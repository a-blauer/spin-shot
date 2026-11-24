import sys, subprocess, numpy as np, matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
from scipy import signal
SR=44100
def load(f):
    raw=subprocess.run(['ffmpeg','-v','quiet','-i',f,'-f','f32le','-ac','1','-ar',str(SR),'-'],capture_output=True).stdout; return np.frombuffer(raw,dtype=np.float32)
names=sys.argv[2:]; cols=4; rows=(len(names)+cols-1)//cols
fig,ax=plt.subplots(rows,cols,figsize=(16,2.6*rows),squeeze=False)
for i,n in enumerate(names):
    x=load('../../public/audio/'+n+'.mp3'); a=ax[i//cols][i%cols]
    nf=1024 if len(x)>SR*0.3 else 256
    f,t,S=signal.spectrogram(x,SR,nperseg=nf,noverlap=nf*3//4); S=10*np.log10(S+1e-10); m=S.max()
    a.pcolormesh(t,f,S,vmin=m-70,vmax=m,shading='auto',cmap='magma'); a.set_yscale('symlog',linthresh=200); a.set_ylim(40,16000); a.set_yticks([60,250,1000,4000,12000]); a.set_yticklabels(['60','250','1k','4k','12k'],fontsize=6)
    a.set_title(n,fontsize=9); a.tick_params(labelsize=6)
    b=a.twinx(); b.plot(np.arange(len(x))/SR,np.abs(x),color='w',lw=0.3,alpha=0.5); b.set_ylim(0,3); b.set_yticks([])
for j in range(len(names),rows*cols): ax[j//cols][j%cols].axis('off')
plt.tight_layout(); plt.savefig(sys.argv[1],dpi=70)
