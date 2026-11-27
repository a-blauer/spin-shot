import asyncio, shot
from playwright.async_api import async_playwright
async def main():
    shot.serve()
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://127.0.0.1:8765/index.html?test')
        await pg.wait_for_function('window.__dmh && window.__dmh.player', timeout=180000)
        await pg.wait_for_timeout(600)
        await pg.evaluate("window.__locks = []; if (navigator.keyboard) { const L = navigator.keyboard.lock.bind(navigator.keyboard), U = navigator.keyboard.unlock.bind(navigator.keyboard); navigator.keyboard.lock = (k) => { window.__locks.push('lock ' + (k ? k.length : 'all')); return L(k); }; navigator.keyboard.unlock = () => { window.__locks.push('unlock'); return U(); }; }")
        await pg.keyboard.press('KeyP'); await pg.wait_for_timeout(300)
        await pg.screenshot(path='out/fs_pause.png')
        print('panel:', await pg.evaluate("document.getElementById('pause').style.display + ' | ' + document.getElementById('pfull').textContent + ' | ' + document.querySelector('#pause .pfs span').textContent"))
        await pg.click('#pfull'); await pg.wait_for_timeout(700)
        print('after click:', await pg.evaluate("document.getElementById('pfull').textContent + ' | fullscreen ' + !!document.fullscreenElement + ' | ' + window.__locks.join(',') + ' | saved ' + localStorage.getItem('dmh-settings')"))
        await pg.click('#pfull'); await pg.wait_for_timeout(700)
        print('after second click:', await pg.evaluate("document.getElementById('pfull').textContent + ' | fullscreen ' + !!document.fullscreenElement + ' | ' + window.__locks.join(',')"))
        r = await pg.evaluate("""(() => { const out = {}; for (const [n, o] of [['F3', { code: 'F3' }], ['Ctrl+S', { code: 'KeyS', ctrlKey: true }], ['Ctrl+D', { code: 'KeyD', ctrlKey: true }], ['Ctrl+F', { code: 'KeyF', ctrlKey: true }], ['Ctrl+1', { code: 'Digit1', ctrlKey: true }], ['Ctrl+R', { code: 'KeyR', ctrlKey: true }]]) { const e = new KeyboardEvent('keydown', Object.assign({ bubbles: true, cancelable: true }, o)); window.dispatchEvent(e); out[n] = e.defaultPrevented; window.dispatchEvent(new KeyboardEvent('keyup', o)); } const w = new WheelEvent('wheel', { deltaY: 100, ctrlKey: true, bubbles: true, cancelable: true }); document.getElementById('pause').style.display = 'none'; return out; })()""")
        print('blocked:', r, '| errors:', errs)
        await b.close()
asyncio.run(main())
