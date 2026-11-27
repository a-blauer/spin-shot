import asyncio
from playwright.async_api import async_playwright
import shot
async def main():
    shot.serve()
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(); logs=[]
        pg.on('pageerror', lambda e: logs.append(f'{e} {(e.stack or "")[:500]}')); pg.on('console', lambda m: logs.append(m.type+':'+m.text) if m.type in ('error','warning') and 'toNonIndexed' not in m.text else None)
        await pg.goto('http://127.0.0.1:8765/index.html?test&map=6'); await pg.wait_for_timeout(45000)
        print('\n'.join(logs[:6])); await b.close()
asyncio.run(main())
