import asyncio, sys, base64
from playwright.async_api import async_playwright
import shot
async def main():
    shot.serve()
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 900, 'height': 500})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://127.0.0.1:8765/index.html?test')
        await pg.wait_for_function('window.__dmh && window.__dmh.player', timeout=180000)
        await pg.evaluate("window.__dmhHold=true; window.__locker()"); await pg.wait_for_timeout(600)
        for spec in sys.argv[1:]:
            body, slot, view = spec.split(':')
            d = await pg.evaluate(f"window.__charSheet('{body}','{slot}','{view}')")
            open(f'out/cs_{body}_{slot}_{view}.jpg','wb').write(base64.b64decode(d.split(',')[1])); print('ok', spec)
        print(errs[:5]); await b.close()
asyncio.run(main())
