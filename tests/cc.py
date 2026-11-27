# character sheets: python3 cc.py <out-tag> "<js returning a data url>" ...
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
        args = sys.argv[1:]
        for i in range(0, len(args), 2):
            tag, js = args[i], args[i+1]
            if js.startswith('@'): js = open(js[1:]).read()
            d = await pg.evaluate(js)
            if isinstance(d, str) and d.startswith('data:'):
                open(f'/tmp/cc_{tag}.jpg','wb').write(base64.b64decode(d.split(',')[1])); print('ok', tag)
            else: print(tag, str(d)[:1500])
        print(errs[:5]); await b.close()
asyncio.run(main())
