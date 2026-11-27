# Is every part of a map joined up? With every door open: can each spawn pit, chest and station be walked to from the start?
import asyncio, sys, json
sys.path.insert(0, '/home/claude/dmh-test')
from shot import serve
from playwright.async_api import async_playwright
JS = """() => { const g=__dmh,P=g.player; g.godMode=true; const start=P.pos.clone(); const out={start:[Math.round(start.x),Math.round(start.y),Math.round(start.z)]};
 const nd=(p)=>{const[cx,cy]=g.cellOf(p.x,p.z);return g.navValid(cx,cy)&&g.navFree(cx,cy)?g.navDist[cy*g.navW+cx]:-1;};
 // doors shut: which zones can be reached without paying (should be zone 0 only)
 g.navRebuild(start); out.shutReach=[...new Set(g.spawnPoints.filter(S=>{const d=nd(S.pos);return d>=0&&d<1e8;}).map(S=>S.zone))];
 for(let i=0;i<g.zones.length;i++)g.unlockZone(i,true); for(const I of g.interactables)if(I.type==='Door'&&!I.open)g.openDoor(I); g.navRebuild(start);
 out.zones=g.zones.map((Z,i)=>i+':'+Z.name+' z'+(Z.z||0)); out.spawns=g.spawnPoints.length;
 out.badSpawns=g.spawnPoints.filter(S=>{const d=nd(S.pos);return d<0||d>1e8;}).map(S=>[S.zone,Math.round(S.pos.x),Math.round(S.pos.z),nd(S.pos)<0?'blocked':'cut off']);
 out.badStations=g.interactables.filter(I=>I.type!=='Door').filter(I=>{ let ok=false; for(let a=0;a<8&&!ok;a++){ const p={x:I.pos.x+Math.cos(a*0.785)*180,z:I.pos.z+Math.sin(a*0.785)*180}; const d=nd(p); if(d>=0&&d<1e8) ok=true; } return !ok; }).map(I=>[I.type,I.label,Math.round(I.pos.x),Math.round(I.pos.z)]);
 out.doors=g.interactables.filter(I=>I.type==='Door').map(I=>{ const c=I.box3.getCenter(new P.pos.constructor()); const ax=Math.abs(Math.round(Math.cos(I.yaw*Math.PI/180)))===1; const a=nd({x:c.x+(ax?260:0),z:c.z+(ax?0:260)}), b=nd({x:c.x-(ax?260:0),z:c.z-(ax?0:260)}), m=nd({x:c.x,z:c.z}); return [Math.round(c.x),Math.round(c.z),I.cost,g.zones[I.zoneA].name+'>'+g.zones[I.zoneB].name,(a>=0&&a<1e8&&b>=0&&b<1e8&&m>=0)?'ok':'BAD '+a+' '+m+' '+b]; });
 out.spawnY=g.spawnPoints.filter(S=>{ const h=g.phys.raycastDown(new P.pos.constructor(S.pos.x,S.pos.y+300,S.pos.z),900); return !h||Math.abs(h.point.y-S.pos.y)>40; }).map(S=>[S.zone,Math.round(S.pos.x),Math.round(S.pos.y),Math.round(S.pos.z)]);
 const h=g.phys.raycastDown(new P.pos.constructor(start.x,start.y+50,start.z),600); out.startGround=h?Math.round(h.point.y):null;
 return JSON.stringify(out); }"""
async def main():
    srv = serve()
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        for MAP in sys.argv[1].split(','):
            pg = await b.new_page(viewport={'width': 640, 'height': 360})
            logs = []
            pg.on('pageerror', lambda e: logs.append('[pageerror] ' + str(e) + ' ' + (e.stack or '')[:400]))
            await pg.goto('http://127.0.0.1:8765/index.html?test&map=' + MAP)
            await pg.wait_for_function('window.__dmh && window.__dmh.player', timeout=180000)
            await pg.evaluate("() => { window.__dmhHold = true; }")
            r = json.loads(await pg.evaluate(JS))
            print('MAP', MAP, 'start', r['start'], 'ground', r['startGround'], 'spawns', r['spawns'], 'reach with doors shut:', r['shutReach'])
            print(' zones', r['zones'])
            print(' bad spawns', r['badSpawns']); print(' bad stations', r['badStations']); print(' spawn height off', r['spawnY'])
            for d in r['doors']: print('  door', d)
            print(' errors', logs[:4]); await pg.close()
        await b.close()
    srv.shutdown()
asyncio.run(main())
