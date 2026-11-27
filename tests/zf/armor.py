import json,subprocess,sys,math
tag=sys.argv[1]; names=sys.argv[2].split(','); mods=sys.argv[3] if len(sys.argv)>3 else 'Armored'
steps=[{"js":"const g=__dmh,P=g.player;g.godMode=true;g.tip=()=>{};g.hud.toast=()=>{};__sim(30);for(const E of g.enemies)E.dead=true;document.getElementById('hud').style.visibility='hidden';g.vm.hidden=true;'a'"},
{"js":"const g=__dmh,P=g.player,D=g.data.enemies;const N="+json.dumps(names)+";const f=P.forward(),r=P.pos.clone().set(-f.z,0,f.x);window.__A=[];N.forEach((n,i)=>{const d=D.findIndex(e=>e.name===n);const at=P.pos.clone().addScaledVector(f,520).addScaledVector(r,(i-(N.length-1)/2)*170);const E=g.spawnEnemy(d,at,false,-1,1,1,0,false);E.baseSpeed=0;E.speed=0;E.attackCd=99;E.puppet.setMods("+json.dumps(mods.split('+') if mods else [])+");window.__A.push(E);});__sim(200);for(const E of window.__A){E.vel.set(0,0,0);E.pos.copy(E.spawnAt||E.pos);}'s'"}]
for k,(yaw,dist,h) in enumerate([(0,0,0),(0.7,0,0),(1.5,0,0)]):
    steps.append({"js":f"const g=__dmh,P=g.player;for(const E of window.__A){{E.puppet.yaw3=Math.atan2(P.pos.x-E.pos.x,P.pos.z-E.pos.z)+{yaw};E.puppet.reach=0;E.puppet.windup=0;E.puppet.lunge=0;}}window.__dmhHold=true;'v'"})
    steps.append({"wait":200}); steps.append({"shot":f"ar{tag}{k}"})
json.dump({"w":1400,"h":700,"query":"&map=6","steps":steps},open(f'zf/ar{tag}.json','w'))
o=subprocess.run(['python3','shot_fl.py',f'zf/ar{tag}.json'],capture_output=True,text=True,timeout=900).stdout
print([l for l in o.split('\n') if 'pageerror' in l][:3])
from PIL import Image
o2=Image.new('RGB',(1400,2100))
for k in range(3): o2.paste(Image.open(f'out/ar{tag}{k}.png'),(0,k*700))
o2.resize((1050,1575)).save(f'/tmp/ar{tag}.jpg',quality=85)
