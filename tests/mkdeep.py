import json,sys
pre=("const g=__dmh,P=g.player,D=g.descent;g.godMode=true;g.tip=()=>{};g.hud.helpT=1e6;g.hud.draw=()=>{};g.phaseTimer=0;__sim(30);g.toSpawn=0;g.spawned=0;for(const E of g.enemies)E.remove=true;"
"window.__c=(i,fx,fy,h,look,pitch)=>{window.__dmhHold=false;D.arena=i;g.world.showChunk(i);D.flip=1;const A=D.A();g.zones.forEach((Z,k)=>Z.unlocked=k===A.zone);let x=A.c[0]+fx*A.hx,z=A.c[1]+fy*A.hy;h=h<=1?h*A.H:h;"
"if(look==='c'){P.yaw=Math.atan2(-(A.c[0]-x),-(A.c[1]-z));}else{x=A.c[0]+A.hx-1000;P.yaw=-Math.PI/2;}"
"P.pos.set(x,h,z);P.vel.set(0,0,0);P.pitch=pitch;for(const E of g.enemies)E.remove=true;g.hud.hurtWhite=0;__sim(1);P.pos.set(x,h,z);g.vm.hidden=true;window.__dmhHold=true;return 1};1")
rooms=[int(a) for a in sys.argv[1:]]
st=[{"js":pre}]; names=[]
views=[(0.2,-0.24,185,'c',0.1),(0,0.3,185,'w',0.12),(-0.55,0.55,185,'c',0.02),(-0.5,-0.75,0.85,'c',-0.5)]
for i in rooms:
    for k,(fx,fy,h,look,p) in enumerate(views):
        st.append({"js":f"__c({i},{fx},{fy},{h},'{look}',{p})"}); st.append({"wait":200}); st.append({"shot":f"dp{i}_{k}"}); names.append(f"dp{i}_{k}")
json.dump({"w":640,"h":360,"query":"&map=6","steps":st},open('rv.json','w')); open('rv.names','w').write(' '.join(names))
