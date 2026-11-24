import json, subprocess, numpy as np, sys, os, glob
SR=44100
M=json.load(open('/tmp/sfx_manifest.json'))
def load(f):
    raw=subprocess.run(['ffmpeg','-v','quiet','-i',f,'-f','f32le','-ac','1','-ar',str(SR),'-'],capture_output=True).stdout
    return np.frombuffer(raw,dtype=np.float32)
bad=[]; rows=[]
for n,m in sorted(M.items()):
    x=load('../../public/audio/'+n+'.mp3'); pk=np.abs(x).max(); idx=np.where(np.abs(x)>0.05*pk)[0]; lead=idx[0]/SR*1000; tailv=np.abs(x[-200:]).max()/pk
    rows.append((n,m['dur'],m['kwin'],m['bands'],m['cen'],m['crest'],lead,os.path.getsize('../../public/audio/'+n+'.mp3')))
    if pk<0.5 and not n.startswith('S_Amb'): bad.append(n+' quiet peak %.2f'%pk)
    if lead>45 and not n.startswith('S_Amb') and n not in('S_RoundStart','S_Phase','S_Revive','S_Blink','S_Door','S_Energy','S_Enter','S_Spit','S_Tide','S_PowerUp','S_Shield'): bad.append(n+' late start %dms'%lead)
    if tailv>0.08 and not n.startswith('S_Amb'): bad.append(n+' cut tail %.2f'%tailv)
    if m['bands'][0]>0.3 and n!='S_Heartbeat': bad.append(n+' sub %d%%'%(m['bands'][0]*100))
    if sum(m['bands'][2:])<0.3 and not n.startswith('S_Amb') and n!='S_Heartbeat': bad.append(n+' thin top %d%%'%(sum(m['bands'][2:])*100))
    if np.isnan(x).any(): bad.append(n+' NaN')
print('%d sounds, %.2f MB'%(len(rows),sum(r[-1] for r in rows)/1e6))
if len(sys.argv)>1:
    for r in rows:
        if any(k in r[0] for k in sys.argv[1:]): print('%-15s %5.2fs k%6.1f sub%3d bass%3d mid%3d hi%3d air%3d cen%5d crest%5.1f lead%3d'%(r[0],r[1],r[2],*[int(b*100) for b in r[3]],r[4],r[5],r[6]))
print('PROBLEMS:',bad)
