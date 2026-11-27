# Evaluate a JS file (returns a data URL or an array of them) against the test build in /tmp/fldist; save as JPEGs.
# Usage: python3 vs2/sheet.py TAG file.js [query]  ->  /tmp/sh_TAG<i>.jpg
import asyncio, sys, base64, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from playwright.async_api import async_playwright
import shot_fl
async def main():
    srv = shot_fl.serve()
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 760})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        await pg.goto('http://127.0.0.1:8767/index.html?test' + (sys.argv[3] if len(sys.argv) > 3 else ''))
        await pg.wait_for_function('window.__dmh && window.__dmh.player && window.__vprops && window.__vshapes', timeout=180000)
        await pg.evaluate("window.__dmhHold=true"); await pg.wait_for_timeout(300)
        L = await pg.evaluate(open(sys.argv[2]).read())
        if isinstance(L, str): L = [L]
        for i, d in enumerate(L or []):
            if isinstance(d, str) and d.startswith('data:'): open(f'/tmp/sh_{sys.argv[1]}{i}.jpg', 'wb').write(base64.b64decode(d.split(',')[1]))
            else: print(str(d)[:3000])
        print('ok', errs[:6]); await b.close()
    srv.shutdown()
asyncio.run(main())
