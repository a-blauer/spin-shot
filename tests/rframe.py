# full frames of reloads: rframe.py TAG gun frac,frac,... [--full]  (empty reload)
import json, sys, subprocess
from PIL import Image
tag = sys.argv[1]; gi = int(sys.argv[2]); fr = [float(x) for x in sys.argv[3].split(',')]
steps = [{"js": "const g=__dmh,P=g.player;g.godMode=true;g.hud.helpT=-5;g.hud.draw=()=>{};g.hud.cv.style.visibility='hidden';g.tip=()=>{};g.phase='Intermission';g.phaseTimer=1e9;for(const E of g.enemies)E.dead=true;P.pos.set(-1500,114,0);P.yaw=1.1;P.pitch=0.0;__sim(10);1"},
         {"js": f"(()=>{{const P=__dmh.player,vm=__dmh.vm;P.giveWeapon({gi});vm.inspect=null;P.reloading=false;__sim(60);P.slot.ammo=0;P.slot.reserve=999;P.startReload();window.__rd=P.reloadDur;window.__rt=0;window.__dmhHold=true;return P.reloadDur}})()"}]
for f in fr:
    steps.append({"js": f"window.__dmhHold=false;(()=>{{const n=Math.round(window.__rd*60*{f})-window.__rt;__sim(Math.max(1,n));window.__rt+=Math.max(1,n);window.__dmhHold=true;return 1}})()"})
    steps.append({"wait": 30, "shot": f"rf_{tag}_{int(f*100):02d}"})
json.dump({"w": 1280, "h": 720, "steps": steps}, open('/tmp/rf_tmp.json', 'w'))
out = subprocess.run(['timeout', '600', 'python3', 'shot_fl.py', '/tmp/rf_tmp.json'], capture_output=True, text=True).stdout
n = len(fr); cols = 2 if n > 1 else 1; rows = (n + cols - 1) // cols
S = Image.new('RGB', (960 * cols, 540 * rows))
for i, f in enumerate(fr):
    im = Image.open(f'out/rf_{tag}_{int(f*100):02d}.png').resize((960, 540)); S.paste(im, ((i % cols) * 960, (i // cols) * 540))
S.save(f'/tmp/rf_{tag}.jpg', quality=84); print('ok')
