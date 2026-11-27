# Frame-by-frame animation check: for each creature, pose its puppet at fixed points of the walk cycle and of an attack
# (wind-up, then the lunge) and photograph each pose from the side and from the front three-quarter.
# usage: python3 zf/anim.py TAG regular|boss idx,idx,...
import json, subprocess, sys
tag, kind, idxs = sys.argv[1], sys.argv[2], [int(x) for x in sys.argv[3].split(',')]
DMUL = sys.argv[4] if len(sys.argv) > 4 else '1'
FR = [('walk', w / 8 * 6.2832, 0, 0) for w in range(8)] + [('wind', 0, 0.5, 0), ('wind', 0, 1, 0), ('lunge', 0, 1, 0.5), ('lunge', 0, 0, 1)]
POSE = r"""
window.__pose=(E,ph,wu,lu,view)=>{const p=E.puppet,g=__dmh,S=p.S||{};p.walk=ph;p.stride=(wu||lu)?0:1;p.reach=(wu||lu||S.crawler||S.flying)?0:1;p.idle=0;p.windup=wu;p.lunge=lu;p.time=1;p.twitch=0;p.hurtT=0;p.leanF=(wu||lu)?0:1;p.bodyRot=0;p.dig=0;
 const yaw=p.yaw3,f=[Math.sin(yaw),Math.cos(yaw)],r=[Math.cos(yaw),-Math.sin(yaw)],h=(p.heightCm||200),d=Math.max(150,h*1.05)*(window.__dmul||1),C=g.camera;
 const dir=view==='side'?r:[f[0]*0.8+r[0]*0.6,f[1]*0.8+r[1]*0.6];const fy=E.feet().y,cy=fy+h*0.5;
 C.position.set(E.pos.x+dir[0]*d,fy+Math.min(156,h*0.78),E.pos.z+dir[1]*d);C.lookAt(E.pos.x,cy,E.pos.z);C.updateMatrixWorld();window.__dmhHold=true;return 'h'+h.toFixed(0)+' s'+(p.baseScale||0).toFixed(2);};
"""
steps = [{"js": "const g=__dmh;g.godMode=true;g.tip=()=>{};g.hud.toast=()=>{};__sim(30);for(const E of g.enemies)E.dead=true;document.getElementById('hud').style.visibility='hidden';g.vm.hidden=true;window.__F0=g.player.forward().clone();window.__P0=g.player.pos.clone();" + POSE + "window.__dmul=" + DMUL + ";'a'"}]
shots = []
if kind == 'regular':
    steps.append({"js": "const g=__dmh,P=g.player,f=window.__F0,r=P.pos.clone().set(-f.z,0,f.x);window.__A={};const N=" + json.dumps(idxs) + ";N.forEach((i,k)=>{const at=window.__P0.clone().addScaledVector(f,700).addScaledVector(r,(k-(N.length-1)/2)*300);const E=g.spawnEnemy(i,at,false,-1,1,1,0,false);E.baseSpeed=0;E.speed=0;E.attackCd=99;window.__A[i]=E;});__sim(240);for(const O of g.enemies)if(!Object.values(window.__A).includes(O)){O.dead=true;O.pos.y=-1e5;}'spawned '+Object.keys(window.__A).length"})
for i in idxs:
    if kind == 'regular':
        steps.append({"js": f"const g=__dmh;window.__dmhHold=true;const E=window.__A[{i}];for(const O of Object.values(window.__A)){{O.puppet.visible=(O===E);O.vel.set(0,0,0);}}E.puppet.yaw3=Math.atan2(-window.__F0.x,-window.__F0.z)+1.2;window.__E=E;g.data.enemies[{i}].name"})
    else:
        steps.append({"js": f"window.__dmhHold=false;const g=__dmh,P=g.player,D=g.descent;D.bossPick=[{i},{i},{i},{i}];D.enter(5);__sim(300);const E=g.boss;if(!E)'nob';else{{E.baseSpeed=0;E.speed=0;E.attackCd=99;E.bossTimer=99;window.__E=E;for(const O of g.enemies)if(O!==E){{O.dead=true;O.pos.y=-1e5;}}E.vel.set(0,0,0);E.puppet.yaw3=1.2;g.data.bosses[{i}].name}}"})
    for k, (nm, ph, wu, lu) in enumerate(FR):
        for view in (['side'] if nm == 'walk' else ['side', 'front']):
            steps.append({"js": f"window.__pose(window.__E,{ph},{wu},{lu},'{view}')"}); steps.append({"wait": 120})
            s = f"anim/{tag}_{i}_{k}_{view}"; steps.append({"shot": s}); shots.append((i, k, view, s))
json.dump({"w": 640, "h": 640, "query": "&map=6" if kind == 'regular' else "", "steps": steps}, open(f'zf/anim_{tag}.json', 'w'))
o = subprocess.run(['python3', 'shot_fl.py', f'zf/anim_{tag}.json'], capture_output=True, text=True, timeout=3000).stdout
print([l for l in o.split('\n') if 'pageerror' in l or 'js>' in l][:60])
from PIL import Image
for i in idxs:
    mine = [s for s in shots if s[0] == i]
    o2 = Image.new('RGB', (8 * 300, 2 * 300))
    walk = [s for s in mine if s[1] < 8]; atk = [s for s in mine if s[1] >= 8]
    for c, s in enumerate(walk): o2.paste(Image.open(f'out/{s[3]}.png').resize((300, 300)), (c * 300, 0))
    for c, s in enumerate(atk): o2.paste(Image.open(f'out/{s[3]}.png').resize((300, 300)), (c * 300, 300))
    o2.save(f'/tmp/anim_{tag}_{i}.jpg', quality=80)
