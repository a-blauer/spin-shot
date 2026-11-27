# first-person strips per gun: idle, firing, reload at 25/50/75/95%:  gview.py TAG idx,idx,... [tier]
import json, sys, subprocess
from PIL import Image, ImageDraw
tag = sys.argv[1]; ids = [int(x) for x in sys.argv[2].split(',')]; tier = int(sys.argv[3]) if len(sys.argv) > 3 and sys.argv[3].isdigit() else 0
F = [('idle', None), ('fire', None), ('r20', 0.2), ('r40', 0.4), ('r60', 0.6), ('r80', 0.8)]
SKIP_FIRE = '--nofire' in sys.argv
steps = [{"js": "const g=__dmh,P=g.player;g.godMode=true;g.hud.helpT=-5;g.hud.draw=()=>{};g.hud.cv.style.visibility='hidden';g.tip=()=>{};g.phase='Intermission';g.phaseTimer=1e9;for(const E of g.enemies)E.dead=true;P.pos.set(-1500,114,0);P.yaw=1.1;P.pitch=0.0;__sim(10);1"}]
for gi in ids:
    steps.append({"js": f"window.__dmhHold=false;(()=>{{const P=__dmh.player,vm=__dmh.vm;P.giveWeapon({gi});if({tier})vm.setWeapon({gi},{tier},false);vm.inspect=null;P.reloading=false;__sim(60);window.__dmhHold=true;return P.slot.def}})()"})
    steps.append({"wait": 30, "shot": f"gv_{tag}_{gi:02d}_idle"})
    steps.append({"js": "window.__dmhHold=false;(()=>{const P=__dmh.player;P.slot.ammo=Math.max(P.slot.ammo,5);for(let k=0;k<4;k++){P.fireCd=0;__sim(1,{fire:true,firePressed:1});}window.__dmhHold=true;return 1})()"})
    steps.append({"wait": 30, "shot": f"gv_{tag}_{gi:02d}_fire"})
    steps.append({"js": "window.__dmhHold=false;(()=>{const P=__dmh.player;__sim(40);P.reloading=false;P.slot.ammo=0;P.slot.reserve=999;P.startReload();window.__rd=P.reloadDur;window.__rt=0;window.__dmhHold=true;return P.reloadDur})()"})
    for name, f in F[2:]:
        steps.append({"js": f"window.__dmhHold=false;(()=>{{const n=Math.round(window.__rd*60*{f})-window.__rt;__sim(Math.max(1,n));window.__rt+=Math.max(1,n);window.__dmhHold=true;return 1}})()"})
        steps.append({"wait": 30, "shot": f"gv_{tag}_{gi:02d}_{name}"})
json.dump({"w": 1280, "h": 720, "steps": steps}, open(f'/tmp/gv_{tag}.json', 'w'))
out = subprocess.run(['timeout', '1500', 'python3', 'shot_fl.py', f'/tmp/gv_{tag}.json'], capture_output=True, text=True).stdout
err = [l for l in out.split('\n') if 'rror' in l]
if err: print('\n'.join(err[:5]))
W, H = 480, 300
S = Image.new('RGB', (W * len(F), H * len(ids)), (0, 0, 0)); d = ImageDraw.Draw(S)
for r, gi in enumerate(ids):
    for c, (name, _) in enumerate(F):
        try: im = Image.open(f'out/gv_{tag}_{gi:02d}_{name}.png')
        except Exception: continue
        w, h = im.size; im = im.crop((int(w * 0.28), int(h * 0.18), w, h)).resize((W, H)); S.paste(im, (c * W, r * H))
        d.rectangle((c * W, r * H, c * W + 70, r * H + 16), fill=(0, 0, 0)); d.text((c * W + 3, r * H + 2), f'{gi} {name}', fill=(255, 220, 120))
S.save(f'/tmp/gv_{tag}.jpg', quality=85); print('ok', f'/tmp/gv_{tag}.jpg')
