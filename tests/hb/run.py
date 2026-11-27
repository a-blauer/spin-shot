import json,subprocess,sys
js=open('hb/measure.js').read()
one = """(() => { const g=__dmh, out=[]; for (const [kind,i,name,ai,model] of __hbList.slice(%d,%d)) {
  for (const E of g.enemies) { E.dead = true; E.remove = true; } g.enemies.length = 0;
  const P=g.player, at=P.pos.clone(); at.z -= 900; const h=g.phys.raycastDown(at.clone().setY(at.y+400),3000); if(h) at.y=h.point.y+120;
  let E; try { E = kind==='enemy' ? g.spawnEnemy(i, at, false, -1, 1, 1, 0, false) : g.spawnEnemy(0, at, false, i, 1, 1, 0, false); } catch(e) { out.push([kind,name,ai,model,{err:'spawn '+String(e).slice(0,80)}]); continue; }
  E.baseSpeed = 0; E.desiredSpeed = 0; for (let k=0;k<20;k++) __sim(6);
  let m; try { m = __hbMeasure(E, 6); } catch(e) { m = {err: String(e).slice(0,100)}; }
  m.bs = +E.bodyScale.toFixed(2); m.walkR = Math.round(E.radius); m.feetOff = Math.round(E.feetOffset);
  out.push([kind,name,ai,model,m]); E.dead = true; E.remove = true; }
  return JSON.stringify(out); })()"""
steps=[{"js":"const g=__dmh;g.godMode=true;__sim(10);'a'"},{"wait":300},{"js":js}]
N=int(sys.argv[1]) if len(sys.argv)>1 else 67
for a in range(0,N,8): steps.append({"js":one%(a,a+8)})
json.dump({"w":640,"h":360,"query":"&map=6","steps":steps},open('hb/m.json','w'))
o=subprocess.run(['python3','shot_fl.py','hb/m.json'],capture_output=True,text=True,timeout=1500).stdout
rows=[]
for L in o.split('\n'):
    if L.startswith('js> [['): rows+=json.loads(L[4:])
    elif L.startswith('js> ') and 'rror' in L: print(L[:300])
json.dump(rows,open('hb/res.json','w'),indent=0)
print(len(rows))
