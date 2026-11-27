import json,sys,subprocess,re,collections
from PIL import Image, ImageDraw
m=sys.argv[1]; d=json.load(open(f'fl/m{m}.res')); src=open('/tmp/fldist/game.js').read().split('\n')
def where(st):
    for fr in (st or '').split('|'):
        mm=re.search(r':(\d+):(\d+)\)?$',fr.strip())
        if not mm: continue
        ln=int(mm.group(1)); mod=None
        for k in range(ln-1,-1,-1):
            if src[k].lstrip().startswith('// src/'): mod=src[k].strip()[7:]; break
        if mod and not mod.endswith('world.js'): return f'{mod}:{ln}'
    return '?'
c=collections.defaultdict(list)
for r in d['sample']: c[where(r[8])].append(r)
import sys as _s
if len(_s.argv)>2: c={k:v[int(_s.argv[2]):] for k,v in c.items()}
cats=sorted(c.items(),key=lambda kv:-len(kv[1]))
steps=[{"js":"const g=__dmh;g.godMode=true;g.tip=()=>{};__sim(10);document.getElementById('hud').style.visibility='hidden';window.__dmhHold=true;'a'"},{"wait":800}]
labels=[]
for i,(k,v) in enumerate(cats):
    r=v[0]; ch,x,y,z=r[3],r[4],r[5],r[6]; s=max(r[7]); dist=max(260,s*1.6+150)
    cy=y+r[7][1]/2; dx=dist*0.7; dz=dist*0.7; h=cy+dist*0.35
    import math
    yaw=math.atan2(dx,dz); pt=-math.atan2(h-cy, dist)
    steps.append({"js":f"const g=__dmh,P=g.player;if(g.world.showChunk&&{"null" if ch is None else ch}!==null)g.world.showChunk({"null" if ch is None else ch});window.__eo=window.__eo||(g.camera.position.y-P.pos.y);const f=()=>{{P.pos.set({x}+{dx},{h}-window.__eo,{z}+{dz});P.vel.set(0,0,0);}};f();P.yaw={yaw};P.pitch={pt};__sim(1);f();'v'"})
    steps.append({"wait":250}); steps.append({"shot":f"fl{m}_{i}"})
    labels.append(f"{len(v)} {k}")
json.dump({"w":640,"h":400,"query":f"&map={m}","steps":steps},open(f'fl/look{m}.json','w'))
subprocess.run(['python3','shot_fl.py',f'fl/look{m}.json'],capture_output=True,text=True,timeout=900)
n=len(labels); cols=4; rows=(n+cols-1)//cols
o=Image.new('RGB',(cols*400,rows*270),'black'); dr=ImageDraw.Draw(o)
for i,l in enumerate(labels):
    try: im=Image.open(f'out/fl{m}_{i}.png').resize((400,250))
    except Exception: continue
    o.paste(im,((i%cols)*400,(i//cols)*270)); dr.text(((i%cols)*400+4,(i//cols)*270+252),f'{i}: {l}',fill='yellow')
o.save(f'/tmp/fl{m}.jpg',quality=80)
for i,l in enumerate(labels): print(i,l)
