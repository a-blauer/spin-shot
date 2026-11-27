import json
pre=("const g=__dmh,P=g.player,D=g.descent;g.godMode=true;g.tip=()=>{};g.banner=()=>{};g.hud.toast=()=>{};g.phaseTimer=0;__sim(30);g.toSpawn=0;g.spawned=0;for(const E of g.enemies)E.remove=true;__sim(3);"
"D.arena=8;D.flip=1;const A=D.A();g.zones.forEach((Z,k)=>Z.unlocked=k===A.zone);window.px=A.c[0]+1500;window.pz=A.c[1]+900;P.pos.set(px,110,pz);__sim(2);"
"window.__live=(ids,boss)=>{const V=P.pos.constructor;const out=[];for(const E of g.enemies){E.dead=true;E.remove=true;}g.boss=null;__sim(2);const es=[];ids.forEach((id,k)=>{try{const p=new V(px+(k-ids.length/2)*260,150,pz-900);const E=boss?g.spawnEnemy(g.data.bosses[id].minion,p,false,id,1,1,0,false):g.spawnEnemy(id,p,false,-1,1,1,0,false);if(E)es.push([E,id]);else out.push(id+':nospawn');}catch(e){out.push(id+':spawn '+e.message)}});"
"const chk=(tag)=>{for(const [E,id] of es){const pu=E.puppet;if(!pu)continue;const b=[E.pos.x,E.pos.y,E.pos.z,pu.yaw3].some(v=>!isFinite(v));if(b)out.push(id+':NaN '+tag);if(!pu.is3D)out.push(id+':flat');if(E.pos.y<-300)out.push(id+':fell '+tag);}};"
"try{for(let k=0;k<8;k++){__sim(30);P.pos.set(px,P.pos.y,pz);chk('live'+k);}}catch(e){out.push('live:'+e.message)}"
"try{for(const [E,id] of es){if(!E.dead)E.takeHit(1e9,E.pos,new (P.pos.constructor)(0,0,-1),false);}__sim(60);}catch(e){out.push('death:'+e.message)}"
"const alive=es.filter(q=>!q[0].dead).map(q=>q[1]);if(alive.length)out.push('alive:'+alive.join(','));return JSON.stringify([...new Set(out)])};1")
st=[{"js":pre}]
for s in range(0,79,10): st.append({"js":"__live(%s,false)"%json.dumps(list(range(s,min(s+10,79))))})
for s in range(0,51,6): st.append({"js":"__live(%s,true)"%json.dumps(list(range(s,min(s+6,51))))})
json.dump({"w":640,"h":360,"query":"&map=6","steps":st},open('live.json','w'))
