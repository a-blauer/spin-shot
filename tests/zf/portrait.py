# Portraits of regular creatures at eye level from the front three-quarter: python3 zf/portrait.py TAG name,name [yawOffset] [distMul]
import json, subprocess, sys
POSE = r'''
window.__pose=(E,ph,wu,lu,view)=>{const p=E.puppet,g=__dmh,S=p.S||{};p.walk=ph;p.stride=(wu||lu)?0:1;p.reach=(wu||lu||S.crawler||S.flying)?0:1;p.idle=0;p.windup=wu;p.lunge=lu;p.time=1;p.twitch=0;p.hurtT=0;p.leanF=(wu||lu)?0:1;p.bodyRot=0;p.dig=0;
 const yaw=p.yaw3,f=[Math.sin(yaw),Math.cos(yaw)],r=[Math.cos(yaw),-Math.sin(yaw)],h=(p.heightCm||200),d=Math.max(150,h*1.05)*(window.__dmul||1),C=g.camera;
 const dir=view==='side'?r:[f[0]*0.8+r[0]*0.6,f[1]*0.8+r[1]*0.6];const cy=E.pos.y+h*0.5;
 C.position.set(E.pos.x+dir[0]*d,cy+h*0.08,E.pos.z+dir[1]*d);C.lookAt(E.pos.x,cy,E.pos.z);C.updateMatrixWorld();window.__dmhHold=true;return 'h'+h.toFixed(0)+' s'+(p.baseScale||0).toFixed(2);};
'''
tag, names = sys.argv[1], sys.argv[2].split(',')
yo = sys.argv[3] if len(sys.argv) > 3 else '0.55'; dm = sys.argv[4] if len(sys.argv) > 4 else '1'
steps = [{"js": "const g=__dmh;g.godMode=true;g.tip=()=>{};g.hud.toast=()=>{};__sim(30);for(const E of g.enemies)E.dead=true;document.getElementById('hud').style.visibility='hidden';g.vm.hidden=true;window.__P0=g.player.pos.clone();window.__F0=g.player.forward().clone();" + POSE + "'a'"}]
for k, n in enumerate(names):
    steps.append({"js": f"window.__dmhHold=false;const g=__dmh,P=g.player;for(const O of g.enemies){{O.dead=true;O.pos.y=-1e5;}}__sim(3);P.pos.copy(window.__P0);const i=g.data.enemies.findIndex(e=>e.name==={json.dumps(n)});const f=window.__F0;const E=g.spawnEnemy(i,window.__P0.clone().addScaledVector(f,700),false,-1,1,1,0,false);E.baseSpeed=0;E.speed=0;E.attackCd=99;__sim(240);for(const O of g.enemies)if(O!==E){{O.dead=true;O.pos.y=-1e5;}}E.vel.set(0,0,0);window.__E=E;i"})
    steps.append({"js": f"const E=window.__E;E.puppet.yaw3=Math.atan2(-window.__F0.x,-window.__F0.z)+{yo};window.__dmul={dm};window.__pose(E,0,0,0,'front');const C=__dmh.camera,fy=E.feet().y,h=E.puppet.heightCm||200;C.position.y=fy+h*0.5;C.lookAt(E.pos.x,fy+h*0.47,E.pos.z);C.updateMatrixWorld();'feet '+(E.pos.y-fy).toFixed(0)"})
    steps.append({"wait": 250}); steps.append({"shot": f"gal/p_{tag}_{k}"})
json.dump({"w": 900, "h": 900, "query": "&map=6", "steps": steps}, open('zf/portrait.json', 'w'))
o = subprocess.run(['python3', 'shot_fl.py', 'zf/portrait.json'], capture_output=True, text=True, timeout=2000).stdout
print([l for l in o.split('\n') if 'pageerror' in l or l.startswith('js>')][:20])
