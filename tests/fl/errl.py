import asyncio, sys
from playwright.async_api import async_playwright
sys.path.insert(0,'/home/claude/dmh-test'); import shot_fl as shot
async def main():
    shot.serve()
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':1440,'height':900}); errs=[]
        pg.on('pageerror', lambda e: errs.append('ERR '+str(e)+' '+(e.stack or '')[:400]))
        pg.on('console', lambda m: errs.append('LOG '+m.text[:200]) if m.type in ('error','warning') and 'toNonIndexed' not in m.text else None)
        await pg.goto('http://127.0.0.1:8767/index.html?scan=1&map=6'); await pg.wait_for_timeout(30000); await pg.screenshot(path='/tmp/lobby.png')
        print('\n'.join([e for e in errs if 'hidden' not in e][:6])); print('player', await pg.evaluate('!!(window.__dmh && window.__dmh.player)')); await b.close()
asyncio.run(main())
