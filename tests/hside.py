# grips seen from outside the gun (hands kept on): hside.py TAG idx,... frames pose
#   frames: idle,r30,r60,...   pose: [x,y,z,p,y,r] for vm.inspect (default: the left flank)
import json, sys, subprocess
from PIL import Image, ImageDraw
tag = sys.argv[1]; ids = [int(x) for x in sys.argv[2].split(',')]; frames = sys.argv[3].split(',') if len(sys.argv) > 3 else ['idle']
pose = sys.argv[4] if len(sys.argv) > 4 else '[78,-2,-2, 0,96,0]'
steps = [{"js": "const g=__dmh,P=g.player;g.godMode=true;g.hud.helpT=-5;g.hud.draw=()=>{};g.hud.cv.style.visibility='hidden';g.tip=()=>{};g.phase='Intermission';g.phaseTimer=1e9;for(const E of g.enemies)E.dead=true;P.pos.set(-1500,114,0);P.yaw=1.1;P.pitch=0.0;__sim(10);1"}]
names = []
for gi in ids:
    steps.append({"js": f"window.__dmhHold=false;(()=>{{const P=__dmh.player,vm=__dmh.vm;vm.inspect=null;vm.inspectHands=false;P.giveWeapon({gi});P.reloading=false;__sim(60);return 1}})()"})
    rel = False
    for fr in frames:
        if fr == 'idle':
            steps.append({"js": f"(()=>{{const vm=__dmh.vm;vm.inspectHands=true;vm.inspect={pose};__sim(2);window.__dmhHold=true;return 1}})()"})
        else:
            f = float(fr[1:]) / 100
            if not rel:
                steps.append({"js": "window.__dmhHold=false;(()=>{const P=__dmh.player,vm=__dmh.vm;vm.inspect=null;P.slot.ammo=0;P.slot.reserve=999;P.startReload();window.__rd=P.reloadDur;window.__rt=0;return 1})()"}); rel = True
            steps.append({"js": f"window.__dmhHold=false;(()=>{{const vm=__dmh.vm;vm.inspect=null;const n=Math.round(window.__rd*60*{f})-window.__rt;__sim(Math.max(1,n-1));window.__rt+=Math.max(1,n);vm.inspectHands=true;vm.inspect={pose};__sim(1);window.__dmhHold=true;return 1}})()"})
        nm = f"hs_{tag}_{gi:02d}_{fr}"; steps.append({"wait": 30, "shot": nm}); names.append((gi, fr, nm))
    steps.append({"js": "window.__dmhHold=false;(()=>{const P=__dmh.player,vm=__dmh.vm;vm.inspect=null;vm.inspectHands=false;__sim(Math.round((window.__rd||1)*60)+10);P.reloading=false;return 1})()"})
json.dump({"w": 1280, "h": 720, "steps": steps}, open(f'/tmp/hs_{tag}.json', 'w'))
subprocess.run(['timeout', '1700', 'python3', 'shot_fl.py', f'/tmp/hs_{tag}.json'], capture_output=True, text=True)
W, H = 640, 360; cols = len(frames) if len(frames) > 1 else 3; rows = (len(names) + cols - 1) // cols
S = Image.new('RGB', (W * cols, H * rows)); d = ImageDraw.Draw(S)
for k, (gi, lab, nm) in enumerate(names):
    try: im = Image.open(f'out/{nm}.png').resize((W, H))
    except Exception: continue
    x, y = (k % cols) * W, (k // cols) * H; S.paste(im, (x, y)); d.rectangle((x, y, x + 80, y + 16), fill=(0, 0, 0)); d.text((x + 3, y + 2), f'{gi} {lab}', fill=(255, 220, 120))
S.save(f'/tmp/hs_{tag}.jpg', quality=86); print('ok', f'/tmp/hs_{tag}.jpg', len(names))
