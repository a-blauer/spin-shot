# Survey stills of Thimblewick.
#   top: orthographic plan from a cut height (everything above CUT is left out, so the giants' canopies do not hide the
#        hollow), mirrored into the code's frame (+x right, +y up) with a 500-unit grid -> out/TAG/top_code.png
#   ob_*: high obliques from the four corners, fog off
#   extra views from a json list [{n, at:[x,y,z], look:[x,y,z], fov, fog}] (local village coords, z up)
# Usage: python3 vs2/survey.py TAG [extra.json] [--cut 1300] [--half 4300] [--nob]
import json, sys, subprocess, os, math
from PIL import Image, ImageDraw
args = sys.argv[1:]; tag = args[0]
def opt(k, d):
    return float(args[args.index(k) + 1]) if k in args else d
CUT = opt('--cut', 1300); HALF = opt('--half', 4300); nob = '--nob' in args
extra = json.load(open(args[1])) if len(args) > 1 and args[1].endswith('.json') else []
os.makedirs('out/' + tag, exist_ok=True)
SETUP = ("const g=__dmh;g.godMode=true;g.tip=()=>{};g.hud.toast=()=>{};g.banner=()=>{};__sim(10);g.villageRT.enter();__sim(30);"
         "document.getElementById('hud').style.visibility='hidden';g.vm.hidden=true;for(const p of g.villageRT.people)p.root.visible=true;"
         "let U=null;g.scene.traverse(o=>{const m=o.material;if(!U&&m&&m.uniforms&&m.uniforms.fogParams)U=m.uniforms.fogParams;});window.__fogU=U;window.__fogW=U?U.value.w:0;"
         "if(!g.__render){g.__render=g.render.bind(g);g.render=()=>{const O=window.__ortho;if(!O)return g.__render();const R=g.renderer;R.autoClear=false;R.setClearColor(0x1a2418,1);R.clear();R.render(g.scene,O);};}'v'")
pre = [{"js": SETUP}, {"wait": 1500}]
def cam(at, look, fov, fog=True):
    return {"js": f"window.__ortho=null;if(window.__fogU)window.__fogU.value.w={'window.__fogW' if fog else '0'};const g=__dmh,V=g.villageRT,C=g.camera;window.__dmhHold=true;const [a,b]=V.w({at[0]},{at[1]}),[e,f]=V.w({look[0]},{look[1]});C.up.set(0,1,0);g.player.fov={fov};C.position.set(a,{at[2]},b);C.lookAt(e,{look[2]},f);C.updateMatrixWorld();'c'"}
top = {"js": f"if(window.__fogU)window.__fogU.value.w=0;const g=__dmh,V=g.villageRT,T=window.__THREE;window.__dmhHold=true;const [a,b]=V.w(0,0),H={HALF};const O=new T.OrthographicCamera(-H,H,H,-H,1,{CUT}+400);O.position.set(a,{CUT},b);O.up.set(0,0,1);O.lookAt(a,0,b);O.updateMatrixWorld();O.updateProjectionMatrix();window.__ortho=O;'o'"}
steps = list(pre) + [top, {"wait": 700}, {"shot": f"{tag}/top"}, {"js": "window.__ortho=null;'x'"}]
json.dump({"w": 1400, "h": 1400, "query": "&map=6", "steps": steps}, open('vs2/_top.json', 'w'))
rest = list(pre)
if not nob:
    for n, (x, y) in {'SW': (-3600, -3600), 'SE': (3600, -3600), 'NE': (3600, 3600), 'NW': (-3600, 3600)}.items():
        rest += [cam([x, y, 2300], [x * 0.15, y * 0.15, 0], 75, fog=False), {"wait": 500}, {"shot": f"{tag}/ob_{n}"}]
for e in extra:
    rest += [cam(e['at'], e['look'], e.get('fov', 80), fog=e.get('fog', True)), {"wait": 450}, {"shot": f"{tag}/{e['n']}"}]
json.dump({"w": 1280, "h": 720, "query": "&map=6", "steps": rest}, open('vs2/_rest.json', 'w'))
for f in ['vs2/_top.json'] + (['vs2/_rest.json'] if len(rest) > len(pre) else []):
    o = subprocess.run(['python3', 'shot_fl.py', f], capture_output=True, text=True, timeout=3000).stdout
    print('\n'.join(l for l in o.splitlines() if ('error' in l.lower() and 'toNonIndexed' not in l) or l.startswith('shot'))[-1500:])
im = Image.open(f'out/{tag}/top.png').transpose(Image.FLIP_LEFT_RIGHT); d = ImageDraw.Draw(im); W = im.width; s = W / (2 * HALF)
for v in range(-int(HALF) // 500 * 500, int(HALF) + 1, 500):
    p = W / 2 + v * s; c = (255, 230, 120) if v == 0 else (230, 230, 230)
    wd = 2 if v % 1000 == 0 else 1
    d.line([(p, 0), (p, W)], fill=c, width=wd); d.line([(0, W - p), (W, W - p)], fill=c, width=wd)
    if v % 1000 == 0: d.text((p + 3, 3), str(v), fill=(255, 255, 0)); d.text((3, W - p + 3), str(v), fill=(255, 255, 0))
im.save(f'out/{tag}/top_code.png')
if not nob and os.path.exists(f'out/{tag}/ob_SW.png'):
    ims = [Image.open(f'out/{tag}/ob_{n}.png') for n in ['SW', 'SE', 'NW', 'NE']]; Wd, Hd = ims[0].size; g = Image.new('RGB', (Wd * 2, Hd * 2))
    for i, m in enumerate(ims): g.paste(m, ((i % 2) * Wd, (i // 2) * Hd))
    g.save(f'out/{tag}/ob_all.png')
