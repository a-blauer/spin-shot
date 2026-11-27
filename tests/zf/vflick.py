import json,subprocess,math,sys
from PIL import Image, ImageChops
tag=sys.argv[1]
spots=[(0,0),(1200,0),(-1200,0),(0,1200),(0,-1200),(1200,1200),(-1200,-1200),(2400,0),(-2400,600)]
steps=[{"js":"const g=__dmh;g.godMode=true;g.tip=()=>{};g.hud.toast=()=>{};__sim(10);g.villageRT.enter();__sim(30);document.getElementById('hud').style.visibility='hidden';g.vm.hidden=true;window.__p0=g.player.pos.clone();window.__eo=g.camera.position.y-g.player.pos.y;'v'"},{"wait":800}]
n=0
for (sx,sz) in spots:
  for k in range(4):
    yaw=k*math.pi/2+0.3
    for j,off in enumerate((0,0.5)):
      steps.append({"js":f"const g=__dmh,P=g.player,p0=window.__p0;const f=()=>{{P.pos.set(p0.x+{sx}+{off}*Math.cos({yaw}),p0.y,p0.z+{sz}-{off}*Math.sin({yaw}));P.vel.set(0,0,0);}};window.__dmhHold=false;f();P.yaw={yaw};P.pitch=-0.15;__sim(1);f();window.__dmhHold=true;'s'"})
      steps.append({"wait":100}); steps.append({"shot":f"vf{tag}_{n}_{j}"})
    n+=1
json.dump({"w":960,"h":540,"query":"&map=6","steps":steps},open('zf/vf.json','w'))
o=subprocess.run(['python3','shot_fl.py','zf/vf.json'],capture_output=True,text=True,timeout=1800).stdout
res=[]
for i in range(n):
  try:
    a=Image.open(f'out/vf{tag}_{i}_0.png').convert('L'); b=Image.open(f'out/vf{tag}_{i}_1.png').convert('L')
  except Exception: continue
  d=ImageChops.difference(a,b).point(lambda v:255 if v>40 else 0); c=sum(1 for v in d.getdata() if v); res.append((c,i)); d.save(f'out/vfd{tag}_{i}.png')
res.sort(reverse=True); print(tag,'total',sum(r[0] for r in res),'top',res[:8])
