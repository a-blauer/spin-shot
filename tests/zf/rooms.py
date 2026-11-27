import json,subprocess,sys
from PIL import Image, ImageDraw
chs=[int(x) for x in sys.argv[1].split(',')] if ',' in sys.argv[1] else list(range(int(sys.argv[1]),int(sys.argv[2]))); tag=sys.argv[3]; q=sys.argv[4] if len(sys.argv)>4 else ''
steps=[{"js":"const g=__dmh;g.godMode=true;g.tip=()=>{};g.hud.toast=()=>{};g.banner=()=>{};__sim(10);document.getElementById('hud').style.visibility='hidden';g.vm.hidden=true;'a'"},{"wait":500}]
for ch in chs:
    steps.append({"js":f"const g=__dmh,D=g.descent,P=g.player;for(const E of g.enemies)E.dead=true;D.arena={ch};D.room=2;D.flip=1;D.arrive(false);__sim(20);for(const E of g.enemies)E.dead=true;const A=D.A();window.__eo=window.__eo||(g.camera.position.y-P.pos.y);const s=P.pos.clone();const cx=A.c[0],cz=A.c[1];const dx=cx-s.x,dz=cz-s.z,L=Math.hypot(dx,dz)||1;const px=s.x-dx/L*150,pz=s.z-dz/L*150,py=520;const f=()=>{{P.pos.set(px,py-window.__eo,pz);P.vel.set(0,0,0);}};f();P.yaw=Math.atan2(-dx,-dz);P.pitch=-Math.atan2(py-150,L+150)*0.9;window.__dmhHold=true;__sim(1);f();JSON.stringify([D.arena,g.zone,(g.descent.T&&g.descent.T().name)||''])"})
    steps.append({"wait":250}); steps.append({"shot":f"rm{tag}{ch}"})
json.dump({"w":640,"h":360,"query":"&map=6"+q,"steps":steps},open(f'zf/rooms{tag}.json','w'))
o=subprocess.run(['python3','shot_fl.py',f'zf/rooms{tag}.json'],capture_output=True,text=True,timeout=1800).stdout
print('\n'.join(l for l in o.split('\n') if l.startswith('js>') or 'pageerror' in l)[:3000])
cols=4; rows=(len(chs)+cols-1)//cols
o=Image.new('RGB',(cols*400,rows*240),'black'); dr=ImageDraw.Draw(o)
for i,ch in enumerate(chs):
    try: im=Image.open(f'out/rm{tag}{ch}.png').resize((400,225))
    except Exception: continue
    o.paste(im,((i%cols)*400,(i//cols)*240)); dr.text(((i%cols)*400+4,(i//cols)*240+226),f'{ch}',fill='yellow')
o.save(f'/tmp/rooms_{tag}.jpg',quality=80)
