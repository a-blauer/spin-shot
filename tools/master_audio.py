# Offline mastering pass for Polyshot's sound library. Run from dmh-web/.
import subprocess, numpy as np, json, os, glob
from scipy.signal import butter, sosfiltfilt, sosfilt, resample_poly
SR=44100; ORIG='/tmp/audio_orig'; OUT='public/audio'
SRC='/home/claude/buddingmonkey/freefirearmssfxlibrary/Prepared SFX'
rng=np.random.default_rng(7)
def dec(f, ss=None, dur=None):
    cmd=['ffmpeg','-v','quiet']+(['-ss','%.4f'%ss,'-t','%.4f'%dur] if ss is not None else [])+['-i',f,'-f','f32le','-ac','1','-ar',str(SR),'-']
    return np.frombuffer(subprocess.run(cmd,capture_output=True).stdout,dtype=np.float32).astype(np.float64)
def enc(x, f, br='128k'):
    x=np.clip(x,-1,1).astype(np.float32)
    subprocess.run(['ffmpeg','-v','quiet','-y','-f','f32le','-ar',str(SR),'-ac','1','-i','-','-c:a','libmp3lame','-b:a',br,f],input=x.tobytes(),check=True)
def filt(x, lo=None, hi=None, order=4):
    if lo and hi: sos=butter(order,[lo,hi],btype='band',fs=SR,output='sos')
    elif lo: sos=butter(order,lo,btype='high',fs=SR,output='sos')
    else: sos=butter(order,hi,btype='low',fs=SR,output='sos')
    return sosfiltfilt(sos,x)
def win_db(x, ms=100):
    w=min(len(x),int(SR*ms/1000)); c=np.cumsum(np.concatenate([[0],x*x])); return 10*np.log10(max(1e-12,np.max(c[w:]-c[:-w])/w))
def env(x, hz=30):
    return np.maximum(0,sosfilt(butter(2,hz,btype='low',fs=SR,output='sos'),np.abs(x)))
def fade_out(x, ms):
    n=min(len(x),int(SR*ms/1000)); y=x.copy(); y[-n:]*=0.5*(1+np.cos(np.linspace(0,np.pi,n))); return y
def norm_peak(x, db=-1.5): return x*(10**(db/20)/max(1e-9,np.abs(x).max()))
def soft(x, c=0.8): return c*np.tanh(x/c)
def to_loud(x, target, c=0.8):
    """Gain into a soft clipper until the loudest 100 ms sits at `target` dBFS. The first millisecond of a shot gets shaved, the body comes up."""
    g=1.0
    for _ in range(12):
        y=soft(x*g,c); d=target-win_db(y)
        if abs(d)<0.1: break
        g*=10**(d/20)
    return soft(x*g,c)
def excite(x, lo=35, hi=220, drive=4.0, bias=0.25, out_hp=140):
    """Harmonics made from the low end, so a sound that lives under 200 Hz still speaks on a phone speaker."""
    b=filt(x,lo,hi); b=b/max(1e-9,np.abs(b).max())
    h=np.tanh(drive*b+bias)-np.tanh(bias)
    return filt(h,out_hp,6000)
def noise_layer(x, lo, hi, env_hz=40):
    n=filt(rng.standard_normal(len(x)),lo,hi); n/=np.abs(n).max(); e=env(x,env_hz); return n*e/max(1e-9,e.max())
report={}
# ---------------------------------------------------------------- 1. gun recordings, re-cut from the source masters
M=json.load(open('/tmp/match.json')); D=json.load(open('/tmp/meter.json'))
for k,m in M.items():
    dur=D['guns/'+k]['dur']
    x=dec(SRC+'/'+m['file'], max(0,m['t']-0.003), dur)
    x=x-np.mean(x); x=filt(x,lo=65)                       # the subsonic thump under 60 Hz is wind and mic overload, not gun
    i=int(np.argmax(np.abs(x)>0.02*np.abs(x).max())); x=x[max(0,i-int(SR*0.002)):]
    x=x/np.abs(x).max()
    y=to_loud(x,-11.0); y=fade_out(y,180)
    enc(y, OUT+'/guns/'+k+'.mp3'); report['guns/'+k]=win_db(y)
# ---------------------------------------------------------------- 2. low-only sounds: add harmonics and a mid layer so they translate
LOW={  # name: (share of the energy that should sit above 250 Hz, exciter : noise balance, noise band)
 'S_Explosion':(0.38,0.5,(400,4500)), 'S_Slam':(0.32,0.6,(350,3500)), 'S_Stomp':(0.28,0.65,(300,3000)), 'S_Heartbeat':(0.2,1,None),
 'S_Land':(0.3,0.75,(900,3500)), 'S_Step0':(0.3,0.7,(1200,4500)), 'S_Step1':(0.3,0.7,(1200,4500)), 'S_Step2':(0.3,0.7,(1200,4500)), 'S_Step3':(0.3,0.7,(1200,4500)),
 'S_Splat':(0.35,0.4,(1500,6000)),
}
for n,(share,bal,band) in LOW.items():
    x=dec(ORIG+'/'+n+'.mp3'); x=filt(x,lo=38); x=x/np.abs(x).max()
    top=bal*excite(x)
    if band: nl=noise_layer(x,band[0],band[1]); top=top+(1-bal)*nl*(np.sqrt(np.mean(excite(x)**2))/max(1e-9,np.sqrt(np.mean(nl**2))))
    lowE=np.sum(x**2)-np.sum(filt(x,lo=250)**2); topE=np.sum(filt(top,lo=250)**2)+np.sum(filt(x,lo=250)**2)
    k=np.sqrt(max(0,share*lowE/((1-share)*max(1e-12,np.sum(filt(top,lo=250)**2)))))
    y=x+k*top
    enc(norm_peak(y), OUT+'/'+n+'.mp3'); report[n]=win_db(norm_peak(y))
# ---------------------------------------------------------------- 3. creature voices: every one sat in the same narrow band at 690 Hz
VOX={'S_Groan0':(0.85,0,0.2),'S_Groan1':(0.85,0,0.2),'S_Groan2':(0.85,0.3,0.2),'S_Groan3':(0.85,0.3,0.2),'S_Snarl':(0.4,0,0.28),'S_BossRoar':(0.8,0.5,0.22),'S_Screech':(0.0,0,0.3),'S_Attack':(0.35,0,0.2),'S_EnemyDie':(0.3,0,0.15)}
for n,(octv,fifth,breath) in VOX.items():
    x=dec(ORIG+'/'+n+'.mp3'); x=x/np.abs(x).max(); y=x.copy()
    if octv:  lo=resample_poly(x,2,1)[:len(x)]; y=y+octv*fade_out(lo,60)                # an octave under: chest
    if fifth: md=resample_poly(x,4,3)[:len(x)]; y=y+fifth*fade_out(md,60)               # and a fourth under: size
    if breath: y=y+breath*noise_layer(x,1800,7000,25)                                   # breath and rasp on top
    y=fade_out(filt(y,lo=45),40)
    enc(norm_peak(y), OUT+'/'+n+'.mp3'); report[n]=win_db(norm_peak(y))
# ---------------------------------------------------------------- 4. piercing highs: shave the 2-6 kHz spike
for n in ('S_Buy','S_Coin','S_Ricochet','S_ShellDrop','S_Chain'):
    x=dec(ORIG+'/'+n+'.mp3'); y=0.55*x+0.45*filt(x,hi=2600,order=2)
    enc(norm_peak(y), OUT+'/'+n+'.mp3'); report[n]=win_db(norm_peak(y))
print(len(report),'files written')
