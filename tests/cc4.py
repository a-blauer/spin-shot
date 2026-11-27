import asyncio, sys, base64
from playwright.async_api import async_playwright
import shot
async def main():
    shot.serve()
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 760})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://127.0.0.1:8765/index.html?test'+(sys.argv[3] if len(sys.argv)>3 else ''))
        await pg.wait_for_function('window.__dmh && window.__dmh.player', timeout=180000)
        await pg.evaluate("window.__dmhHold=true"); await pg.wait_for_timeout(300)
        L = await pg.evaluate(open(sys.argv[2]).read())
        for i, d in enumerate(L):
            if d.startswith('data:'): open(f'/tmp/cc_{sys.argv[1]}{i}.jpg','wb').write(base64.b64decode(d.split(',')[1]))
            else: print(d[:60000])
        print('ok', errs[:5]); await b.close()
asyncio.run(main())
