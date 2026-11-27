# hand close-ups: hview.py TAG idx,idx,... mode   mode: idle | r30,r60 (reload fractions)  -> sheet of crops, 3 per row
import json, sys, subprocess
from PIL import Image, ImageDraw
tag = sys.argv[1]; ids = [int(x) for x in sys.argv[2].split(',')]; mode = sys.argv[3] if len(sys.argv) > 3 else 'idle'
fr = [] if mode == 'idle' else [float(x[1:]) / 100 for x in mode.split(',')]
steps = [{"js": "const g=__dmh,P=g.player;g.godMode=true;g.hud.helpT=-5;g.hud.draw=()=>{};g.hud.cv.style.visibility='hidden';g.tip=()=>{};g.phase='Intermission';g.phaseTimer=1e9;for(const E of g.enemies)E.dead=true;P.pos.set(-1500,114,0);P.yaw=1.1;P.pitch=0.0;__sim(10);1"}]
names = []
for gi in ids:
    steps.append({"js": f"window.__dmhHold=false;(()=>{{const P=__dmh.player,vm=__dmh.vm;P.giveWeapon({gi});vm.inspect=null;P.reloading=false;__sim(60);window.__dmhHold=true;return 1}})()"})
    if not fr:
        steps.append({"wait": 30, "shot": f"hv_{tag}_{gi:02d}_i"}); names.append((gi, 'idle', f"hv_{tag}_{gi:02d}_i"))
    else:
        steps.append({"js": "window.__dmhHold=false;(()=>{const P=__dmh.player;P.slot.ammo=0;P.slot.reserve=999;P.startReload();window.__rd=P.reloadDur;window.__rt=0;window.__dmhHold=true;return 1})()"})
        for f in fr:
            steps.append({"js": f"window.__dmhHold=false;(()=>{{const n=Math.round(window.__rd*60*{f})-window.__rt;__sim(Math.max(1,n));window.__rt+=Math.max(1,n);window.__dmhHold=true;return 1}})()"})
            nm = f"hv_{tag}_{gi:02d}_{int(f*100)}"; steps.append({"wait": 30, "shot": nm}); names.append((gi, f'r{int(f*100)}', nm))
        steps.append({"js": "window.__dmhHold=false;(()=>{const P=__dmh.player;__sim(Math.round(window.__rd*60)+10);P.reloading=false;return 1})()"})
json.dump({"w": 1920, "h": 1080, "steps": steps}, open(f'/tmp/hv_{tag}.json', 'w'))
subprocess.run(['timeout', '1700', 'python3', 'shot_fl.py', f'/tmp/hv_{tag}.json'], capture_output=True, text=True)
W, H = 640, 330; cols = 3; rows = (len(names) + cols - 1) // cols
S = Image.new('RGB', (W * cols, H * rows)); d = ImageDraw.Draw(S)
for k, (gi, lab, nm) in enumerate(names):
    try: im = Image.open(f'out/{nm}.png').crop((620, 420, 1920, 1080)).resize((W, H))
    except Exception: continue
    x, y = (k % cols) * W, (k // cols) * H; S.paste(im, (x, y)); d.rectangle((x, y, x + 80, y + 16), fill=(0, 0, 0)); d.text((x + 3, y + 2), f'{gi} {lab}', fill=(255, 220, 120))
S.save(f'/tmp/hv_{tag}.jpg', quality=86); print('ok', f'/tmp/hv_{tag}.jpg', len(names))
