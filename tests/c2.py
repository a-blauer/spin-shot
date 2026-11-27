import asyncio, re
from playwright.async_api import async_playwright
import shot
src=open('coop.py').read(); MOCK=src[src.index("MOCK = r'''")+11:src.index("'''\nasync def")]
async def main():
    shot.serve()
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        ctx = await b.new_context(viewport={'width':640,'height':360}); await ctx.add_init_script(MOCK)
        pg = await ctx.new_page(); await pg.goto('http://127.0.0.1:8765/index.html?test'); await pg.wait_for_function('window.__dmh && window.__dmh.player', timeout=90000)
        print(await pg.evaluate("(async () => { const t = performance.now(); try { await __dmh.net.join('zzzzz', 'x'); return 'joined'; } catch (e) { return 'err ' + e.message + ' ' + Math.round(performance.now() - t); } })()"))
        await b.close()
asyncio.run(main())
