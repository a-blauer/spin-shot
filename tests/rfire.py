# frames after one shot: rfire.py TAG gun f1,f2,...   (f = sim frames after the trigger)
import json, sys, subprocess
from PIL import Image
tag = sys.argv[1]; gi = int(sys.argv[2]); fr = [int(x) for x in sys.argv[3].split(',')]
steps = [{"js": "const g=__dmh,P=g.player;g.godMode=true;g.hud.helpT=-5;g.hud.draw=()=>{};g.hud.cv.style.visibility='hidden';g.tip=()=>{};g.phase='Intermission';g.phaseTimer=1e9;for(const E of g.enemies)E.dead=true;P.pos.set(-1500,114,0);P.yaw=1.1;P.pitch=0.0;__sim(10);1"},
         {"js": f"(()=>{{const P=__dmh.player,vm=__dmh.vm;P.giveWeapon({gi});vm.inspect=null;P.reloading=false;__sim(60);P.slot.ammo=Math.max(3,P.slot.ammo);P.fireCd=0;__sim(1,{{fire:true,firePressed:1}});window.__ft=1;window.__dmhHold=true;return 1}})()"}]
for f in fr:
    steps.append({"js": f"window.__dmhHold=false;(()=>{{const n={f}-window.__ft;if(n>0)__sim(n);window.__ft={f};window.__dmhHold=true;return 1}})()"})
    steps.append({"wait": 30, "shot": f"fr_{tag}_{f:02d}"})
json.dump({"w": 1280, "h": 720, "steps": steps}, open('/tmp/fr_tmp.json', 'w'))
subprocess.run(['timeout', '600', 'python3', 'shot_fl.py', '/tmp/fr_tmp.json'], capture_output=True, text=True)
n = len(fr); cols = 2; rows = (n + 1) // 2
S = Image.new('RGB', (960 * cols, 540 * rows))
for i, f in enumerate(fr):
    im = Image.open(f'out/fr_{tag}_{f:02d}.png').resize((960, 540)); S.paste(im, ((i % cols) * 960, (i // cols) * 540))
S.save(f'/tmp/fr_{tag}.jpg', quality=84); print('ok')
