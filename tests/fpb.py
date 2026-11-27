# first-person stills by body: fpb.py <tag> <gun> ...   columns: short thin arms / default / long heavy arms; rows: hip, aimed, mid-reload per gun
import json, sys, subprocess
from PIL import Image
tag=sys.argv[1]; guns=[int(x) for x in sys.argv[2:]]
B=[('{arms:-1,weight:-1}','short thin'),('{}','default'),('{arms:1,weight:1}','long heavy')]
steps=[{"js":"const g=__dmh,P=g.player;g.godMode=true;g.hud.helpT=-5;g.tip=()=>{};g.phase='Intermission';g.phaseTimer=1e9;for(const E of g.enemies)E.dead=true;P.pos.set(-1500,114,0);P.yaw=1.1;P.pitch=0.0;__sim(10);1"}]
for gi in guns:
    for bi,(b,_) in enumerate(B):
        steps.append({"js":f"window.__dmhHold=false;(()=>{{const P=__dmh.player,vm=__dmh.vm,M=__meta.Meta;M.setShapes({b});P.giveWeapon({gi});P.setBody(M.look());vm.inspect=null;__sim(70);window.__dmhHold=true;return JSON.stringify(P.body)}})()"})
        steps.append({"wait":70,"shot":f"fpb_{gi:02d}_{bi}_0"})
        steps.append({"js":"window.__dmhHold=false;__sim(40,{aim:true});window.__dmhHold=true;1"})
        steps.append({"wait":70,"shot":f"fpb_{gi:02d}_{bi}_1"})
        steps.append({"js":"window.__dmhHold=false;(()=>{const P=__dmh.player;__sim(20);P.slot.ammo=Math.max(0,P.slot.ammo-1);__sim(1,{reload:1});__sim(Math.round(P.reloadTime?26:26));window.__dmhHold=true;return P.reloading?'reloading':'not'})()"})
        steps.append({"wait":70,"shot":f"fpb_{gi:02d}_{bi}_2"})
        steps.append({"js":"window.__dmhHold=false;__sim(200);1"})
json.dump({"steps":steps},open('fp_tmp.json','w'))
out=subprocess.run(['timeout','170','python3','shot.py','fp_tmp.json'],capture_output=True,text=True).stdout
print('\n'.join(l for l in out.split('\n') if 'pageerror' in l or '[error]' in l or 'js>' in l)[:900])
W,H=560,315
sheet=Image.new('RGB',(W*3,H*3*len(guns)))
for r,gi in enumerate(guns):
    for bi in range(3):
        for k in range(3):
            try: im=Image.open(f'out/fpb_{gi:02d}_{bi}_{k}.png').convert('RGB').resize((W,H)); sheet.paste(im,(bi*W,(r*3+k)*H))
            except Exception as e: print('missing',gi,bi,k)
sheet.save(f'/tmp/fpb_{tag}.jpg',quality=85); print(sheet.size)
