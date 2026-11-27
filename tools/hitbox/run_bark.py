import json,subprocess,sys
js=open('hb/measure.js').read(); rj=open('hb/rays.js').read()
one = """(() => { const g=__dmh, out=[]; for (const [kind,i,name,ai,model] of __hbList.slice(%d,%d)) {
  for (const E of g.enemies) { E.dead = true; E.remove = true; } g.enemies.length = 0;
  const P=g.player, at=P.pos.clone(); at.z -= 900; const h=g.phys.raycastDown(at.clone().setY(at.y+400),3000); if(h) at.y=h.point.y+120;
  let E; try { E = kind==='enemy' ? g.spawnEnemy(i, at, false, -1, 1, 1, 0, false) : g.spawnEnemy(0, at, false, i, 1, 1, 0, false); } catch(e) { out.push([kind,name,ai,model,{err:'spawn'}]); continue; }
  E.baseSpeed = 0; E.desiredSpeed = 0; for (let k=0;k<20;k++) __sim(6);
  const tot = { seen: 0, both: 0, miss: 0, phantom: 0, headSeen: 0, headOk: 0, bodySeen: 0, bodyAsHead: 0, missAt: [], phAt: [] };
  try { for (let s=0;s<2;s++) { __sim(9); const c = __hbRays(E, %d); if (!c) { tot.err = E.puppet && E.puppet.custom ? 'custom rig' : 'no body'; break; } for (const k in c) if (Array.isArray(c[k])) tot[k] = tot[k].concat(c[k]).slice(0,6); else tot[k] += c[k]; } } catch(e) { tot.err = String(e).slice(0,120); }
  tot.H = Math.round(E.hitH||E.half*2); tot.R = Math.round(E.hitR||E.radius); tot.hy = Math.round(E.headY() - (E.pos.y - E.feetOffset));
  out.push([kind,name,ai,model,tot]); E.dead = true; E.remove = true; }
  return JSON.stringify(out); })()"""
N=int(sys.argv[1]) if len(sys.argv)>1 else 24
steps=[{"js":"const g=__dmh;g.godMode=true;__sim(10);'a'"},{"wait":300},{"js":js},{"js":rj}]
steps.append({"js":one%(47,48,N)})
json.dump({"w":640,"h":360,"query":"&map=6","steps":steps},open('hb/r.json','w'))
o=subprocess.run(['python3','shot_fl.py','hb/r.json'],capture_output=True,text=True,timeout=3000).stdout
rows=[]
for L in o.split('\n'):
    if L.startswith('js> [['): rows+=json.loads(L[4:])
    elif L.startswith('js> ') and 'rror' in L: print(L[:300])
json.dump(rows,open(sys.argv[2] if len(sys.argv)>2 else 'hb/rays.json','w'))
for k,n,ai,mo,c in rows:
    if c.get('err'): print(f"{k:5} {n[:22]:22} ERR {c['err']}"); continue
    s=max(1,c['seen']); b=max(1,c['both']+c['phantom'])
    print(f"{k:5} {n[:22]:22} {ai[:8]:8} H{c['H']:4} R{c['R']:4} hy{c['hy']:4} | missed {c['miss']/s:5.0%}  phantom {c['phantom']/b:5.0%} | head credited {c['headOk']/max(1,c['headSeen']):4.0%} of {c['headSeen']:4}  body-as-head {c['bodyAsHead']/max(1,c['bodySeen']):4.0%}")
