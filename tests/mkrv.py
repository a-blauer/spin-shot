import json,sys
pre="const g=__dmh,P=g.player,D=g.descent;g.godMode=true;g.tip=()=>{};g.hud.helpT=1e6;g.hud.draw=()=>{};g.phaseTimer=0;__sim(30);g.toSpawn=0;g.spawned=0;for(const E of g.enemies)E.remove=true;window.__v=(i,fx,fy,h,pitch)=>{window.__dmhHold=false;D.arena=i;g.world.showChunk(i);D.flip=1;const A=D.A();g.zones.forEach((Z,k)=>Z.unlocked=k===A.zone);const x=A.c[0]+fx*A.hx,z=A.c[1]+fy*A.hy;P.pos.set(x,h,z);P.vel.set(0,0,0);P.yaw=Math.atan2(-(A.c[0]-x),-(A.c[1]-z));P.pitch=pitch;for(const E of g.enemies)E.remove=true;g.hud.hurtWhite=0;__sim(1);P.pos.set(x,h,z);g.vm.hidden=true;window.__dmhHold=true;return 1};1"
rooms=[int(a) for a in sys.argv[1:]]
st=[{"js":pre}]; names=[]
views=[(0.8,-0.8,330,-0.12),(-0.85,0.3,260,-0.05),(0.55,0.1,700,-0.45),(-0.1,-0.6,200,0.1)]
for i in rooms:
    for k,(fx,fy,h,p) in enumerate(views):
        st.append({"js":f"__v({i},{fx},{fy},{h},{p})"}); st.append({"wait":250}); st.append({"shot":f"rv{i}_{k}"}); names.append(f"rv{i}_{k}")
json.dump({"w":960,"h":540,"query":"&map=6","steps":st},open('rv.json','w')); open('rv.names','w').write(' '.join(names))
