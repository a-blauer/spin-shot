# 40-room Descent build (in progress)
- Engine done: world.chunk + showChunk(i) (only current arena drawn), arenas on a 7-col grid (SP 13200), N_ROOMS from ROOM_DIMS, descent.order = 16 random of N_ROOMS, bosses at arena N_ROOMS, N_ROOMS+1.
- Rooms 0-7 in src/descent_rooms.js (craftRoom switch). Rooms 8+ come from EXTRA = ROOMS_A..D in src/descent_rooms_{a,b,c,d}.js: each { theme:{name,floor,floor2,wall,trim,glow,lamp,fog,sh}, dims:[hx,hy,H], wall:{panel,hang,corner,c1,c2,glow,n}, build(K,Q,P) }.
  Q = kit (descent_rooms.js: hit/solid/deco use BASE z; plat, platOct, lowWall, crate, barrel, ring, slabs, tall, L). P = props (descent_props.js).
  wall.panel: niche|window|pipes|banner|shelf|bars|planks|arch ; hang: lamp|chain|spike|vine|cloth|star ; corner: crates|rubble|barrels
- Rules: keep clear the strip within 450 of both end walls for x in [-1300,2700]; wall guns at (+-hx, +-500); doors at (0,+-hy); nothing solid on side walls; raised things via plat (stepped) only.
- Planned 32 themes: Clockwork Hall, Sunken Library, Ash Chapel, Meat Locker, Bone Orchard, Big Top, Pump Station, Crystal Cavern | Fungal Grotto, Sewer Junction, Powder Magazine, The Vault, Opera House, Cell Block, Glasshouse, Observatory | Apothecary, Armory, Magma Chamber, Warehouse, Throne Room, Bathhouse, Feast Hall, Salt Mine | Webbed Den, Scrapyard, Stables, Hall of Statues, Cistern, Sand Tomb, Distillery, Toy Workshop
- Tests (/home/claude/dmh-test): chk.json (spawns/stations reachable, uses arenas 0..N), nav2.json (__room(i)), mkrv2.py + grid.py (stills), boss.json, tip.json, d8.json. Tests must call g.world.showChunk(i) after setting D.arena.
- Publish: artifact slug e5dd3f5c-743a-43c6-a567-a73ae54acbe6 (base_version = last publish; latest 1795559179-67dc, commit 05d7c52), then tar-copy to /home/claude/spin-shot, cp dist to docs, commit with attribution, push.
- checkpoint: 24 rooms published (version after 1795543090-ef45: see last publish), rooms_a + rooms_b done. Remaining: rooms_c (Apothecary, Armory, Magma Chamber, Warehouse, Throne Room, Bathhouse, Feast Hall, Salt Mine), rooms_d (Webbed Den, Scrapyard, Stables, Hall of Statues, Cistern, Sand Tomb, Distillery, Toy Workshop)
- rooms_c, rooms_d written (all 40 exist). If a room errors at build: missing helper in its destructure list. boot2.py prints first console errors.
- DONE: all 40 rooms published (artifact version 1795546xxx after 1795545064-4414) and pushed.
- DEEP REVIEW (user asked rooms 8-39 be brought to standard of first 8): upgraded P.gear, P.column bands, dressWall motifs (pilasters, dentils, richer panels). Reviewing rooms with mkdeep.py <rooms> (4 views/room -> grid.py -> out/gridN.png), fixing per room. Progress noted below.
- Deep review DONE and published (after 1795546172-14f0). NOTE: stills must sim ~200 steps in a room before shooting or the previous room's palette shows (mkov.py does this).
- AUDIO: all non-gun SFX resynthesised by tools/sfx (core.py, parts.py, sounds_a/b/c.py, check.py, calib.py, build_all.sh). src/audio_trim.js is generated. S_ShellDrop/S_HullDrop and guns/ untouched. Published + pushed.
- WEAPON SIGNATURES (in progress): src/signatures.js = one signature per gun (SIG[name]: name/short/text/play/fav/aff/proc + hooks shot/pre/crit/post/kill/reload/tick/hud/after, and params ric/chain/pierceGain/flameEnd/bounceGain/sawBounces/selfLaunch/fullMulti/critCap/critAdd/noCrit/mag/sheet/spread/rate). player.js: shotCtx `C` set in fireWeapon, carried on projectiles as P.sx; dealDamage calls hooks; recompute applies sig.aff; runProcs uses sigProc; sigTick/sigDeath global. hud.js shows sig line at y-150; craft.js shows .sig box + "suits" chips. Backups /tmp/player.bak. TODO: per-gun test (sig.json), tip.json, d8.json, publish over 1795553398-3434, push.
- SIGNATURES DONE + published + pushed. Tests: mksig.py <out.json> <gun ids> (damage on dummies with/without rule via globalThis.__nosig, kill run), sigf.json (functional checks per mechanic), sigui.json (workbench + HUD stills). __sim(n,{right:1}) moves the player. Dummies must finish emerging before near()-based effects see them. Balance is by measurement on dummies only; noisy (+-15%).
- 25 ODDITIES added (weapons 30-54, cls 'Oddity' mostly, mode 'Special'): rules in src/signatures2.js (SIG2 merged into SIG; sig2Tick/sig2Amp/sig2After global), helpers src/sigkit.js. New hooks: fire/free/ammo/can/charge/rkey/hurt/bar/snd + projectile pTick/pHit/pWall/pEnd/pGone (entities.js; P.sx = shot ctx, P.stuck, P.spin, projectiles.kill). content.json fields: pk (projectile kind), cont (continuous). Models in guns.js (cases before default), FEEL_GUN entries flagged odd:true => spec.SightExact: ADS eye height = Sight exactly (auto top-of-centre-line is wrong for wide flat tops) and hideAds parts are skipped. Keep Sight >= visible top + ~2 (more for parts near the muzzle).
- Tests: rev4.py <tag> <ids> (side, 3/4, in hand, aimed sheet -> /tmp/r4_<tag>.png), fp.py, sigg1/2/4.json (functional; NOTE player drifts between tests, so run suspicious ones alone), gall55.json (all 55 fire/aim/reload via real input), world.json (trap/box/rods still).
- Melee: two-handed hafts (bat, sledge, shovel) now right hand on top, left at the butt (viewmodel mTwoDrop); katana unchanged.
- PENDING (user asked): replayability hook for the Descent. Proposed 'Notches + Ante' (per-weapon completion grid, opt-in stakes, exclusive part per gun, daily descent); waiting for the user's go-ahead before building.
- CHARACTER CREATOR (2026-11-24): src/headkit.js = sculpted head per `jaw` id (FACES: oval square round narrow heart strong soft gaunt diamond), fz(x,y)/fx/pt/domeY place things on the skin, shell({k,kin,a0,a1,top,bot,fall,lift}) makes hair/stubble/bandana/mask sheets (pl([[angle,y]...]) for hairlines), tube() for cornrows. character.js: body from frame (body: regular|fem, f) + 10 sliders (cosmetics.js SHAPES; look.shape, -1..1; chest/rear/groin default -1 = none). Limbs: `sl`/`up` groups scale with length, `wr`/`ft` carry hand/gun/boot; boots are in ankle space (y 0 ankle, -21 ground). Bust helpers vband/hband/bz lay outfit strips over the chest. Hats: origin y 42 on head (open ones in a map). bodyStats(look) -> player.body {reach,spread,jump,dash,speed,health,hit,evade}; player.setBody(look) at run start. Look string: 23 slots + '|~' + 10 letters (a..u). FACE_PRESETS. Non-human bodies and 'andro' removed; facial hair is slot fhair (old face stache/beard migrate).
  Tests: cc.py <tag> @file.js (one sheet -> /tmp/cc_<tag>.jpg), cc2.py <tag> @file.js (array of sheets), window.__charSheet(base, slot, view, cols) views head|face|side|rear|torso|legs|full, window.__lookSheet([{label,look,yaw,view}], cols, cw, ch); cb1/cb2.json (stats), ccui.json (creator UI), fpb.py (first-person by body).
- DESCENT PROGRESSION: src/deeds.js (DEEDS, EVO_NEED 30/90/180/300, TEMPERS, ATTUNES). No money in Descent (addMoney no-op, spend true). P.boxRolls per room. Guns evolve via player.creditKill/evolve (S.evoK). descent.reward() ascends top-damage gun not yet marked on this difficulty (Meta.asc/ascend/ascPick/carry/keepsake). Recycler/reroll/banish in craft.js. W.cash guns (Gold Rush, House Edge) kept out. Tests dd1.json, dd2.json (__meta.Meta.*; ?test has unlockAll on so every deed reads as earned).
- Published 1795563415-645e, pushed 9d396af.
- Progress screen has RESET PROGRESS (two presses; Meta.reset + reload). Test rst.json.
- FACE STYLE PROTOTYPES (not live): src/proto_head.js (TEST only, window.__proto(char, 'A'|'B'|'C'|'D', look); __lookSheet entries take post:'B'). Sheet script /tmp/s_p.js -> cc.py proto. User asked for less cartoony, truly sculpted faces; awaiting their pick.
- GNOMES (2026-11-24, replaces the humanoid heads; headkit.js and proto_head.js deleted): character.js head = skin ball + ears + nose (slot nose, blush) + beard group (slot beard; tilted to lie on the chest, more for a poncho) + moustache (stache) + hair under hat (hair) + hat at head y 21 covering everything above the nose. Gnome hats use cone(h, n, r0, r1, bend(i), p0, col) (segments up a leaning spine, returns tip {p,q}), brim(), scatter() for spots/stars/patches; old hats reuse their code with HA/HB colours. Slots now: tone hair haircol outfit legs boots gloves hat face neck shoulder waist back hatcol hatpat hattip nose blush beard stache. SHAPES: arms legs weight (stat) head hatH hatF brim nose beardL beardW (each has a page). Legs base 0.64, arms 0.88. Sheets: /tmp/s_g1.js, /tmp/s_g2.js via cc.py.
- FITTED PARTS (dressGun in guns.js) rewritten: ray probes top/bot/side/front on the built gun (gun.updateWorldMatrix(true,true) first: the gun's parent is scaled 0.31), ring(x) = section round the bore, collar/stud/flank/mount helpers, mag pieces in MagRoot's frame, pieces attach() to the group of the mesh they sit on, top pieces go in adsHide on SightExact guns. Contact test: set window.__dressCheck=[] before a build, failures are pushed as 'Gun:tag'. Tests: /tmp/s_chk.js (55 guns x 18 parts x1/x4 via cc.py), /tmp/s_chk2.js (all parts x1/x3/x6 + sheets via cc3.py), dg.json (live first person, fire/aim/reload). window.__gunSheet([{def,cores,yaw,pitch}]).
- 2026-11-25: BENCH PARTS NO LONGER CHANGE THE GUN MODEL (dressGun call removed from viewmodel build; dressGun still exported). Evolution carries the visuals: tier IV added (TIER_PAL[4] white-gold/pearl/teal, TIER_GLOW[4] cyan; setWeapon/displayModel use Math.min(4, tier)); all 25 oddities have tier I-III cases in guns.js vault tier switch. __floatScan clean tiers 0-4. Sheet: /tmp/s_ev.js.
- Reward-claim glitch fixed: craft.js had its own @keyframes cpop (scale 16 fade) overriding index.html's claim popup cpop. Renamed benchpop / claimpop.
- GNOME FACE REWORK: character.js sweep(p, c, pts, rads, {ref, cap}) = smooth swept oval-section body (cached in geo by key). Noses = sweep + nostril wings + nostrils (nose sits lower with bigger nose slider; NC rosier than skin so it reads in toon shading). Beards = mass(K) knots [y,z,halfW,halfD] + lock() strands + sideburns flat on face; curly = puffs + CURL coils; braid = leaning lobes; bz(y) straightens beards below a poncho; cap(L,k) keeps long beards off the ground. Moustache sweeps (pale hair: beard shaded down, moustache bright). Hair: tufts/braids(plait helper, over the chest)/pigtails/long/pony rebuilt. Test hooks: window.__buildChar, window.__faceSheet([{label,look,yaw,dist,dy,up}]) frames heads like the NOSE AND BEARD page. Sheets: /tmp/s_nb.js, /tmp/s_nb2.js, /tmp/s_hr.js, /tmp/s_hr2.js, /tmp/s_bo.js, /tmp/s_cu.js (cc3.py).
- 2026-11-25 (2): BEARDS/HAIR AS SHELLS. character.js shell(p, c, key, nu, nv, F(u,v)->[x,y,z,nx,ny,nz,thick,shade]) builds one closed carved piece (front + shallow back, zero thickness at the edge), vertex-coloured grooves via matV (render.js toon shader now multiplies vertex colour when USE_COLOR). headPt(th, y, lift) = point on the head egg. Beard styles = table ST0 {L, W width profile, T thickness profile, N locks, hem(u), A groove depth, S hem scallop, curly}; top edge under the nose rising to the brim at the ears (top(u)), blends from the face to a curtain on the chest (wraps back 17u^2). Moustache z pushed in front of the beard via frontZ() over the shell's front points. Hair = skirt() under the brim (y 20.6) from behind one ear round the back; nape(side, mid) lengths; long hair hangs (hang=true). Braids/pigtails start behind the ears. Nose wings/nostrils and potato lump removed; button nose spine fixed. __faceSheet takes noArms (doesn't hide raised preview arms). Sheets: /tmp/s_bc.js /tmp/s_pf.js /tmp/s_ns.js /tmp/s_hr3.js /tmp/s_fin.js /tmp/s_hats.js.
- 2026-11-25 (3): SOFT HATS. character.js clothTube(p, key, spine, radAt, colAt, edges) = smooth parallel-transport swept cloth (vertex colours, crisp colour edges via doubled rings, soft creases inside bends, closed tip); returns {p tip, surf(s, dir)->{p,n}} for things sewn on (n includes the taper). clothRing(p, key, profile[[r,y]], closed, colAt, mod) = lathe with vertex colours/waves/ribs (brims, knit cuffs, beanie). Hat cone() keeps its old (h, n, r0, r1, bend, p0, col) signature and builds via clothTube; band pattern painted + buckle via surf. Gnome hat spike flaps removed; brim = felt roll with wavy edge; wizard brim droops/waves; stocking = knit cuff + tip flop capped so it never loops over the face; beanie = ribbed crown + folded cuff. NOTE: toon shader transforms normals by modelMatrix, so non-uniformly squashed spheres shade like beads - use real flat geometry (cyl discs) for flat decals. Sheets /tmp/s_sh.js /tmp/s_sh2.js /tmp/s_sh3.js /tmp/s_allh.js.
- 2026-11-25 (4): CLOTHING. character.js: TPROF torso profile + torsoAt(ph, y, lift) (superellipse SUP 2.6, numeric normal), torsoPh(x, y); cprof() cubic profile; wrapSurf(p, key, ys, S, pt, colAt) round surfaces with vertex colours; rowsOf(a,b,step,edges) doubles rows at colour edges. Inside buildCharacter: torso(top, colAt, edges), panel(key,c,y0,y1,xr(y),th,back,lift), strip(key,c,path,w,th,back,lift), wrapPanel(key,c,y0,y1,xo(y),th,colFn) (coat/vest wrapped round from a front opening), pin()/disc() for flat things, lapels/pocket/placket/collar. Things laid on a coat/vest use lift ~1.5. Coats/vests stop at y 10.6 (above the belt; tails hang from y 9 under it). Poncho = wrapSurf with folds + diamonds + fringe; coat tails = two shells split up the back. Sleeves = clothTube (open end, elbow fold mod, bands). Neckwear rebuilt on the torso (neckBand, hang strips, onShirt lift). Cape = cloth shell on R.cape pivot. shell(c=null) takes per-vertex hex in f[7]. Build cost 12-150 ms uncached, ~1 ms cached. Sheets /tmp/s_oc.js /tmp/s_out.js /tmp/s_ow.js /tmp/s_nk.js /tmp/s_bk.js /tmp/s_cape.js /tmp/s_fin2.js.
- 2026-11-25 (5): TROUSERS + BOOTS + SHADER. Trouser legs = clothTube in `up` (open end; tucked vs hem profiles; knee fold mod; hem band), legAt/legPanel/legDisc lay seams, stripes, knee patch, studs, chaps (+fringe) on the leg. Boots: shaft() = clothTube sized by needR() to contain the trouser at every height (tall boots min(23, 0.6*legLen), spur min(18, 0.52*legLen)); vamp() = sweepAB foot (ankle->heel->instep->toe, floor-clamped, toe cap colour, pointed for spur); sole() = sweepAB oval following the foot outline; sneaker rim line likewise. Mushroom cap = clothRing lathe with flat disc spots. render.js toon vertex shader now uses normalMatrix (view space) turned back to world for non-instanced meshes, so non-uniformly scaled primitives shade correctly everywhere. Sheets /tmp/s_leg.js /tmp/s_boot.js /tmp/s_mu.js.
- 2026-11-25 (6): HANDS + SHOULDERS. Hands = sweepAB palm + 4 curled fingers + thumb (loose fist, palm facing in, IN = -s); boxing = sweepAB mitt + thumb lobe + laces; glove cuff = clothTube flaring over the sleeve cuff; gauntlet (long) = clothTube up the forearm; wraps = elliptical bands on wrist and knuckles. Shoulder caps (patch, spikes, pauldron, fur) = clothRing hugging the shoulder ball (capP/capAt/RX/RY, group capG tilted -s*0.5 outward), rim tori; epaulette board in the capG group, fringe in arm space via g.matrix; crow/parrot = sweepAB body, wings, tail, beak + head ball, eyes, feet; lantern = base/post/frame/glass/cap/bail; roll = cylinder + spiral end tori + straps. __faceSheet accepts dx. Sheets /tmp/s_hand.js /tmp/s_bird.js /tmp/s_gh.js.
- 2026-11-25 (7): SCULPTED GUN FURNITURE. guns.js module helpers: sweepSide(c(t)->[x,z], sec(t,a)->[halfAcross, halfInPlane], n superellipse, M, S, t0, t1) (flat ends), sweepPath(pts3D, r(t), S, M, flat(t)) (round ends, optional flattened section), sculptGeo(key, build) (gun->view coords, wound out, cached, geometry.userData.sculpt = key), cprofG. In buildGunWith: sculpt(key, build, col, glow) via vm.Mesh(parent, geo, col, glow, pos) (new ViewModel method). grip(): sculpted, flat sides at the old width (panels sit on them), palm swell at the back, 3 finger grooves at the front, tucks in where it enters the frame, darker butt cap. stock(): sculpted, flat sides at full width (n 3.4), wrist eases to 0.88, spacer + rubber pad cut to the butt, pad screws, swivel, collar; sets lastStock.plate(col, th) for a butt plate cut to the outline (Quarter Horse brass). hose() = one smooth sweepPath. Boomerang (Come-Back Kid mag) = flattened sweepPath with painted tips; Lariat coil = helix hose; Bullwhip handle = round plaited sweepSide + ferrule. Gun shader now uses normalMatrix too. Tests: window.__sculptGapScan(def, tier) (things set against sculpted stock/grip that float off or sink into its real surface; skips parts touching other parts; Sidewinders twin confuses it), /tmp/s_gap.js, /tmp/s_gt.js /tmp/s_gt2.js (rear: zoom option in __gunSheet), /tmp/s_org.js. Known pre-existing: Copperhead mag window inside grip, Quarter Horse saddle ring.
- 2026-11-25 (8): CUSTOM FURNITURE. viewmodel Ext options round (bevelSegments 4: edges rounded over) and soft (softCorners(pts, r): outline corners rounded by up to r). Applied (round: true, soft: 1.2) to the non-metal custom stocks: Gold Rush, Stampede, Widowmaker, Dynamite Dan, Frostbite Beam, Buzzsaw, Thunderhead, Black Cat, Jack-in-the-Box, Wrecking Ball, Lariat, Loaded Dice, Hocus Pocus; fore grips: Copperhead, Back-Alley, High Striker, Tilt flipper; tier cheek pieces Stampede/Long Rider (soft 0.6). Steel stocks (Railroad Spike, Hellfire Hose, Gusher), magazines and machined parts stay crisp. Sheet /tmp/s_cs.js.
- 2026-11-25 (9): GUN COLOUR GRADE. viewmodel gunGrade(color, glow): applied in Part/Ext/Mesh only while this.grading (set around buildGun in build), so hands/skin/melee untouched; glowing parts skipped. Saturation compressed above 0.24 (x0.42), bright pastels deepened, magentas lean rose, 7% warm grime. Gold (metal>=0.6, hue .07-.17) keeps more saturation, hue warmed toward .118, no grime. Tier trim gold tagged metal 1. PAL steel less blue, brass aged, red deeper. Tier III accent lerp to white 0.1 (was .25), tier IV accent lerp to teal 0x2a7480 0.3 (was cyan .35). Sheets /tmp/s_all.js, /tmp/s_tg.js.
- 2026-11-25 (10): DESCENT SCULPTED PROPS. world.js: shapeId(key, build) registers a cached sculpted geometry (built in UE coords, vertex colours) as a new GEOS entry; world.Shape(key, build, center, rot, color, scale) instances it (no collision: props add their own hit/Solid). Shapes render double-sided with vertex colours. render.js toon: instanced normals divided by scale^2 (stretched instances shade true, all maps), and normals flipped on back faces. src/propkit.js: Geo with surf/fan/tube/lathe (runs of one colour smooth, colour change = crisp edge)/blob (superellipsoid + warp)/place/map. src/descent_shapes.js: banner, rug, barrel, cushion, blanket, awning, hay, deadTree, mushroom, statue, chain, vine, web, curtain, valance, canopy, bunting, webSheet. Used in descent_props (banner, rug, bed, throne cushions, hay, deadTree, statue, mushroom (one shape per kind, scaled), stall awning), kit barrel/chain, dressWall (banner panels, hung cloth, chains, vines (2 lengths stretched), corner barrels), Big Top (canopy + bunting, hang none), Opera House (curtains with tie-backs, swag valance), Webbed Den (webSheet). Test hooks: window.__shapeSpots(prefix), window.__worldSheet([{chunk, at, look, fov, label}]). cc4.py <tag> <js> <query> (cc3 with a URL query), cc5.py/shot_old.py run against /tmp/oldsite (previous build). Perf: avg draws/room 7 -> 12 (worst 36), avg tris 90k -> 117k. d11.json is stale (chest index) on old build too; /tmp/dall.json visits all 42 arenas.
- 2026-11-25 (11): SCOPE FIX: commit 37830c5 had dropped `if (this.adsHide) this.adsHide.visible = this.aimA < 0.8;` from ViewModel.tick, so every scope's tube/caps filled the eyepiece while aiming (27 of 37 optic gun/tier combos blocked; snipers use the full-screen scope so were fine). Restored after tickFlyers. Test: /tmp/scopeaudit.json casts a 5x5 cone of rays from vm.camera while aimed for every optic gun x tier; expect 0/25 everywhere. DRAGON'S BREATH: tier II wings removed (user disliked the side flames), replaced by a brass pilot-light feed under the barrel with two clamps and a blue glow tip. DESCENT SOLIDS: world.recordProps (set per room in map_descent) records draw + collision bounds; world.solidify(ch) after dress() adds a nav-blocking Solid for every non-shape, non-glow, non-ring piece with footprint >=40, height >=40 in the body slab (floor+20..floor+170), bottom within 150 of the floor below it, fill >=0.45 (skips slanted beams), and <60% already inside collision. ~2000 bodies over 42 rooms; stations (spawn/bench/chest/box/exit) checked clear; records freed per room. Small mushrooms (h<260) get a full cap-sized body. world.solidified lists them; world.roomNames[i]. ?scan=1 keeps the records. /tmp/s_solv.js draws them as red boxes.
- 2026-11-25 (12): DESCENT-FIRST PROGRESSION. Lobby defaults to the Descent (Meta.map() returns -1 until a map is picked after this change: S.mapPick2). RANKS (meta.js) rewritten: 31 ranks; rewards = 25 oddities (commonest first) + machines {compressor r2, showcase r5, recycler r9, fortune r13, fusion r17} + 3 skins; STARTERS all open; challenges no longer lock guns. Meta.machineOn(id)/machineRank(id). deeds.js now MACHINES/machine() (old deeds bless/roll2/eye/recycle/reroll/banish/keep removed incl. keepsake UI). cores.js: Pressed X (x1.5, counts ceil, noDrop) + 6 FUSIONS (fx 'Fuse', U.fuse 'a+b', Epic, noDrop) with BLADE entries; player.fuseProc/tickFuseZones (steam, cloud zones in P.fzones), boilT/shatterT death hooks. player: compress, scrapOf/makeCost/scrapPart/makePart (scrap 1/2/4/8, cost 4/8/16/32), fortuneReroll/fortuneTrade (P.fortuneUsed reset per room in descent.open). Compressor station (interact type 'Compressor', craft mode 'press') every 3rd room beside the bench. Showcase: box.prize2 + B.pick by gaze. Sig affinities halved at load (signatures.js). Wall guns removed (World.WallBuy no-op; Descent no longer places them). Ammo box: P.ammoReady 90s. Gunslinger cd 40. Sniper starts + Widowmaker; Brawler katana. ENGINEER: ShoulderTurret (turret.js; TURRET_TYPES sentry/scatter/tesla/flamer; turretStats from P.turretCores), cls cd 30, 10s out; craft TURRET tab (onTurret) with type picker (.tt). dg.json now needs &map=0 (dg0.json). /tmp/mach.json, /tmp/mach2.json, /tmp/tur.json test machines/bench/turret.
- 2026-11-25 (13): 38 UNLOCKABLE PARTS (cores.js, after Whetstone / before passives; icons in a K map before the pressed-symbol loop). Stats appended to STATS in data.js (StatusTime..Lantern). Locked via RANKS[].parts -> lockedUps; rollCore/rollCoreAt/rollPassive/makePart/recycler list skip Meta.upgradeLocked. Batches of 5 at ranks 3,6,8,11,14,18 and 4 at 22,26 (Ranch Hand, Trailblazer, Regulator, Outrider, Desperado, Gravewalker, Gravedigger, Deep Walker). Hooks in player.js: ridersOnHit (from dealDamage after takeHit), tetherShare (dealDamage + enemy DoT), ridersOnKill (after buildKill), Catalyst in creditKill, Bank Shot in fireHitscan wall branch (C.banked guard), BlastStun in explodeAt, Undertow = wells entry with dmg 0, Heat Sink heatSink() 0.25s throttle, Conductor in Chain case (+1 jump, carries burn/bleed, sets shockT), Quick Swap swapGuardT/swapBoost (proc chance x2 for 3s), onDashBuffs (Kinetic, Ember Dash gzones, Smoke/Decoy -> P.lure read by net.targetOf), afterHurt (Backlash, Last Stand), body-buff reductions in receiveDamage, Grounding Rod cap, staticLanding (slAir flag / wrEnd), tickBodyBuffs (Frost Wake, Holster Loader Q.holT, Bloodbank, Heat Shield, Lantern, tether arcs), onRoomClear (Quartermaster; called from descent.clear and the net path). maxSlots is now a getter: slotBase + ExtraSlot (weapons array has 4). Enemy statusK() for Lingering. Test: /tmp/buffs.json.
- 2026-11-25 (14): UI POLISH. index.html ends with a "polish layer" CSS block (:root tokens --panel/--gold/--line/--edge/--scrim; menu windows solid + box-shadow 100vmax scrim; button hover/active/focus-visible; settings two-column .pcols/.psec; progress .tg reward tags + .pc.next; title .tfoot rank line from progBadge()). Settings: SET_GROUPS + fmtSet in main.js (%, degrees). Progress rw() uses rewardTags(), no "Locked" label. Lobby lists The Descent first. craft.js: short header hints with <kbd>, quieter panels (accent bar instead of loud outline) for recycler/press, evolve heading on one line. hud.js: bottom vitals/weapon y = H-92*S (was 64, labels clipped), pip/evolve labels bigger, minFs 13, room banner/tips/toasts/"nothing can touch you" hidden while a menu/craft/pause is open (busy flag; banner is ended), toasts wrap in a 27%W column, inventory empty-state moved below the suit row, Descent death card shows ROOM and PARTS instead of PURSE. Screenshot tour: dmh-test/tour.py <prefix> [W H] -> out/tour/.
- 2026-11-25 (15): BOSSES. descent.js BOSS_HP = [2.3,2.5,2.7,2.9] by tier (was flat 1.4), +60% per extra co-op player (was +0.5 flat), twin gets 0.72 of it. bossx.js: hitX no longer returns 0 during phaseT; phaseT 2.4 -> 1.4 (a roar you can shoot through); each act: scale x1.07, speed x1.08, hitstop 0.3, explosion, sets hud.bossAct (replaces the act banner). enemies.js takeHit: ward multiplies by 0.3 instead of returning 0 (Titan, Leviathan). hud.js drawBoss rewritten: 980*S bar with plate, chip trail (bossTrail drains 0.45/s after 0.5s without hits), ACT n + act name, name only (no title). drawBossCards: bossIntro (auto when game.boss changes; letterbox, BOSS / name / title / desc, 4.2s), bossAct (2.6s), bossDown (4s, set in game.js on the last piece's death with hitstop 0.8 + 5 explosions). Cards cancel each other and the room banner. Burst gate (10% max HP per second, then 30%) unchanged. Test: /tmp/boss.json.
- 2026-11-25 (16): REWARDS + SHAKE. meta.js: CLASS_META rewards = renown 500/1500/4000; ACHIEVEMENTS lose upgrades/skin, gain renown (blades kept: Katana, Shovel); RANKS lose skin; map 'h:' milestone pays renown 500 (heirlooms retired: lobby HEIRLOOM row and run-start handover removed). Renown paid on claim via payClaim(). Meta.skin() now derives first-person hand colours from look (gloves a/b, else skin tone; sleeve/stripe from outfit). Hands tab removed (SKINS kept only as data). data.js CUT += Twin Mount, Remote Detonator. player.js chestOffers skips moneyOnly() buffs in the Descent. Shake: addShake merges asks within one step (game.stepN) at the max, diminishing toward CAP 1.2 (was 1.6, additive); decay uses game.rawDt (unscaled by hit-stop) and is faster when high; camKickVel clamped ±70; fovKick capped 8; game.step cuts chained small hit-stops after 0.3 s (hsRun). Tests: /tmp/shake2.json (stress), /tmp/prog.json.

## (17) Class sets, Descent challenges, attack motions, room plans
- Class rewards are 3-piece cosmetic sets (gunslinger gambler/duster/quickdraw; brawler flatcap/knuckles/singlet; engineer welder/apron/toolpack; sniper boonie/ghillie/spyglass; bomber blasthood/quilted/keg) + renown. Claims set stat `claim:<key>`; cosmetics unlock on those stats.
- Challenges regrouped: Combat / The Descent / The Workshop / Survival. New parts as challenge rewards: Grapeshot, Echo Chamber, Death Mark, Hollow Charge, Pinning Bolt, Static Build (logic in player.ridersOnHit).
- viewmodel ATK table (lash/smash/throw/flick) via FEEL_GUN.atk; Bullwhip thong is a live tube (whipThong) that unrolls from vm.whipPts and snaps back.
- Wall run: holding jump keeps the run while looking anywhere. Tab shows a kills/damage leaderboard (net presence sends kl/dm). Title has CHARACTER; lobby draws a 3D lineup (#lbline) from lookStr.
- Descent rooms: roomPlan(i) picks one of 10 plans (cross, octagon, hourglass, ell, ell2, ring, serpent, tee, hex, diamond); walls are built first, full height, and world.carve drops any later prop/solid/lamp that would stand in them. Doorways and the bench end (|x| < E) stay open. Tests: /tmp/shp.json (+/tmp/shpdraw.py), /tmp/spots.json.
- world.solidify also bodies hung props (lanterns, beams; nav off) so they can be grappled.

## (18) Barn Door, turret model, portals, square-lid audit
- Barn Door: the door is vm.DoorRoot (guns.js), a notched board door; viewmodel swings it from the hip (21,-10,3, turned out 0.5) to in front at (35,0,0) a quarter turn round, dipping 18 under the barrels mid-swing so they drop into the notch. Tier dressing builds into DoorRoot.
- Turret: turret.js turretBody()/dressTurret()/turretModel() shared by the shoulder turret and the workbench (craft.js shows it at x2.4). The old barrels were flat discs (cylinder scaled on the wrong axis).
- Square on barrels: the Distillery wash tubs had a full-bright box (meshId 0) as liquid, wider than the round tub. Now round discs. Audit: world.js logs every piece in ?scan=1 (scanAll); /tmp/sq*.json finds flat boxes on round tops. Only other hit: wharf relic cap (now an Oct). Frost turntable deck overhang is intended.
- Portals: portal.js (arch, whirl shader, floor runes, motes, open-out). Stands PORTAL_Y in front of the room's doorway; pillars and crown are solid (I.solids, cleared in wipe).

## (19) Thimblewick: the village lobby
- PLAY puts you in Thimblewick, a playable village built as chunk VILLAGE_IDX (= N_ROOMS+2) of the Descent map (map_village.js, shapes in village_shapes.js). Runtime: village.js (Village: enter/leave/tick, NPCs via buildCharacter, Quest interactables that call game.onVillage(kind)). Palette zone 'village' in maps.js; env.noSky off in the village. game.step strips combat input while village.on; Descent.tick idles in phase 'Village'.
- Windows: village_ui.js (#vpanel, scoped CSS) for shop / board / slots / roulette / blackjack / dice; the Way Down reuses #lobby (renderLobby: contract fixes mode/diff/muts, starting gun = owned guns); the wardrobe is #locker showing owned items only.
- Economy (meta.js): S.gold (start 300), S.owned {guns, cos}. Gold per room 12 / round 8 / boss 40 / final 150 / win 250, x[1,1.5,2] by difficulty. Gun prices by rarity; cosmetics: BODY_SLOTS free, STARTER_COS free, need-gated earned free, rest priced. Contracts: boardFor(dayKey) six a day; runWon() pays once (idempotent per run).
- Casino edges: slots RTP 96.96% (REEL weights 7/6/5/4/3/2/1, PAY3/PAY2), roulette single zero, dice 0.98/p, blackjack 3:2, S17, no split.
- Descent: no Mystery Box; The Showcase machine now = half the time the room chest is a grade better. restartRun() goes home to the village (keeps the party); restartRun('title') quits. Net presence 'run' flag drives hostStarted(); onState ignored while in the village.
- /tmp/mach.json's box step is obsolete (no box in the Descent).

## (20) Cosier Thimblewick
- Village type: Fraunces (700/900/600i) + Nunito (700/800), OFL, embedded in index.html. Used by #vpanel, #lobby, #locker and the HUD while in the village (hud.vfont swaps F_BIG/F_TXT in text()). The run HUD and title keep Big Shoulders/Barlow.
- Painted signs: village_signs.js (canvas boards: 'wood', 'marquee' with chasing bulbs, 'stone'); map pushes VSPOTS.signs, village.js hangs them after document.fonts load. VSPOTS.signs/smoke are reset at the start of buildVillage.
- Way Down knoll: boulders sit wholly behind the arch (front > 60 behind the pillars) or wholly beside it (|x| > 340 + 1.2r); the slab behind is now an invisible Solid.
- Golden hour palette; every cottage window lit; chimney smoke; fairy lights; campfire (VSPOTS.fire) with fx; lantern stakes; toadstool clusters; ~900 grass tufts.

## (21) Live casino, the Hollow King raid, room quality, cozy village
- Casino: games play on the tables in the world (casino_world.js CasinoRigs); the window is a bet bar docked at the bottom.
  Each play is told to the party through presence `cz` {k, s, ...}; peers replay it on the same table with a name label.
- Final boss (room 20, arena N_ROOMS+1 "The Bottom", now reserved for it; rooms 5/10/15 use arena N_ROOMS): raid.js.
  Loop: rise -> gather (Bearers (elite Wraiths) climb up; each drops a cinder; carry it onto an unlit pyre plate) -> 3 lit
  -> kneel -> 22s damage phase (heart exposed at the rim) -> purge shockwave (jump it), pyres out -> repeat. Under 12% HP:
  30s final stand. Enrage clock 8:00 for the whole fight. Wipe = lethal markers over the island.
  Heart = boss entry "The Hollow King" (raid: true, map 99) driven by raidHeart (fixed to the King's chest), immune via
  raidImmune. Arms animate from SLAM markers in g.hazards (so guests match), beam from BEAM markers. Raid state rides
  Descent.state()[9]. Off the island: the deep throws you back (25% HP). Abyss is nav-blocked row by row.
  Hands only slam where they can reach (reach ~6600); further off, the King's gaze drops bolts instead.
- Rooms: bookcase/pew/table/bench/car/guardian sculpted shapes (descent_shapes.js); floors are near-tone laid stone; inner
  walls get plinths, coursing, pilasters with lamps.
- Village: earthier ground, dusk palette, ferns, mossy logs, overgrown verges, lamp pools along the road.
- HUD measures text in the village fonts; menus clamp/ellipsis long labels. /tmp/flow.json is obsolete (old one-step gate).
- (21b) The Hollow King is sculpted: tools/sculpt_king.mjs (SDF smooth unions -> surface nets, baked AO in vertex colours)
  writes public/king.json (torso, head, upper, fore, hand). raid.js fetches it and swaps it in (old primitive King is the
  fallback while it loads). IK targets are now where the fingertips land; the wrist rides 1250 up and 900 back.
  Rebuild the sculpt after editing it: node tools/sculpt_king.mjs (about 40s).
- (22) Cowboy/white hat: one clothRing felt surface (brim curl, crown crease, front pinches). Villagers: animateCharacter
  opts.rest (arms at the sides, gun hidden). Mushroom doors sit on stemR's skin (the stem used to poke through the top).
  Bullwhip lash: kinematic, not physics (vm.whipThong): raise back (thong trails along BACK), stroke at 0.29, a U loop rolls
  out to the tip by 0.405 (the crack), hangs, sags, back into the coil by 0.66; ATK.lash pose matches those times; the thongTip ball is hidden between lashes (it used to
  float under the whip). Circus: SH.beastWagon replaces box cage + slab.
- Old Ironhide: sculpted at run time by src/ironhide.js (src/sdf.js = the runtime SDF kit, same as tools/sculpt_king.mjs);
  Body3D uses it when creature === 'Ironhide' (this.custom). New mechanic ('front'): 4 plates; armoured takes 20-100% by
  plates left; a missed charge winds it 4s; damage while winded cracks a plate per 6% max HP.
- Light show: removed at the user's request (lightshow.js deleted, settings sliders gone).
- (23) Wardrobe: each piece has a picture (main.js cosThumbs: your gnome wearing it, framed by COS_FRAME, drawn a few a
  frame, cached per piece + Meta.lookStr()); colour-only slots keep swatches.
  Village flicker: paths are one ribbon Shape each (were overlapping coplanar discs); ground patches 0.55 apart in height;
  the extra window Glows laid on the houses' own lit glass removed; the floating door-lamp dot removed; the door step is stone.
  Slots: a WILD (1 stop in 57) completes any three of a kind (three wilds x1400); pays re-tuned, RTP 96.7% (exact).
- (24) Shop cosmetics show the same pictures (H.cosThumbs(el), H.cosPic(slot)). Village collision: every meadow rock,
  bushes 90+, pond stones, hay by the fire and the gate bushes have bodies; a Blocker the width of the village sits just
  behind the Way Down (y = GATE + 260), so nobody walks past the portal.
- (25) Crawler models: the crawler arm override (pitch -95..-150, root +8) bent the arms of every Crawler/Burrower
  without legs up and over the body (Contortionist, Gutter/Pale/Rime Crawler, Burrower, Crab, Jack). Their art already has
  the arms down on the ground as legs, so now they paw in a short stride and rise only into the strike. Matches the flat art.
  King Ooze: split pieces carry splitRoot + introDone (no new entrance card, net.js too); one bar for the whole King
  (root + 2 halves + 4 quarters, estimated from hpMul, never climbs back); every piece is noLoot except the last one alive,
  which drops the boss buffs once (game.enemyKilled `rest`). Widowmaker First Blood: a headshot kill returns the round but
  no longer works the bolt instantly. Scrapyard rebuilt: plan 'octagon' (rooms can name their plan: wall.plan), bales of
  crushed cars (SH.crushedCar) 3-7 high making lanes, crusher on a pad, lattice crane with a wreck on the magnet,
  SH.scrapHeap / SH.tyreStack cover, corrugated sheeting on the end walls, sodium floodlights. The old room's crusher sat
  inside the 'ring' plan's central wall block, which is why the room read as flat walls.
- (26) THE BLIGHT (stage 1-2). Enemies are sculpted, not raised from 2D art.
  tools/blight/kit.mjs: SDF kit with 6-number paint [r,g,b, cap,flesh,glow] (strain channels), surface nets, smoothing +
  projection, AO kept apart, box-capping. tools/blight/decimate.mjs: QEM half-edge collapse; glow/paint borders (>70/255)
  never collapse; no slivers/flips. tools/blight/creatures.mjs: the creatures (parts on pivots, roles as Body3D's).
  node tools/sculpt_blight.mjs [names] -> public/blight.json (deflate-raw + base64; ~3.7 MB for 15 creatures).
  src/blight.js: STRAINS (Toadstool, Rustcap, Mirecap, Nightshade, Char), loader (adds synthetic PARTS with
  sculpted:true, rz), instanced strain material (iCap/iFlesh/iGlow per instance). body3d.js: kindFor branch, setStrain,
  P.rz, fling()/flyTick() for knocked-off sculpted parts. Roster (content.json `model`; `art` kept as the lookup key):
  Walker Rotcap, Runner Sporeling, Crawler Creeper, Bloater Puffball, Spitter Inkcap, Leaper BlightRat, Flyer Drifter,
  Brute Bracketback, Screamer Shrieker, Burrower Rootworm, Gilded GoldenTruffle, Shield Shelfshield, Priest Sporecaller,
  Totems SporePod / GraspingMycel. game.strainNow(): Descent every 4 rooms; survival per map. fx.withSap(): spores and
  sap instead of blood for Blight hits. Review sheets: dmh-test/rev.py NAME strain scale tag height -> /tmp/rev_tag.jpg.
  Bosses are still the old 2D-art bodies (stage 3).
- (27) Blight bosses (stage 3). Every Descent boss has a sculpted body (content bosses[].model, B_* in creatures.mjs):
  Brood Mother, Old Barkhide (Ironhide rig re-skinned: bracket plates, green slit, mushrooms), Drift Queen, King Puffcap,
  Lamplighter (angler), Carapace, Great Rootworm, Thunderhead, Ash and Ember (hound), Furnace, Hydra, Mirror Queen,
  Unblinking, Reaper (mantis), Grandfather Toad, Rotwing, Stump Titan, Leviathan, Devourer, Nameless. Survival bosses
  borrow the nearest Descent boss body (names unchanged). Bosses ship one file each (public/bl_<name>.json), fetched in
  the background at start; a boss spawned before its file arrives stands in its old painted body and swaps
  (Enemy.bodyPending / makeBody()). Baker: vertices renumbered by first use, positions as deltas, indices as distance
  from the next new vertex, normals octahedral (z:3); budgets x0.8 (BS env). blight.json 2.5 MB + bosses ~5 MB.
- (28) Mother Mold, sectors, nothing floating.
  Raid: the King is the Mother Mold (king.json rebaked, fungal palette, warted cap); raid.js green (cracks, eyes, heart,
  mist, abyss), "THE MOTHER KNEELS". Raid room has its own theme ROOT_THEME ('The Root', map_descent THEMES, pushed after
  EXTRA; maps.js lighting uses it) and dressing (bracket fungus clutches on the walls, mycelium from the roof, mold and
  toadstools on the floor, great caps in the corners). craftRaid re-themed: mossy stone, mold creeping over the island
  edge, caps on the old ruins, six great toadstools out of the dark, spore sacs on mycelium stalks; green lights.
  src/sector.js (stage 5): every non-raid room gets its strain's mold (patches, glow specks, clusters of toadstools in
  the strain's colours) built locally from the room number (same for every client), plus one hazard per strain:
  Toadstool puffball beds (burst when a player is within 300), Rustcap rust fall (markers at each player's lead every
  ~7.5 s), Mirecap mire pools (local slow 0.4 while standing in them), Nightshade blooms (warning marker then a 5 s
  cloud by each player), Char smoulder (the two charred patches nearest a player flare). Host lays markers/fires (sent
  as usual); boss rooms are dressed but quiet. A toast names the sector on its first room. Hazards: a marker with
  damage 0 is a warning only (no blast, no hurt); fire carries its colour to clients.
  FLOATING AUDIT: ?scan=1&stack=1 records every placed piece with its call site (world.scanAll[5]); dmh-test/fl/
  (scan.js = union of touching pieces, a group is held up if any piece stands on the ground; run.py MAP groups the
  loose ones by source line; look.py/views.py photograph them; shot_fl.py serves /tmp/fldist, an unminified build).
  All 7 maps now 0 loose (mine's lit sign and hanging rope judged fine by eye). World.group(fn): a thing of many
  pieces is kept or carved away whole (carving by plan walls used to leave ribs, doors, rails standing alone); P.*
  props (not pool/fence), kit crate/barrel/candle/skull/chain/lowWall/plat/platOct, and Q.group() (returns whether it
  was built) use it. Chains get one extra link so they always reach what hangs from them. Many single fixes: lamp
  rods reach the roof, door strips sit on the lintel, Null Chamber slabs rest on the floor and its crystals hang on
  chains, bone heaps on the floor, carnival string lights have wires, bayou reeds/moss/wisps grounded or hung, etc.
- (29) Creature second opinion. A separate reviewer rendered all 34 Blight models from every angle (sheets in
  /home/claude/review: rev_*.jpg, x_*.jpg extra angles, z_* crops; rex.py = ground-level/top/stride/wind-up angles).
  Fixed: capDome no longer leaves a lens of cap below its hollow (Rotcap, Brood Mother: "loose plate"); every
  sprout's stalk starts max(10, 2*cr) below its base (none stand off a curve); shelf() buries its back half (0.45R)
  and Bracketback's top shelves moved down onto the shoulders; Hound's spine caps follow the back; Brood Mother's
  sac caps sit on the sac; angler tail grows from a fleshy stock; Devourer lips grow from a collar, eyes moved onto
  it; mantis hips run up into the body (one pivot carries two legs); Sporeling pore on the head; Sporecaller's censer
  hangs on a knotted cord (chain links were below bake size); Thunderhead/Drift Queen strands no thinner than the
  bake holds (tails h 1.1); Rootworm mound and Grasping Mycel mat continue under the floor; Mycel has a knot where
  its two braids meet; bigger budgets for the robes, truffle and worm; Nameless hood has folds, an opening and a
  stronger slit; Rotwing wings scalloped and painted along the fingers; Carapace head bigger and out from the shell;
  Inkcap eyes bigger. Runtime: capped creatures (Rotcap, Inkcap, Brood Mother, Sporeling, Puffball, Shelfshield)
  raise their arms out to the side on the wind-up, not up through the cap; the Furnace is always Char.
  Not done (design): bosses that share bodies (Hound x7, Mirror Queen x6, King Puff x5 in content), sphere-with-
  tentacles bosses, bark creatures showing little strain colour, Mirror Queen cap top, Shrieker throat from below.
  Gotcha: a trailing // comment added by a replace swallowed the rest of the line twice (mantis legs, moss, wires).
- (30) The Hosts: 15 new boss bodies for the survival maps (creatures.mjs "THE HOSTS", B_Foreman, B_Abomination,
  B_Founder, B_ShiftBoss, B_Baron, B_Deacon, B_Ferryman, B_Mourn, B_Cannonball, B_Twins, B_Grin, B_Ringmaster,
  B_Harbourmaster, B_Hangman, B_Graves): the town's people the Blight took, dressed as they were (hats become caps of
  the strain). hostRig(o) builds the 6-part biped (boxes padded 12 all round); helpers garment() (hanging coats/
  dresses/cloaks), fitted() (close cloth = the trunk's own ellipsoids let out; trunk() records them), hat(), hostFace(),
  hand() (with grip), sleeveArm(), strand(). Process: shape language per host, silhouette test (review/sil.py: render
  with and without the creature, diff to a black mask; /tmp/silhouettes.png) before detail. content bosses: those 15
  survival bosses use their own host; White Widow -> B_DriftQueen, Old Scratch -> B_Titan, Madame Zora ->
  B_Unblinking, Net-Mender -> B_BroodMother; no body now serves more than two bosses. Rotcap: body stalk shortened to
  118 (it rose over the mouth). Boss files ~10 MB total, fetched in the background.
- (31) Creature look: blight.js BLIGHT_STYLE (vec4 clean, facet, outline, bands) on the Blight shader; default is "clean"
  (x=1): cap/flesh paint weights snapped to quarters, fixed paint colours posterised to 8 luminance steps (not the
  near-black ones), crevice AO mostly lifted, colour 1.3x saturation and 8% lighter, no rim darkening. ?bstyle=NAME
  (current, clean, faceted, outlined, cel, toon) for comparisons. Outline = an inverted-hull twin InstancedMesh per part
  (K.line, shares instanceMatrix; hidden unless the style asks). Baker env for a low-poly test bake: OUTDIR (write
  elsewhere), LP (budget scale, border 200), SP (paint smoothing passes), HS (coarser grid; heads sqrt(HS)). The
  low-poly look was shown to the user and not chosen: faces painted on bodies smear at that resolution.
- 2026-11-26 (32): CLIPPING, LARIAT, GRADE. Clipping when the camera moved was z-fighting. main.js renderer now `reversedDepthBuffer: true` (float depth reversed; three falls back if EXT_clip_control is missing) and the main camera's near plane is 10 (was 5). Coplanar faces found with dmh-test/zf/scan.js (same-plane, same-facing, different colour, not buried) and separated: Descent border bands 2.3, gravel 1.6, slime tiles 2.0, snow/moss patches stepped, crate bands, altar/plinth caps, void specks, cliff caps (mapzones), cabin doors/windows (mapx, the log rails were flush), carnival awning/counter/stall, frost sign and washing line, village washing line, wharf deck. LARIAT reworked (signatures2.js): one throw catches up to 4 inside a 200 loop where it lands (generous 70 aim), each takes 110 (was 40, single target), dragged toward the middle, slowed 0.5 for 6s; herd shares half as before; mag 5, reload 1.3, range 2600. GRADE: render.js G.grade (air tint 0.14, sat cap 0.62, white knee 0.72) applied to all painted world surfaces and world sprites (not lights), creatures get half the air tint; ?grade=a,s,k,on to compare. Mire room moss and pool glows toned down. zf/rooms.py shoots every Descent room.
- 2026-11-26 (33): FLOATERS, HUD, GUN PALETTE. HUD markers broke with the reversed depth buffer (projected z no longer says "behind"): hud.js projectB() decides behind in camera space and mirrors the point through the eye, as before. world.Hang(top, w, colour, reach) (exposed to map builders as M.Hang): resolved in finish(): a rod up to the underside of whatever is overhead within reach; else an L bracket to the nearest wall at that height (<=170); else a post beside it down to the ground (or the waterline). Lanterns (mapx K.lantern, mine lantern, reach 400), vault chandeliers (three chains), barber pole, belfry bell, crusher rope use it. Also fixed: cell number plates grouped with their rail (carved together), hand truck moved onto the freight platform, carnival freak-show boards on poles, mural frames to the ground, bulb string end post, booth pennants hung from the awning edge, frost fire-tower cab roof on corner posts, cabin door/window 8 thick (closes the 1-unit gap behind). Float scan (fl/run.py) is 0 on all seven maps. NOTE: the scan covers world instances only (not Sector dressing, enemies, pickups); Drifters are flyers by design. Viewmodel: Sawbuck tier barrel extensions, bores and rib now ride on the 'barrels' part (they stayed put when it broke open); Live Wire coil trimmed to the tube; zf/vmscan.js finds body pieces held only by a moving part. GUNS: guns.js C() runs every colour through fitHex(): hue pulled 75% to the nearest family (oxblood 352, rust 18, brass 36, gold 47, mold 86, verdigris 168, gunmetal 212; violet/pink -> plum/oxblood), saturation capped per family, reds kept deep, cool colours dark and grey. TIER_GLOW now gold / amber / ember / Blight green (was pink, pink, cyan).
- 2026-11-26 (34): FORGING. Compressor: Fusion (rank 17) now forges ANY two gun parts; Compressor: Crucible (rank 20, Tunnel Rat, machine 'crucible') adds a third dish. Same pair still presses, two different elements still make their named fusion (Steam Vent etc). Everything is in src/forge.js. A forged part (rarity Legendary, noDrop, made at runtime and appended to DATA.upgrades, one entry per recipe per session, MADE map) keeps its parts at full strength (mods concatenated; Player.recompute puts the parts' proc indices into eff) and adds a resonance read from the dishes in order: WHEN (trigger), WHAT (payload), HOW (twist). Ten aspects (PART_ASPECT covers all 42 gun parts; pressed = its part's, fused = both elements): fire frost blood storm blast edge reach rhythm grip life. Triggers: status-on-target 15% (grip 18%), lightning strike 20%, your blast 35% (cd .8), crit/headshot 25%, shot reaching a 2nd enemy 25%, every 10th hit, kill of a status carrier 50%; cd .5; ProcChance and Quick Swap apply. Resonance level L = dishes sharing the WHAT aspect: x1 / 1.3 / 1.6 ("Pure" at 3). Hooks in player.js: forgeHit (end of dealDamage, non-proc hits), forgeEvent 'kill' (onKill), 'blast' (explodeAt), 'arc' (Chain proc, Static Build, projectile chains, fusion zaps, the storm payload); tickForge in tickProcs; forgeRof added to the fire-rate line. Chains: a resonance never sets itself off; another forged part's can follow once (forgeDepth). compressOut(us) says what dishes make; compress(...us). Scrap: 6 + parts. Blade: its parts' blade effects. Compressor screen: dishes labelled WHEN/WHAT/HOW, aspect shown on chips and dishes, live preview with name and full text, right column lists every aspect's three lines. Tests: zf/forge.json, zf/forgeall.json (131 resonances fired), zf/forgetrig.json, zf/cmpui*.json; window.__forge in TEST.
- 2026-11-26 (35): Compressor screen simplified: chips show name + aspect only, dishes WHEN/WHAT/HOW with aspect, result = name + resonance line + 'keeps ...'; right column GUIDE = ten aspect tiles + three recipe cards (+ locked rank card). All detail moved to one hover box (#ctip; tips[] indexed by data-t, moveTip on pointermove, hidden while dragging and on close).
- 2026-11-26 (36): Village z-fighting. The reversed depth buffer already covered the village (same renderer and camera); what was left was coplanar ground: the 130 grass patches shared nine heights (0.5 + (i%9)*0.55), so overlapping ones fought, and the higher ones even stood above the plaza disc (top 3). Now each patch has its own height 0.3 + i*0.012 (all below the plaza). Paths each sit 0.25 above the previous one (pathN) so junctions do not fight; edge pebbles get 0-2 of height jitter. Village pieces are mostly Shapes, which zf/scan.js (boxes only) cannot read.
- 2026-11-26 (37): Compressor left column has ON YOUR GUNS: every gun's fitted gun parts (and blade, turret), grouped by gun; click one and it comes off (pullCore) into the pack and onto the first free dish. Parts taken off stay in the pack if you leave without forging. Test: zf/eq.json.
- 2026-11-26 (38): Armored on the 3D Blight. The flat 2D armour discs (puppet.js 'Armored') no longer draw on 3D bodies. Instead blight_gear.js barkShell() builds, once per kind and part, a carapace from the part's own mesh: vertices lifted along position-welded normals, kept on the chest/upper body (all round it when the face is on the body, upper back on beasts) and as shoulder caps on arms, cut into stepped plates by a jittered cell pattern (dark seams, pale plate edges, a lip where it ends), and kept clear of anything glowing (eyes, maws). body3d.js draws it as one InstancedMesh per kind (K.shellM). The sculpted plate/shelf pieces and armorAnchors() remain but are unused (shelves read as floating discs). Also: Body3D.fling() returns if the body was never drawn (no feet yet). Judged from stills only.
- 2026-11-26 (39): Smoother Blight. blight_smooth.js smoothPart() runs on every sculpted part as it decodes (blight.js): welds vertices split along paint borders, 3 rounds of Taubin smoothing (lambda 0.5, mu -0.53, open rims pinned), blends paint 35% toward its neighbours, and rebuilds normals per welded vertex (float normals). The clean-style posterising (cap/flesh weights to 4 steps, colour luminance to 8) moved from the vertex to the fragment shader with soft steps (snapSoft), so colour borders no longer zig-zag along triangles. About 0.3 s once at load for all creatures. ?smooth=0 turns the mesh smoothing off to compare. Judged from stills.
- 2026-11-26 (40): Calmer, cleaner Blight bake. tools/blight/kit.mjs: bump() scaled by CALM (0.35) and broad melts (k>=4) widened by UK (1.25); creatures.mjs: knife-edge thin shells (caps, skirts, hems, funnels: every Math.max(Math.abs(..)) ) now soft-edged via smaxN/smax3 (k 1.2-1.8), Rotcap skirt tears, Shrieker frill and garment hems toned down; decimate.mjs refuses collapses that turn a face more than acos(FOLD=0.8) (was 0.35), which was chewing thin edges into flaps; baked with SP=2 (paint speckle merged) and BS=1.6 (twice the triangle budget). blight.json 2.5 -> 3.8 MB, boss files 9.9 -> 16 MB in total (one loaded per run). Rebake: SP=2 BS=1.6 node tools/sculpt_blight.mjs [names]. Judged from stills.
- 2026-11-26 (41): The Blight redrawn to fit the game (tools/blight/chunky.mjs, which the baker now prefers over creatures.mjs; OLD=1 bakes the first sculpts). Rules: a few big rounded primitives, flat colour areas, no noise or rags, chunky proportions, same rig (roles and pivots). Faces: eyes and teeth are no longer sculpted (the sculpt can only colour its corners, so they blurred) but separate instanced meshes drawn by body3d.js: part.eyes [{at,r,out,s}] -> a scowling lid-cut lit ball (strain glow, unshaded), a dark backing rim and a slit pupil; part.teeth [{a,b,r}] -> toon-shaded cones. The sculpt only carves sockets (with a scowling brow) and a downturned mouth. Redrawn: all 15 regular creatures and the 19 Descent Blight bosses; the Reaper is now a proper mantis (prothorax, raptorial forelegs with spined femur and folded scythe tibia, four walking legs, segmented abdomen, folded wings, triangular head with big eyes and antennae) and the Rotwing a proper dragon (deep chest, tucked fore and hind legs, S neck, long skull with horns, brow and open toothed jaw, bat wings of arm, forearm and four fingers with scalloped membrane, crest, tail with spade). Old Barkhide (Ironhide rig) and the other maps' bosses (B_Foreman etc.) are unchanged. Creatures' shadow edge softened (blight.js band smoothstep -0.1..0.16); load-time paint blend 0.35 -> 0.2. Judged from stills.
- 2026-11-26 (42): Animation pass on the redrawn Blight, frame by frame (zf/anim.py: 8 walk phases side-on, wind-up 0.5/1 and lunge 0.5/1 side and front, for all 13 regulars and 20 Descent bosses; zf/gaps.py: per part, nearest distance to any other part and depth below the floor, over the same 12 poses). Fixes: body3d keepOnFloor() lifts a sculpted creature so no limb goes through the floor (lowest band of each limb part, cached); per-creature lean factor (creature.lean, 0 for the rooted/dragging Brood Mother, Hydra, Leviathan, Nameless, Great Rootworm, Rootworm, Spore Pod, Grasping Mycel); Hydra's four necks all animate as Heads (as Arm/Tail they folded over); Leviathan's roots moved into its Body (a Tail swings); Devourer body cut fixed (was cutting its back off) and the maw reaches into the body so the lunge opens no seam, eyes moved onto the maw; Unblinking's eye part turns about the eye's centre; Mirror Queen's and Sporecaller's thighs run up into the gown; Blight Rat tail rooted inside the body. Eyes and teeth now stay on dying creatures (eyes dim out). Gaps now under 3.5 cm everywhere, nothing sinks. Judged from stills.
- 2026-11-26 (43): Blight Rat, Creeper, Sporeling and Puffball remodelled in Blender (tools/blender/*.py, shared kit common.py) after the Rotcap: solid fused limbs, toes and fingers sharpened to points, rot/mould/sores/ooze. Sporeling redesigned lean (root ribcage glowing inside, spined back, long pointed hood); Puffball redesigned as an earthstar (ridged flask on pointed rays, two walk, two lash, beaked pore head). All five baked from tools/blender/out/*.json; gaps clean (rat tail root sunk to close a 2.7 cm gap), poses fine, dg0 clean. Judged from stills.
- 2026-11-26 (44): The other ten regular Blight remodelled in Blender (Inkcap, Shrieker, Shelfshield, Sporecaller, Drifter, Bracketback, Golden Truffle, Rootworm, Spore Pod, Grasping Mycel), angular rather than round. Kit: root_leg/root_arm/seat_eyes/fan in common.py; sharpen now merges collapsed points (decimate had been flattening sharpened limbs into blades - the earlier five rebuilt with the fix). gaps: remaining flags are vertex-sampling artefacts on big flat facets (Truffle head, Drifter tail hangs as before); dg0 clean. Judged from stills.
- 2026-11-26 (45): First nine Blight bosses remodelled in Blender (tools/blender/b_*.py): Brood Mother, King Puffcap (from the Puffball), Drift Queen, Lamplighter, Carapace, Great Rootworm (from the Rootworm), Thunderhead, Ash and Ember, Furnace. fan() for fins. Boss gaps mostly vertex-sampling on big facets at x1.4-2 scale; sockets added at necks. boss.json: all clear but KingOoze and TwinHound (both pre-existing).
- 2026-11-26 (46): The other ten Blight bosses remodelled in Blender: Hydra, Mirror Queen, Unblinking (boolean-carved socket, carve() in common.py), Reaper (mantis anatomy kept), Grandfather Toad, Rotwing (dragon anatomy kept, fan() membranes), Stump Titan, Leviathan, Devourer, Nameless. Preview camera clip_end raised (large bosses were being clipped). Real gaps fixed: Devourer maw floated 16cm off its body; Leviathan maw dipped into the floor on lunge. boss.json: all clear but KingOoze, TwinHound (pre-existing). All 34 Descent creatures are now Blender-made.
- 2026-11-26 (47): Review pass after user feedback. Fixed: Toad mouth (boolean-cut slot, lip, tongue, teeth), Reaper neck gap, Rotwing jaw hinge/throat, Titan hands (root_arm now tapers only each finger's last joint, sharp_r = 1.15x finger radius; was pulling palm faces into shards). Redesigned: King Puffcap (robed tyrant king: ruff, ermine, beard, crown, scepter), Thunderhead (storm-spirit face in a mane of storm puffballs, lightning bolts), Shrieker headpiece (three ribbed trumpet caps, lit throats). Upgraded: Inkcap/Shrieker bulked out with bellies, Shelfshield stem, Sporecaller morel lattice, Brood Mother bark torso/belly/heavier arms, Carapace softer bands, Leviathan brain folds + floor slabs, bark paint replaced by groove ribbons (Titan, Bracketback). dg0 + boss clean (KingOoze/TwinHound pre-existing).
- 2026-11-26 (48): Look filter (src/post.js LookFilter): pause menu LOOK button cycles CLEAN / PIXEL / PIXEL + DITHER (settings.look 0-2), 'Pixel detail' slider 200-540 lines (settings.pix, default 360). Pixel: world+gun drawn into a small render target (float depth texture for the reversed depth range), blown up with nearest filtering; Dither: 4x4 Bayer, 7 shades per channel. HUD is its own canvas and stays sharp. Default CLEAN. Test: look.json.
- 2026-11-27 (49): Look filter removed (post.js deleted; pause LOOK button and Pixel detail slider gone). FLOATERS, AGAIN: the old float scan (fl/scan.js) joined pieces whose world bounding boxes came within 6 units, so tilted or slightly-off pieces passed (Descent showed 0 while things floated). New fl/scan2.js + fl/run2.py: pieces joined only if their oriented boxes overlap (separating-axis test, EPS 1.5); glows count as support but are never reported; a point on a room's outer wall or roof counts as held (rooms' shells are not pieces); report names the caller, not the kit helper. Descent 519 -> 36. Fixed: nave tomb lid (was tilted and 5 over the tomb; now flat, yawed, on the trim), wall-niche candles (beside the altar -> on a wider altar; niche built whole via world.group so a door cut cannot leave candles), rope coils off the planks, spider silk (tilted along the wall, never reached it; now wall-to-floor), Deep station roof braces (same axis mistake), cinder pipe brackets, gold ingot layers (4-unit gaps), foundry ingot layers (2), valve wheels, road barrier feet, fountain finial, canopy drapes, vault wheel (20 off the floor), crane-lamp crossbar, crusher hazard stripes (56 off the base), village lantern caps (frame added), banners on columns, flask bottoms, weed fronds. Sewer Junction slime glints were bright unshaded bars 1.6 over the water (read as floating): now small, green, flush. Other maps flag candidates under the strict scan (0:176 1:61 2:113 3:122 4:215 5:110) - terrain/buildings not modelled yet, not triaged.
- 2026-11-27 (50): FLOATERS, round 2: the strict scan still passed anything built with solid(): a point's down-ray started inside the piece's own collider and hit itself. Fixed (ray starts 0.25 below the point, reaches EPS). That exposed the Ash Chapel (arena 10, 'ell' plan): the inner wall carved the altar's raised platform away and left altar, candles and the four candle pillars 80 up. Raised platforms (plat, platOct), the Cistern causeway and the Deep station roof beams now ignore carving (inside a wall they are hidden); meat-locker rails are built per hook (group), strip curtains hang from straps, footbridges reach the banks, cannon cheeks hold the barrel, notice board on the bars, cart couplings reach, Ossuary ridge bosses hang from the roof, oil pools thickened, clockwork going train built whole. Descent strict scan 124 -> 15 (8 of them the old village, since rebuilt).
  WEAPONS: Come-Back Kid +15% speed and +12% time out per evolution (range ~900 -> ~1500 at III). Dynamite Dan: right click sets off every stick of yours in flight or on the ground; it never aims (signature aimKey hook in player input). Bear Trap: +10% size, trigger and blast radius per evolution. Old Faithful range 800 -> 960. Whaler: no pull; pierces every enemy (pierce 999), kill reloads it. Lariat: no cap, ties everything in the loop in place for 3 s (rootT: no movement, no leaps, crowd does not shove it; bosses only slowed), loop radius +25% per evolution, evolves from enemies tied (each once) not kills (evoByTie; player.addEvo). Copperhead semi-auto.
  WORKBENCH model: a gunsmith's bench (walnut, oxblood drawers, brass, felt mat, oil lantern, Blight caps at its foot). WORKBENCH UI re-themed (walnut panels with brass rivets, stitched leather chips, brass buttons, round socket slots). Recycler: the dropdown is gone; MAKE A PART opens a catalogue (every part by rarity with icon, effect, cost, have/fitted, suits-this-gun, aspect; detail panel with MAKE). COMPRESSOR UI: a brass press (nameplate, columns, ram that drops on PRESS with steam), dishes as brass rings joined by pipes, a strip of the three things it can do (PRESS / FUSE / FORGE) with the one the dishes will do lit, roles renamed TRIGGER / EFFECT / TWIST, and for a forge the new effect read out as one sentence. Gauge removed at the user's ask.
  VILLAGE rebuilt smaller (VSIZE 6000 -> 3000, a quarter the area): a hollow among seven giant mossy trees (giantTree: root skirt, limbs with hanging moss, canopy; lanterns on long ropes from the limbs), root arches over the roads, moss cushions, glowing blue-green caps, paper lanterns across the square, a treehouse up the NE giant. Guns split out of Bramble & Bolt into Flintwhistle's Guns (village kind 'gunshop', its own counter, smith, forge, gun rack). Home has a Dressing Porch: deck, rose pergola, painted wardrobe, folding screen, mirror, dresser with lamps, rug, paper lanterns.
- 2026-11-27 (51): VILLAGE PASS. String lanterns gone except across the square. New well (wellFine: footing, five staggered courses round an open shaft darkening to water, rounded coping, posts in the coping, windlass with wound rope and crank, shingled roof, buckets); the black cylinder in it is gone. New village scans in dmh-test/vs: run.py (vscan.js) finds (1) things at body height you can walk through (rays toward each surface point from outside), (2) collision with nothing drawn in it, (3) clipping: a piece's surface buried in another structure's collision box (true rotated boxes: world.js keeps each Solid's matrix in scan mode); frun.py is the strict float scan for the village only; sweep.py shoots every area N/E/S/W at eye height. Fixed: giant roots had no collision (giantRoots() is shared by shape and map; each root gets bodies wherever it is low enough to walk into, you can walk under the high arches); roots that would run into a building, the gate knoll or lie low across a path are left out of the tree (rootMask, a bit per root, part of the shape key); limb lanterns hang from the limb's true curve and only where rope and glass meet nothing (houses, caps, rocks, trunks, roots), spaced 240 apart; glowing caps only on open ground; bushes, bench backs, casino and porch stools, lantern stakes, campfire, log seats, door pots, garden vegetables, the frog stone all solid; mushroom cottages get a round (8-sided) body, not a square with empty corners. Moved: garden west of the cottage (was in the NW giant's roots), gate giant back to y 4900 (knoll rocks were in its trunk), gate boulders out past the lantern posts and bushes (two a side), cottages off the stream bank and away from trunks, the amber cottage removed (its cap hit the casino's), pond, campfire (stream bank), powder kegs (were inside the gun counter), treehouse ladder, gate flowers, a villager out of the pond; the gunsmith's sign hangs from a header beam, the porch sign on rods. Scans: walk-through only soft plants, counter-top things and ladder rungs; no invisible walls; village float scan 0.
- 2026-11-27 (52): Village follow-ups. Gun rack moved back against the smithy wall and Flintwhistle stands between it and the counter (the rack board had been in front of him). Moss strands on the root arches and the giants' limbs now start inside them, on the same Catmull-Rom curve the tube is laid along (village_shapes curveOf; they hung under a guessed height before). Campfire tripod rebuilt: three legs from the ground to a lashed apex, a linked chain to the pot's bail, lugs, a lid. Signpost and benches gone; the square's four lamp posts are 720 tall, the string lights run between them at 700 and up to a mast on the well's ridge (790). The Way Down's stone sign in the village is gone (the rooms' portal signs are untouched). Casino: gold-bordered carpet, plank seams, a floor medallion, a prize wheel on a dais facing the door (rings, 32 bulbs, pegs, pointer), a ring chandelier on chains round it, banners between the pillars, a brass rail round the edge (open at the door and the bar), back shelf with bottles and a mirror, bar stools, a cashier's cage with its sign, rugs under the tables, stanchions with a velvet rope at the door, potted toadstools, a sconce on each pillar. Scans: village float 0; no new walk-through or clipping (stools kept off the pillars).

## (53) The town grows from runs: rescues, Forge, Training Yard, Lectern
- Prize: Descent rolls `this.prize = Meta.rollPrize()` (next lost gnome in GNOMES order, or a machine not yet home; an
  upgrade only if its base machine is home; else a 600-gold hoard). town.js buildPrize(P): caged gnome (iron birdcage on
  a hooked post, gnome inside) or a chained machine cabinet, toon materials, root scale 0.8 / 0.62. Placed at
  `raid.prizeAt` ([x, y, yaw] in the raid's frame; Mother Mold default [0, -900]) and added to raid.root. reward() calls
  Meta.rescue(prize) and prizeO.free() (door swings, gnome climbs out and waves; chains drop).
- Machines left renown: RANKS no longer carry `machine`. Meta.machineOn reads S.town.machines; saves from before keep
  machines their claimed ranks had opened (OLD_MACHINE_RANK on load). Meta.machineHow(id) replaces machineRank text.
- Forge (gunshop kind, Flintwhistle): guns cost weapon fragments (FORGE_COST by rarity). Fragments only once the forge
  gnome is home: elites 1 (floater), bosses 3, final boss 10; Meta.frags/addFrags (fractional accumulator for boons).
- Lectern (replaces the challenge board; contracts return null now): MUTATORS are pages with `boon` + `bf` factors
  (gold, renown, parts, cls, frags, bossPart). data.js mutBoon(key); mutXp = (1+daily)*mutBoon('renown'). Meta.pages()
  is S.muts only once Inkcap is home; beginRun sets it. Lobby section THE LECTERN shows pages read.
- Training Yard (trainer.js TRAINING): per class 9 lessons in 3 tiers (perks, an ability lesson, 2 variants, 3 gear =
  the old class-level cosmetics). Class points per class: room 1, boss 3, final 6, win 10 (CP_RATES), x mutBoon('cls');
  earned even before Hobnail is home. Meta.cp/addCp/train/trainState/trainedMods/variant/setVariant. Player: setClass
  sets this.trainMods + this.cv; recompute adds trainMods. Variants: fan, calm (gunslinger), long, check (brawler), over,
  watch (engineer turretStats), line, roll (sniper), cluster (gtype 4), twin (bomber). Class milestones removed; gear
  bought here sets stat claim:c:cls:k so old cosmetics needs still work.
- Village: VSPOTS.lectern (board's spot, Lectern + canopy built in map_village), VSPOTS.trainer + Training Yard at
  [2060, -1260] (fenced ring, dummies, target, rack, class banners; path extended). People with `need` are hidden until
  rescued; their stations show "lost" prompts and refuse use. Tips: 'town1'.
- Tests: fl/prz.json (prize shots), vs/town.json and town2.json (buildings + windows), /tmp/v.json style variant check.
- Raid designs: dmh-test/raid_designs.md draft 2 (Lantern-Eater cut for the Fruiting Spire after the agent review).

## (54) Enemy hit shapes from the models
- Measured (hb/run2.py: ray grids from 4 sides, drawn mesh vs counted hit): the old upright cylinder (hitR/hitH from the
  2D art) missed 10-30% of shots on the visible body (up to 60-76%: Wendigo, Reaper, Keeper, Rotwing, Creeper) and
  counted 25-50% of hits on empty air; headshots were height-only (wide/flying creatures 0-13% credited, some bodies
  80% counted as head). Old Barkhide's rig: 35% missed, 48% body-as-head.
- Now: game.rayEnemy on a 3D body = cylinder round the posed parts (Body3D.hitBound, broad) then Body3D.rayParts: each
  part's triangles in a 6x3 grid of cells (sliceBoxes, boxed round whole triangles), slab test then exact triangle test
  (rayTris) in hit cells. pad>0 (projectile radius, flame, aim highlight) stops at the boxes. Posed once a frame
  (FRAME in bodies3dBegin + feet/yaw key). Old Barkhide: raycast of its rig meshes (rigPose/rigRole; pad: 5 rays).
- Headshots: rayEnemy records E.rayRole / E.rayY; E.headAt(at) = hit on the Head part (falls back to headY for flat
  cut-outs and bodies with no Head part). Callers in player.js and turret.js use headAt.
- Result: every enemy and boss within 0-2% missed / 0-2% empty-air (with a fresh pose per test ray), headshots credited
  ~100% on the head, ~0% on the body. Cost ~0.06 ms a shot with 40 enemies. Unchanged: raid heart (E.raidHeart keeps
  its cylinder), flat cut-out mode, melee reach / explosions / contact (still hitR / radius).
- Test hooks: window.__bodyPoints, __bodyRay, __DATA (TEST builds). Picture: out/hitboxes_before_after.png.

## (55) Choose the prize; Hard-only prizes; rescue reveal
- Meta.prizeOptions() (lost gnomes, machines not home, upgrades once their base is home; .hard from HARD_PRIZES:
  gnome:forge, gnome:lectern, machine:crucible). S.prizePick via setPrizePick; prizeFor(df) = pick if allowed on df
  (hard needs df >= 1), else the first allowed, else hoard. Descent uses prizeFor(difficulty()) at start and again on
  reaching the last room. Lobby section THE PRIZE (descent only, host/solo; guests use their own saved pick).
- Win screen (hud drawDescentWon): a glowing green panel first, "RESCUED - HOME TO THIMBLEWICK" / "NEW MACHINE FOUND",
  name, what it opens or does, and for an upgrade what it replaces. Shots: out/town/win_*.png, lobby_prize*.png.

## (56) Bosses at the end of their room; no splitting; Recycler on Hard; Recycler +35%
- HARD_PRIZES now machine:recycler, gnome:lectern, machine:crucible (the Forge is back on Normal).
- Player.makeCost (Recycler scrap by tier) 4/8/16/32 -> 5/11/22/43.
- Descent: rooms 5/10/15 are ordinary rooms (order is 19 rooms; arenaFor(room) = order[room-1], 20 = raid arena
  N_ROOMS+1; flipFor alternates). The boss room gets its normal horde; game.endRound calls Descent.hordeDone() for a boss
  room, which banners THE BOSS COMES and sets bossT 2.6; spawnBoss places it at a free spot (findFreeLocationNear). The
  old boss arena (arena N_ROOMS) is no longer used. Raid room unchanged (bossT 2.2, no horde).
- King Puffcap: mech 'split' removed (hp 12 -> 24, new desc). The Lamplighter's decoys and Ash and Ember's twin kept.

## (57) Class levels replace character buffs; kill-shield limiter; turret evolves; Compress All
- Character buffs (cores kind 'me') are noDrop (cores.js, after CORE_DEFS): never drop, not in the Recycler catalogue
  (its filter tabs are just ALL), removed from the rank unlock lists. Definitions kept for old references.
- Class levels: meta.js classLevelOf(rounds): level L->L+1 takes 4+L rounds/rooms cleared as the class (stat cls_<id>,
  existing progress counts); max 50 (1,421 in all). Meta.clsLevel / clsLevelInfo / clsHp (+5 a level past the first).
  Player.lvlHp added to MaxHealth in recompute (set in setClass); roundCleared pushes {type:'clslevel'} -> game.js
  banner + toast + player.levelHp() (the health at once). Lobby chips "Lv N"; class blurb and progress cards show it.
- Player.combatShield(a): every proc 'Shield' (any trigger) and Homesteader's per-blast shield. One gain per 0.5 s,
  budget 3/s holding 9, never past 25% of max health (shieldCap 60% still bounds everything else). Topaz Brooch / Quick
  Wrists text updated.
- Engineer turret: no parts (fitCore refuses; any old turretCores return to the bag when the bench opens). Evolves from
  its own kills (P.turretHitting set around the shoulder turret's dealDamage -> creditKill -> turretEvo): need
  EVO_NEED*0.8 (24/72/144/240), 4 tiers, each +25% damage, +10% rate, +10% time (turretStats). Workbench turret tab
  shows the evolution bar; tab chip "evolved N".
- Compressor: COMPRESS ALL (Player.compressPairs / compressAll) presses every pair of the same pressable part in the bag
  (coreInv only), leaving odd ones. Shots: out/town/cp_all*.png, wb_turret.png.
- Fortune Teller now works on gun parts in the bag (fortuneOk, reroll once a room, trade 2 up); its panel only shows
  with the machine.

## (58) Thimblewick re-laid: a cross of streets, a place for everything
- Why: the user found the village cluttered (Lectern, campfire, yard and casino door all on the square's east side, two
  shops and two cottages jammed on the west, ~1,300 randomly scattered plants, rope lanterns hanging everywhere) and low
  on detail in places (flat octagon cobbles, disc stream and pond, bare meadows).
- Plan (map_village.js header): the square at the centre, four streets on its axes - north to the Way Down, east to the
  Lucky Toadstool's door (CASINO [2250, 0]), west to Bramble & Bolt's counter (SHOP [-1650, 0]), south over the bridge.
  Lanes off the north/south roads: home + porch + garden NW (HOME [-1950, 1650]), Inkcap's grove NE (GROVE [1550, 1700]:
  seven standing stones round a pool, lectern on its west shore at LECT, runes on the three facing it), the forge on the
  stream bank SW (FORGE [-1800, -1250]: hearth yard, anvil, trough, grindstone, coal, waterwheel in the stream on an axle
  to a bellows housing), the campfire on the brook E (FIRE [900, -1000]), the training yard across the water SE (YARD
  [1500, -2750]), two cottages (COTS: SW by the spawn, W past Bramble & Bolt), a fishing jetty + rowboat below the casino,
  the welcome arch over the south road (WELCOME, signs both ways). Giants moved to the rim (GIANTS); root arches at
  ARCH_S -1250 / ARCH_N 1750. streamY(x) is exported (same curve as before).
- New props: src/village_props.js (cobbleSquare, planter, woodpile, choppingBlock, washLine, reeds, lilies, standingStone,
  waterwheel, anvil, trough, grindstone, dummy, archeryButt, cart, crate, sack, stump, welcomeArch, thicket,
  lecternStand, flowerClump, rowboat). oring() = an open band of revolution (G.lathe always closes its ends with discs).
- Planting is by hand, not random scatter: ferns/caps between giants' roots, thicket + young trees along the edge,
  flower clumps in beds by doors and in seven meadow drifts, tufts in clumps on the road verges, grass round building
  feet, four mossy logs. plant()/clear() keep things off paths (pathDist), the stream (onStream), roots and buildings.
- Lights: four 560 lamp posts on the square's diagonals with string lights post to post only (mast and the well runs
  gone), a few road posts, door lanterns on cottages, limb lanterns only where a limb is over the high street. The
  lectern's Lamp sits on the book (its glare is the book's glow); no Lamps on the runes (Lamp always adds a GlowCross).
- Ground: fewer, purposeful patches (sunny meadows, moss under giants, worn earth at counters); paths at z 2.6+ (were 7).
- Stream: one ribbon ('vstream2', darker down the middle) + bank lips ('vbank-1/1'); stones on bends (all solid), reeds
  in clumps, lilies in three reaches. Old disc stream gone.
- Folk: two chatting at the well, one by the fire, one at the jetty, one at the pumpkin cart, one by the stones.
- Tests: dmh-test/vs2/ survey.py TAG [views.json] (orthographic cut-away plan -> out/TAG/top_code.png in code frame,
  obliques, eye-level views; game.render is swapped for the ortho camera, P.fov drives the main camera's fov), plan.py
  (footprint spacing sketch), sheet.py + window.__shapeSheet (props alone), reach.py/reach.js (grid flood from the spawn:
  every station reachable), perf.py (draw calls). vs/run.py knows the bundle's S3 helper and soft plants.
- Results: village float 0, no invisible walls, walk-throughs only counter-top goods/thin rope (as before), all 13 stations
  reachable; instanced meshes 393 -> 345, instances 5470 -> 3909, draw calls at spawn -15%. dg0 [55,[],[]].
  Judged from stills.

## (59) Thimblewick touch-ups from play; the Will-o'-Wisp glows softly
- Treehouse (north-east giant): one shape now, treeDeck() in village_props.js. Board wedges round the trunk (no gaps
  from below), a rim beam, 12 joists into the bark, knee braces from the trunk to every other joist (the free-standing
  struts are gone), a railing open where the ladder comes up. The ladder stands outside the rim (R1 + 12) and stops at
  a handhold above the deck instead of running through it; its foot keeps the giant's roots away. Deck inner edge is
  0.9 r, inside the bark. giantTree() takes `deck` (height kept clear of shelf fungus; only that giant).
- Grove and giants' feet: the Glow cylinders over the blue-green toadstools are gone (they read as white boxes).
- Bramble & Bolt: a real dress form (dressForm: tripod, turned torso, tape measure) for the floating ball-on-a-stick; a
  draper's rack (clothRack: three shelves of bolts, ends to the street, one gap on top) for the five giant logs.
- Counter lamps (Bramble & Bolt, the forge) are lanterns standing on the counter (tableLamp) instead of bare glows;
  the casino's back-bar lamps sit on gilt brackets, the cashier's cage has a lantern on a chain (lampHang).
- Bushes: berries/blossom sit on the lumps' own skins (were placed on a sphere and some floated).
- The forge's test target stands against the forge's north wall (was out by Bramble & Bolt).
- The notice board (old challenge board) is gone from the square.
- Gnomes still lost in the Descent no longer greet you from where they would stand (HELLO needs root.visible).
- Will-o'-Wisp: its rounds are `soft` (player.js SOFT_ROUNDS; carried in co-op shots as field 18). Soft orbs: body
  emissive 0.8 (1.3), glow 0.55 size, 0.75 alpha, 1.2 intensity (2.2). Blasts are fx.mistBurst (tinted flash, fading
  glow, four mist puffs, five motes, a ring; no white star, fireball or scorch). Haunt's wisps are soft too, their
  rising flash smaller and without the light. Muzzle flash 0.5 (1).
- All your own rounds: the glow fades in over the first ~4 m from the camera, so nothing flares in your face leaving the
  muzzle (hostile rounds unchanged).
- Results: village float 0, ghost 0, all 13 stations reachable, dg0 [55,[],[]], wt ok. Judged from stills.

## (60) Gun animation pass 1: arms out of your face, nothing moves on its own
- Every gun reviewed in first person (idle, a shot, reload at 20/40/60/80%) and grips checked from both flanks and from
  above with the hands kept on (vm.inspectHands, a test hook). Tools: tests gview.py (strips), rframe.py (full reload
  frames), rfire.py (frames after a shot), hview.py (hand close-ups), hside.py (grips from outside), hprobe.json (closest
  the off hand comes to the eye in each reload), gsheet.py (workbench side sheets).
- Charging handle (SMGs, rifles, LMGs from empty): the hand takes the handle on the receiver's left flank from below
  instead of reaching over the top past the eye; the gun dips 3 and turns its flank to the hand. Rustler's cocking handle
  moved up front (x 10) over the handguard.
- Launchers (Dynamite Dan, Boomtown, Fireworks Finale) and the Whaler and Live Wire: the muzzle is tipped down and across
  to the off hand (rp [-14,-32,12] / [-12,-28,12]) so a round goes in at arm's length, not with the arm stretched overhead.
  Whaler and Live Wire now load at the muzzle (were sliding the harpoon/rod out sideways through the barrel).
- Drums on top (Thresher, Tumbleweed): lifted off down and to the left (U(-4,-13,-19)), not out at arm's length; the
  Tumbleweed rolls left for its reload so the hopper comes to the hand and the arm never crosses the cask.
- Thunderhead: the pull lever sits forward on the near flank (x 11); the capacitor stack is taken out under the gun and a
  fresh one brought up by the hand (it used to drop and rise by itself).
- 'cell' reloads: the steam vent and the power-up hum only on things that run on charge (Energy, Wonder, or feel.vent);
  oddities with a box or canister just swap it.
- Hands: idle grips and the changed poses were checked from outside the gun: right hand thumb on the left of the grip and
  trigger finger on the right; off hand palm up under the handguard, fingers over the far side, thumb on the near side;
  palms on what they hold (magazine, handle, drum, rocket, harpoon, capacitor).
- Checks: gun float/gap scans unchanged (only the known twin-pistol pair and a sunk grip screw), dg0 [55,[],[]], wt ok.

## (61) The off hand takes hold the right way round
- User: the left hand was operating backwards in the reload poses (an open palm held up beside the part).
- viewmodel.js: the off hand's palm, fingers and thumb are their own group (vm.supHand) on the wrist; the cuff and sleeve
  stay on vm.support. Away from its rest grip (reloads; not while riding a pump or a crank) the hand rolls palm-in to
  the gun's flank, -90 deg about the gun's long axis, scaled by distance from the rest grip (/6): back of the hand to the
  camera, thumb over the top, fingers under. At rest it is cupped palm-up under the handguard as before.
- Thumb at rest laid forward along the near side (pointing at the muzzle), not standing up.
- Checked: charging handle, magazine, speedloader, shells into the breech, drum, rocket, harpoon, rod, hopper, capacitor,
  from first person and from outside (hside.py).

## (62) Creature and boss touch-ups (Blender)
- bpy 5.3 installed from PyPI (the wheel matches Python 3.13); tools/blender/*.py run with plain `python3`, then
  `node tools/sculpt_blight.mjs Name ...` bakes public/blight.json (bosses: public/bl_B_Name.json).
- Cap gills: 16 broad stripes instead of 40 thin ones (common.py rotten_cap, rotcap.py): the thin ones shimmered at
  range. Rebuilt Rotcap, Creeper, Brood Mother.
- Sporeling: limbs and spine about a fifth thicker (still lean; read as a stick figure at range).
- Inkcap: the stalk given depth (was flat side-on).
- Golden Truffle: grime in its creases (tarnished under, near-black in the deepest), 17 knobs (11), a heavier scowl.
- The Furnace: 26 ember cracks (14), longer, each with a lit vein down the middle; the bark's tops a shade of ash so the
  hulk reads in a dark room.
- Reviewed from a clean studio (rev.py studio moved to 160000,3000,160000, clear of the re-laid village): revq.py /
  revq1.py (quick 3/4 and side looks for many creatures), zf/lineup.py (one frame each in game).
- tests: boss.json reports 'noboss' for every boss (its __boss helper predates bosses arriving at the end of their
  room's horde, (56)); not a model problem. dg0 [55,[],[]].

## (63) Shots land on thin creatures; the Sporeling runs a readable line
- User: the Sporeling's pathing was very sporadic and it was far harder to hit, as if its hitbox needed pixel-perfect aim.
- Hits: hitscan shots (and aimPoint) call rayEnemy with HIT_PAD = 4 (player.js): a shot counts within 4 of a part's
  slice boxes (the boxes round its triangles), instead of the exact triangle test that (54) made pixel-perfect. Measured
  with +/-8 aim jitter on the torso (hitpad.json): Sporeling 76% -> 100%; Creeper, Drifter, Puffball, Rotcap 100% both.
  Projectiles, melee and explosions unchanged.
- Movement: the Sprinter weave ('zigzag') 0.55 side at 2.4 rad/s (was 1.1 at 4); the crosshair dodge (Runner, Leaper,
  elites) eases in and out over 0.3 s (sin envelope) at 1.1 side and +20% speed (was a 0.38 s snap at 1.6 and +30%),
  every 2.2-4.2 s (1.4-3). zig.json / zig2.json / zig3.json log heading against the line to the player.

## (64) Tumbleweed: flung out of the bell, twice the size, a new gun
- User: the weed should shoot out a bit before rolling instead of coming out on the floor; make it 100% bigger; the
  weed on top of the gun looked weird and it glitched when aiming down sights.
- Shot (signatures2.js): leaves the bell at 0.3 size and opens to full over 0.2 s, flies in a short arc (0.62 of its
  speed forward, 280 up, gravity 1960, tumbling), lands about 460 ahead after ~0.47 s, makes one small hop (-0.3 of
  its fall if faster than 350) and rolls off at the speed it landed with, gathering pace to the old roll speed (time
  constant 0.25 s; base speed still +35%/s up to 2400). Radius 44 (22). Into a wall in the air: it drops there.
  The velocity line had been eaten by a mid-line comment on the first try (the weed fell flat at full speed).
- Gun (guns.js): the hopper and the weed on top are gone. An oak cask with iron hoops, twine and a side crank; a tin
  chute into a brass bell with the next weed stuffed in its mouth (MagRoot 27.4,0,7.6); open sights along the top
  (brass strap, notch on a base at the back, short bead on the bell's lip). Stave joins are rolled round the cask
  (R(0,0,-i*30)); pitched, they stuck out like spokes. Loaded from the front: reload 'muzzle', rp [-12,-28,12]; the
  off hand brings a weed up from below and pushes it into the bell.
- ADS: the bead's top (16.2) stood above the eye line (Sight 15.6 + 0.45), so the sight-line check called the gun
  blocked and auto-canted it onto its side. Bead 1.15 tall (top 15.75), notch on a base (tops 15.8): no cant, the bead
  sits in the notch just under the crosshair; the bell's lip (15.55) clears.
- tests: tw/fly.py (first person + side stills of one shot into a held line of three); gscan no new floats; dg0
  [55,[],[]]; a 15 s soak firing into six enemies, no errors.

## (65) The run is five places down the valley, then the raid
- User: fewer, longer rooms (each the equivalent of three old rooms in time and creatures); Mystery Box and Compressor
  after every room; 5 rooms then the raid boss. Rooms become destinations: larger, real places infected by the Blight,
  20 of them in one consistent world, built one at a time. Chosen (AskUserQuestion): the valley down to the Root,
  5 regions of 4; bosses at the end of rooms 2 and 4 only; one destination from each region, in order.
- REGIONS (descent.js): The Vale (Bramble Farm, Cider Orchard, Millbrook, Crossroads Inn; strain Toadstool),
  The Wildwood (Old Oak Woods, Bogwater Fen, Lantern Lake, Ranger's Ridge; Mirecap), The Works (Cogsworth Depot,
  Market Town, The Brewery, Ironworks; Rustcap), Under the Hill (Copperdeep Mine, Glimmer Caves, The Old Hold,
  The Catacombs; Nightshade), The Rot (Sporefall Wood, The Withered Abbey, The Weeping Garden, The Rootgate; Char).
  Room 6 is the raid at the Root (strain Char).
- DESTS 5, ROOMS 6 (raid), STAGES 3. A room's horde comes in three stretches with no lull: depthOf(room, stage) =
  3(room-1)+1+stage (room 1 = depths 1-3 ... room 5 = 13-15). Each stretch holds what its old room did
  (24 + 4.5 x depth, x1.6 per extra player); the next is let out once the last of this one is out (Descent.allowed
  replaces the round's 20%-then-even release, per stretch). Stepping deeper (stepDeeper) sets g.round = depth (all
  scaling), restarts the per-round drop caps, runs the round hooks quietly (class levels, XP, gold, revive clock,
  OnRoundStart procs: three times a room, as before) and bumps dRooms. Raid depth 17 (was round 20: the run is 15
  old rooms deep now, not 19). Toasts: 'More are coming, and they are tougher' / 'The last of them are coming'.
- Bosses: rooms 2 and 4 (BOSS_ROOMS); room 2's from tiers 1-2, room 4's from tiers 3-4. isBossRoom also counts the
  raid's room (its fight ends when its boss dies; without that the raid room 'cleared' at once and the run was won).
- After every room: workbench, Mystery Box (one free roll), Compressor (if unlocked), ammo, the way on. The way on is
  titled with the next place's name and region (a boss waits there / where the Blight comes up).
- Route: one per region in order (built destinations of that region; an old room stands in until one is built:
  DEST_ARENAS in map_descent.js, empty until the first destination). nameOf/regionOf; banner = the place's name.
- HUD: ROOM shows 1-5 (RAID after); run-end stats show the room. Lobby chip: '5 rooms and the raid - best room N'
  (best depth / 3). Achievements: reach room 2 / 3 / 5; 'Clear 30 rooms' (dRooms counts three per room; per: 3 in
  the challenge list). Quartermaster refills 90% on a room clear (three old rooms' worth).
- tests: dst/run.json plays all five rooms (kills everything each frame) and enters the raid: depths 1-15, horde
  100/140/181/221/262 solo, bosses only in 2 and 4, box + compressor + bench + ammo after each, raid at depth 17 stays
  in its fight. dg0 [55,[],[]]; wt clean.

## (66) Destinations: the framework, and the first place, Bramble Farm
- The first of the 20 destinations (65). Each is a real place, handmade, built and checked one at a time.
- Framework:
  - dest.js: DEST_DEFS (spacing DSP 20000; Bramble: hx 5400, hy 5800, H 2600, flip 1, ambient bed S_AmbWind, its own
    air palette). buildDest builds the place inside M.at at its origin (zone group 'dest:key'), rings it with an
    invisible Blocker fence and a nav-blocked band outside, turns its spots to world, sets A.dest {key, region, name,
    flip, bed}, bossAt, beds and title, lays spawn marks on a staggered 900 grid (kept 1500 off the spawn, 900 off
    the exit, 500 off the bench and the box), then solidifies (0 added at the farm: everything chunky has a body).
  - dest_kit.js: S (a shape at a spot), body / round (fitted bodies; nav off for things you step past), lit,
    patch / blot ground cover, path (a wavering dirt ribbon with edge stones; skip(x, y) keeps the stones off floors),
    lineDist, clear(x, y, m) (a spot m clear of every ground-standing body built so far: for scattering).
  - dest_props.js: the Vale's pieces (farmhouse, barn, silo, coop, cart shed, duck house, drystone walls, gate posts
    and leaves, pump, churn, scarecrow, haystacks, hives, wheelbarrow, ladder, baskets, rail fences, raised beds,
    sign, plough, furrows, apple trees, wheat fields, far trees, hedge lumps, Blight masses). Sizes snap to a few
    variants (pick) so pieces instance.
  - map_descent.js builds the destinations after the village (DEST_ARENAS); navInit covers their bounds. The run
    takes the region's built destination for its room, else an old room stands in.
  - world.js: SolidRot (a body with a full turn: roof slabs, a leaning ladder). Static sprites (lamp halos, decals)
    are kept per chunk (staticRec, shownChunk): the farm's horizon no longer sparkles with other rooms' halos.
  - sector.js: a destination's strain beds come from A.beds (each used once); no generic creep blotches there (they
    read as stains on grass); hazard damage goes by depth.
- Bramble Farm (the Vale, room 1): the lane comes in at the south gate past the sign; the packed-earth yard with the
  well, pump, trough, cart and sacks; the farmhouse west of it (kitchen garden, woodpile, washing line, bench); the
  great barn north of it with the track running through it door to door (hay down one aisle, stalls down the
  other, lanterns); the silo at its shoulder; the pond with reeds, lilies, a rowboat and a duck house, the windmill
  beyond; the pumpkin patch and vegetable beds east; the coop and its run; the cart shed; the orchard (ladder,
  baskets, windfalls) south-west; haystacks and hives north-east; the round threshing floor at the north gate where
  the stations come up. Drystone walls and a hawthorn hedge round it, a hedgerow across the south-east field with a
  way through east of the coop run, the ploughed field beyond, wheat fields and the Wildwood's edge outside. The
  Blight came up under the barn: a mass bursting through its floor, pale veins running out, toadstools along them,
  the Vale strain's puffball beds in six places. Meadow tufts thicken along the walls and hedges.
- Solid: buildings (walls, gables, roofs, chimney), walls, fences, every hedge bush (an eight-sided body per bush, as
  wide as its leaves at chest height, on the walking grid), trees, rocks, stacks, hives, carts, crates, toadstool
  clusters, the duck house. Only grass, reeds, flowers and the beds' greens let you through.
- Checks: loose parts inside sculpted shapes 0 (apples hang at the canopy mesh's corners, where they always touch;
  blossoms sit on the hedge skins); floating 0 of 857; invisible walls 0; clipping only into a piece's own bodies or
  where things abut (stall fronts on the barn wall, the Blight through the barn's corner); walking grid 10022 of
  10025 cells reachable (one corner cell), every spawn mark reachable; the horde reaches the player at 8 spots
  (barn, behind the house, pond shore, threshing floor, coop run, orchard, patch, yard), none stuck (Spitters and
  the Golden Truffle are left out of that count: they keep their distance by design). The place's own meshes:
  220 draw calls, 927k triangles (the village: 336, 1.3M).
- Fixed on the way: the hedgerow's way through opened onto the coop run's fence, so the walking grid had it shut and
  the horde went round the hedge's end (moved east of the run; the bushes beside it are the small ones, set back);
  the track's edge stones poked up through the barn's boards; tufts are kept clear of every body.
- tests/dst: look.py (stills: top, oblique, eye level), scan.py + dscan.js + fscan.js (walk-through, invisible
  walls, clipping, floating), shapes.py + shapescan.js (loose parts inside shapes), nav.json (reachability),
  chase.json (horde pathing from 8 spots), perf.py (whole-frame cost), tri.json (the place's own meshes), run.json.

## (67) Bramble Farm, second pass: true boards, a new coop, new workbench and compressor, the stations laid out
- User (after playing the farm): the barn's floorboards and walls, the grain silo and the chicken coop not up to
  standard; the stations and the box oddly placed; the workbench and compressor models don't fit the world in design
  or palette.
- Cause of the barn/silo/coop look: boards, battens and staves were blobs with few segments. A blob's poles taper its
  long ends to points and four segments round make its section a diamond: battens ended in spikes with daylight
  between them, the silo's staves the same over its base, the porch boards' ends a sawtooth.
  - propkit: Geo.box() (six faces with their own corners: square ends, crisp edges, a colour per face) and shapeB,
    a shape builder that draws any squared-off blob (e 8 or more, no warp) as a true box. dest_props.js and
    dest_props_wood.js build with it; the village's pieces are unchanged.
- Barn: battens, backing, trim as boxes; the stone footing laid in two courses of blocks; the floor a dark deck under
  boards laid in staggered lengths, the worn ones pale down the middle, the farm track's ribbon now under the deck.
- Silo: staves as boxes round a dark core (no gaps), a base of stone blocks in three staggered courses, a cap ring.
- Coop (rebuilt, CP sizes): a hen house on its corner posts, whitewashed boards on a frame round a dark core, a red
  shingled gable roof with overhangs and a ridge board, the pop-hole with its slide door and a cleated ramp, a nest box
  with three hatches under a hinged lid, a wired window at the back. It now faces its run: pop-hole and ramp into it.
- Stations (station_shapes.js, sculpted with the same kit and colours as the world; Interactable.sculpt draws them):
  - Workbench: a tinker's bench under its own red shingled roof: oak top on stout legs, drawers with brass pulls, a
    shelf with a crate of scrap, rope and a bucket; a brass-jawed vise with a gun's action in it; a green cloth of
    gears, a spring and screws; an oil can and a small anvil; behind it a board of tools on pegs (hammer, saw,
    wrench, brace, file, calipers) and a shelf of jars; the name board on posts on the roof. The lantern (lit), the
    turning gear and the Blight's glowing caps at its foot are kept.
  - Compressor: an old screw press: an oak base block in iron straps on a plank deck, two oak posts in iron bands, a
    crossbeam with the name board across its face, a brass screw with a spoked iron wheel on top; the iron platen hangs
    from the screw (the ram group); two copper dishes glowing amber in the bed; a copper chute down to a tray; a gauge
    and a red-knobbed lever on the posts. Text cream and brass (no more teal).
- Layout (descent: S.pressYaw turns the compressor on its own; the bench's ring follows the bench's facing): on the
  threshing floor the box stands at the north side with the way on behind it, the workbench and the compressor either
  side of the floor, turned in towards it and towards you as you come up (bench [-660, 4620] yaw -25, press
  [660, 4620] yaw -155, box [0, 4900]). The chest spot is the box's (its ring lights the box).
- dest.js: a destination can be wip (only built in test builds; the run takes an old room for it). Old Oak Woods is
  wip (dest_oakwoods.js, dest_props_wood.js: oaks, the great oak, a fallen oak, the lodge, woodshed, camp, charcoal
  mounds, lean-to, standing stones, footbridge, hide, arch); blightMass takes a strain palette ('mire').
- tests: dst/sheet.py (a sheet of sculpts, each framed: __dprops / __wprops / __sprops in test builds); look.py
  'clear' (the room cleared, the stations up); shapes.py ... st (the stations' sculpts too): 0 loose parts; farm
  floating 0, invisible walls 0, clips only self or abutting; grid 10022/10025, all spawns reachable; chase: the horde
  reaches every spot (the stragglers it lists are walking round the barn to its doors); dg0 [55,[],[]]; wt clean;
  run.json to the raid; village floats 0.

## (68) The box is not in front of the way on
- User: no Mystery Box in front of the portal. Destinations now keep the way up the middle of the stations' floor
  clear to the way on: the workbench and the compressor stand side by side on one side of the floor facing in, the box
  across from them on the other side facing in (Bramble Farm: bench [-700, 4830], press [-700, 4330], both yaw 0; box
  [700, 4600] yaw 180; Old Oak Woods the same on its flagstone floor). The chest spot follows the box.

## (69) Old Oak Woods, the Wildwood's first place (room 2)
- The old wood north of the Vale where the foresters work; strain Mirecap; a boss at the end (room 2). Layout (local):
  the forest road in under a timber arch with the wood's name on it (both faces), boulders and a waymarker; the
  forester's lodge west of the road (log cabin, porch with a lantern, stone chimney, woodshed, chopping block, axe in
  a stump, rain barrel, washing line, fenced herb beds); the woodcutters' camp east (three log piles, the saw trestle
  with a two-man saw, stumps with axes, a canvas tent, a campfire with a tripod and pot, log seats, a cart, crates,
  sacks, a lantern post); the brook across the middle (dark water on a muddy bed, stones, reeds) with a footbridge on
  the road and two fords; the charcoal burners' clearing west (two earth mounds with wood ends at their feet and
  embers at their vents, a lean-to, cordwood, sacks); the stone circle east (seven standing stones, two fallen, the
  altar); the great hollow oak by the road; the glade (the boss's ground) with the fallen giant along its west side,
  the Blight's heart heaving out of its root plate, pale threads across the grass; the flagstone floor at the north
  end for the stations, the road out between two old oaks; a hunter's hide in the north-east; a ridge of boulders
  on the east edge; oaks everywhere else, thickest at the edge, holly and hazel under them, ferns, fallen stumps; the
  Wildwood and hills beyond.
- Pieces (dest_props_wood.js): oak (buttress roots that dive into the ground, boughs, crown above head height),
  greatOak (the hollow, burrs, a rolled lip of bark), fallenOak (root plate stood on edge, broken boughs, shelf fungus),
  stump (rings, an axe), logPile (logs hard against each other, stakes), fern, logCabin (notched logs, openings cut in
  the courses, gables, shakes, chimney, porch) + CB, woodshed, sawTrestle, tent, campfire, logSeat, charcoalMound,
  leanTo, standingStone, altarStone, footbridge + FB, waymarker, hide + HD, woodArch, flagFloor, rainBarrel.
  blightMass 'mire'. dest_kit: plan() lays out trees and bushes so no pocket of open ground is ever sealed (the
  thing walling a pocket off is left out until every open cell is reachable); exactNav (this place) gives bodies their
  true footprint on the walking grid (a turned box's rectangle, a round body's circle, + 28) and trunk() the same for
  one round body. Why: a creature that can see you walks straight at you, and a grid cell shut but open on the ground
  turns it back there: it jittered at the corners of square footprints round trunks and turned log piles.
- Walkable decks are low: the porch and the footbridge at 16 (at 26 and 34 creatures failed to step up onto them and
  waited at the edge). The bridge runs square to the grid; the water beside its rails is shut and so are the grid
  cells along the rails' outsides, so the horde goes round the rails' ends onto the deck. Wide bosses take the fords.
- Checks: loose parts 0; floating 0 of 1303; invisible walls 0; clipping 0; walk-through only reeds and herbs;
  grid 10211 of 10211 cells reachable, every spawn reachable; chase from 10 spots (lodge porch, camp, bridge, charcoal,
  circle, great oak, glade, floor, hide, west ford) clean on most runs, an odd straggler mid-route at most; bosses spawn
  in the glade and reach the player across the wood (the far camp by the east ford in about 40 s). Cost: 219 draw
  calls, 1.19M triangles (the village 336, 1.3M).
- tests/dst: nav2.json, chase2.json, boss2.json (room 2), look.py/scan.py/shapes.py take the room.

## (70) No buffs leaking into the Descent; Carapace without the shell; no act titles
- "RUSH" kept popping up: an evolved gun's Tune-Ups ("...reload speed") were caught by the Rush family's word test in
  builds.js buildOf, so holding a gun evolved twice woke RUSH I (banner + toast + the dash power) every time you switched
  to it. buildOf now returns null for `bench` upgrades as well as parts.
- Character buffs in a run: game.enemyKilled still dropped the old boss buff (rollBuff, the chest pool, which can also
  pick 'me' parts) beside the Descent's own boss parts. That drop is now outside the Descent only.
- Carapace (mech 'shell' removed, now null): no immunity during the Spin, no "SHELL" / "ON ITS BACK" floaters (nothing
  showed it on its back). The Spin is a triple ram labelled "RAMMING - out of its path"; it stands dazed 2.4 s after,
  like any boss. desc: "Rams across the room, again and again. Get out of its path." (content.json and
  tools/descent_content.py). Rule: no boss text that claims something the model does not show.
- Boss bar: no "ACT I/II/III" and no act names; the mid-screen act card is gone. The change still happens at 2/3 and
  1/3 (roar, ring, "IT ROARS - POUR IT ON", the bar flashes); the two notches stay. PH names stay in bossx.js unused.
- Test: /tmp/t/fix1.json (Tune-Ups x4 -> no family; Carapace hurt mid-spin; no ACT text; boss drops = 2 parts).
