import asyncio, sys, json
import shot
from playwright.async_api import async_playwright
async def main():
    srv = shot.serve()
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        logs = []
        pg.on('pageerror', lambda e: logs.append(f'[pageerror] {e} {(e.stack or "")[:400]}'))
        pg.on('console', lambda m: logs.append(m.text) if m.type == 'error' else None)
        await pg.goto('http://127.0.0.1:8765/index.html?test&map=6')
        await pg.wait_for_function('window.__dmh && window.__dmh.player', timeout=180000)
        r = await pg.evaluate("""() => { const g=__dmh; g.godMode=true; g.phaseTimer=0; __sim(20); const D=g.descent; const ids=g.data.bosses.map((b,i)=>b.tier?i:-1).filter(i=>i>=0); return JSON.stringify([ids.length, g.data.enemies.length, D.roster]); }""")
        print(r)
        which = sys.argv[1:] or None
        res = await pg.evaluate("""() => g0()
          ; function g0(){ return __dmh.data.bosses.map((b,i)=>b.tier?[i,b.art]:null).filter(Boolean); }""")
        for (bi, art) in res:
            if which and art not in which: continue
            out = await pg.evaluate("""(bi) => { const g=__dmh, D=g.descent, P=g.player; const B=g.data.bosses[bi]; D.bossPick=[bi,bi,bi,bi]; D.enter(B.tier*5,[7,3,0]); let err='';
              const seen=new Set(); let hpMin=1, kids=0, hz=0;
              try { for(let i=0;i<50;i++){ __sim(30); const E=g.boss; if(E&&!E.dead){ seen.add(E.attackName&&E.attackName()||'-'); if(i%6===3) E.takeHit(E.maxHealth*0.09,E.pos,new P.pos.constructor(0,0,1),false); hpMin=Math.min(hpMin,E.health/E.maxHealth);} kids=Math.max(kids,g.aliveCount()); hz=Math.max(hz,g.hazards.list.length);} } catch(e){ err=String(e.stack||e).slice(0,500); }
              const E=g.boss; const h=E?Math.round(E.puppet.heightCm):0;
              window.__dmhHold=true; if(E&&!E.dead){ P.pos.set(E.pos.x, 100, E.pos.z-900); P.yaw=Math.PI; P.pitch=0.12; } window.__dmhHold=false; __sim(1); window.__dmhHold=true;
              return JSON.stringify([B.name, h, [...seen].join(','), 'hp', +hpMin.toFixed(2), 'alive', kids, 'hz', hz, err]); }""", bi)
            print(out)
            if which:
                await pg.wait_for_timeout(300); await pg.screenshot(path=f'/home/claude/dmh-test/out/boss_{art}.png')
            await pg.evaluate("() => { window.__dmhHold=false; for (const E of __dmh.enemies) E.remove = true; }")
        print('\n'.join(logs[-12:]))
        await b.close()
    srv.shutdown()
asyncio.run(main())
