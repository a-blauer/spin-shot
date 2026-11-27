# draw calls / triangles / instanced meshes in the village from a few spots (renderer.info after one frame)
import json, subprocess, sys
spots = {'spawn': [0, -2700, 0, -2000], 'square': [0, -600, 0, 600], 'west': [-700, 0, -1700, 0], 'east': [700, 300, 2000, 300], 'gate': [0, 1800, 0, 2600]}
steps = [{"js": "const g=__dmh;g.godMode=true;__sim(10);g.villageRT.enter();__sim(30);'v'"}, {"wait": 1200}]
for n, (x, y, lx, ly) in spots.items():
    steps += [{"js": f"const g=__dmh,V=g.villageRT,C=g.camera;window.__dmhHold=true;const [a,b]=V.w({x},{y}),[e,f]=V.w({lx},{ly});C.position.set(a,150,b);C.lookAt(e,120,f);C.updateMatrixWorld();'c'"}, {"wait": 300},
              {"js": f"const g=__dmh,R=g.renderer;R.info.autoReset=false;R.info.reset();g.render();const i=R.info.render;const t0=performance.now();for(let k=0;k<5;k++)g.render();const ms=(performance.now()-t0)/5;R.info.autoReset=true;let im=0,inst=0;g.scene.traverse(o=>{{if(o.isInstancedMesh&&o.visible&&(o.parent&&o.parent.visible!==false)){{im++;inst+=o.count;}}}});JSON.stringify({{n:'{n}',calls:i.calls,tris:i.triangles,ms:+ms.toFixed(1),im,inst}})"}]
json.dump({"w": 1280, "h": 720, "query": "&map=6", "steps": steps}, open('vs2/_perf.json', 'w'))
o = subprocess.run(['python3', 'shot_fl.py', 'vs2/_perf.json'], capture_output=True, text=True, timeout=1200).stdout
print('\n'.join(l for l in o.splitlines() if l.startswith('js> {')))
