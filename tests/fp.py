# first-person sheet: fp.py <tag> <gun indices...>  (hip view and aimed view of each)
import json, sys, subprocess
from PIL import Image
tag=sys.argv[1]; guns=[int(x) for x in sys.argv[2:]]
steps=[{"js":"const g=__dmh,P=g.player;g.godMode=true;g.hud.helpT=-5;g.tip=()=>{};g.phase='Intermission';g.phaseTimer=1e9;for(const E of g.enemies)E.dead=true;P.pos.set(-1500,114,0);P.yaw=1.1;P.pitch=0.0;__sim(10);1"}]
for gi in guns:
    steps.append({"js":f"window.__dmhHold=false;(()=>{{const P=__dmh.player,vm=__dmh.vm;P.giveWeapon({gi});vm.inspect=null;__sim(60);window.__dmhHold=true;return 1}})()"})
    steps.append({"wait":70,"shot":f"fp_{gi:02d}_0"})
    steps.append({"js":"window.__dmhHold=false;__sim(40,{aim:true});window.__dmhHold=true;1"})
    steps.append({"wait":70,"shot":f"fp_{gi:02d}_1"})
json.dump({"steps":steps},open('fp_tmp.json','w'))
out=subprocess.run(['timeout','150','python3','shot.py','fp_tmp.json'],capture_output=True,text=True).stdout
print('\n'.join(l for l in out.split('\n') if 'pageerror' in l or '[error]' in l)[:1500])
W,H=640,360
sheet=Image.new('RGB',(W*2,H*len(guns)))
for r,gi in enumerate(guns):
    for k in range(2):
        im=Image.open(f'out/fp_{gi:02d}_{k}.png').convert('RGB').resize((W,H)); sheet.paste(im,(k*W,r*H))
sheet.save(f'/tmp/fp_{tag}.png'); print(sheet.size)
