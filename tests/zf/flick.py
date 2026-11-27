# z-fight metric: render each view twice, camera nudged 0.6 units sideways; count pixels that change a lot
import json,sys,subprocess,math
from PIL import Image, ImageChops
m=sys.argv[1]; tag=sys.argv[2]; q=sys.argv[3] if len(sys.argv)>3 else ''
steps=[{"js":"const g=__dmh;g.godMode=true;g.tip=()=>{};__sim(10);document.getElementById('hud').style.visibility='hidden';window.__dmhHold=true;g.vm.hidden=true;const gl=document.querySelector('canvas').getContext('webgl2');'clip='+!!(gl&&gl.getExtension('EXT_clip_control'))+' rev='+g.renderer.capabilities.reversedDepthBuffer+' near='+g.camera.near"},{"wait":600}]
n=0
for k in range(8):
  yaw=k*math.pi/4
  for pit in (-0.12,-0.35):
    for j,off in enumerate((0,0.6)):
      steps.append({"js":f"const g=__dmh,P=g.player;window.__p0=window.__p0||P.pos.clone();P.pos.set(window.__p0.x+{off}*Math.cos({yaw}),window.__p0.y,window.__p0.z-{off}*Math.sin({yaw}));P.vel.set(0,0,0);P.yaw={yaw};P.pitch={pit};__sim(0.02);P.pos.set(window.__p0.x+{off}*Math.cos({yaw}),window.__p0.y,window.__p0.z-{off}*Math.sin({yaw}));'v'"})
      steps.append({"wait":120}); steps.append({"shot":f"zf_{tag}{m}_{n}_{j}"})
    n+=1
json.dump({"w":800,"h":450,"query":f"&map={m}"+q,"steps":steps},open(f'zf/fk{m}.json','w'))
o=subprocess.run(['python3','shot_fl.py',f'zf/fk{m}.json'],capture_output=True,text=True,timeout=900).stdout
print([l for l in o.split('\n') if 'clip=' in l][:1])
tot=0; per=[]
for i in range(n):
  a=Image.open(f'out/zf_{tag}{m}_{i}_0.png').convert('L'); b=Image.open(f'out/zf_{tag}{m}_{i}_1.png').convert('L')
  d=ImageChops.difference(a,b).point(lambda v:255 if v>48 else 0); c=sum(1 for v in d.getdata() if v); per.append(c); tot+=c
  d.save(f'out/zfd_{tag}{m}_{i}.png')
print(tag,'map',m,'flicker px',tot,per)
