import asyncio, sys, json
sys.path.insert(0, '/home/claude/dmh-test')
from shot import serve
from tourlib import LOOK
from playwright.async_api import async_playwright
from PIL import Image
JOBS = json.loads(sys.argv[1])
async def main():
    srv = serve(); n = 0
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        for MAP, views in JOBS:
            pg = await b.new_page(viewport={'width': 960, 'height': 540})
            await pg.goto('http://127.0.0.1:8765/index.html?test&map=%s' % MAP)
            await pg.wait_for_function('window.__dmh && window.__dmh.player', timeout=180000)
            await pg.evaluate("() => { window.__dmhHold = true; const g=__dmh; g.godMode=true; document.getElementById('hud').style.display='none'; for(let i=0;i<g.zones.length;i++)g.unlockZone(i,true); for(const I of g.interactables)if(I.type==='Door'&&!I.open)g.openDoor(I); g.phase='Intermission'; g.phaseTimer=1e9; if(g.mech.train)g.mech.train.wait=1e9; }"); await pg.evaluate(LOOK + '1')
            for v in views:
                await pg.evaluate("__lk(%s)" % ','.join(map(str, v))); await pg.wait_for_timeout(200); await pg.screenshot(path='aud/x_%02d.png' % n); n += 1
            await pg.close()
        await b.close()
    srv.shutdown()
    cols = 3; rows = (n + cols - 1) // cols; sh = Image.new('RGB', (cols * 640, rows * 360))
    for i in range(n): sh.paste(Image.open('aud/x_%02d.png' % i).resize((640, 360)), ((i % cols) * 640, (i // cols) * 360))
    sh.save('aud/x_sheet.png')
asyncio.run(main())
