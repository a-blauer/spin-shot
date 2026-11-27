# Joint check: for every creature, pose it at the 12 test poses and measure, for every part, the smallest distance
# from its surface to any other part's surface (a limb that has come away from the body shows as a gap), and how far
# its lowest point sits below the floor. Prints the worst per part.
import json, subprocess, sys
kind, idxs = sys.argv[1], [int(x) for x in sys.argv[2].split(',')]
JS = r"""
window.__gaps=(E)=>{const p=E.puppet,R=p.rootMatrix(),M4=R.constructor,V3=E.pos.constructor;const poses=[];for(let w=0;w<8;w++)poses.push([w/8*6.2832,0,0]);poses.push([0,0.5,0],[0,1,0],[0,1,0.5],[0,0,1]);
 const S=p.S||{};const out={};
 // sample each part's vertices once (in its own frame)
 const samp=p.kind.map((K)=>{if(!K||!K.geo)return null;const P=K.geo.attributes.position,n=P.count,st=1,a=[];for(let i=0;i<n;i+=st)a.push(new V3(P.getX(i),P.getY(i),P.getZ(i)));return a;});
 for(const [ph,wu,lu] of poses){p.walk=ph;p.stride=(wu||lu)?0:1;p.reach=(wu||lu||S.crawler||S.flying)?0:1;p.idle=0;p.windup=wu;p.lunge=lu;p.time=1;p.twitch=0;p.hurtT=0;p.leanF=(wu||lu)?0:1;p.bodyRot=0;p.dig=0;p.offZ=Math.abs(Math.sin(ph))*13*p.stride*(p.amp||1);p.offX=Math.sin(ph)*7*p.stride;
  const R0=p.rootMatrix();if(p.keepOnFloor)p.keepOnFloor();const root=R0.clone(),W=p.parts.map((P,i)=>{if(!samp[i]||!P.visible)return null;const m=root.clone().multiply(p.partMatrix(P,new M4()));return samp[i].map(v=>v.clone().applyMatrix4(m));});
  const fy=E.feet().y;
  p.parts.forEach((P,i)=>{if(!W[i])return;let best=1e9;const A=W[i],sa=Math.max(1,Math.floor(A.length/700));W.forEach((B,j)=>{if(j===i||!B)return;for(let ai=0;ai<A.length;ai+=sa){const a=A[ai];for(const b of B){const d=a.distanceToSquared(b);if(d<best)best=d;}if(best<1)break;}});
   let low=1e9;for(const a of W[i])low=Math.min(low,a.y-fy);const key=i+':'+P.role;const o=out[key]||(out[key]={gap:0,gapAt:'',sink:0,sinkAt:''});const g=Math.sqrt(best);if(g>o.gap){o.gap=+g.toFixed(1);o.gapAt=ph.toFixed(1)+'/'+wu+'/'+lu;}if(-low>o.sink){o.sink=+(-low).toFixed(1);o.sinkAt=ph.toFixed(1)+'/'+wu+'/'+lu;}});}
 return JSON.stringify({s:+p.baseScale.toFixed(2),parts:out});};
"""
steps = [{"js": "const g=__dmh;g.godMode=true;g.tip=()=>{};g.hud.toast=()=>{};__sim(30);for(const E of g.enemies)E.dead=true;" + JS + "'a'"}]
for i in idxs:
    if kind == 'regular':
        steps.append({"js": f"const g=__dmh,P=g.player;for(const O of g.enemies){{O.dead=true;O.pos.y=-1e5;}}__sim(3);const f=P.forward();const E=g.spawnEnemy({i},P.pos.clone().addScaledVector(f,600),false,-1,1,1,0,false);E.baseSpeed=0;E.speed=0;E.attackCd=99;__sim(240);g.data.enemies[{i}].name+' '+window.__gaps(E)"})
    else:
        steps.append({"js": f"const g=__dmh,D=g.descent;D.bossPick=[{i},{i},{i},{i}];D.enter(5);__sim(300);const E=g.boss;E?g.data.bosses[{i}].name+' '+window.__gaps(E):'nob'"})
json.dump({"w": 400, "h": 300, "query": "&map=6" if kind == 'regular' else "", "steps": steps}, open('zf/gaps.json', 'w'))
o = subprocess.run(['python3', 'shot_fl.py', 'zf/gaps.json'], capture_output=True, text=True, timeout=3000).stdout
for l in o.split('\n'):
    if not l.startswith('js> ') or l == 'js> a': continue
    name, js = l[4:].split(' {', 1) if ' {' in l else (l[4:], None)
    if not js: print(name); continue
    d = json.loads('{' + js); print(f"{name} (scale {d['s']})")
    for k, v in d['parts'].items():
        flag = ' <-- GAP' if v['gap'] > 2.5 else ''
        flag += ' <-- SINKS' if v['sink'] > 6 else ''
        print(f"   {k:14s} gap {v['gap']:6.1f} @{v['gapAt']:12s} sink {v['sink']:6.1f} @{v['sinkAt']}{flag}")
