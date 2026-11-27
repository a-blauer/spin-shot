import json,sys
# anim.py kind start count per  (kind: e|b)
kind,start,count,per=sys.argv[1],int(sys.argv[2]),int(sys.argv[3]),int(sys.argv[4])
dist,gap=(760,185) if kind=='e' else (1150,430)
pre=("const g=__dmh,P=g.player,D=g.descent;g.godMode=true;g.tip=()=>{};g.hud.helpT=0;g.hud.draw=()=>{};g.banner=()=>{};g.hud.toast=()=>{};g.phaseTimer=0;__sim(30);g.toSpawn=0;g.spawned=0;for(const E of g.enemies)E.remove=true;__sim(3);"
 "D.arena=8;D.flip=1;const A=D.A();g.zones.forEach((Z,k)=>Z.unlocked=k===A.zone);window.px=A.c[0]+1500;window.pz=A.c[1]+900;P.pos.set(px,110,pz);P.yaw=0;P.pitch=-0.02;__sim(2);g.vm.hidden=true;"
 "window.__batch=(ids,boss,dist,gap)=>{window.__dmhHold=false;g.toSpawn=0;g.spawned=0;for(const E of g.enemies){E.dead=true;E.remove=true;E.puppet.visible=false;}g.boss=null;__sim(2);const V=P.pos.constructor;window.__es=[];ids.forEach((id,k)=>{const x=px+(k-(ids.length-1)/2)*gap;let E=null;try{E=boss?g.spawnEnemy(g.data.bosses[id].minion,new V(x,170,pz-dist),false,id,1,1,0,false):g.spawnEnemy(id,new V(x,120,pz-dist),false,-1,1,1,0,false);}catch(e){window.__err=(window.__err||'')+id+':'+e.message+' ';}if(E){E.emerge=0;E.burrowed=false;__es.push([E,x]);}});"
 "for(let k=0;k<40;k++){__sim(1);P.pos.set(px,P.pos.y,pz);for(const [E,x] of __es){E.pos.x=x;E.pos.z=pz-dist;E.vel.x=0;E.vel.z=0;E.windup=0;E.attackCd=9;E.burrowed=false;E.emerge=0;}}for(const E of g.enemies){if(!__es.some(q=>q[0]===E)){E.puppet.visible=false;}}window.__base=__es.map(q=>q[0].puppet.yaw3);g.projectiles.list.length=0;window.__dmhHold=true;return JSON.stringify(__es.map(q=>[(q[0].isBoss?g.data.bosses[q[0].bossIndex]?.art:q[0].def.art),q[0].puppet.is3D?1:0]))};1")

SET="window.__st=(o)=>{__es.forEach((q,i)=>{const p=q[0].puppet;p.yaw3=__base[i]+0.9;p.walk=o.walk||0;p.stride=o.stride||0;p.reach=o.reach||0;p.idle=o.idle||0;p.twitch=0;p.windup=o.windup||0;p.lunge=o.lunge||0;p.hurtT=o.hurt||0;p.hurtSide=1;p.dig=o.dig||0;p.leanF=o.stride?1:0;p.bodyRot=o.rock||0;p.dying=!!o.death;p.deathT=o.death||0;p.fall=1;if(p.S){if(p.__g===undefined)p.__g=p.S.grounded;p.S.grounded=o.air?false:p.__g;}});return 1};1"
STATES=[("walkA","{walk:1.57,stride:1,reach:1,rock:8}"),("walkB","{walk:4.71,stride:1,reach:1,rock:-8}"),("windup","{windup:1,idle:1}"),("lunge","{lunge:1,reach:1}"),("hurt","{hurt:1,idle:1}"),("air","{air:1,stride:.6,reach:1}"),("dig","{dig:1}"),("death1","{death:0.15}"),("death2","{death:0.7}")]
st=[{"js":pre},{"js":SET}]; names=[]
i=start
while i<start+count:
    ids=list(range(i,min(i+per,start+count)))
    st.append({"js":"__batch(%s,%s,%d,%d)"%(json.dumps(ids),'true' if kind=='b' else 'false',dist,gap)})
    for n,o in STATES:
        st+=[{"js":"__st(%s)"%o},{"shot":"an_%s%d%s"%(kind,i,n)}]; names.append("an_%s%d%s"%(kind,i,n))
    i+=per
st.append({"js":"window.__err||'no errors'"})
json.dump({"w":1300,"h":440,"query":"&map=6","steps":st},open('rev.json','w')); open('rev.names','w').write(' '.join(names))
