# three-quarter inspection of every gun's hands: grip.py <tag> [pose]
import json, sys, subprocess
from PIL import Image
tag=sys.argv[1]; pose=sys.argv[2] if len(sys.argv)>2 else "[62,6,-7, -4,28,-8]"
for b in range(3):
    guns=list(range(b*10,b*10+10))
    steps=[{"js":"const g=__dmh,P=g.player;g.godMode=true;g.hud.helpT=0;g.phase='Intermission';g.phaseTimer=1e9;for(const E of g.enemies)E.dead=true;P.pos.set(-1500,114,0);P.yaw=1.1;P.pitch=0.0;__sim(10);1"}]
    for gi in guns:
        steps.append({"js":f"window.__dmhHold=false;(()=>{{const P=__dmh.player,vm=__dmh.vm;P.giveWeapon({gi});vm.inspect=null;__sim(50);vm.inspect={pose};__sim(2);window.__dmhHold=true;return 1}})()"})
        steps.append({"wait":60,"shot":f"gp_{gi:02d}"})
    json.dump({"steps":steps},open('grip_tmp.json','w'))
    out=subprocess.run(['timeout','118','python3','shot.py','grip_tmp.json'],capture_output=True,text=True).stdout
    print('\n'.join(l for l in out.split('\n') if 'pageerror' in l or '[error]' in l)[:600])
W,H=560,292
for part in range(2):
    sheet=Image.new('RGB',(W*5,H*3))
    for k in range(15):
        gi=part*15+k
        im=Image.open(f'out/gp_{gi:02d}.png').convert('RGB').crop((180,130,1180,650)).resize((W,H)); sheet.paste(im,((k%5)*W,(k//5)*H))
    sheet.save(f'/tmp/grip_{tag}_{part}.png')
print('ok')
