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
        await A.evaluate("document.getElementById('lbstart').click()"); await A.wait_for_timeout(50000); await A.evaluate("window.__dmhHold = false"); await A.wait_for_timeout(1500)
        await B.bring_to_front(); await B.wait_for_timeout(50000); await B.evaluate("window.__dmhHold = false")
        await A.bring_to_front(); await A.evaluate("()=>{const g=__dmh;g.godMode=true;g.phase='Intermission';g.phaseTimer=1e9}"); await B.evaluate("()=>{__dmh.godMode=true}")
        async def both(n=2):
            for k in range(n):
                await A.bring_to_front(); await A.wait_for_timeout(700); await B.bring_to_front(); await B.wait_for_timeout(700)
        await both(3)
        # guest throws a grenade and fires a few shots; host should see a harmless copy and tracers
        await B.bring_to_front()
        print('B fire', await B.evaluate("()=>{const g=__dmh,P=g.player;P.grenades=[0,0];P.grenadeCd=0;P.throwGrenade();for(let i=0;i<4;i++){P.shotSeq=(P.shotSeq||0)+1;}return JSON.stringify([g.net.role,g.net.started,g.projectiles.list.filter(p=>!p.done).length])}"))
        await B.wait_for_timeout(250); await A.bring_to_front(); await A.wait_for_timeout(350)
        print('A sees', await A.evaluate("()=>{const g=__dmh;return JSON.stringify({ghostPj:g.projectiles.list.filter(p=>p.ghost).length,kinds:g.projectiles.list.filter(p=>p.ghost).map(p=>p.kind),q:[...g.net.ghosts.values()].map(G=>[G.queue,G.shot])})}"))
        await A.screenshot(path='out/coop_pj_A.png')
        # host throws; guest should see it
        print('A fire', await A.evaluate("()=>{const g=__dmh,P=g.player;P.grenades=[0,0];P.grenadeCd=0;P.throwGrenade();return g.projectiles.list.filter(p=>!p.done&&!p.ghost).length}"))
        await A.wait_for_timeout(250); await B.bring_to_front(); await B.wait_for_timeout(350)
        print('B sees', await B.evaluate("()=>{const g=__dmh;return JSON.stringify({ghostPj:g.projectiles.list.filter(p=>p.ghost).length,hostile:g.projectiles.list.filter(p=>p.hostile).length})}"))
        await both(3)
        print('\n'.join(logs[:12]))
        await b.close()
asyncio.run(main())
