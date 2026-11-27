# Walk a map's quest from start to finish by doing each job the way a player would (teleporting between them).
import asyncio, sys, json
sys.path.insert(0, '/home/claude/dmh-test')
from shot import serve
from playwright.async_api import async_playwright
MAP = sys.argv[1]
JS_INIT = """() => { const g=__dmh,P=g.player; g.godMode=true; g.hud.helpT=-5; for(let i=0;i<g.zones.length;i++)g.unlockZone(i,true); for(const I of g.interactables)if(I.type==='Door'&&!I.open)g.openDoor(I);
 g.navRebuild(P.pos); return JSON.stringify({steps:g.quest.def?g.quest.def.steps.map(s=>s.type):null, hud:g.quest.hud()}); }"""
JS_STEP = """() => { const g=__dmh,P=g.player,Q=g.quest,S=Q.S,V=P.pos.constructor; if(!Q.active) return 'done';
 const out={i:Q.i,type:S.type}; const reach=(p)=>{const[cx,cy]=g.cellOf(p.x,p.z);return g.navFree(cx,cy)&&g.navDist[cy*g.navW+cx]<1e8;};
 const tp=(p)=>{P.pos.set(p.x,p.y+114,p.z);P.vel.set(0,0,0);};
 if(S.type==='collect'){ out.reach=S.items.map(I=>reach(I.pos)); out.z=S.items.map(I=>Math.round(I.pos.y)); for(const I of S.items.slice()){tp(I.pos);__sim(3);} }
 else if(S.type==='souls'){ out.reach=S.v.map(v=>reach(v.pos)); for(const v of S.v){ for(let k=0;k<S.D.need;k++){ const E=g.spawnEnemy(g.map.enemies[0],v.pos.clone().add(new V(120,150,0)),false,-1,1,1,0,false); E.emerge=0; __sim(2); E.takeHit(1e9,E.pos,new V(0,1,0),false); __sim(1);} } }
 else if(S.type==='shoot'){ out.los=[]; for(const T of S.tg.slice()){ let ok=false; for(let a=0;a<16&&!ok;a++){ for(const r of [500,900,1400]){ const o=new V(T.pos.x+Math.cos(a*0.39)*r,g.zoneZ(T.pos.x+Math.cos(a*0.39)*r,T.pos.z+Math.sin(a*0.39)*r)+150,T.pos.z+Math.sin(a*0.39)*r); const[cx,cy]=g.cellOf(o.x,o.z); if(!g.navFree(cx,cy)||g.navDist[cy*g.navW+cx]>1e8) continue; const d=T.pos.clone().sub(o), L=d.length(); d.normalize(); const w=g.phys.raycast(o,d,L-40); if(!w){ Q.shot(o,d,L+10); ok=true; break; } } } out.los.push(ok); } }
 else if(S.type==='order'){ out.reach=S.bells.map(I=>reach(I.pos)); const seq=S.seq.slice(); for(const k of seq){ tp(S.bells[k].pos.clone().add(new V(120,0,0))); __sim(2); S.bells[k].q.use(P); } }
 else if(S.type==='use'){ const I=Q.objs[0]; out.reach=reach(I.pos); I.q.use(P); }
 else if(S.type==='hold'){ out.reach=reach(S.pos); g.phase='Round'; g.toSpawn=1e6; g.spawned=0; tp(S.pos); for(let k=0;k<S.time*6+30&&Q.S===S;k++){ __sim(10); tp(S.pos); P.health=P.maxHealth; } g.toSpawn=g.spawned; for(const E of g.enemies) if(!E.dead&&!E.isBoss) E.takeHit(1e9,E.pos,new V(0,1,0),false); }
 else if(S.type==='boss'){ const E=g.spawnEnemy(g.map.enemies[0],P.pos.clone().add(new V(300,200,0)),false,g.map.bosses[0],1,1,0,false); E.emerge=0; __sim(5); E.health=1; E.ward=0; E.takeHit(1e9,E.pos,new V(0,1,0),false); __sim(2); if(Q.S===S) Q.killed(E); }
 out.after=Q.done?'DONE':Q.i; out.hud=Q.hud(); return JSON.stringify(out); }"""
JS_END = """() => { const g=__dmh,P=g.player,F=g.final; if(!F||!F.gate) return 'NO GATE'; const gate=[Math.round(F.gate.x),Math.round(F.gate.y),Math.round(F.gate.z)]; P.pos.set(F.gate.x,F.gate.y+114,F.gate.z); __sim(20); return JSON.stringify({gate, active:g.final.active, boss:g.boss&&g.boss.boss?g.boss.boss.name:null, inVault:g.inVault(P.pos)}); }"""
async def main():
    srv = serve()
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 960, 'height': 540})
        logs = []
        pg.on('pageerror', lambda e: logs.append('[pageerror] ' + str(e) + ' ' + (e.stack or '')[:400]))
        pg.on('console', lambda m: logs.append(m.text) if m.type == 'error' else None)
        await pg.goto('http://127.0.0.1:8765/index.html?test&map=' + MAP)
        await pg.wait_for_function('window.__dmh && window.__dmh.player', timeout=180000)
        await pg.evaluate("() => { window.__dmhHold = true; __sim(10); }")
        print(await pg.evaluate(JS_INIT))
        await pg.screenshot(path=f'/home/claude/dmh-test/out/q{MAP}_hud.png')
        for k in range(8):
            r = await pg.evaluate(JS_STEP); print(r)
            if r == 'done' or '"after": "DONE"' in r or '"after":"DONE"' in r: break
        print(await pg.evaluate(JS_END))
        print('errors:', logs[:5])
        await b.close()
    srv.shutdown()
asyncio.run(main())
