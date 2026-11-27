import json,sys,subprocess
# views: name, cam local [x,y,z], look local [x,y,z]   (village local frame: +Y north, z up)
views=json.loads(sys.argv[1]); out=sys.argv[2] if len(sys.argv)>2 else 'vil'
steps=[{"js":"const g=__dmh;g.godMode=true;g.tip=()=>{};g.hud.toast=()=>{};g.banner=()=>{};__sim(10);g.villageRT.enter();__sim(30);document.getElementById('hud').style.visibility='hidden';g.vm.hidden=true;'v'"},{"wait":1500}]
for n,c,l in views:
    steps+=[{"js":f"const g=__dmh,V=g.villageRT,C=g.camera;window.__dmhHold=true;const [a,b]=V.w({c[0]},{c[1]}),[e,f]=V.w({l[0]},{l[1]});C.position.set(a,{c[2]},b);C.lookAt(e,{l[2]},f);C.fov=70;C.updateProjectionMatrix();C.updateMatrixWorld();'c'"},{"wait":700},{"shot":f"{out}/{n}"}]
json.dump({"w":1280,"h":720,"query":"&map=6","steps":steps},open('fl/vv.json','w'))
print(subprocess.run(['python3','shot_fl.py','fl/vv.json'],capture_output=True,text=True,timeout=900).stdout.count('js>'))
