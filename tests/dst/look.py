# Stills of a destination (the run's room 1 by default): look.py TAG VIEWS [room]
#   views (';'-separated): top[:height] | ob:x,y,h,tx,ty  (camera at local x,y,h looking at local tx,ty,0) |
#   eye:x,y,deg (gnome eye height, facing deg: 0 = north/+Y, 90 = east/+X) | far (fog thinned for the whole view)
import json, os, sys, subprocess, os
from PIL import Image
tag = sys.argv[1]; views = [v for v in sys.argv[2].split(';') if v]; room = int(sys.argv[3]) if len(sys.argv) > 3 else 1
os.makedirs('out/dst', exist_ok=True)
setup = ("const g=__dmh,P=g.player,D=g.descent;g.godMode=true;g.tip=()=>{};g.hud.toast=()=>{};g.banner=()=>{};g.phaseTimer=0;__sim(30);"
  f"if(D.room!=={room}){{D.enter({room});__sim(5);}}g.toSpawn=0;g.spawned=0;for(const E of g.enemies){{E.dead=true;E.remove=true;}}__sim(20);"
  "document.getElementById('hud').style.visibility='hidden';g.vm.hidden=true;"
  "window.__A=D.A();window.__thin=(on)=>{const e=g.env;if(!e.__op)e.__op=e.palette;e.palette=on?((P,z)=>{const r=e.__op(P,z);r.fogDensity=0.0000015;r.fogStart=60000;return r;}):e.__op;e.update(100,g.camera.position,e.zone);};"
  "JSON.stringify({room:D.room,arena:D.arena,name:D.nameOf(),c:__A.c,spawns:__A.spawns,solidified:__A.solidified,zone:__A.zone,dest:!!__A.dest})")
steps = [{"js": setup}]
names = []
for i, v in enumerate(views):
    k, _, a = v.partition(':'); nm = f'{tag}_{i}'
    if k == 'clear':   # clear the room: the stations and the way on come up
        steps += [{"js": "const g=__dmh;g.toSpawn=0;g.spawned=0;for(const E of g.enemies){E.dead=true;E.remove=true;}g.descent.clear();__sim(60);'c'"}]; continue
    hide = "for(const m of g.world.chunkMeshes||[]){const k=(m.geometry.userData.shape||'');if(/^(mceil|mtite)/.test(k))m.visible=false;}"   # roofs off for the views from above
    if k == 'top':
        h = float(a or 16000)
        js = f"const g=__dmh;{hide}__thin(true);const C=g.camera,[cx,cy]=__A.c;window.__dmhHold=true;C.position.set(cx,{h},cy+1);C.up.set(0,0,-1);C.lookAt(cx,0,cy);C.fov=60;C.updateProjectionMatrix();C.updateMatrixWorld();C.up.set(0,1,0);'t'"
    elif k == 'tq':   # top-down over local x,y from height h (same way up as 'top': north at the bottom, east to the right)
        x, y, h = [float(t) for t in a.split(',')]
        js = f"const g=__dmh;{hide}__thin(true);const C=g.camera,[cx,cy]=__A.c;window.__dmhHold=true;C.position.set(cx+{x},{h},cy+{y}+1);C.up.set(0,0,-1);C.lookAt(cx+{x},0,cy+{y});C.fov=60;C.updateProjectionMatrix();C.updateMatrixWorld();C.up.set(0,1,0);'t'"
    elif k == 'ob':
        x, y, h, tx, ty = [float(t) for t in a.split(',')]
        js = f"const g=__dmh;__thin(true);const C=g.camera,[cx,cy]=__A.c;window.__dmhHold=true;C.position.set(cx+{x},{h},cy+{y});C.lookAt(cx+{tx},0,cy+{ty});C.fov=60;C.updateProjectionMatrix();C.updateMatrixWorld();'o'"
    else:
        x, y, d = [float(t) for t in a.split(',')]
        js = f"const g=__dmh;for(const m of g.world.chunkMeshes||[])if(/^(mceil|mtite)/.test(m.geometry.userData.shape||''))m.visible=true;__thin(false);const C=g.camera,[cx,cy]=__A.c,r={d}*Math.PI/180;window.__dmhHold=true;C.position.set(cx+{x},150,cy+{y});C.lookAt(cx+{x}+Math.sin(r)*1000,90,cy+{y}+Math.cos(r)*1000);C.fov=80;C.updateProjectionMatrix();C.updateMatrixWorld();'e'"
    steps += [{"js": js}, {"wait": 40, "shot": f"dst/{nm}"}]
    names.append(nm)
json.dump({"w": 1280, "h": 720, "query": "&map=6" + (("&dest=" + os.environ["DEST"]) if os.environ.get("DEST") else ""), "steps": steps}, open('/tmp/dlook.json', 'w'))
r = subprocess.run(['timeout', '900', 'python3', 'shot_fl.py', '/tmp/dlook.json'], capture_output=True, text=True)
print([l for l in r.stdout.splitlines() if l.startswith('js>')][:1])
print([l for l in r.stdout.splitlines() if 'rror' in l][:5])
cols = 2 if len(names) > 1 else 1; rows = (len(names) + cols - 1) // cols
S = Image.new('RGB', (960 * cols, 540 * rows))
for i, n in enumerate(names):
    try: S.paste(Image.open(f'out/dst/{n}.png').resize((960, 540)), ((i % cols) * 960, (i // cols) * 540))
    except Exception as e: print('miss', n, e)
S.save(f'/tmp/dl_{tag}.jpg', quality=84); print('ok', f'/tmp/dl_{tag}.jpg')
