# aimed view of each gun: ads.py <tag> <gun indices...>
import json, sys, subprocess
from PIL import Image
tag=sys.argv[1]; guns=[int(x) for x in sys.argv[2:]]
steps=[{"js":"const g=__dmh,P=g.player;g.godMode=true;g.hud.helpT=-5;g.tip=()=>{};g.phase='Intermission';g.phaseTimer=1e9;for(const E of g.enemies)E.dead=true;P.pos.set(-1500,114,0);P.yaw=1.1;P.pitch=0.0;__sim(10);1"}]
for gi in guns:
    steps.append({"js":f"window.__dmhHold=false;(()=>{{const P=__dmh.player;P.giveWeapon({gi});__sim(45);__sim(40,{{aim:true}});window.__dmhHold=true;return 1}})()"})
    steps.append({"wait":50,"shot":f"ads_{gi:02d}"})
json.dump({"steps":steps},open('ads_tmp.json','w'))
out=subprocess.run(['timeout','172','python3','shot.py','ads_tmp.json'],capture_output=True,text=True).stdout
print('\n'.join(l for l in out.split('\n') if 'pageerror' in l or '[error]' in l)[:800])
W,H=480,270; cols=5
sheet=Image.new('RGB',(W*cols,H*((len(guns)+cols-1)//cols)))
for k,gi in enumerate(guns):
    try: im=Image.open(f'out/ads_{gi:02d}.png').convert('RGB').resize((W,H)); sheet.paste(im,((k%cols)*W,(k//cols)*H))
    except Exception as e: print('miss',gi)
sheet.save(f'/tmp/ads_{tag}.jpg',quality=82); print(sheet.size)
