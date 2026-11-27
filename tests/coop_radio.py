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
        WAV = r'''const wav=(sec,f)=>{const sr=8000,n=sr*sec,b=new ArrayBuffer(44+n*2),v=new DataView(b);const w=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i));};w(0,'RIFF');v.setUint32(4,36+n*2,true);w(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,sr,true);v.setUint32(28,sr*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,n*2,true);for(let i=0;i<n;i++)v.setInt16(44+i*2,Math.sin(i/sr*f*6.283)*3000,true);return b;};const R=__dmh.audio.radio;'''
        ADD = "async()=>{%s await R.ready; await R.clear(); const n=await R.addFiles(%%s.map(([nm,s,f])=>new File([wav(s,f)],nm,{type:'audio/wav'}))); return [n,R.tracks.map(t=>t.key),R.active,R.role];}" % WAV
        print('A add', await A.evaluate(ADD % "[['Alpha Song.wav',40,220],['Bravo_Song.wav',40,330],['Charlie.wav',40,440]]"))
        print('B add', await B.evaluate(ADD % "[['Alpha Song.wav',40,220],['Bravo_Song.wav',40,330]]"))
        ST = "()=>{const R=__dmh.audio.radio;return JSON.stringify([R.cur>=0?R.tracks[R.cur].key:null,!!R.src,Math.round(R.pos()*10)/10,R.active,R.missing,__dmh.net.role])}"
        await A.bring_to_front(); await A.evaluate("()=>{const R=__dmh.audio.radio;R.play(0,0);}"); await A.wait_for_timeout(2500)
        print('A', await A.evaluate(ST)); await B.bring_to_front(); await B.wait_for_timeout(2500); print('B', await B.evaluate(ST), 'A', await A.evaluate(ST))
        # guest presses right arrow -> host skips -> both on bravo
        await B.evaluate("()=>__dmh.audio.radio.press(true)")
        await A.bring_to_front(); await A.wait_for_timeout(2500); await B.bring_to_front(); await B.wait_for_timeout(2500)
        print('after guest skip  A', await A.evaluate(ST), 'B', await B.evaluate(ST))
        # host restarts
        await A.bring_to_front(); await A.wait_for_timeout(3000); await A.evaluate("()=>__dmh.audio.radio.press(false)"); await A.wait_for_timeout(3000); await B.bring_to_front(); await B.wait_for_timeout(2500)
        print('after host restart A', await A.evaluate(ST), 'B', await B.evaluate(ST))
        # host skips to a song the guest lacks
        await A.bring_to_front(); await A.evaluate("()=>__dmh.audio.radio.press(true)"); await A.wait_for_timeout(3000); await B.bring_to_front(); await B.wait_for_timeout(4000)
        print('host on charlie    A', await A.evaluate(ST), 'B', await B.evaluate(ST))
        await A.bring_to_front(); await A.evaluate("()=>__dmh.audio.radio.press(true)"); await A.wait_for_timeout(3000); await B.bring_to_front(); await B.wait_for_timeout(4000)
        print('host back on alpha A', await A.evaluate(ST), 'B', await B.evaluate(ST))
        print('B want', await B.evaluate("()=>{const R=__dmh.audio.radio;const w=JSON.stringify(R.want);R.sync(['alphasong',3]);return w+' cur '+R.cur+' seq '+R.loadSeq+' ctx '+__dmh.audio.ctx.state}")); await B.wait_for_timeout(1500); print('B after manual', await B.evaluate(ST)); await A.bring_to_front(); await A.wait_for_timeout(2500); print('A again', await A.evaluate(ST), await A.evaluate('JSON.stringify(__dmh.audio.radio.state())'), 'B', await B.evaluate(ST))
        print('persist B', await B.evaluate("async()=>{const m=await import('./radio.js').catch(()=>null);return 'n/a'}"))
        print('\n'.join(logs[:12]))
        await b.close()
asyncio.run(main())
