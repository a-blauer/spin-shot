import json,sys
ids=sys.argv[1].split(','); dist=sys.argv[2] if len(sys.argv)>2 else '520'; gap=sys.argv[3] if len(sys.argv)>3 else '190'; angs=sys.argv[4].split(',') if len(sys.argv)>4 else ['0','1.57','3.14','0.75']
pre=("const g=__dmh,P=g.player,D=g.descent;g.godMode=true;g.tip=()=>{};g.hud.helpT=0;g.hud.draw=()=>{};g.phaseTimer=0;__sim(30);g.toSpawn=0;g.spawned=0;for(const E of g.enemies)E.remove=true;__sim(3);"
 "D.arena=8;D.flip=1;const A=D.A();g.zones.forEach((Z,k)=>Z.unlocked=k===A.zone);const V=P.pos.constructor;const px=A.c[0]+1500,pz=A.c[1]+900;P.pos.set(px,110,pz);P.vel.set(0,0,0);P.yaw=0;P.pitch=-0.03;__sim(2);P.pos.set(px,110,pz);"
 "window.__es=[];const ids=[%s];ids.forEach((id,k)=>{const x=px+(k-(ids.length-1)/2)*%s;const E=(id>=1000?g.spawnEnemy(g.data.bosses[id-1000].minion,new V(x,160,pz-%s),false,id-1000,1,1,0,false):g.spawnEnemy(id,new V(x,120,pz-%s),false,-1,1,1,0,false));if(E){E.emerge=0;__es.push(E);}});"
 "for(let k=0;k<45;k++){__sim(1);P.pos.set(px,P.pos.y,pz);__es.forEach((E,i)=>{const x=px+(i-(ids.length-1)/2)*%s;E.pos.x=x;E.pos.z=pz-%s;E.vel.x=0;E.vel.z=0;E.windup=0;E.attackCd=9;});}window.__base=__es.map(E=>E.puppet.yaw3);window.__dmhHold=true;g.vm.hidden=true;JSON.stringify(__es.map(E=>[(E.def&&E.def.name)||E.name,E.puppet.is3D,E.dead]))")
st=[{"js":pre%(','.join(ids),gap,dist,dist,gap,dist)}]
names=[]
for n,a in enumerate(angs):
    st+=[{"js":"__es.forEach((E,i)=>{E.puppet.yaw3=__base[i]+%s});1"%a},{"shot":"b3_%d"%n}]; names.append("b3_%d"%n)
json.dump({"w":1100,"h":520,"query":"&map=6","steps":st},open('b3.json','w')); open('b3.names','w').write(' '.join(names))
