import asyncio, sys, json
sys.path.insert(0, '/home/claude/dmh-test')
from shot import serve
from playwright.async_api import async_playwright
PRE = r"""
const g=__dmh,P=g.player,U=g.data.upgrades,V=P.pos.constructor,id=n=>{const i=U.findIndex(u=>u.name===n);if(i<0)throw new Error('no '+n);return i;};
const add=n=>P.addUpgrade(id(n)), mod=n=>{P.slot.mods.push(id(n));P.recompute();};
const clear=()=>{P.upgradeStacks.fill(0);P.upgradeOrder.length=0;for(const S of P.weapons)S.mods=[];P.recompute();P.health=P.maxHealth;P.wield&&P.setWield(false);P.reloading=false;P.slot.ammo=P.magSize(P.slot);P.grounded=true;P.sustain=0;P.hotBarrel=0;P.procDepth=0;P.invuln=0;P.meleeHitting=false;P.boltN=0;};
const live=()=>g.enemies.filter(E=>!['Flyer','Crawler','Leaper','Burrower','Spitter','Priest','Gilded','Brute'].includes(E.ai)&&!E.elite&&!E.dead&&!E.emerging&&!E.isBoss&&!E.burrowed&&!(E.emerge>0));
const fwd=()=>{const d=new V();g.camera.getWorldDirection(d);return d;};
const put=(E,dist,side=0)=>{const f=P.forward();f.y=0;f.normalize();const r=P.right();E.pos.copy(P.pos).addScaledVector(f,dist).addScaledVector(r,side);E.vel.set(0,0,0);E.health=E.maxHealth;E.staggerT=0;E.slowT=0;E.burnT=0;E.elite=false;E.pryN=0;E.pbAt=-9;E.trampleAt=-9;return E;};
const aimAt=E=>{g.camera.lookAt(E.pos);g.camera.updateMatrixWorld(true);};const far=()=>{for(const E of live())E.pos.set(P.pos.x+3000+Math.random()*500,P.pos.y,P.pos.z+3000);};
const R={};const T=(n,f)=>{try{clear();far();P.pitch=0;g.camera.rotation&&0;R[n]=f();}catch(e){R[n]='ERR '+e.message+' '+(e.stack||'').split('\n')[1];}};
const rnd=Math.random;
"""
TESTS = r"""
T('dbgBolt',()=>{add('Clean Bill');const L=live();const A=put(L[0],700),B=put(L[1],1200);A.maxHealth=A.health=1e7;B.maxHealth=B.health=1e7;aimAt(A);P.boltN=3;const eye=g.camera.position.clone(),d=fwd();const o=[P.S.LightBolt,P.health,P.maxHealth,g.rayEnemy(eye,d,6000,A,25),g.rayEnemy(eye,d,6000,B,25),P.power()];P.fireWeapon();o.push(P.boltN,1e7-A.health,1e7-B.health,P.meleeHitting);return o;});
T('dbgHot',()=>{mod('Overclock');const E=put(live()[0],600);E.maxHealth=E.health=1e7;P.sustain=3;P.lastShotAt=g.time-0.05;aimAt(E);P.fireWeapon();return [P.hotBarrel,E.burnT,1e7-E.health,P.meleeHitting];});
T('SpringHeels',()=>{add('Spring Heels');const E=put(live()[0],200);const h=E.health;P.lastFall=1300;P.onLanded();return [h>E.health, Math.round(h-E.health)];});
T('SpringHeels_hop',()=>{add('Spring Heels');const E=put(live()[0],200);const h=E.health;P.landShockAt=-9;P.lastFall=820;P.onLanded();return h===E.health;});
T('Colossus',()=>{add('Colossus');const E=put(live()[0],300);const h=E.health;P.landShockAt=-9;P.lastFall=820;P.onLanded();return [h>E.health,P.maxHealth];});
T('Crowbar',()=>{add('Crowbar');const E=put(live()[0],600);P.dealDamage(E,1,E.pos,P.forward(),false,1,false);return E.staggerT;});
T('FocusLens',()=>{add('Focus Lens');const E=put(live()[0],300);P.dealDamage(E,1,E.pos,P.forward(),false,1,false);return [Math.round(E.vel.length())>300,E.staggerT];});
T('PryBar',()=>{add('Pry Bar');const E=put(live()[0],600);E.elite=true;E.maxHealth=E.health=1e7;let ok=0;for(let k=0;k<6;k++){for(let i=0;i<5;i++){P.dealDamage(E,1,E.pos,P.forward(),false,1,false);if(i===4&&P.lastCrit)ok++;}}E.elite=false;return ok;});
T('Headhunter',()=>{add('Headhunter Scope');const L=live();const A=put(L[0],600),B=put(L[1],600,120);const h=B.health;P.dealDamage(A,1e7,A.pos,P.forward(),true,1,false);return [A.dead,h>B.health||B.dead];});
T('Adrenal',()=>{add('Adrenal Gland');const E=put(live()[0],600);E.maxHealth=E.health=1e6;P.health=10;P.dealDamage(E,50,E.pos,P.forward(),false,1,false);return E.burnT;});
T('Featherweight',()=>{add('Featherweight');const E=put(live()[0],600);P.grounded=false;P.airJumps=0;E.kill(P,false);const a=P.airJumps;P.grounded=true;return a;});
T('Midas',()=>{add('Midas Touch');const E=put(live()[0],600);const m=P.money;P.S.GoldKill=1;E.kill(P,false);return [P.money-m,E.money];});
T('GoldFever',()=>{add('Gold Fever');const E=put(live()[0],300);const h=E.health;P.money=1e6;P.spentAcc=0;P.spend(6000);const a=E.health===h;P.spend(6000);return [a,h>E.health||E.dead];});
T('Bulwark',()=>{add('Bulwark');const E=put(live()[0],200);E.maxHealth=E.health=1e7;g.godMode=false;let n=0;for(let i=0;i<80&&E.health===1e7;i++){P.health=P.maxHealth;P.lastMeleeHit=-9;P.invuln=0;P.receiveDamage(5,E,true);n++;}g.godMode=true;return [n,Math.round(1e7-E.health)];});
T('Parry',()=>{add("Duelist's Sash");const E=put(live()[0],150);P.setWield(true);P.wield=true;P.swingAt=g.time;const ph=P.health;g.godMode=false;P.receiveDamage(30,E,true);const a=P.health===ph;P.swingAt=-9;P.lastMeleeHit=-9;P.receiveDamage(30,E,true);g.godMode=true;return [a,E.staggerT,P.health<ph];});
T('LongReach',()=>{add('Long Reach');const E=put(live()[0],900);const h=E.health;P.wield=true;P.meleeHeavy=true;P.meleeBig=false;P.meleeThrust=false;P.meleeStrike();P.wield=false;return h>E.health||E.dead;});
T('CheapShot',()=>{add('Cheap Shot');const E=put(live()[0],110);E.maxHealth=E.health=1e9;P.wield=true;let n=0,st=0;for(let i=0;i<60&&!st;i++){put(E,110);E.health=1e9;P.meleeHeavy=false;P.meleeBig=false;P.meleeThrust=false;P.meleeStrike();n++;if(P.lastCrit)st=E.staggerT;}P.wield=false;return [n,st,1e9-E.health];});
T('CleanBill',()=>{add('Clean Bill');const L=live();const A=put(L[0],700),B=put(L[1],1200);A.maxHealth=A.health=1e7;B.maxHealth=B.health=1e7;P.boltN=3;P.fireCd=0;aimAt(A);P.fireWeapon();return [1e7-B.health>0,Math.round(1e7-B.health)];});
T('HairTrigger',()=>{P.fireCd=0;P.sustain=0;P.lastShotAt=-9;P.fireWeapon();const a=P.fireCd;mod('Hair Trigger');P.slot.ammo=9;P.sustain=3;P.lastShotAt=g.time-0.05;P.fireWeapon();return [a,P.fireCd];});
T('QuickHands',()=>{mod('Quick Hands');P.slot.ammo=1;P.startReload();const a=P.reloading;P.dashCharges=1;P.dashT=0;P.doDash();return [a,P.reloading,P.slot.ammo];});
T('MagCoupler',()=>{mod('Mag Coupler');const S=P.slot;S.tapeN=0;S.ammo=1;P.startReload();const a=P.reloadDur;P.finishReload();S.ammo=1;P.startReload();const b=P.reloadDur;P.finishReload();return [a,b];});
T('DeadeyeGlass',()=>{mod('Deadeye Glass');const L=live();const A=put(L[0],600),B=put(L[1],600,200);A.maxHealth=A.health=1e7;const h=B.health;const at=A.pos.clone();at.y=A.headY()+5;P.dealDamage(A,20,at,P.forward(),true,1,false);return h>B.health||B.dead;});
T('HeavyBarrel',()=>{mod('Heavy Barrel');const E=put(live()[0],600);E.maxHealth=E.health=1e9;let n=0;for(let i=0;i<80&&E.staggerT<0.7;i++){E.staggerT=0;P.dealDamage(E,1,E.pos,null,false,1,false);n++;}return [n,E.staggerT];});
T('Overclock',()=>{mod('Overclock');const E=put(live()[0],600);E.maxHealth=E.health=1e7;P.sustain=3;P.lastShotAt=g.time-0.05;P.fireCd=0;const d=E.pos.clone().sub(g.camera.position);aimAt(E);P.fireWeapon();return [P.hotBarrel,E.burnT];});
T('Outlaw',()=>{const E=put(live()[0],600);E.maxHealth=E.health=1e7;P.slot.ammo=5;aimAt(E);P.fireWeapon();const a=1e7-E.health;E.health=1e7;mod("Outlaw's Nerve");P.slot.ammo=1;aimAt(E);P.fireCd=0;P.fireWeapon();return [Math.round(a),Math.round(1e7-E.health)];});
T('Pierce',()=>{mod('Rebar Rounds');mod('Hollow Charge');const L=live();const A=put(L[0],500),B=put(L[1],800);A.maxHealth=A.health=1e7;B.maxHealth=B.health=1e7;aimAt(A);P.fireWeapon();return [Math.round(1e7-A.health),Math.round(1e7-B.health),B.slowT];});
"""
async def main():
    srv = serve()
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 960, 'height': 540})
        logs = []; pg.on('pageerror', lambda e: logs.append(str(e)))
        await pg.goto('http://127.0.0.1:8765/index.html?test&map=0')
        await pg.wait_for_function('window.__dmh && window.__dmh.player', timeout=180000)
        await pg.evaluate("()=>{const g=__dmh;g.godMode=true;g.hud.helpT=0;__diffTest.setDifficulty(0);g.round=3;g.startRound();__sim(700);window.__dmhHold=true;}")
        only = sys.argv[1:] 
        for line in TESTS.strip().split("\n"):
            name = line.split("'")[1]
            if only and name not in only: continue
            try:
                r = await asyncio.wait_for(pg.evaluate("()=>{" + PRE + line + "return JSON.stringify(R);}"), 12)
                print(r)
            except Exception as e:
                print(name, 'TIMEOUT/FAIL', str(e)[:80]); break
        print('errors', logs[:5])
        await b.close()
    srv.shutdown()
asyncio.run(main())
