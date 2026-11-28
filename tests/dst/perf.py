# Draw calls and triangles per frame at spots in the farm and in an old room (real rendered frames)
import json, subprocess
views = [['farm spawn N', 0, -5250, 'PI'], ['farm yard N', 0, -1500, 'PI'], ['farm floor S', 0, 4500, '0'], ['farm east W', 4000, 0, 'PI/2'], ['farm barn in', 0, 1000, 'PI']]
steps = [{"js": "const g=__dmh,D=g.descent;g.godMode=true;g.tip=()=>{};g.phaseTimer=0;__sim(30);g.toSpawn=0;g.spawned=0;for(const E of g.enemies){E.dead=true;E.remove=true;}__sim(10);window.__pf={};'a'"}]
for nm, x, y, yw in views:
    steps.append({"js": f"(()=>{{const g=__dmh,D=g.descent,A=D.A(),P=g.player;P.pos.set(A.c[0]+{x},P.pos.y,A.c[1]+{y});P.yaw=Math.{yw if yw!='0' else 'E*0'};P.pitch=0;__sim(3);const R=__renderer;R.info.autoReset=false;window.__pfn='{nm}';return 1}})()"})
    steps.append({"wait": 300})
    steps.append({"js": "(()=>{const R=__renderer;R.info.reset();return new Promise((res)=>requestAnimationFrame(()=>requestAnimationFrame(()=>{__pf[__pfn]=[R.info.render.calls,Math.round(R.info.render.triangles/1000)+'k'];res(1)})))})()"})
steps.append({"js": "(()=>{const g=__dmh,D=g.descent;D.enter(2);__sim(5);g.toSpawn=0;g.spawned=0;for(const E of g.enemies){E.dead=true;E.remove=true;}__sim(5);const S=D.S(),P=g.player;P.pos.set(S.spawn[0],P.pos.y,S.spawn[1]);P.yaw=S.yaw;__sim(3);window.__pfn='old room '+D.arena;return 1})()"})
steps.append({"wait": 300})
steps.append({"js": "(()=>{const R=__renderer;R.info.reset();return new Promise((res)=>requestAnimationFrame(()=>requestAnimationFrame(()=>{__pf[__pfn]=[R.info.render.calls,Math.round(R.info.render.triangles/1000)+'k'];res(1)})))})()"})
steps.append({"js": "JSON.stringify(__pf)"})
json.dump({"w": 1280, "h": 720, "query": "&map=6", "steps": steps}, open('/tmp/dperf.json', 'w'))
o = subprocess.run(['timeout', '900', 'python3', 'shot_fl.py', '/tmp/dperf.json'], capture_output=True, text=True).stdout
print([l for l in o.splitlines() if l.startswith('js> {')][-1:])
