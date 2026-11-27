import asyncio, re
from playwright.async_api import async_playwright
import shot
WAV = re.search(r"WAV = r'''(.*?)'''", open('coop_radio.py').read(), re.S).group(1)
async def main():
    shot.serve()
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(viewport={'width': 960, 'height': 540}); pg = await ctx.new_page(); logs=[]
        pg.on('pageerror', lambda e: logs.append(str(e)))
        await pg.goto('http://127.0.0.1:8765/index.html?test'); await pg.wait_for_function('window.__dmh && window.__dmh.player', timeout=180000)
        print('add', await pg.evaluate("async()=>{%s await R.ready; await R.clear(); const n=await R.addFiles([['Alpha Song.wav',6,220],['Bravo_Song.wav',30,330],['Charlie.mp3',30,440]].map(([nm,s,f])=>new File([wav(s,f)],nm,{type:'audio/wav'}))); return [n,R.tracks.map(t=>t.title),!!R.db];}" % WAV))
        await pg.reload(); await pg.wait_for_function('window.__dmh && window.__dmh.player', timeout=180000)
        print('after reload', await pg.evaluate("async()=>{const R=__dmh.audio.radio;await R.ready;return [R.tracks.map(t=>t.key),R.active,__dmh.phase,!!__dmh.audio.ctx]}"))
        ST = "()=>{const R=__dmh.audio.radio;return JSON.stringify([R.cur>=0?R.tracks[R.cur].key:null,!!R.src,Math.round(R.pos()*10)/10,R.active])}"
        await pg.mouse.click(480, 270); await pg.wait_for_timeout(1500); print('state', await pg.evaluate(ST), await pg.evaluate("[__dmh.phase, __dmh.audio.musicMode, !!__dmh.audio.ctx, __dmh.audio.ctx&&__dmh.audio.ctx.state].join()"))
        await pg.evaluate("()=>{__dmh.audio.radio.play(0,0)}"); await pg.wait_for_timeout(800); print('alpha', await pg.evaluate(ST))
        await pg.keyboard.press('ArrowRight'); await pg.wait_for_timeout(800); print('right', await pg.evaluate(ST))
        await pg.wait_for_timeout(1500); await pg.keyboard.press('ArrowLeft'); await pg.wait_for_timeout(600); print('left', await pg.evaluate(ST))
        await pg.evaluate("()=>{__dmh.audio.radio.play(0,4.5)}"); await pg.wait_for_timeout(3000); print('auto-advance', await pg.evaluate(ST))
        await pg.screenshot(path='out/radio_hud.png')
        await pg.keyboard.press('KeyP'); await pg.wait_for_timeout(500); await pg.screenshot(path='out/radio_pause.png')
        print(logs[:5]); await b.close()
asyncio.run(main())
