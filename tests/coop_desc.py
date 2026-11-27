# two pages in one context, a BroadcastChannel-backed mock of the artifact `room` capability
import asyncio, os
from playwright.async_api import async_playwright
import shot
MOCK = r'''
(() => {
  // stand-in for PeerJS: peers find each other over BroadcastChannels
  class Conn { constructor(owner, other) { this.owner = owner; this.peer = other; this.open = false; this.h = {}; this.out = new BroadcastChannel('peer-' + other); }
    on(e, f) { (this.h[e] = this.h[e] || []).push(f); } fire(e, a) { (this.h[e] || []).forEach((f) => f(a)); }
    send(m) { this.out.postMessage({ t: 'data', from: this.owner.id, m: JSON.parse(JSON.stringify(m)) }); } close() { this.open = false; this.out.postMessage({ t: 'close', from: this.owner.id }); } }
  class FakePeer {
    constructor(a) { this.id = typeof a === 'string' ? a : 'c' + Math.random().toString(36).slice(2, 9); this.h = {}; this.conns = new Map(); this.bc = new BroadcastChannel('peer-' + this.id);
      this.bc.onmessage = (e) => { const d = e.data;
        if (d.t === 'conn') { const c = new Conn(this, d.from); this.conns.set(d.from, c); this.fire('connection', c); c.out.postMessage({ t: 'ack', from: this.id }); setTimeout(() => { c.open = true; c.fire('open'); }, 10); }
        else if (d.t === 'ack') { const c = this.conns.get(d.from); if (c) { c.open = true; c.acked = true; c.fire('open'); } }
        else if (d.t === 'data') { const c = this.conns.get(d.from); if (c) c.fire('data', d.m); }
        else if (d.t === 'close') { const c = this.conns.get(d.from); if (c) { c.open = false; c.fire('close'); } } };
      setTimeout(() => this.fire('open', this.id), 20); }
    on(e, f) { (this.h[e] = this.h[e] || []).push(f); } fire(e, a) { (this.h[e] || []).forEach((f) => f(a)); }
    connect(id) { const c = new Conn(this, id); this.conns.set(id, c); c.out.postMessage({ t: 'conn', from: this.id }); setTimeout(() => { if (!c.acked) this.fire('error', { type: 'peer-unavailable' }); }, 1500); return c; }
    destroy() { for (const c of this.conns.values()) c.close(); this.bc.close(); } reconnect() {}
  }
  window.__PeerCtor = FakePeer;
})();
'''
async def main():
    shot.serve()
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(viewport={'width': 960, 'height': 540})
        await ctx.add_init_script(MOCK)
        logs = []
        pages = []
        for i in range(2):
            pg = await ctx.new_page()
            pg.on('pageerror', lambda e, i=i: logs.append(f'[pageerror {i}] {e} {(e.stack or "")[:400]}'))
            pg.on('console', lambda m, i=i: logs.append(f'[{m.type} {i}] {m.text}') if m.type == 'error' else None)
            await pg.goto('http://127.0.0.1:8765/index.html?test')
            await pg.wait_for_function('window.__dmh && window.__dmh.player', timeout=180000)
            pages.append(pg)
        A, B = pages
        await A.evaluate("document.getElementById('playbtn').click()"); await A.wait_for_timeout(300)
        await A.evaluate("window.__dmhHold = true")   # as in real play: the host's game does not run (or announce itself started) while the lobby is open
        await A.evaluate("document.getElementById('lname').value='Hosty'; document.getElementById('lbinvite').click()"); await A.wait_for_timeout(1500)
        code = await A.evaluate('__dmh.net.code'); print('code', code)
        await B.bring_to_front(); await B.evaluate("window.__dmhHold = true; document.getElementById('playbtn').click()"); await B.wait_for_timeout(300)
        await B.evaluate("document.getElementById('lname').value='Joiner'; document.getElementById('lcode').value='" + code.lower() + "'; document.getElementById('lbjoin').click()"); await B.wait_for_timeout(3000)
        await B.screenshot(path='out/coop_lobby_b.png'); await A.bring_to_front(); await A.wait_for_timeout(1500); await A.screenshot(path='out/coop_lobby_a.png')
        await A.evaluate("[...document.querySelectorAll('.lbpick[data-map]')].find(e=>/Descent/.test(e.textContent)).click()"); await A.wait_for_timeout(1500)
        await A.evaluate("document.getElementById('lbstart').click()"); await A.wait_for_timeout(50000); await A.evaluate("window.__dmhHold = false"); await A.wait_for_timeout(1500)
        await B.bring_to_front(); await B.wait_for_timeout(50000); await B.evaluate("window.__dmhHold = false")
        ST = "()=>{const g=__dmh,D=g.descent,P=g.player;return JSON.stringify({map:g.map.id,role:g.net.role,phase:g.phase,room:D&&D.room,arena:D&&D.arena,cl:D&&D.cleared,gates:D&&D.gates.length,things:D&&D.things.length,offers:D&&D.offers,pos:[Math.round(P.pos.x),Math.round(P.pos.z)],en:g.enemies.filter(E=>!E.dead).length})}"
        async def both(tag, n=3):
            for k in range(n):
                await A.bring_to_front(); await A.wait_for_timeout(900); await B.bring_to_front(); await B.wait_for_timeout(900)
            print(tag, 'A', await A.evaluate(ST)); print(tag, 'B', await B.evaluate(ST))
        await A.bring_to_front(); await A.evaluate("()=>{const g=__dmh;g.godMode=true;g.phaseTimer=0}"); await B.evaluate("()=>{__dmh.godMode=true}")
        await both('start')
        await A.bring_to_front(); await A.evaluate("()=>{const g=__dmh;for(const E of g.enemies)if(!E.dead)E.takeHit(1e9,E.pos,new g.player.pos.constructor(0,1,0),false);g.spawned=g.toSpawn}")
        await both('cleared')
        await B.bring_to_front(); await B.screenshot(path='out/coopd_B.png')
        await B.evaluate("()=>{const D=__dmh.descent; D.gates[0].q.use()}")
        await both('B pressed', 2)
        print('rdy A', await A.evaluate("JSON.stringify(__dmh.descent.rdyN)"), 'B', await B.evaluate("JSON.stringify(__dmh.descent.rdyN)"))
        await A.bring_to_front(); await A.evaluate("()=>{const D=__dmh.descent; D.gates[0].q.use()}")
        await both('room2', 4)
        print('\n'.join(logs[:12]))
        await b.close()
asyncio.run(main())
