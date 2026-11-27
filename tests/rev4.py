# full review sheet per gun: side, three-quarter, in hand, aimed.  rev4.py <tag> <gun indices...>
import json, sys, subprocess
from PIL import Image
tag=sys.argv[1]; guns=[int(x) for x in sys.argv[2:]]
steps=[{"js":"const g=__dmh,P=g.player;g.godMode=true;g.hud.helpT=-5;g.tip=()=>{};g.phase='Intermission';g.phaseTimer=1e9;for(const E of g.enemies)E.dead=true;P.pos.set(-1500,114,0);P.yaw=1.1;P.pitch=0.0;__sim(10);1"}]
for gi in guns:
    for k,pose in enumerate(["[86,16,2, 0,-84,0]","[62,6,-7, -4,28,-8]"]):
        steps.append({"js":f"window.__dmhHold=false;(()=>{{const P=__dmh.player,vm=__dmh.vm;if(P.slot.def!=={gi})P.giveWeapon({gi});vm.inspect=null;__sim(50);vm.inspect={pose};__sim(2);window.__dmhHold=true;return 1}})()"})
        steps.append({"wait":60,"shot":f"r4_{gi:02d}_{k}"})
    steps.append({"js":"window.__dmhHold=false;__dmh.vm.inspect=null;__sim(40);window.__dmhHold=true;1"}); steps.append({"wait":60,"shot":f"r4_{gi:02d}_2"})
    steps.append({"js":"window.__dmhHold=false;__sim(40,{aim:true});window.__dmhHold=true;1"}); steps.append({"wait":60,"shot":f"r4_{gi:02d}_3"})
json.dump({"steps":steps},open('r4_tmp.json','w'))
out=subprocess.run(['timeout','170','python3','shot.py','r4_tmp.json'],capture_output=True,text=True).stdout
print('\n'.join(l for l in out.split('\n') if 'pageerror' in l or '[error]' in l)[:1500])
W,H=420,236
sheet=Image.new('RGB',(W*4,H*len(guns)))
for r,gi in enumerate(guns):
    for k in range(4):
        im=Image.open(f'out/r4_{gi:02d}_{k}.png').convert('RGB')
        im=im.crop((180,130,1180,692)) if k<2 else im.crop((390,220,1280,720))
        sheet.paste(im.resize((W,H)),(k*W,r*H))
sheet.save(f'/tmp/r4_{tag}.png'); print(sheet.size)
