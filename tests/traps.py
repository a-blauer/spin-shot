import asyncio, sys, json
from shot import serve
from playwright.async_api import async_playwright
async def main():
    serve(); out = {}
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        for m in [int(x) for x in sys.argv[1:]]:
            pg = await b.new_page(viewport={'width': 960, 'height': 540}); logs=[]; pg.on('pageerror', lambda e: logs.append(str(e)))
            await pg.goto('http://127.0.0.1:8765/index.html?test&map=%d' % m); await pg.wait_for_function('window.__dmh && window.__dmh.player', timeout=120000)
            r = await pg.evaluate("""()=>{const g=__dmh,P=g.player;g.godMode=true;g.hud.helpT=-5;g.hud.tipQ=[];__meta.Meta.tipMark('money');
              return JSON.stringify(g.mech.traps.map(T=>({k:T.D.kind,n:T.D.name,sw:[Math.round(T.I.pos.x),Math.round(T.I.pos.y),Math.round(T.I.pos.z)],c:[Math.round(T.c.x),Math.round(T.c.y),Math.round(T.c.z)],hw:Math.round(T.hw),nrm:[T.n.x,T.n.z],yaw:T.yaw})))}""")
            T = json.loads(r); print(m, json.dumps(T)); out[m] = T
            for k, t in enumerate(T):
                sw, c = t['sw'], t['c']
                # stand on the far side of the switch from the doorway, looking at both
                await pg.evaluate("""([sw,c,k])=>{const g=__dmh,P=g.player,T=g.mech.traps[k];const V=P.pos.constructor;let best=null,bs=-1;
                  for(let a=0;a<16;a++){for(const R of [330,260,420]){const px=sw[0]+Math.cos(a*Math.PI/8)*R,pz=sw[2]+Math.sin(a*Math.PI/8)*R;const [cx,cy]=g.cellOf(px,pz);if(!g.navFree(cx,cy))continue;
                    const from=new V(px,sw[1]+150,pz),to=new V(sw[0],sw[1]+170,sw[2]),d=to.clone().sub(from),L=d.length();d.normalize();const h=g.phys.raycast(from,d,L-30);if(h)continue;
                    const sc=Math.abs((px-sw[0])*T.n.x+(pz-sw[2])*T.n.z)+ (R===330?50:0);if(sc>bs){bs=sc;best=[px,pz];}}}
                  if(!best)best=[sw[0]+300,sw[2]];
                  P.pos.set(best[0],sw[1]+100,best[1]);P.vel.set(0,0,0);P.yaw=Math.atan2(best[0]-sw[0],best[1]-sw[2]);P.pitch=0.08;g.phase='Intermission';g.phaseTimer=1e9;g.hud.tipQ=[];g.hud.banners.length=0;g.hud.roundBanner=null;g.hud.toasts.length=0;g.hud.helpT=-5;__sim(4);P.money=1e6;window.__dmhHold=true;}""", [sw, c, k])
                await pg.wait_for_timeout(250); await pg.screenshot(path='out/trap_%d_%d.png' % (m, k))
                res = await pg.evaluate("""(k)=>{window.__dmhHold=false;const g=__dmh,P=g.player,T=g.mech.traps[k];g.round=2;g.startRound();__sim(400);const L=g.enemies.filter(E=>!E.dead&&!E.isBoss&&!(E.emerge>0)).slice(0,3);
                  for(const E of L){E.pos.copy(T.c);if(!T.radius)E.pos.y=T.floor+100;E.pos.x+=Math.random()*60;E.vel.set(0,0,0);}
                  const h=L.map(E=>E.health);const m0=P.money;T.I.q.use(P);__sim(T.D.kind==='blast'?99:50);g.hud.banners.length=0;g.hud.roundBanner=null;g.hud.toasts.length=0;g.hud.tipQ=[];window.__dmhHold=true;
                  const r=[L.length,m0-P.money,L.map((E,i)=>E.dead?'dead':Math.round(h[i]-E.health)),L.map(E=>Math.round(E.staggerT*10)/10),Math.round(T.run*10)/10,Math.round(T.cool)];
                  return JSON.stringify(r)}""", k)
                await pg.wait_for_timeout(250); await pg.screenshot(path='out/trapfx_%d_%d.png' % (m, k)); print('   ', t['n'], res)
                await pg.evaluate("()=>{window.__dmhHold=false;const g=__dmh;__sim(200);for(const E of g.enemies)E.remove=true;g.phase='Intermission';g.phaseTimer=1e9;__sim(5)}")
            print('   errors', logs[:3]); await pg.close()
        await b.close()
asyncio.run(main())
