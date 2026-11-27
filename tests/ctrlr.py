# does Ctrl+R during a run leave the page alone, and still reload the weapon?
import asyncio, shot
from playwright.async_api import async_playwright
async def main():
    shot.serve()
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 960, 'height': 540})
        loads = []
        pg.on('load', lambda: loads.append(1))
        await pg.goto('http://127.0.0.1:8765/index.html?test')
        await pg.wait_for_function('window.__dmh && window.__dmh.player', timeout=180000)
        await pg.wait_for_timeout(800)
        await pg.evaluate("window.__mark = 123; const P = __dmh.player; P.slot.ammo = 1; window.__a0 = P.slot.ammo")
        await pg.mouse.click(480, 270)
        r = await pg.evaluate("""(() => { const e = new KeyboardEvent('keydown', { code: 'KeyR', key: 'r', ctrlKey: true, bubbles: true, cancelable: true }); window.dispatchEvent(e); return e.defaultPrevented; })()""")
        print('synthetic Ctrl+R default prevented in a run:', r)
        await pg.keyboard.down('Control'); await pg.keyboard.press('KeyR'); await pg.keyboard.up('Control')
        await pg.wait_for_timeout(2500)
        print('after real Ctrl+R: page still the same instance:', await pg.evaluate("window.__mark === 123"), '| page loads:', len(loads), '| weapon reloading or reloaded:', await pg.evaluate("__dmh.player.reloading || __dmh.player.slot.ammo > window.__a0"))
        await b.close()
asyncio.run(main())
