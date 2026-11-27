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
        ST = "()=>{const g=__dmh,P=g.player,N=g.net;return JSON.stringify({dead:P.dead,down:!!P.downed,bleed:Math.round(P.bleed||0),rp:Math.round((P.reviveP||0)*100),hp:Math.round(P.health),ghosts:[...N.ghosts.values()].map(G=>[G.name,G.dead,!!G.down,G.rv||'',Math.round(G.rp*100)]),tgt:N.reviveTarget?N.reviveTarget.name:null,pings:(g.pings||[]).length,phase:g.phase})}"
        await A.bring_to_front(); await A.wait_for_timeout(1500)
        # put B next to A, then kill B
        await B.bring_to_front()
        apos = await A.evaluate("()=>{const p=__dmh.player.pos;return [p.x,p.y,p.z]}")
        await B.evaluate("(p)=>{const g=__dmh,P=g.player;g.godMode=false;P.pos.set(p[0]+120,p[1],p[2]);P.vel.set(0,0,0);}", apos); await B.wait_for_timeout(800)
        await B.evaluate("()=>{const P=__dmh.player;P.invuln=0;P.revives=0;P.receiveDamage(99999,null,true);}"); await B.wait_for_timeout(1200)
        print('B downed:', await B.evaluate(ST)); await B.screenshot(path='out/coop_down_B.png')
        await A.bring_to_front(); await A.evaluate("()=>{__dmh.godMode=true}"); await A.wait_for_timeout(1500); print('A sees:', await A.evaluate(ST)); await A.screenshot(path='out/coop_down_A.png')
        # A holds E; both tabs must tick, so alternate
        await A.keyboard.down('KeyE')
        for k in range(22):
            await A.bring_to_front(); await A.wait_for_timeout(700); await B.bring_to_front(); await B.wait_for_timeout(700)
            sb = await B.evaluate(ST); 
            if '"dead":false' in sb: break
        await A.keyboard.up('KeyE')
        print('B after:', await B.evaluate(ST))
        await B.screenshot(path='out/coop_up_B.png')
        await A.bring_to_front(); await A.keyboard.press('KeyG'); await A.wait_for_timeout(700); await A.evaluate("()=>{__dmh.player.fireWeapon()}"); await A.wait_for_timeout(400); await A.screenshot(path='out/coop_ping_A.png')
        await B.bring_to_front(); await B.wait_for_timeout(1200); print('B after A ping+shot:', await B.evaluate(ST)); await B.screenshot(path='out/coop_ping_B.png')
        print('\n'.join(logs[:12]))
        await b.close()
asyncio.run(main())
