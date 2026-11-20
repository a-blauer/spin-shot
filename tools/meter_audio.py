import subprocess, numpy as np, glob, os, sys, json
def load(f):
    raw=subprocess.run(['ffmpeg','-v','quiet','-i',f,'-f','f32le','-ac','1','-ar','44100','-'],capture_output=True).stdout
    return np.frombuffer(raw,dtype=np.float32)
def meter(f):
    x=load(f); sr=44100
    if len(x)<100: return None
    peak=float(np.max(np.abs(x)))
    # loudest 100 ms window RMS (how loud it reads when it hits) and whole-file RMS
    w=int(sr*0.1); 
    if len(x)<w: w=len(x)
    c=np.cumsum(np.concatenate([[0],x.astype(np.float64)**2])); win=np.sqrt(np.max(c[w:]-c[:-w])/w)
    rms=float(np.sqrt(np.mean(x.astype(np.float64)**2)))
    X=np.abs(np.fft.rfft(x*np.hanning(len(x))))**2; fr=np.fft.rfftfreq(len(x),1/sr); tot=X.sum()+1e-20
    band=lambda a,b: float(X[(fr>=a)&(fr<b)].sum()/tot)
    cen=float((fr*X).sum()/tot)
    thr=peak*0.05; idx=np.where(np.abs(x)>thr)[0]; lead=idx[0]/sr if len(idx) else 0; tail=(len(x)-idx[-1])/sr if len(idx) else 0
    db=lambda v: 20*np.log10(max(v,1e-9))
    return dict(dur=len(x)/sr,peak=db(peak),win=db(win),rms=db(rms),sub=band(0,60),bass=band(60,250),mid=band(250,2000),hi=band(2000,6000),air=band(6000,22050),cen=cen,lead=lead*1000,dc=float(np.mean(x)),clip=int((np.abs(x)>0.985).sum()))
if __name__=='__main__':
    out={}
    for f in sorted(glob.glob('public/audio/*.mp3'))+sorted(glob.glob('public/audio/guns/*.mp3')):
        m=meter(f); 
        if m: out[os.path.relpath(f,'public/audio')[:-4]]=m
    json.dump(out,open('/tmp/meter.json','w'))
    print("name            dur   peak   win100  rms   sub% bass% mid% hi% air%  cen   lead clip")
    for k,m in out.items():
        print("%-15s %4.2f %6.1f %6.1f %6.1f  %3d %4d %4d %3d %3d %6d %4d %4d"%(k,m['dur'],m['peak'],m['win'],m['rms'],m['sub']*100,m['bass']*100,m['mid']*100,m['hi']*100,m['air']*100,m['cen'],m['lead'],m['clip']))
