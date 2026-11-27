# Gun contact sheets: side views of the display models, and first-person views of each weapon in hand.
import asyncio, sys, os, functools, threading, http.server
from playwright.async_api import async_playwright
from PIL import Image
sys.path.insert(0, '/home/claude/dmh-test')
from shot import Q, DIST
OUT = '/home/claude/dmh-test/ads'
os.makedirs(OUT, exist_ok=True)
PAIRS = [tuple(int(v) for v in x.split(':')) for x in sys.argv[1].split(',')] if len(sys.argv) > 1 else [(i, 0) for i in range(30)]
import json as _j
CANTS = _j.loads(os.environ.get('CANTS', '[]'))
ACT = sys.argv[2] if len(sys.argv) > 2 else 'ads'

async def main():
    h = functools.partial(Q, directory=DIST)
    s = http.server.ThreadingHTTPServer(('127.0.0.1', 8769), h)
    threading.Thread(target=s.serve_forever, daemon=True).start()
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 960, 'height': 540})
        logs = []
        pg.on('pageerror', lambda e: logs.append(str(e)))
        pg.on('console', lambda m: logs.append(m.text) if m.type == 'error' else None)
        await pg.goto('http://127.0.0.1:8769/index.html?test')
        await pg.wait_for_function('window.__dmh && window.__dmh.player', timeout=180000)
        await pg.evaluate("""() => { window.__dmhHold = true; const g = window.__dmh; g.godMode = true; 
          const P = g.player; P.pos.set(-4000, 95, -1200); P.yaw = Math.PI + 0.35; P.pitch = 0; g.phase = 'Intermission'; g.phaseTimer = 1e9; __sim(5);
          window.showSide = (i, t=0) => { if (window._gm) g.scene.remove(window._gm); g.vm.hidden = true;
            const VM = g.vm.constructor; const m = VM.displayModel(g, i, t); const T = g.camera.position.constructor;
            const c = g.camera; const f = new T(0,0,-1).applyQuaternion(c.quaternion), r = new T(1,0,0).applyQuaternion(c.quaternion);
            const piv = new (m.constructor)(); piv.add(m); m.rotation.y = -Math.PI/2; m.position.set(-14, -6, 0);
            piv.position.copy(c.position).addScaledVector(f, 70); piv.quaternion.copy(c.quaternion); piv.rotateY(-0.5); piv.rotateX(0.18);
            g.scene.add(piv); window._gm = piv; g.render(); return g.data.weapons[i].name; };
          window.showFP = (i, t=0) => { if (window._gm) g.scene.remove(window._gm); window._gm = null; g.vm.hidden = false; P.giveWeapon(i); P.slot.tier = t; g.vm.setWeapon(i, t, false); P.refillAll(); __sim(40); return g.data.weapons[i].name; };
        }""")
        n = 0
        for (i, t) in PAIRS:
          if True:
            await pg.evaluate(f"showFP({i},{t}); {('__dmh.vm.feel.cant=' + _j.dumps(CANTS[n]) + ';') if n < len(CANTS) else ''} __dmh.hud.helpT=0; {'__sim(50,{aim:true});' if ACT=='ads' else '__sim(50,{aim:true});__sim(1,{aim:true,fire:true,firePressed:1});__sim(2,{aim:true,fire:true});' if ACT=='fire' else '__sim(20);__sim(1,{fire:true,firePressed:1});__sim(1,{fire:true});' if ACT=='hipfire' else '__sim(6,{aim:true});' if ACT=='mid' else ''} __dmh.render && __dmh.render(); 1"); await pg.wait_for_timeout(300)
            await pg.screenshot(path=f'{OUT}/a{n:02d}.png')
            n += 1
        print('errors:', logs[:6])
        await b.close()
    s.shutdown()
    for pre in ('a',):
        files = sorted(f for f in os.listdir(OUT) if f.startswith(pre) and f[1:3].isdigit())
        for k in range(0, len(files), 6):
            sheet = Image.new('RGB', (1920, 720))
            for j, f in enumerate(files[k:k + 6]):
                im = Image.open(os.path.join(OUT, f)).convert('RGB')
                im = im.crop((160, 60, 800, 420)) if pre == 's' else im.resize((640, 360))
                sheet.paste(im, ((j % 3) * 640, (j // 3) * 360))
            sheet.save(f'{OUT}/sheet_{pre}{k // 6}.png')
asyncio.run(main())
