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
        await A.evaluate("document.querySelector('.lbpick[data-map=\"3\"]').click()"); await A.wait_for_timeout(1500)
        await B.bring_to_front(); await B.wait_for_timeout(1500); print('B sees host map in lobby:', await B.evaluate("__dmh.net.hostMap() + ' / lobby text: ' + ([...document.querySelectorAll('#lobby .lbpick[data-map].sel b, #lobby section')].map(e=>e.textContent).join(' ').match(/Mourning Bayou/) ? 'shows Mourning Bayou' : 'no bayou text')"))
        await A.bring_to_front()
        print('before start: B lobby', await B.evaluate("document.getElementById('lobby').style.display + ' hostStarted ' + __dmh.net.hostStarted()"))
        await A.evaluate("document.getElementById('lbstart').click()"); await A.wait_for_timeout(9000); await A.evaluate("window.__dmhHold = false"); await A.wait_for_timeout(1500)
        await B.bring_to_front(); await B.wait_for_timeout(9000); await B.evaluate("window.__dmhHold = false")
        for k in range(2):
            await B.wait_for_timeout(1500); print('  B poll', await B.evaluate("__dmh.net.hostMap() + ' round ' + __dmh.round + ' mapId ' + __dmh.mapId + ' started ' + __dmh.net.hostStarted() + ' lobby ' + document.getElementById('lobby').style.display + ' phase ' + __dmh.phase"))
        print('MAPS  A:', await A.evaluate("__dmh.map.name"), ' B:', await B.evaluate("__dmh.map.name + ' chests ' + __dmh.interactables.filter(i=>i.type==='Chest').length"), ' A chests', await A.evaluate("__dmh.interactables.filter(i=>i.type==='Chest').map(i=>Math.round(i.pos.x)+','+Math.round(i.pos.z)).slice(0,4).join(' ')"), '| B chests', await B.evaluate("__dmh.interactables.filter(i=>i.type==='Chest').map(i=>Math.round(i.pos.x)+','+Math.round(i.pos.z)).slice(0,4).join(' ')"))
        await B.bring_to_front(); await B.wait_for_timeout(2500)
        print('B lobby closed:', await B.evaluate("document.getElementById('lobby').style.display + ' role ' + __dmh.net.role + ' started ' + __dmh.net.started"))
        # host: force a round with enemies
        print('A cam', await A.evaluate("(() => { const d = new __dmh.player.pos.constructor(); __dmh.camera.getWorldDirection(d); return d.x.toFixed(2) + ',' + d.z.toFixed(2); })()"))
        print('A', await A.evaluate("(() => { const g = __dmh; g.godMode = true; g.phaseTimer = 0; return g.net.role + ' ghosts=' + g.net.ghosts.size; })()"))
        await A.evaluate('__sim(400)'); await A.wait_for_timeout(300)
        print('A', await A.evaluate("(() => { const g = __dmh; return 'round ' + g.round + ' phase ' + g.phase + ' enemies ' + g.enemies.length + ' toSpawn ' + g.toSpawn; })()"))
        await B.evaluate('__sim(30)')
        print('B kinds', await B.evaluate("[...new Set(__dmh.enemies.filter(e => e.remote).map(e => e.def.name + ':map' + e.def.map))].join(', ')"))
        print('B', await B.evaluate("(() => { const g = __dmh; return g.net.role + ' round ' + g.round + ' phase ' + g.phase + ' mirrors ' + g.enemies.filter(e => e.remote).length + ' rem ' + g.remaining() + ' ghosts ' + g.net.ghosts.size; })()"))
        # client shoots a mirror: apply big hit
        print('B hit', await B.evaluate("(() => { const g = __dmh; g.godMode = true; const E = g.enemies.find(e => e.remote && !e.dead); if (!E) return 'none'; window.__eid = E.id; window.__m = g.player.money; E.takeHit(99999, E.pos, new g.player.pos.constructor(1,0,0), true); return 'sent ' + E.id; })()"))
        await B.evaluate('__sim(10)'); await B.wait_for_timeout(300); await A.evaluate('__sim(20)'); await A.wait_for_timeout(300); await B.evaluate('__sim(10)')
        print('B after', await B.evaluate("(() => { const g = __dmh; const E = g.enemies.find(e => e.id === window.__eid); return 'enemy ' + (E ? 'dead=' + E.dead : 'removed') + ' money ' + window.__m + ' -> ' + g.player.money; })()"))
        await A.evaluate("(() => { const g = __dmh, V = g.player.pos.constructor; g.projectiles.spawn({ hostile: true, pos: new V(0, 300, 0), vel: new V(10, 0, 0), damage: 20, kind: 'Card', color: [1, 0.2, 0.2], life: 6 }); g.hazards.marker(new V(0, 0, 0), 30, 300, 3, [1, 0.2, 0.1]); g.hazards.ring(new V(0, 0, 0), 30, 900, 1200, [1, 0.5, 0.2]); })()")
        await B.wait_for_timeout(400)
        print('B proj/haz', await B.evaluate("__dmh.projectiles.list.filter(p => p.hostile).length + ' / ' + __dmh.hazards.list.map(h => h.kind).join(',')"))
        # look at host from client
        await A.evaluate('__sim(5)'); await A.wait_for_timeout(200)
        print(await B.evaluate("(() => { const g = __dmh, G = [...g.net.ghosts.values()][0], P = g.player; __sim(5); P.pos.set(G.pos.x + 350, G.pos.y, G.pos.z); let best = 0, bd = -9; const d = new P.pos.constructor(); for (let k = 0; k < 16; k++) { P.yaw = k * Math.PI / 8; P.pitch = 0; P.updateCamera(0.016); g.camera.updateMatrixWorld(true); g.camera.getWorldDirection(d); const dot = d.x * -1; if (dot > bd) { bd = dot; best = P.yaw; } } P.yaw = best; window.__dmhHold = true; P.updateCamera(0.016); const fw = new P.pos.constructor(0,0,1).applyQuaternion(G.group.getWorldQuaternion(new (g.camera.quaternion.constructor)())); return 'ghostFwd ' + fw.x.toFixed(2) + ',' + fw.z.toFixed(2) + ' ghost ' + G.fresh + ' ' + !!G.group + ' y ' + Math.round(G.pos.y) + ' py ' + Math.round(P.pos.y) + ' dot ' + bd.toFixed(2); })()"))
        await B.bring_to_front(); await B.wait_for_timeout(1500); await B.screenshot(path='out/coop_b.png')
        print('\n'.join(logs)[-3000:])
        await b.close()
asyncio.run(main())
