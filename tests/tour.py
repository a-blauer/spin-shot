# UI tour: screenshots every menu at desktop size. usage: python3 tour.py <prefix> [W H]
import asyncio, sys, os
from playwright.async_api import async_playwright
sys.path.insert(0, '/home/claude/dmh-test'); import shot
PRE = sys.argv[1] if len(sys.argv) > 1 else 'b'
W = int(sys.argv[2]) if len(sys.argv) > 2 else 1440
H = int(sys.argv[3]) if len(sys.argv) > 3 else 900
OUT = '/home/claude/dmh-test/out/tour'; os.makedirs(OUT, exist_ok=True)
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']

async def snap(pg, name): await pg.screenshot(path=f'{OUT}/{PRE}_{name}.png'); print('shot', name)

async def main():
    shot.serve()
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=ARGS)
        errs = []
        # ---- front end (real boot, no test flag)
        pg = await b.new_page(viewport={'width': W, 'height': H})
        pg.on('pageerror', lambda e: errs.append('ERR ' + str(e)))
        await pg.goto('http://127.0.0.1:8765/index.html')
        await pg.wait_for_function('document.body.classList.contains("ready")', timeout=180000)
        await pg.wait_for_timeout(1500)
        await snap(pg, '01_title')
        await pg.click('#playbtn'); await pg.wait_for_timeout(1200); await snap(pg, '02_lobby')
        await pg.evaluate("document.querySelector('#lobby main')&&document.querySelector('#lobby main').scrollTo(0,9999)"); await pg.wait_for_timeout(300); await snap(pg, '03_lobby_scroll')
        await pg.evaluate("window.__locker&&window.__locker()"); await pg.wait_for_timeout(1500); await snap(pg, '04_locker')
        await pg.goto('http://127.0.0.1:8765/index.html')
        await pg.wait_for_function('document.body.classList.contains("ready")', timeout=180000)
        await pg.click('#progbtn'); await pg.wait_for_timeout(900); await snap(pg, '05_progress')
        await pg.evaluate("const t=[...document.querySelectorAll('#progress .ptabs button')];if(t[1])t[1].click()"); await pg.wait_for_timeout(500); await snap(pg, '06_progress_tab2')
        await pg.goto('http://127.0.0.1:8765/index.html')
        await pg.wait_for_function('document.body.classList.contains("ready")', timeout=180000)
        await pg.click('#setbtn'); await pg.wait_for_timeout(700); await snap(pg, '07_settings')
        await pg.close()
        # ---- in game (test flag, the Descent)
        pg = await b.new_page(viewport={'width': W, 'height': H})
        pg.on('pageerror', lambda e: errs.append('ERR ' + str(e)))
        await pg.goto('http://127.0.0.1:8765/index.html?test')
        await pg.wait_for_function('window.__dmh && window.__dmh.player', timeout=180000)
        await pg.evaluate("const g=__dmh,P=g.player;g.godMode=true;P.money=740;__sim(240,{fwd:1})")
        await pg.wait_for_timeout(600); await snap(pg, '10_hud')
        await pg.evaluate("const g=__dmh,P=g.player;P.health=P.maxHealth*0.3;__sim(90,{fire:true,firePressed:1})")
        await pg.wait_for_timeout(300); await snap(pg, '11_hud_combat')
        await pg.evaluate("const g=__dmh,P=g.player;for(const E of g.enemies)E.dead=true;g.enemies.length=0;const C=g.interactables.find(I=>I.type==='Chest')||{tier:1,setOpened(){},pos:P.pos.clone(),free:true};C.free=true;C.opened=false;P.openChest(C);__sim(30)")
        await pg.wait_for_timeout(500); await snap(pg, '12_chest')
        await pg.evaluate("const P=__dmh.player;P.menu=null;P.menuStation=null;P.showInventory=true;__sim(10)")
        await pg.wait_for_timeout(300); await snap(pg, '13_inventory')
        await pg.evaluate("const P=__dmh.player;P.showInventory=false;const U=__dmh.data.upgrades;P.coreInv={};U.forEach((u,i)=>{if(u.core&&u.kind==='gun'&&!u.noDrop&&i%5==0)P.coreInv[i]=1});P.scrap=14;__dmh.openCraft(false)")
        await pg.wait_for_timeout(1200); await snap(pg, '14_bench')
        await pg.evaluate("__craft.close&&__craft.close();__dmh.openCraft(false,'press')")
        await pg.wait_for_timeout(1000); await snap(pg, '15_press')
        await pg.evaluate("__craft.close&&__craft.close();__setMode('paused');const pe=document.getElementById('pause');pe.style.display='flex'")
        await pg.wait_for_timeout(500); await snap(pg, '16_pause')
        await pg.evaluate("document.getElementById('pause').style.display='none';__setMode('play');const g=__dmh,P=g.player;g.godMode=false;P.invuln=0;P.safeT=0;P.revives=0;try{P.receiveDamage(999999,null)}catch(e){P.health=0;P.dead=true};__sim(200)")
        await pg.wait_for_timeout(600); await snap(pg, '17_death')
        print('\n'.join(errs[:8]))
        await b.close()

asyncio.run(main())
