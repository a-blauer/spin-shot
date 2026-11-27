import asyncio, sys
sys.argv=['x']; exec(open('shot.py').read().split("async def main")[0])
async def go():
    srv=serve()
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':640,'height':360}); logs=[]
        pg.on('console', lambda m: logs.append(f'[{m.type}] {m.text}')); pg.on('pageerror', lambda e: logs.append(f'[pageerror] {e} {(e.stack or "")[:600]}'))
        await pg.goto('http://127.0.0.1:8765/index.html?test&map=6')
        await pg.wait_for_timeout(30000)
        print('ready', await pg.evaluate('!!(window.__dmh && window.__dmh.player)'))
        print('\n'.join(l for l in logs if 'GPU stall' not in l and 'toNonIndexed' not in l)[:1800])
asyncio.run(go())
