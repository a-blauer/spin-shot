import json,sys,subprocess
from PIL import Image
# spots: name -> (x, y); four views each (N, E, S, W) at gnome eye height
spots=json.loads(open(sys.argv[1]).read()); out=sys.argv[2]
import os; os.makedirs('out/'+out,exist_ok=True)
steps=[{"js":"const g=__dmh;g.godMode=true;g.tip=()=>{};g.hud.toast=()=>{};g.banner=()=>{};__sim(10);g.villageRT.enter();__sim(30);document.getElementById('hud').style.visibility='hidden';g.vm.hidden=true;for(const p of g.villageRT.people)p.root.visible=true;'v'"},{"wait":1500}]
dirs=[('N',0,1),('E',1,0),('S',0,-1),('W',-1,0)]
for n,(x,y,*z) in spots.items():
    h=z[0] if z else 140
    for d,dx,dy in dirs:
        steps+=[{"js":f"const g=__dmh,V=g.villageRT,C=g.camera;window.__dmhHold=true;const [a,b]=V.w({x},{y}),[e,f]=V.w({x+dx*1000},{y+dy*1000});C.position.set(a,{h},b);C.lookAt(e,{h-60},f);C.fov=80;C.updateProjectionMatrix();C.updateMatrixWorld();'c'"},{"wait":350},{"shot":f"{out}/{n}_{d}"}]
json.dump({"w":800,"h":450,"query":"&map=6","steps":steps},open('vs/sw.json','w'))
o=subprocess.run(['python3','shot_fl.py','vs/sw.json'],capture_output=True,text=True,timeout=3000).stdout
names=list(spots)
for i in range(0,len(names),2):
    g=Image.new('RGB',(3200,900))
    for j,n in enumerate(names[i:i+2]):
        for k,(d,_,_) in enumerate(dirs):
            try: g.paste(Image.open(f'out/{out}/{n}_{d}.png'),(k*800,j*450))
            except Exception as e: pass
    g.resize((2400,675)).save(f'/tmp/sw_{out}_{i//2}.png')
print(o.count('js>'), (len(names)+1)//2)
