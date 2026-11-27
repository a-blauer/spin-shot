# Headless play-test harness: serves dist/, opens ?test, runs a JS scenario, takes screenshots, dumps console errors.
import asyncio, sys, json, os, http.server, threading, functools
from playwright.async_api import async_playwright

DIST = '/home/claude/dmh-web/dist'
OUT = '/home/claude/dmh-test/out'
os.makedirs(OUT, exist_ok=True)

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

def serve():
    h = functools.partial(Q, directory=DIST)
    s = http.server.ThreadingHTTPServer(('127.0.0.1', 8765), h)
    threading.Thread(target=s.serve_forever, daemon=True).start()
    return s

async def main(script_path):
    scen = json.load(open(script_path))
    srv = serve()
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
        pg = await b.new_page(viewport={'width': scen.get('w', 1280), 'height': scen.get('h', 720)})
        logs = []
        pg.on('console', lambda m: logs.append(f'[{m.type}] {m.text}'))
        pg.on('requestfailed', lambda r: logs.append('[reqfail] ' + r.url))
        pg.on('response', lambda r: logs.append(f'[404] {r.url}') if r.status >= 400 else None)
        pg.on('pageerror', lambda e: logs.append(f'[pageerror] {e} {(e.stack or "")[:300]}'))
        await pg.goto('http://127.0.0.1:8765/index.html' + scen.get('url', '?test') + scen.get('query', ''))
        await pg.wait_for_function('window.__dmh && window.__dmh.player', timeout=180000)
        for step in scen['steps']:
            if 'js' in step:
                r = await pg.evaluate(step['js'])
                if r is not None: print('js>', r)
            if 'wait' in step:
                await pg.wait_for_timeout(step['wait'])
            if 'shot' in step:
                await pg.screenshot(path=f"{OUT}/{step['shot']}.png")
                print('shot', step['shot'])
        print('\n'.join(l for l in logs if 'GPU stall' not in l and 'maxLeafTris' not in l)[-6000:])
        await b.close()
    srv.shutdown()

if __name__ == "__main__":
    asyncio.run(main(sys.argv[1]))
