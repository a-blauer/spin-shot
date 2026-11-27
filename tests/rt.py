# real-time play: lobby -> pick a map -> fight with the real gun, screenshot as it goes
import asyncio, sys, json, os
import shot
from playwright.async_api import async_playwright
MAP = int(sys.argv[1]) if len(sys.argv) > 1 else 1
N = int(sys.argv[2]) if len(sys.argv) > 2 else 36
AIM = r"""
(() => { const g=__dmh,P=g.player; g.godMode=true; g.hud.helpT=-5; g.round=5;
 window.__aim=setInterval(()=>{ const g=__dmh,P=g.player; if(!g||!P) return; P.health=P.maxHealth; for(const W of P.weapons) if(W&&W.def>=0){ W.reserve=999; }
   if(g.phase==='Intermission'||g.phase==='PreGame') g.phaseTimer=Math.min(g.phaseTimer,0.5);
   let best=null,bd=1e9; for(const E of g.enemies){ if(E.dead||E.emerge>0.4||E.burrowed) continue; const d=E.pos.distanceTo(P.pos); if(d<bd&&d>120){bd=d;best=E;} }
   if(!best) return; const T=best.pos.clone().sub(g.camera.position).normalize(); let by=P.yaw,bdot=-9; const V=P.pos.constructor;
   for(let k=0;k<96;k++){ const y=k*Math.PI/48; P.yaw=y; P.pitch=0; P.updateCamera(0.016); g.camera.updateMatrixWorld(true); const d=new V(); g.camera.getWorldDirection(d); const dot=d.x*T.x+d.z*T.z; if(dot>bdot){bdot=dot;by=y;} }
   P.yaw=by; P.pitch=Math.asin(Math.max(-0.9,Math.min(0.9,T.y))); P.updateCamera(0.016); }, 220); return 1; })()
"""
async def main():
    srv = shot.serve()
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
        pg = await b.new_page(viewport={'width': 960, 'height': 540})
        logs = []
        pg.on('pageerror', lambda e: logs.append(f'[pageerror] {e}'))
        pg.on('console', lambda m: logs.append(f'[{m.type}] {m.text}') if m.type == 'error' else None)
        await pg.goto('http://127.0.0.1:8765/index.html?test')
        await pg.wait_for_function('window.__dmh && window.__dmh.player', timeout=180000)
        await pg.wait_for_timeout(500)
        await pg.evaluate("document.getElementById('playbtn').click()")
        await pg.wait_for_timeout(400)
        await pg.evaluate("document.querySelector('.lbpick[data-map=\"%d\"]').click(); document.querySelector('.lbpick[data-cls=\"brawler\"]').click(); document.getElementById('lbstart').click()" % MAP)
        await pg.wait_for_timeout(9000)
        print(await pg.evaluate("__dmh.map.name + ' ' + __dmh.phase"))
        await pg.evaluate(AIM)
        await pg.mouse.move(480, 270); await pg.mouse.down()
        for i in range(N):
            await pg.wait_for_timeout(1300)
            await pg.screenshot(path='rt/m%d_%02d.png' % (MAP, i))
            if i % 6 == 5: print(await pg.evaluate("'r'+__dmh.round+' '+__dmh.phase+' alive '+__dmh.enemies.filter(e=>!e.dead).length+' kills '+__dmh.player.kills"))
        print('\n'.join(logs)[-1500:])
        await b.close()
    srv.shutdown()
asyncio.run(main())
