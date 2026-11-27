# several sheets from one page: python3 cc2.py tag "<js returning array of data urls>"
import asyncio, sys, base64
from playwright.async_api import async_playwright
import shot
async def main():
    shot.serve()
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 760})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://127.0.0.1:8765/index.html?test')
        await pg.wait_for_function('window.__dmh && window.__dmh.player', timeout=180000)
        await pg.evaluate("window.__dmhHold=true; window.__meta.Meta.setUnlockAll(true)"); await pg.wait_for_timeout(300)
        tag, js = sys.argv[1], sys.argv[2]
        if js.startswith('@'): js = open(js[1:]).read()
        L = await pg.evaluate(js)
        for i, d in enumerate(L):
            open(f'/tmp/cc_{tag}{i}.jpg','wb').write(base64.b64decode(d.split(',')[1]))
        print('ok', tag, len(L), errs[:5]); await b.close()
asyncio.run(main())
