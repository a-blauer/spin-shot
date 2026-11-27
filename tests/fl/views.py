import json,sys,subprocess,math
from PIL import Image, ImageDraw
# (map, chunk, x, y, z, dist, label) : y is height of the thing's middle
V=[l for l in json.loads(sys.argv[1])]
out=sys.argv[2]
bym={}
for i,v in enumerate(V): bym.setdefault(v[0],[]).append((i,v))
for m,L in bym.items():
    steps=[{"js":"const g=__dmh;g.godMode=true;g.tip=()=>{};__sim(10);document.getElementById('hud').style.visibility='hidden';window.__dmhHold=true;'a'"},{"wait":800}]
    for i,(mm,ch,x,y,z,dist,lab) in L:
        dx=dist*0.7; dz=dist*0.7; h=y+dist*0.3; yaw=math.atan2(dx,dz); pt=-math.atan2(h-y,dist)
        chs='null' if ch is None else ch
        steps.append({"js":f"const g=__dmh,P=g.player;if(g.world.showChunk&&{chs}!==null)g.world.showChunk({chs});window.__eo=window.__eo||(g.camera.position.y-P.pos.y);const f=()=>{{P.pos.set({x}+{dx},{h}-window.__eo,{z}+{dz});P.vel.set(0,0,0);}};f();P.yaw={yaw};P.pitch={pt};__sim(1);f();'v'"})
        steps.append({"wait":300}); steps.append({"shot":f"vw{i}"})
    json.dump({"w":640,"h":400,"query":f"&map={m}","steps":steps},open('fl/vw.json','w'))
    subprocess.run(['python3','shot.py','fl/vw.json'],capture_output=True,text=True,timeout=900)
cols=3; rows=(len(V)+cols-1)//cols
o=Image.new('RGB',(cols*480,rows*320),'black'); dr=ImageDraw.Draw(o)
for i,v in enumerate(V):
    try: im=Image.open(f'out/vw{i}.png').resize((480,300))
    except Exception: continue
    o.paste(im,((i%cols)*480,(i//cols)*320)); dr.text(((i%cols)*480+4,(i//cols)*320+302),f'{i}: {v[6]}',fill='yellow')
o.save(out,quality=82)
