# tumbleweed flight stills: first person + side view at several frames after one shot, a line of 3 held enemies ahead
import json, subprocess
from PIL import Image
sig = json.load(open('sigf.json'))
fr = [3, 10, 20, 30, 42, 62]
steps = [sig['steps'][0], {"js": "(()=>{const g=__dmh,P=g.player;g.hud.draw=()=>{};g.hud.cv.style.visibility='hidden';P.yaw=0;P.pitch=0;P.giveWeapon(46);g.vm.inspect=null;__sim(60);"
  "window.__es=__spawn(3,1e6,true);window.__adv=(n)=>{for(let k=0;k<n;k++){P.yaw=0;P.pitch=0;P.pos.x=px;P.pos.z=pz;__sim(1);for(const E of __es){if(!E.dead){E.pos.x=E.home.x;E.pos.z=E.home.z;E.vel.x=0;E.vel.z=0;}}}};"
  "__adv(20);P.slot.ammo=Math.max(3,P.slot.ammo);P.fireCd=0;P.fireWeapon();window.__ft=0;window.__dmhHold=true;return __es.length})()"}]
for f in fr:
    steps.append({"js": f"window.__dmhHold=false;__adv({f}-window.__ft);window.__ft={f};window.__dmhHold=true;1"})
    steps.append({"wait": 30, "shot": f"twf_fp_{f:02d}"})
    steps.append({"js": "(()=>{const g=__dmh,c=g.camera;g.vm.root.visible=false;c.position.set(px+700,150,pz-430);c.lookAt(px,70,pz-430);c.updateMatrixWorld();return 1})()"})
    steps.append({"wait": 30, "shot": f"twf_sd_{f:02d}"})
    steps.append({"js": "__dmh.vm.root.visible=true;1"})
json.dump({"w": 1280, "h": 720, "query": sig['query'], "steps": steps}, open('/tmp/twfly.json', 'w'))
r = subprocess.run(['timeout', '600', 'python3', 'shot_fl.py', '/tmp/twfly.json'], capture_output=True, text=True)
print([l for l in r.stdout.splitlines() if l.startswith('js>')][:3])
for kind in ('fp', 'sd'):
    S = Image.new('RGB', (1920, 1620))
    for i, f in enumerate(fr):
        S.paste(Image.open(f'out/twf_{kind}_{f:02d}.png').resize((960, 540)), ((i % 2) * 960, (i // 2) * 540))
    S.save(f'/tmp/twf_{kind}.jpg', quality=82)
print('ok')
