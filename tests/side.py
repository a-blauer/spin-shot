# side-profile inspection sheet: side.py <tag> <gun indices...>
import json, sys, subprocess
from PIL import Image
tag=sys.argv[1]; guns=[int(x) for x in sys.argv[2:]]
steps=[{"js":"const g=__dmh,P=g.player;g.godMode=true;g.hud.helpT=0;g.phase='Intermission';g.phaseTimer=1e9;for(const E of g.enemies)E.dead=true;P.pos.set(-1500,114,0);P.yaw=1.1;P.pitch=0.0;__sim(10);document.querySelectorAll('canvas').forEach(c=>{});1"}]
for gi in guns:
    for k,pose in enumerate(["[86,16,2, 0,-84,0]","[62,6,-7, -4,28,-8]"]):
        steps.append({"js":f"window.__dmhHold=false;(()=>{{const P=__dmh.player,vm=__dmh.vm;P.giveWeapon({gi});vm.inspect=null;__sim(50);vm.inspect={pose};__sim(2);window.__dmhHold=true;return 1}})()"})
        steps.append({"wait":70,"shot":f"sd_{gi:02d}_{k}"})
json.dump({"steps":steps},open('side_tmp.json','w'))
out=subprocess.run(['timeout','118','python3','shot.py','side_tmp.json'],capture_output=True,text=True).stdout
print('\n'.join(l for l in out.split('\n') if 'pageerror' in l or '[error]' in l)[:1500])
W,H=700,364
sheet=Image.new('RGB',(W*2,H*len(guns)))
for r,gi in enumerate(guns):
    for k in range(2):
        im=Image.open(f'out/sd_{gi:02d}_{k}.png').convert('RGB').crop((180,130,1180,650)).resize((W,H)); sheet.paste(im,(k*W,r*H))
sheet.save(f'/tmp/side_{tag}.png'); print(sheet.size)
