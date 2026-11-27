import asyncio, sys
from playwright.async_api import async_playwright
import shot
async def main():
    shot.serve()
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1366, 'height': 768}); logs=[]
        pg.on('pageerror', lambda e: logs.append(f'PAGEERR {e} {(e.stack or "")[:400]}')); pg.on('console', lambda m: logs.append(m.text[:300]) if m.type=='error' else None)
        await pg.goto('http://127.0.0.1:8765/index.html?test&map=6')
        await pg.wait_for_function('window.__dmh && window.__dmh.player && window.__dmh.descent', timeout=180000)
        await pg.wait_for_timeout(1500)
        print(await pg.evaluate("""()=>{const g=__dmh,P=g.player;g.godMode=true;g.tip=()=>{};const C0=g.data.upgrades.findIndex(u=>u.core);window.C0=C0;
          for(const k of [0,0,1,2,4,6,9,10,12,12,13,14,16,17]) P.collectPickup('Buff',C0+k); for(const k of [18,18,19,21,25,26]) P.collectPickup('Buff',C0+k);
          P.money=200000; P.giveWeapon(8); return JSON.stringify([C0,g.data.upgrades.length,P.coreInv,P.maxHealth,P.weapons.map(s=>s.def)])}"""))
        await pg.evaluate("()=>{__dmh.openCraft()}"); await pg.wait_for_timeout(900)
        await pg.screenshot(path='out/cr1.png')
        # drag the first chip onto the table
        async def dragchip(n):
            c = (await pg.query_selector_all('#craft .chip'))[n]; bb = await c.bounding_box(); tb = await (await pg.query_selector('#ctable')).bounding_box()
            await pg.mouse.move(bb['x']+30, bb['y']+20); await pg.mouse.down(); await pg.mouse.move(tb['x']+tb['width']/2, tb['y']+tb['height']/2, steps=6)
            if n==0 and not getattr(dragchip,'shot',0): dragchip.shot=1; await pg.wait_for_timeout(200); await pg.screenshot(path='out/cr2.png')
            await pg.mouse.up(); await pg.wait_for_timeout(250)
        for n in [0,0,4,5,3,6,5,5,2]: await dragchip(min(n, len(await pg.query_selector_all('#craft .chip'))-1))
        await pg.wait_for_timeout(500); await pg.screenshot(path='out/cr3.png')
        await pg.click('#ctune'); await pg.wait_for_timeout(300)
        for n in [2,2,2]: await dragchip(min(n, len(await pg.query_selector_all('#craft .chip'))-1))
        await pg.wait_for_timeout(600); await pg.screenshot(path='out/cr4.png')
        print(await pg.evaluate("()=>{const P=__dmh.player;return JSON.stringify([P.slot.cores,P.slot.mods.length,P.coreInv,P.gunSheet()])}"))
        # swap: buffs come back
        await pg.evaluate("()=>{__craft.close()}"); await pg.wait_for_timeout(1200); await pg.screenshot(path='out/cr6.png')
        print(await pg.evaluate("()=>{const P=__dmh.player;P.giveWeapon(5);P.giveWeapon(11);P.giveWeapon(14);return JSON.stringify([P.weapons.map(s=>[s.def,s.cores.length]),P.coreInv])}"))
        await pg.wait_for_timeout(800); await pg.screenshot(path='out/cr5.png')
        print('\n'.join(logs[:8])); await b.close()
asyncio.run(main())
