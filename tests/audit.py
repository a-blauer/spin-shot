# Map audit: wall fittings (wall-buys, signs) that float or are buried, things you can use that sit inside geometry.
import asyncio, sys, json
sys.path.insert(0, '/home/claude/dmh-test')
from shot import serve
from playwright.async_api import async_playwright
JS = """() => { const g=__dmh,P=g.player,V=P.pos.constructor; const out={wb:[],signs:[],inside:[]};
 const ray=(o,d,L)=>{const h=g.phys.raycast(o,d,L);return h?Math.round(h.distance):null;};
 for(const I of g.interactables){ if(I.type==='WallBuy'){ const a=I.yaw*Math.PI/180,n=new V(Math.cos(a),0,Math.sin(a)); const o=I.pos.clone().add(new V(0,150,0)).addScaledVector(n,40); const back=ray(o,n.clone().negate(),400), front=ray(o,n,260);
   if(back===null||back>75||back<25||(front!==null&&front<200)) out.wb.push([I.label,Math.round(I.pos.x),Math.round(I.pos.z),Math.round(I.pos.y),'back',back,'front',front]); }
  else if(I.type!=='Door'&&I.type!=='Chest'){ if(g.phys.overlapsCapsule(I.pos.clone().add(new V(0,400,0)),30,40)) out.inside.push([I.type,I.label,Math.round(I.pos.x),Math.round(I.pos.z)]); } }
 for(const m of g.world.signs.children){ const n=new V(0,0,1).applyQuaternion(m.quaternion); const o=m.position.clone().addScaledVector(n,30); const back=ray(o,n.clone().negate(),400), front=ray(o,n,200);
   if(back===null||back>60||back<18||(front!==null&&front<150)) out.signs.push([m.userData.text||'?',Math.round(m.position.x),Math.round(m.position.z),Math.round(m.position.y),'back',back,'front',front]); }
 out.near=[]; for(const D of g.interactables){ if(D.type!=='Door') continue; const c=D.box3.getCenter(new V()); for(const I of g.interactables){ if(I===D||I.type==='Door') continue; const d=Math.hypot(I.pos.x-c.x,I.pos.z-c.z); if(d<520) out.near.push([Math.round(c.x),Math.round(c.z),I.type,I.label,Math.round(I.pos.x),Math.round(I.pos.z),Math.round(d)]); } for(const S of g.spawnPoints){ const d=Math.hypot(S.pos.x-c.x,S.pos.z-c.z); if(d<380) out.near.push([Math.round(c.x),Math.round(c.z),'spawn pit','',Math.round(S.pos.x),Math.round(S.pos.z),Math.round(d)]); } }
 out.nsigns=g.world.signs.children.length; return JSON.stringify(out); }"""
async def main():
    srv = serve()
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        for MAP in sys.argv[1].split(','):
            pg = await b.new_page(viewport={'width': 640, 'height': 360})
            await pg.goto('http://127.0.0.1:8765/index.html?test&map=' + MAP)
            await pg.wait_for_function('window.__dmh && window.__dmh.player', timeout=180000)
            await pg.evaluate("() => { window.__dmhHold = true; }")
            r = json.loads(await pg.evaluate(JS))
            print('MAP', MAP, 'signs', r['nsigns'])
            for k in ('wb', 'near', 'inside'):
                for x in r[k]: print('  ', k, x)
            await pg.close()
        await b.close()
    srv.shutdown()
asyncio.run(main())
