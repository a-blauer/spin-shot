import json,subprocess,sys,math
ch=int(sys.argv[1]); views=json.loads(sys.argv[2]); tag=sys.argv[3]
steps=[{"js":"const g=__dmh;g.godMode=true;g.tip=()=>{};g.hud.toast=()=>{};g.banner=()=>{};__sim(10);document.getElementById('hud').style.visibility='hidden';g.vm.hidden=true;'a'"},{"wait":400},
{"js":f"const g=__dmh,D=g.descent,P=g.player;for(const E of g.enemies)E.dead=true;D.arena={ch};D.room=2;D.flip=1;D.arrive(false);__sim(20);for(const E of g.enemies)E.dead=true;const A=D.A();window.__A=A;window.__eo=(g.camera.position.y-P.pos.y);JSON.stringify([A.c,A.hx,A.hy,A.H,P.pos.x|0,P.pos.z|0,P.yaw])"}]
for i,(x,z,h,yaw,pit) in enumerate(views):
    steps.append({"js":f"const g=__dmh,P=g.player,A=window.__A;const f=()=>{{P.pos.set(A.c[0]+({x}),{h}-window.__eo,A.c[1]+({z}));P.vel.set(0,0,0);}};f();P.yaw={yaw};P.pitch={pit};window.__dmhHold=true;__sim(1);f();'v'"})
    steps.append({"wait":250}); steps.append({"shot":f"{tag}{i}"})
json.dump({"w":1280,"h":540,"query":"&map=6","steps":steps},open(f'zf/{tag}.json','w'))
o=subprocess.run(['python3','shot_fl.py',f'zf/{tag}.json'],capture_output=True,text=True,timeout=1800).stdout
print('\n'.join(l for l in o.split('\n') if l.startswith('js>') or 'pageerror' in l)[:2000])
