# try cant values: adsv.py <tag> "R,Y,Z;R,Y,Z" <guns...>
import json, sys, subprocess
from PIL import Image
tag=sys.argv[1]; vals=[v.split(',') for v in sys.argv[2].split(';')]; guns=[int(x) for x in sys.argv[3:]]
steps=[{"js":"const g=__dmh,P=g.player;g.godMode=true;g.hud.helpT=-5;g.tip=()=>{};g.phase='Intermission';g.phaseTimer=1e9;for(const E of g.enemies)E.dead=true;P.pos.set(-1500,114,0);P.yaw=1.1;P.pitch=0.0;__sim(10);1"}]
for vi,(r,y,z) in enumerate(vals):
  for gi in guns:
    steps.append({"js":f"window.__dmhHold=false;(()=>{{window.__cantR={r};window.__cantY={y};window.__cantZ={z};const P=__dmh.player;P.giveWeapon({gi});__dmh.vm.setWeapon({gi},0,false);__sim(45);__sim(40,{{aim:true}});window.__dmhHold=true;return 1}})()"})
    steps.append({"wait":50,"shot":f"adsv_{vi}_{gi:02d}"})
json.dump({"steps":steps},open('adsv_tmp.json','w'))
out=subprocess.run(['timeout','172','python3','shot.py','adsv_tmp.json'],capture_output=True,text=True).stdout
print('\n'.join(l for l in out.split('\n') if 'pageerror' in l or '[error]' in l)[:800])
W,H=400,225
sheet=Image.new('RGB',(W*len(guns),H*len(vals)))
for vi in range(len(vals)):
  for k,gi in enumerate(guns):
    try: im=Image.open(f'out/adsv_{vi}_{gi:02d}.png').convert('RGB').resize((W,H)); sheet.paste(im,(k*W,vi*H))
    except Exception as e: print('miss',gi)
sheet.save(f'/tmp/adsv_{tag}.jpg',quality=82); print(sheet.size)
