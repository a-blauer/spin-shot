# Walk-round audit: every gate from both sides, every district from several of its spawn pits, each special object.
import asyncio, sys, json, os
sys.path.insert(0, '/home/claude/dmh-test')
from shot import serve
from tourlib import LOOK
from playwright.async_api import async_playwright
from PIL import Image
MAP = sys.argv[1]; EXTRA = json.loads(sys.argv[2]) if len(sys.argv) > 2 else []
JS = """() => { const g=__dmh,P=g.player,V=P.pos.constructor; g.godMode=true; g.hud.helpT=-5; document.getElementById('hud').style.display='none';
 for(let i=0;i<g.zones.length;i++)g.unlockZone(i,true); for(const I of g.interactables)if(I.type==='Door'&&!I.open)g.openDoor(I); g.phase='Intermission'; g.phaseTimer=1e9; g.navRebuild(P.pos);
 if(g.mech.train){g.mech.train.wait=1e9;} const ok=(x,z)=>{const[cx,cy]=g.cellOf(x,z); if(!g.navFree(cx,cy)||g.navDist[cy*g.navW+cx]>1e8) return false; const y=g.zoneZ(x,z); return !g.phys.overlapsCapsule(new V(x,y+130,z),40,60);};
 const views=[]; const gy=(x,z)=>{const h=g.phys.raycastDown(new V(x,g.zoneZ(x,z)+250,z),900);return h?h.point.y:g.zoneZ(x,z);};
 for(const I of g.interactables){ if(I.type!=='Door') continue; const c=I.box3.getCenter(new V()); const ax=Math.abs(Math.round(Math.cos(I.yaw*Math.PI/180)))===1;
   for(const s of [-1,1]) for(const d of [650,900,480]) { const x=c.x+(ax?s*d:140), z=c.z+(ax?140:s*d); if(ok(x,z)){ views.push(['door '+Math.round(c.x)+','+Math.round(c.z)+(s>0?' +':' -'),x,z,gy(x,z),c.x,c.z,c.y]); break; } } }
 g.zones.forEach((Z,zi)=>{ const S=g.spawnPoints.filter(s=>s.zone===zi&&ok(s.pos.x,s.pos.z)); const cx=(Z.min.X+Z.max.X)/2, cz=(Z.min.Y+Z.max.Y)/2; const pick=[]; for(const s of S){ if(pick.every(p=>Math.hypot(p.pos.x-s.pos.x,p.pos.z-s.pos.z)>1400)) pick.push(s); if(pick.length>=5) break; }
   for(const s of pick) views.push(['zone '+zi+' '+Z.name,s.pos.x,s.pos.z,gy(s.pos.x,s.pos.z),cx,cz,(Z.z||0)+150]); });
 return JSON.stringify(views); }"""
async def main():
    srv = serve()
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 960, 'height': 540})
        logs = []; pg.on('pageerror', lambda e: logs.append(str(e)))
        await pg.goto('http://127.0.0.1:8765/index.html?test&map=' + MAP)
        await pg.wait_for_function('window.__dmh && window.__dmh.player', timeout=180000)
        await pg.evaluate("() => { window.__dmhHold = true; }"); await pg.evaluate(LOOK + '1')
        views = json.loads(await pg.evaluate(JS)) + [['x']+e for e in EXTRA]
        a,b_=[int(x) for x in os.environ.get('SL','0:999').split(':')]; print('total',len(views)); views=views[a:b_]
        os.makedirs('aud', exist_ok=True); n = 0
        for v in views:
            await pg.evaluate("__lk(%s,%s,%s,%s,%s,%s)" % (v[1], v[2], v[3], v[4], v[5], v[6])); await pg.wait_for_timeout(180)
            await pg.screenshot(path='aud/m%s_%02d.png' % (MAP, n)); n += 1
        print('views', n, 'errors', logs[:3])
        for k in range(0, n, 12):
            sh = Image.new('RGB', (1920, 810))
            for j in range(min(12, n - k)): sh.paste(Image.open('aud/m%s_%02d.png' % (MAP, k + j)).resize((480, 270)), ((j % 4) * 480, (j // 4) * 270))
            sh.save('aud/m%s_%ssheet%d.png' % (MAP, os.environ.get('SL','').split(':')[0], k // 12))
        for i, v in enumerate(views): print(i, v[0], [round(x) for x in v[1:]])
        await b.close()
    srv.shutdown()
asyncio.run(main())
