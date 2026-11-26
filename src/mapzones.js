import { V, V2, R, LC, FC, BOX, Pal, FMath } from './mapkit.js';

export function BuildGroundAndBounds(M, GM) {
  const { Box, BoxRot, Glow, Cyl, Ball, ConeShape, Blocker, Ramp, Floor, Wall, Lamp, Sign, Building, StreetLamp, Barrel, Crate, Cactus, PalmTree, DeadTree, Car, Wagon, Headstone, Boxcar, Mesa, JumpPad, Billboard, Station, WallBuy, Door, SpawnAt, AddInstance, Foliage, SurfaceDecal, RotFromXY, Arch, Wedge, Pyramid, Oct, Ring, Mausoleum, Fountain, GasPump, BoxYaw } = M;
	// Ground slab
	Box(V(0., 0., -50.), V(30400., 30400., 100.), Pal.Sand, true, false);
	Floor(V2(-6000., -6000.), V2(-2000., -2000.), 1., Pal.Concrete);
	Floor(V2(-6000., -2000.), V2(-2000., 6000.), 1., Pal.Sidewalk);
	Floor(V2(-4600., -2000.), V2(-3400., 6000.), 2., Pal.Asphalt);
	Floor(V2(-2000., -6000.), V2(2000., -2000.), 1., Pal.Grass);
	Floor(V2(-2000., 2000.), V2(2000., 6000.), 1., Pal.Gravel);
	Floor(V2(-2000., -2000.), V2(2000., 2000.), 1., Pal.Tile);
	Floor(V2(2000., -6000.), V2(6000., 6000.), 1., Pal.RedRock);
	// Road markings
	for (let Y = -1900.; Y < 6000.; Y += 500.)
	{
		Floor(V2(-4015., Y), V2(-3985., Y + 250.), 3., 0xE8D27A);
	}
	// Plaza checker inlay
	for (let i = -3; i <= 3; ++i)
	{
		for (let j = -3; j <= 3; ++j)
		{
			if (((i + j) & 1) == 0 && (FMath.Abs(i) == 3 || FMath.Abs(j) == 3))
			{
				Floor(V2(i * 560. - 140., j * 560. - 140.), V2(i * 560. + 140., j * 560. + 140.), 2., Pal.TileDark);
			}
		}
	}
	// Grass patches
	for (let i = 0; i < 14; ++i)
	{
		let C = V2(FMath.FRandRange(-1900., 1900.), FMath.FRandRange(-5900., -2100.));
		Floor(C.sub(V2(160., 120.)), C.add(V2(160., 120.)), 2., Pal.GrassDark);
	}

	// Outer perimeter: tall canyon walls, now out past the outskirts
	let NoGaps = [];
	Wall(V2(-15000., -15000.), V2(-15000., 15000.), 950., 200., Pal.RockA, NoGaps, true);
	Wall(V2(15000., -15000.), V2(15000., 15000.), 950., 200., Pal.RockA, NoGaps, true);
	Wall(V2(-15000., -15000.), V2(15000., -15000.), 950., 200., Pal.RockA, NoGaps, true);
	Wall(V2(-15000., 15000.), V2(15000., 15000.), 950., 200., Pal.RockA, NoGaps, true);
	// the old canyon wall is now the line between the outskirts and the Badlands, with one gate per district
	Wall(V2(-10600., -10600.), V2(-10600., 10600.), 520., 160., Pal.RockA, [V2(8400., 8800.)], true);     // Shanty Row | Badlands
	Wall(V2(10600., -10600.), V2(10600., 10600.), 520., 160., Pal.RockA, [V2(12400., 12800.)], true);     // Refinery | Badlands
	Wall(V2(-10600., -10600.), V2(10600., -10600.), 520., 160., Pal.RockA, [V2(12400., 12800.)], true);   // Stockyards | Badlands
	Wall(V2(-10600., 10600.), V2(10600., 10600.), 520., 160., Pal.RockA, [V2(8400., 8800.)], true);       // Ghost Rails | Badlands
	// Cliff tops: stacked rock strata resting on the canyon walls, stepping in as they rise
	const CliffCols = [Pal.RockA, Pal.RockB, Pal.RedRock];
	for (let i = 0; i < 61; ++i)
	{
		let T = -15100. + i * 500. + FMath.FRandRange(-60., 60.);
		const sides = [[-15050., T, 1], [15050., T, 1], [T, -15050., 0], [T, 15050., 0]];
		for (let s2 = 0; s2 < 4; ++s2)
		{
			const [cx, cy, alongY] = sides[s2];
			let z = 965.;
			const tiers = 1 + ((i * 7 + s2 * 3) % 3);
			for (let t = 0; t < tiers; ++t)
			{
				const h = 140. + ((i + t * 5 + s2) % 4) * 70.;
				const w = 560. - t * 120. + FMath.FRandRange(-40., 40.);
				const deep = 320. - t * 50.;
				const yaw = FMath.FRandRange(-14., 14.);
				Box(V(cx, cy, z + h * 0.5), alongY ? V(deep, w, h) : V(w, deep, h), CliffCols[(i + t + s2) % 3], true, false, yaw);
				Box(V(cx, cy, z + h - 6.), alongY ? V(deep + 12., w + 12., 12.) : V(w + 12., deep + 12., 12.), 0x7A3A22, false, false, yaw);
				z += h;
			}
			if ((i + s2) % 5 == 0)
			{
				Pyramid(V(cx, cy, z + 110.), V(220., 220., 220.), CliffCols[(i + s2 + 1) % 3], R(0., FMath.FRandRange(0., 90.), 0.));
			}
		}
	}
	// Zone walls with doorway gaps (gap = distance along the wall from its start point).
	const Gap = (A, B) => [V2(A, B)];
	Wall(V2(-2000., -6000.), V2(-2000., -2000.), 520., 80., Pal.Adobe, Gap(1800., 2200.), true);   // Motel | Chapel
	Wall(V2(-2000., -2000.), V2(-2000., 2000.), 520., 80., Pal.Adobe, Gap(1800., 2200.), true);    // Main | Plaza
	Wall(V2(-2000., 2000.), V2(-2000., 6000.), 520., 80., Pal.Adobe, Gap(1800., 2200.), true);     // Main | Rail
	Wall(V2(2000., -6000.), V2(2000., -2000.), 520., 80., Pal.Adobe, Gap(1800., 2200.), true);     // Chapel | Mesa
	Wall(V2(2000., -2000.), V2(2000., 2000.), 520., 80., Pal.Adobe, Gap(1800., 2200.), true);      // Plaza | Mesa
	Wall(V2(2000., 2000.), V2(2000., 6000.), 520., 80., Pal.Adobe, Gap(1800., 2200.), true);       // Rail | Mesa
	// Old town | outskirts (where the canyon wall used to be), one wall per pair of districts
	const None = [];
	Wall(V2(-6000., -6000.), V2(-6000., -2000.), 520., 80., Pal.Adobe, None, true);                // Motel | Shanty Row (the motel backs onto it: no door)
	Wall(V2(-6000., -2000.), V2(-6000., 6000.), 520., 80., Pal.Adobe, None, true);                 // Main | Shanty Row (shopfronts: no door)
	Wall(V2(-6000., -6000.), V2(-2000., -6000.), 520., 80., Pal.Adobe, None, true);                // Motel | Stockyards (motel rooms: no door)
	Wall(V2(-2000., -6000.), V2(2000., -6000.), 520., 80., Pal.Adobe, Gap(200., 600.), true);      // Chapel | Stockyards (doors sit on stretches of wall with open ground both sides)
	Wall(V2(2000., -6000.), V2(6000., -6000.), 520., 80., Pal.Adobe, None, true);                  // Mesa | Stockyards
	Wall(V2(6000., -6000.), V2(6000., 6000.), 520., 80., Pal.Adobe, [V2(1500., 1900.), V2(9650., 10050.)], true);   // Mesa | Refinery, two ways through
	Wall(V2(-6000., 6000.), V2(-2000., 6000.), 520., 80., Pal.Adobe, None, true);                  // Main | Ghost Rails
	Wall(V2(-2000., 6000.), V2(2000., 6000.), 520., 80., Pal.Adobe, Gap(350., 750.), true);        // Rail | Ghost Rails
	Wall(V2(2000., 6000.), V2(6000., 6000.), 520., 80., Pal.Adobe, None, true);                    // Mesa | Ghost Rails
	// between the outskirts districts
	Wall(V2(-6000., -10500.), V2(-6000., -6000.), 520., 80., Pal.Adobe, Gap(2300., 2700.), true);  // Shanty Row | Stockyards
	Wall(V2(6000., 6000.), V2(6000., 10500.), 520., 80., Pal.Adobe, Gap(1800., 2200.), true);      // Refinery | Ghost Rails
}

export function BuildDoors(M, GM) {
  const { Box, BoxRot, Glow, Cyl, Ball, ConeShape, Blocker, Ramp, Floor, Wall, Lamp, Sign, Building, StreetLamp, Barrel, Crate, Cactus, PalmTree, DeadTree, Car, Wagon, Headstone, Boxcar, Mesa, JumpPad, Billboard, Station, WallBuy, Door, SpawnAt, AddInstance, Foliage, SurfaceDecal, RotFromXY, Arch, Wedge, Pyramid, Oct, Ring, Mausoleum, Fountain, GasPump, BoxYaw } = M;
	Door(V(-2000., -4000., 0.), 0., 1500, 0, 2);
	Door(V(-2000., 0., 0.), 0., 1500, 1, 4);
	Door(V(-2000., 4000., 0.), 0., 1500, 1, 3);
	Door(V(2000., -4000., 0.), 0., 2500, 2, 5);
	Door(V(2000., 4000., 0.), 0., 2500, 3, 5);
	Door(V(2000., 0., 0.), 0., 2500, 4, 5);
	// outskirts
	Door(V(-1600., -6000., 0.), 90., 3000, 2, 8);
	Door(V(6000., -4300., 0.), 0., 3500, 5, 9);
	Door(V(6000., 3850., 0.), 0., 3500, 5, 9);
	Door(V(-1450., 6000., 0.), 90., 3000, 3, 10);
	Door(V(-6000., -8000., 0.), 0., 4000, 7, 8);
	Door(V(6000., 8000., 0.), 0., 4000, 9, 10);
	// the Badlands: any one gate opens the whole ring
	Door(V(-10600., -2000., 0.), 0., 5000, 7, 11);
	Door(V(2000., -10600., 0.), 90., 5000, 8, 11);
	Door(V(10600., 2000., 0.), 0., 5000, 9, 11);
	Door(V(-2000., 10600., 0.), 90., 5000, 10, 11);
}

export function BuildMotel(M, GM) {
  const { Box, BoxRot, Glow, Cyl, Ball, ConeShape, Blocker, Ramp, Floor, Wall, Lamp, Sign, Building, StreetLamp, Barrel, Crate, Cactus, PalmTree, DeadTree, Car, Wagon, Headstone, Boxcar, Mesa, JumpPad, Billboard, Station, WallBuy, Door, SpawnAt, AddInstance, Foliage, SurfaceDecal, RotFromXY, Arch, Wedge, Pyramid, Oct, Ring, Mausoleum, Fountain, GasPump, BoxYaw } = M;
	// Wing A (south) - two storeys with a balcony walkway at 360.
	Box(V(-5550., -4100., 180.), V(900., 3400., 360.), Pal.Adobe);
	Box(V(-5700., -4100., 530.), V(600., 3400., 340.), Pal.Adobe, true, false);
	Box(V(-5550., -4100., 365.), V(910., 3410., 14.), Pal.AdobeDark, true, false);
	Box(V(-5700., -4100., 710.), V(620., 3420., 20.), Pal.RoofRed, true, false);
	for (let i = 0; i < 7; ++i)
	{
		let Y = -5600. + i * 480.;
		Box(V(-5098., Y, 115.), V(6., 110., 230.), Pal.Teal, false, false);
		Glow(V(-5098., Y + 170., 170.), V(6., 120., 90.), 0xFFB86A);
		Box(V(-5398., Y, 475.), V(6., 110., 220.), Pal.Teal, false, false);
		Sign(V(-5092., Y, 260.), 0., String(101 + i), FC(240, 230, 200), 30.);
		// railing posts
		Box(V(-5112., Y + 240., 410.), V(12., 12., 90.), Pal.WoodDark, true, false);
	}
	Box(V(-5112., -4300., 452.), V(12., 3000., 10.), Pal.WoodDark, true, false);
	// Stairs up to the balcony
	Box(V(-4950., -2450., 180.), V(300., 200., 360.), Pal.AdobeDark);
	Ramp(V(-4950., -3350., 0.), V(-4950., -2550., 360.), 260., Pal.Wood);

	// Wing B (west) - one storey, roof joins the balcony.
	Box(V(-3750., -5600., 180.), V(2700., 800., 360.), Pal.Adobe);
	Box(V(-3750., -5600., 365.), V(2710., 810., 14.), Pal.AdobeDark, true, false);
	Box(V(-3750., -5210., 400.), V(2700., 12., 60.), Pal.WoodDark, true, false);
	for (let i = 0; i < 5; ++i)
	{
		let X = -4700. + i * 500.;
		Box(V(X, -5198., 115.), V(110., 6., 230.), Pal.Teal, false, false);
		Glow(V(X + 180., -5198., 170.), V(120., 6., 90.), 0xFFB86A);
		Sign(V(X, -5192., 260.), 90., String(108 + i), FC(240, 230, 200), 30.);
	}
	// Office with neon
	Box(V(-2600., -4800., 200.), V(600., 700., 400.), Pal.Cream);
	Box(V(-2600., -4800., 410.), V(620., 720., 20.), Pal.RoofRed, true, false);
	Glow(V(-2600., -4448., 180.), V(400., 6., 140.), 0xFFB86A);
	Sign(V(-2600., -4440., 330.), 90., "OFFICE", FC(255, 90, 140), 50.);

	// Pool: a low curb with no collision. A solid 30-high rim trapped enemies inside it.
	Box(V(-3900., -3900., 7.), V(1400., 40., 14.), Pal.Cream, false, false);
	Box(V(-3900., -3400., 7.), V(1400., 40., 14.), Pal.Cream, false, false);
	Box(V(-4600., -3650., 7.), V(40., 540., 14.), Pal.Cream, false, false);
	Box(V(-3200., -3650., 7.), V(40., 540., 14.), Pal.Cream, false, false);
	Glow(V(-3900., -3650., 6.), V(1360., 460., 4.), Pal.Water);
	Box(V(-4550., -3650., 50.), V(220., 50., 10.), Pal.Cream, false, false); Box(V(-4625., -3650., 23.), V(40., 40., 46.), Pal.Cream, false, false); // the diving board's block
	Lamp(V(-3900., -3650., 60.), LC(0.3, 0.8, 1.), 10., 900., false);
	for (let i = 0; i < 4; ++i)
	{
		Box(V(-4400. + i * 350., -3100., 25.), V(80., 200., 50.), Pal.Teal, true, true, 10.);
	}

	// Motel sign
	Cyl(V(-2500., -3200., 450.), 40., 900., Pal.MetalDark, true, true);
	Box(V(-2500., -3200., 980.), V(60., 700., 260.), Pal.Teal, true, false);
	Glow(V(-2468., -3200., 1030.), V(4., 640., 10.), Pal.Neon);
	Sign(V(-2464., -3200., 990.), 0., "SLEEPY HOLLOW", FC(255, 230, 160), 80.);
	Sign(V(-2464., -3200., 880.), 0., "VACANCY", FC(255, 60, 60), 60.);
	Lamp(V(-2350., -3200., 950.), LC(1., 0.3, 0.5), 20., 1400., false);

	Car(V(-3000., -2700., 0.), 25., 0x5A8AA0);
	Car(V(-4600., -2500., 0.), -8., 0xC0503A);
	Barrel(V(-2300., -5800., 0.), 0x8A3A2A);
	Barrel(V(-2220., -5700., 0.), 0x3A6A8A);
	StreetLamp(V(-3400., -4600., 0.), 0.);
	StreetLamp(V(-4300., -2300., 0.), 180.);

	JumpPad(V(-3600., -4700., 0.), V(-3600., -5600., 380.));

	WallBuy("Saloon Six", V(-5098., -4400., 0.), 0.);
	WallBuy("Hornet's Nest", V(-3200., -5198., 0.), 90.);

	SpawnAt(V(-2400., -2500., 0.), 0);
	SpawnAt(V(-2200., -5700., 0.), 0);
	SpawnAt(V(-4800., -4800., 0.), 0);
	SpawnAt(V(-3000., -4100., 0.), 0);
	SpawnAt(V(-4800., -2400., 0.), 0);

	GM.PlayerSpawn = V(-3300., -4750., 120.);
}

export function BuildMainStreet(M, GM) {
  const { Box, BoxRot, Glow, Cyl, Ball, ConeShape, Blocker, Ramp, Floor, Wall, Lamp, Sign, Building, StreetLamp, Barrel, Crate, Cactus, PalmTree, DeadTree, Car, Wagon, Headstone, Boxcar, Mesa, JumpPad, Billboard, Station, WallBuy, Door, SpawnAt, AddInstance, Foliage, SurfaceDecal, RotFromXY, Arch, Wedge, Pyramid, Oct, Ring, Mausoleum, Fountain, GasPump, BoxYaw } = M;
	// South row (faces +X)
	Building(V2(-6000., -1800.), V2(-5100., -500.), 650., Pal.Wood, Pal.RoofDark, Pal.WoodDark, 1, "SALOON");
	Building(V2(-6000., -300.), V2(-5100., 900.), 500., 0xC9A27A, Pal.RoofRed, Pal.WoodDark, 1, "GENERAL STORE");
	Building(V2(-6000., 1100.), V2(-5100., 2500.), 800., Pal.Brick, Pal.RoofDark, Pal.Cream, 1, "BANK");
	for (let i = 0; i < 4; ++i)
	{
		Cyl(V(-5040., 1250. + i * 370., 300.), 60., 600., Pal.Cream, true, true);
	}
	Building(V2(-6000., 2700.), V2(-5100., 4100.), 950., 0x6A7FA0, Pal.RoofDark, Pal.Cream, 1, "GRAND HOTEL");
	Box(V(-4990., 3400., 620.), V(220., 1300., 16.), Pal.WoodDark, true, false); // hotel balcony

	// Gas station
	Box(V(-4800., 5000., 440.), V(800., 1200., 40.), Pal.Cream, true, false);
	Glow(V(-4800., 5000., 418.), V(760., 1160., 4.), 0xFFF2CC);
	for (let i = 0; i < 4; ++i)
	{
		Box(V(-5150. + (i % 2) * 700., 4500. + Math.floor(i / 2) * 1000., 210.), V(50., 50., 420.), Pal.CasinoRed);
	}
	Box(V(-4800., 5000., 466.), V(820., 1220., 12.), Pal.CasinoRed, true, false);
	Box(V(-4800., 5000., 6.), V(300., 900., 12.), Pal.Concrete, true, false);
	for (let i = 0; i < 2; ++i)
	{
		GasPump(V(-4800., 4750. + i * 500., 12.), 0.);
	}
	Sign(V(-4395., 5000., 450.), 0., "GAS - EATS - BULLETS", FC(200, 20, 30), 40.);
	Building(V2(-6000., 4400.), V2(-5400., 5800.), 400., Pal.Cream, Pal.RoofRed, Pal.CasinoRed, 1, "DINER");
	Lamp(V(-4800., 5000., 380.), LC(1., 0.95, 0.8), 14., 1100., false);

	// North row (faces -X), leaving the two doorways clear.
	Building(V2(-3000., -1800.), V2(-2050., -450.), 450., Pal.Cream, Pal.RoofRed, Pal.Teal, -1, "BARBER");
	Cyl(V(-3040., -1600., 220.), 30., 160., 0xFFFFFF, false, false);
	Glow(V(-3040., -1600., 220.), V(32., 32., 30.), 0xFF3030, 1);
	Building(V2(-3000., 450.), V2(-2050., 2000.), 550., 0xB5893C, Pal.RoofDark, Pal.WoodDark, -1, "SHERIFF");
	Building(V2(-3000., 2100.), V2(-2050., 3550.), 500., 0x4A3A4A, Pal.RoofDark, Pal.StoneDark, -1, "UNDERTAKER");
	for (let i = 0; i < 3; ++i)
	{
		BoxRot(V(-3120., 2400. + i * 220., 80.), V(60., 200., 50.), Pal.WoodDark, R(70., 0., 0.), true); // coffins
	}
	Building(V2(-3000., 4450.), V2(-2050., 5800.), 450., 0x6A5A50, Pal.RoofDark, Pal.WoodDark, -1, "BLACKSMITH");
	Box(V(-3150., 5100., 50.), V(160., 100., 100.), Pal.MetalDark); // anvil block
	Box(V(-3150., 5350., 12.), V(170., 170., 24.), Pal.MetalDark, false, false); Glow(V(-3150., 5350., 39.), V(120., 120., 30.), 0xFF6A1A, 1); // the forge fire, in its hearth

	// Rooftop bridges (planks) across the alleys
	Box(V(-5550., -400., 505.), V(160., 260., 14.), Pal.Wood, true, false);
	Box(V(-5550., 1000., 505.), V(160., 260., 14.), Pal.Wood, true, false);
	Box(V(-2500., 2050., 505.), V(160., 160., 14.), Pal.Wood, true, false);

	// Street furniture
	Wagon(V(-4250., 1300., 0.), 8.);
	Wagon(V(-3700., 3300., 0.), -12.);
	Car(V(-3700., -800., 0.), 80., 0xD8C25A);
	for (let i = 0; i < 6; ++i)
	{
		Barrel(V(-4950. + (i % 2) * 90., -300. + i * 760., 0.), i % 2 ? 0x8A3A2A : 0x6A5A3A);
	}
	Box(V(-3150., 1200., 40.), V(80., 300., 80.), Pal.WoodDark); // trough
	Glow(V(-3150., 1200., 76.), V(60., 280., 4.), Pal.Water);
	Crate(V(-3200., -1100., 0.), 120.);
	Crate(V(-3200., -1100., 120.), 90.);
	Crate(V(-4950., 2650., 0.), 130.);

	// Wall-run billboards down the median
	Billboard(V(-4000., -250., 430.), 1000., 0., "CLOCKTOWER SQUARE  >>");
	Billboard(V(-4000., 2300., 430.), 1000., 0., "ALL BETS ARE OFF");

	// Water tower at the end of the street
	for (let i = 0; i < 4; ++i)
	{
		let Leg = V(-4000., 5600., 0.).add(R(0., 45. + i * 90., 0.).RotateVector(V(230., 0., 0.)));
		Cyl(Leg.add(V(0, 0, 450.)), 30., 900., Pal.WoodDark, true, true);
	}
	Cyl(V(-4000., 5600., 1100.), 600., 400., Pal.Wood, true, false);
	Cyl(V(-4000., 5600., 905.), 640., 20., Pal.WoodDark, true, false);
	ConeShape(V(-4000., 5600., 1400.), V(640., 640., 200.), Pal.RoofRed, true);
	Sign(V(-4310., 5600., 1120.), 180., "LUCKY'S END", FC(250, 235, 200), 70.);

	for (let i = 0; i < 5; ++i)
	{
		StreetLamp(V(-4700., -1500. + i * 1600., 0.), 0.);
		StreetLamp(V(-3300., -700. + i * 1600., 0.), 180.);
	}

	JumpPad(V(-4250., 2800., 0.), V(-5550., 3400., 960.));
	JumpPad(V(-3500., -1300., 0.), V(-2500., -1100., 460.));

	WallBuy("Iron Mule", V(-3002., 1300., 0.), 180.);
	WallBuy("Dynamite Dan", V(-5098., 300., 0.), 0.);

	SpawnAt(V(-4000., -1700., 0.), 1);
	SpawnAt(V(-4800., 1000., 0.), 1);
	SpawnAt(V(-3300., 2700., 0.), 1);
	SpawnAt(V(-4600., 3900., 0.), 1);
	SpawnAt(V(-3500., 5000., 0.), 1);
	SpawnAt(V(-3300., -1100., 0.), 1);
}

export function BuildChapel(M, GM) {
  const { Box, BoxRot, Glow, Cyl, Ball, ConeShape, Blocker, Ramp, Floor, Wall, Lamp, Sign, Building, StreetLamp, Barrel, Crate, Cactus, PalmTree, DeadTree, Car, Wagon, Headstone, Boxcar, Mesa, JumpPad, Billboard, Station, WallBuy, Door, SpawnAt, AddInstance, Foliage, SurfaceDecal, RotFromXY, Arch, Wedge, Pyramid, Oct, Ring, Mausoleum, Fountain, GasPump, BoxYaw } = M;
	// Hollow chapel: X[-500,1100] Y[-5700,-4500], door on the +X wall.
	let H = 650.;
	let NoGap = [];
	let DoorGap = [];
	DoorGap.push(V2(450., 750.));
	Wall(V2(-500., -5700.), V2(1100., -5700.), H, 60., Pal.Cream, NoGap, false);
	Wall(V2(-500., -4500.), V2(1100., -4500.), H, 60., Pal.Cream, NoGap, false);
	Wall(V2(-500., -5700.), V2(-500., -4500.), H, 60., Pal.Cream, NoGap, false);
	Wall(V2(1100., -5700.), V2(1100., -4500.), H, 60., Pal.Cream, DoorGap, false);
	Box(V(1100., -5100., 500.), V(60., 300., 300.), Pal.Cream, true, false); // lintel
	Box(V(1136., -5100., 352.), V(12., 340., 24.), Pal.WoodDark, false, false);
	Box(V(1136., -5262., 175.), V(12., 24., 350.), Pal.WoodDark, false, false);
	Box(V(1136., -4938., 175.), V(12., 24., 350.), Pal.WoodDark, false, false);
	Wedge(V(1140., -5100., 400.), V(380., 20., 70.), Pal.Cream, R(0., 90., 0.));
	// Pitched roof
	let Half = 640.;
	let Pitch = 28.;
	let RoofX = V(1., 0., 0.);
	let SlopeL = V(0., FMath.Cos(FMath.DegreesToRadians(Pitch)), FMath.Sin(FMath.DegreesToRadians(Pitch)));
	let SlopeR = V(0., -FMath.Cos(FMath.DegreesToRadians(Pitch)), FMath.Sin(FMath.DegreesToRadians(Pitch)));
	AddInstance(0, V(300., -5100. - Half * 0.5 * FMath.Cos(FMath.DegreesToRadians(Pitch)), H + 155.), V(1760., Half + 60., 40.), RotFromXY(RoofX, SlopeL), Pal.RoofRed, true, false, false);
	AddInstance(0, V(300., -5100. + Half * 0.5 * FMath.Cos(FMath.DegreesToRadians(Pitch)), H + 155.), V(1760., Half + 60., 40.), RotFromXY(RoofX, SlopeR), Pal.RoofRed, true, false, false);
	// Stained glass
	for (let i = 0; i < 3; ++i)
	{
		let Glass = [ 0xFF4F6A, 0x4FD8FF, 0xFFD24F ];
		for (const [WY, GI] of [[-4468., i], [-5732., (i + 1) % 3]])
		{
			Glow(V(-100. + i * 400., WY, 360.), V(120., 6., 180.), Glass[GI]);
			Glow(V(-100. + i * 400., WY, 450.), V(120., 6., 60.), Glass[GI], 4, R(0., 90., 0.));
			Box(V(-100. + i * 400., WY, 360.), V(10., 10., 180.), Pal.WoodDark, false, false);
			Box(V(-100. + i * 400., WY, 360.), V(120., 10., 10.), Pal.WoodDark, false, false);
			Box(V(-100. + i * 400., WY, 268.), V(150., 16., 14.), Pal.Cream, false, false);
		}
	}
	// Interior: pews, altar, candles
	for (let r = 0; r < 4; ++r)
	{
		for (const PY of [-5380., -4820.])
		{
			Box(V(100. + r * 220., PY, 45.), V(70., 360., 10.), Pal.Wood);
			Box(V(68. + r * 220., PY, 90.), V(8., 360., 80.), Pal.WoodDark, false, false);
			Box(V(100. + r * 220., PY - 176., 30.), V(70., 8., 60.), Pal.WoodDark, false, false);
			Box(V(100. + r * 220., PY + 176., 30.), V(70., 8., 60.), Pal.WoodDark, false, false);
		}
	}
	Box(V(-330., -5100., 60.), V(160., 400., 120.), Pal.Cream);
	Box(V(-470., -5100., 380.), V(20., 30., 300.), Pal.Gold, false, false);
	Box(V(-470., -5100., 440.), V(20., 180., 30.), Pal.Gold, false, false);
	for (let i = 0; i < 5; ++i)
	{
		Glow(V(-330., -5260. + i * 80., 140.), V(10., 10., 30.), 0xFFD27A);
	}
	Lamp(V(-250., -5100., 250.), LC(1., 0.7, 0.4), 12., 1000., false);
	WallBuy("Homesteader", V(-468., -4800., 0.), 0.);

	// Bell tower beside the door
	Box(V(1300., -5500., 600.), V(400., 400., 1200.), Pal.Cream);
	for (let i = 0; i < 4; ++i)
	{
		Box(V(1300. + ((i & 1) ? 170. : -170.), -5500. + ((i & 2) ? 170. : -170.), 1330.), V(60., 60., 260.), Pal.Cream, true, false);
	}
	Box(V(1300., -5500., 1475.), V(440., 440., 30.), Pal.RoofRed, true, false);
	ConeShape(V(1300., -5500., 1600.), V(420., 420., 220.), Pal.RoofRed, true, R(0., 45., 0.));
	ConeShape(V(1300., -5500., 1340.), V(140., 140., 140.), Pal.Gold, false);
	Box(V(1300., -5500., 1400.), V(20., 20., 40.), Pal.MetalDark, false, false);
	Lamp(V(1300., -5500., 1300.), LC(1., 0.8, 0.4), 12., 900., false);
	Ramp(V(1800., -5000., 0.), V(1800., -5700., 420.), 220., Pal.Wood);
	Box(V(1800., -5800., 210.), V(240., 200., 420.), Pal.WoodDark);
	JumpPad(V(1700., -4700., 0.), V(1300., -5500., 1220.));

	// Graveyard
	let Style = 0;
	for (let X = -1600.; X <= 200.; X += 300.)
	{
		for (let Y = -3900.; Y <= -2500.; Y += 350.)
		{
			if (FMath.Abs(X) < 320. && Y > -3000.)
			{
				continue;
			}
			Headstone(V(X + FMath.FRandRange(-40., 40.), Y + FMath.FRandRange(-40., 40.), 0.), FMath.FRandRange(-12., 12.), (Style++) % 3);
		}
	}
	// Iron fence segments
	for (let i = 0; i < 12; ++i)
	{
		let Y = -4100. + i * 150.;
		if (i == 5 || i == 6)
		{
			continue;
		}
		Box(V(-1750., Y, 60.), V(10., 140., 10.), Pal.MetalDark, false, false);
		Box(V(-1750., Y, 30.), V(10., 10., 120.), Pal.MetalDark, true, false);
	}
	// Crypts
	Mausoleum(V(-1500., -4700., 0.), 480., 520., 360., 0., "BLACKWOOD");
	Mausoleum(V(900., -3200., 0.), 560., 520., 400., 180., "VAN DER LUCK");
	WallBuy("Frostbite Beam", V(648., -2980., 0.), 180.);

	DeadTree(V(-1200., -5300., 0.), 520.);
	DeadTree(V(1600., -2500., 0.), 460.);
	DeadTree(V(-300., -3400., 0.), 380.);
	Lamp(V(-700., -3200., 160.), LC(0.5, 1., 0.6), 8., 1200., true);
	Cyl(V(400., -2300., 70.), 10., 140., Pal.MetalDark, false, false); Lamp(V(400., -2300., 160.), LC(0.5, 1., 0.6), 8., 1000., true);

	SpawnAt(V(-1700., -2400., 0.), 2);
	SpawnAt(V(-1500., -5700., 0.), 2);
	SpawnAt(V(1600., -5900., 0.), 2);
	SpawnAt(V(1700., -3700., 0.), 2);
	SpawnAt(V(-200., -4250., 0.), 2);
	SpawnAt(V(1200., -2400., 0.), 2);
	SpawnAt(V(-800., -3700., 0.), 2);
}

export function BuildRailYard(M, GM) {
  const { Box, BoxRot, Glow, Cyl, Ball, ConeShape, Blocker, Ramp, Floor, Wall, Lamp, Sign, Building, StreetLamp, Barrel, Crate, Cactus, PalmTree, DeadTree, Car, Wagon, Headstone, Boxcar, Mesa, JumpPad, Billboard, Station, WallBuy, Door, SpawnAt, AddInstance, Foliage, SurfaceDecal, RotFromXY, Arch, Wedge, Pyramid, Oct, Ring, Mausoleum, Fountain, GasPump, BoxYaw } = M;
	// Tracks
	let Tracks = [ -800., 600. ];
	for (const TX of Tracks)
	{
		Box(V(TX - 72., 4000., 8.), V(12., 4000., 16.), Pal.Metal, true, false);
		Box(V(TX + 72., 4000., 8.), V(12., 4000., 16.), Pal.Metal, true, false);
		for (let Y = 2050.; Y < 6000.; Y += 160.)
		{
			Box(V(TX, Y, 3.), V(240., 40., 6.), Pal.WoodDark, false, false);
		}
	}
	Boxcar(V(-800., 3100., 0.), 1200., 0x8A3A2A);
	Boxcar(V(-800., 4900., 0.), 1200., 0x3A5A7A);
	Boxcar(V(600., 3200., 0.), 1200., 0x6A7A3A);
	// Tanker
	Box(V(600., 5000., 45.), V(220., 1000., 70.), Pal.MetalDark);
	Cyl(V(600., 5000., 260.), 320., 1100., 0x2E2E36, true, false, R(90., 90., 0.));
	Cyl(V(600., 5000., 430.), 80., 60., 0x2E2E36, true, false);
	Sign(V(762., 5000., 260.), 0., "SULFUR & CO.", FC(255, 220, 80), 50.);
	GM.NavBlockBox(BOX(V(440., 4450., 0.), V(760., 5550., 420.)), 1);

	// Platform & station
	Box(V(1575., 4000., 17.), V(750., 3400., 34.), Pal.Sidewalk, true, false);
	Building(V2(1450., 4500.), V2(1950., 5700.), 500., 0x7A9A7A, Pal.RoofDark, Pal.Cream, -1, "DEPOT");
	Box(V(1300., 3200., 300.), V(400., 1400., 16.), Pal.RoofRed, true, false);
	for (let i = 0; i < 3; ++i)
	{
		Cyl(V(1450., 2600. + i * 600., 160.), 26., 290., Pal.WoodDark, true, true);
	}
	WallBuy("Lawman AR", V(1448., 4612., 34.), 180.);

	// Gantry crane over the tracks
	Box(V(-1650., 3950., 500.), V(200., 200., 1000.), 0xD8A030);
	Box(V(1150., 3950., 500.), V(200., 200., 1000.), 0xD8A030);
	Box(V(-250., 3950., 1040.), V(3000., 160., 80.), 0xD8A030, true, false);
	Box(V(-250., 3950., 1110.), V(3000., 60., 60.), 0x9A6A20, true, false);
	Cyl(V(-300., 3950., 820.), 10., 360., Pal.MetalDark, false, false);
	Box(V(-300., 3950., 620.), V(80., 40., 60.), Pal.MetalDark, false, false);

	// Coal & crates
	Ball(V(-1600., 2600., 60.), V(600., 600., 300.), 0x2A2A2A, true);
	Ball(V(-1450., 2450., 40.), V(360., 360., 200.), 0x333333, true);
	GM.NavBlockBox(BOX(V(-1900., 2300., 0.), V(-1300., 2900., 200.)), 1);
	Crate(V(-200., 5650., 0.), 160.);
	Crate(V(-30., 5650., 0.), 140.);
	Crate(V(-120., 5650., 160.), 120.);
	Crate(V(-1550., 5300., 0.), 180.);
	Crate(V(-1550., 5300., 180.), 140.);
	Crate(V(-1550., 5300., 320.), 100.);
	for (let i = 0; i < 3; ++i)
	{
		StreetLamp(V(1250., 2500. + i * 1400., 34.), 180.);
	}
	Lamp(V(-250., 3950., 980.), LC(1., 0.6, 0.3), 14., 1600., false);

	JumpPad(V(-250., 3000., 0.), V(-250., 3950., 1140.));

	SpawnAt(V(-1700., 3500., 0.), 3);
	SpawnAt(V(-1700., 5800., 0.), 3);
	SpawnAt(V(100., 2300., 0.), 3);
	SpawnAt(V(-100., 5200., 0.), 3);
	SpawnAt(V(1000., 3000., 0.), 3);
	SpawnAt(V(-150., 4250., 0.), 3);
}

export function BuildPlaza(M, GM) {
  const { Box, BoxRot, Glow, Cyl, Ball, ConeShape, Blocker, Ramp, Floor, Wall, Lamp, Sign, Building, StreetLamp, Barrel, Crate, Cactus, PalmTree, DeadTree, Car, Wagon, Headstone, Boxcar, Mesa, JumpPad, Billboard, Station, WallBuy, Door, SpawnAt, AddInstance, Foliage, SurfaceDecal, RotFromXY, Arch, Wedge, Pyramid, Oct, Ring, Mausoleum, Fountain, GasPump, BoxYaw } = M;
	for (let s = -1; s <= 1; s += 2)
	{
		Fountain(V(-1400., s * 1300., 0.));
	}
	PalmTree(V(-1700., -1700., 0.), 700.);
	PalmTree(V(-1700., 1700., 0.), 650.);
	PalmTree(V(1700., -1700., 0.), 720.);
	PalmTree(V(1700., 1700., 0.), 680.);
	PalmTree(V(1450., -900., 0.), 600.);
	PalmTree(V(1450., 900., 0.), 620.);
	for (let i = 0; i < 4; ++i)
	{
		StreetLamp(V(-1200. + i * 800., -1750., 0.), 90.);
		StreetLamp(V(-1200. + i * 800., 1750., 0.), -90.);
	}
	// Benches
	for (let i = 0; i < 3; ++i)
	{
		Box(V(1200., -400. + i * 400., 45.), V(70., 240., 10.), Pal.Wood, true, true);
		Box(V(1236., -400. + i * 400., 80.), V(8., 240., 50.), Pal.Wood, false, false);
		Box(V(1200., -400. + i * 400. - 100., 22.), V(70., 8., 44.), Pal.MetalDark, false, false);
		Box(V(1200., -400. + i * 400. + 100., 22.), V(70., 8., 44.), Pal.MetalDark, false, false);
	}

	JumpPad(V(-1450., -600., 0.), V(-400., -500., 960.));
	JumpPad(V(-1450., 600., 0.), V(-400., 500., 960.));
	JumpPad(V(1300., -1500., 0.), V(400., -700., 960.));

	SpawnAt(V(-1750., -1550., 0.), 4);
	SpawnAt(V(1750., -1350., 0.), 4);
	SpawnAt(V(-1750., 1550., 0.), 4);
	SpawnAt(V(1750., 1350., 0.), 4);
	SpawnAt(V(1200., -1300., 0.), 4);
	SpawnAt(V(1200., 1300., 0.), 4);
}

export function BuildPlazaCentre(M, GM) {
  const { Box, BoxRot, Glow, Cyl, Ball, ConeShape, Blocker, Ramp, Floor, Wall, Lamp, Sign, Building, StreetLamp, Barrel, Crate, Cactus, PalmTree, DeadTree, Car, Wagon, Headstone, Boxcar, Mesa, JumpPad, Billboard, Station, WallBuy, Door, SpawnAt, AddInstance, Foliage, SurfaceDecal, RotFromXY, Arch, Wedge, Pyramid, Oct, Ring, Mausoleum, Fountain, GasPump, BoxYaw } = M;
  // The casino is gone. The square is open ground around a dead clock tower: the workbench and an ammo crate
  // stand at its foot, and the mystery box starts here before it wanders.
  const Stone = 0x4a4750, StoneD = 0x2e2c34, Iron = 0x1e1e24;
  Cyl(V(0., 0., 4.), 1500., 8., 0x5a5560, false, false); Cyl(V(0., 0., 7.), 1380., 8., 0x45424c, false, false);
  for (let k = 0; k < 12; ++k) { const a = k * 30 * Math.PI / 180; Box(V(Math.cos(a) * 610., Math.sin(a) * 610., 9.), V(240., 14., 6.), StoneD, false, false, k * 30); }
  // the tower: a square shaft, buttressed, its clock stopped and its crown broken off
  Box(V(0., 0., 30.), V(520., 520., 60.), StoneD, true, true);
  Box(V(0., 0., 760.), V(340., 340., 1400.), Stone, true, true);
  for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { Box(V(sx * 190., sy * 190., 420.), V(90., 90., 840.), StoneD, true, false); Box(V(sx * 190., sy * 190., 860.), V(70., 70., 60.), Iron, false, false); }
  Box(V(0., 0., 1470.), V(400., 400., 30.), StoneD, true, false);
  BoxRot(V(60., -40., 1560.), V(260., 300., 180.), Stone, R(0., 14., 9.), true);
  BoxRot(V(-120., 90., 1620.), V(120., 140., 220.), StoneD, R(8., -20., -14.), false);
  for (const [nx, ny, yaw] of [[1, 0, 0], [-1, 0, 180], [0, 1, 90], [0, -1, -90]]) {
    Cyl(V(nx * 174., ny * 174., 1180.), 230., 8., 0xb8ad94, false, false, R(nx ? 90. : 0., 0., ny ? 90. : 0.));
    Cyl(V(nx * 178., ny * 178., 1180.), 250., 4., Iron, false, false, R(nx ? 90. : 0., 0., ny ? 90. : 0.));
    Box(V(nx * 181., ny * 181., 1215.), nx ? V(4., 8., 80.) : V(8., 4., 80.), Iron, false, false);
    Box(V(nx * 181. + (nx ? 0 : 24.), ny * 181. + (ny ? 0 : 24.), 1190.), nx ? V(4., 60., 8.) : V(60., 4., 8.), Iron, false, false);
    Glow(V(nx * 176., ny * 176., 700.), nx ? V(6., 60., 140.) : V(60., 6., 140.), 0xff9a4a, 0);   // a lit slit window on each face
  }
  // a gibbet arm and its chain, because this town did its hanging here
  Box(V(330., 0., 1000.), V(360., 26., 26.), 0x3a2a22, true, false); Box(V(200., 0., 900.), V(26., 26., 220.), 0x3a2a22, false, false, 0.);
  Box(V(480., 0., 860.), V(6., 6., 260.), Iron, false, false); Cyl(V(480., 0., 700.), 70., 90., Iron, false, false);
  for (const [x, y] of [[700., 700.], [-700., 700.], [700., -700.], [-700., -700.]]) StreetLamp(V(x, y, 0.), 0.);
  for (const [x, y, s] of [[-540., -220., 1.], [-600., -60., 0.8], [520., 420., 0.9]]) Headstone(V(x, y, 0.), s * 40.);
  DeadTree(V(-960., 360., 0.), 520.); DeadTree(V(960., -330., 0.), 440.);   // clear of the lamps: a tree and a lamp post two metres apart wedged the big bosses
  Station('HighRoller', V(-40., -620., 0.), -90., 2500, -1, "Workbench");
  Station('AmmoCrate', V(-620., 60., 0.), 180., 250, -1, "Ammo");
}

export function BuildMesa(M, GM) {
  const { Box, BoxRot, Glow, Cyl, Ball, ConeShape, Blocker, Ramp, Floor, Wall, Lamp, Sign, Building, StreetLamp, Barrel, Crate, Cactus, PalmTree, DeadTree, Car, Wagon, Headstone, Boxcar, Mesa, JumpPad, Billboard, Station, WallBuy, Door, SpawnAt, AddInstance, Foliage, SurfaceDecal, RotFromXY, Arch, Wedge, Pyramid, Oct, Ring, Mausoleum, Fountain, GasPump, BoxYaw } = M;
	Mesa(V2(3300., -4700.), V2(1200., 1400.), 300.);
	Mesa(V2(4700., -4300.), V2(1000., 1200.), 650.);
	Mesa(V2(5300., -2600.), V2(1000., 1400.), 950.);
	Mesa(V2(3700., -2200.), V2(900., 900.), 450.);
	Mesa(V2(4500., 1000.), V2(1400., 1100.), 350.);
	Mesa(V2(5300., 2800.), V2(1000., 1500.), 850.);
	Mesa(V2(3500., 3300.), V2(1000., 900.), 550.);
	Mesa(V2(4700., 5000.), V2(1400., 1200.), 700.);
	Ramp(V(2150., -5100., 0.), V(2720., -5100., 300.), 260., Pal.Wood);
	Ramp(V(3350., 1300., 0.), V(3820., 1300., 350.), 260., Pal.Wood);
	// Plank bridge between M1 and M2
	Ramp(V(3850., -4500., 310.), V(4220., -4500., 650.), 180., Pal.Wood);

	// Giant skeleton: spine on stilts with ribs arching to the ground.
	for (let i = 0; i < 8; ++i)
	{
		let Y = -1300. + i * 330.;
		Box(V(3000., Y, 690.), V(160., 280., 120.), Pal.Bone, true, false);
		Box(V(3000., Y + 165., 690.), V(120., 50., 90.), 0xC8BEA4, true, false);
		for (let s = -1; s <= 1; s += 2)
		{
			// rib arc: a curved chain of tapering bone segments with knuckled joints
			let RP = [[120., 680.], [300., 662.], [450., 590.], [560., 470.], [625., 320.], [640., 160.], [625., 0.]];
			let Pts = RP.map(([x, z]) => V(3000. + s * x, Y, z));
			let D = Pts[Pts.length - 1];
			for (let k = 0; k < Pts.length - 1; ++k)
			{
				let Seg = Pts[k + 1].sub(Pts[k]);
				let Xd = Seg.GetSafeNormal();
				let w = 66. - k * 6.;
				AddInstance(0, Pts[k].add(Pts[k + 1]).mul(0.5), V(Seg.Size() + 16., w, w * 0.8), RotFromXY(Xd, V(0., 1., 0.)), k % 2 ? 0xE6DCC2 : Pal.Bone, true, false, false);
				Ball(Pts[k + 1], V(w * 1.15), 0xD8CCB0, false);
			}
			GM.NavBlockBox(BOX(D.sub(V(40., 40., 0.)), D.add(V(40., 40., 200.))), 1);
		}
	}
	// Neck: the last vertebrae step down from the spine to the skull, which lies on the ground with its jaw in the dirt
	for (const [y, z, w] of [[1240., 650., 150.], [1345., 575., 140.], [1440., 490., 130.]]) { Box(V(3000., y, z), V(w, 130., 110.), Pal.Bone, true, false); Box(V(3000., y + 62., z - 30.), V(w - 40., 40., 80.), 0xC8BEA4, false, false); }
	// Skull
	Ball(V(3000., 1700., 250.), V(560., 520., 480.), Pal.Bone, true);
	Ball(V(3000., 1950., 118.), V(380., 300., 240.), 0xD8CCB0, true);
	Ball(V(2860., 1925., 310.), V(120.), 0x1A1214, false);
	Ball(V(3140., 1925., 310.), V(120.), 0x1A1214, false);
	Glow(V(2860., 1975., 310.), V(30.), 0xFF3020, 2);
	Glow(V(3140., 1975., 310.), V(30.), 0xFF3020, 2);
	ConeShape(V(2790., 1660., 520.), V(110., 110., 320.), Pal.Bone, true, R(0., 0., -25.));
	ConeShape(V(3210., 1660., 520.), V(110., 110., 320.), Pal.Bone, true, R(0., 0., 25.));
	GM.NavBlockBox(BOX(V(2720., 1180., 0.), V(3280., 2110., 500.)), 1);
	Lamp(V(3000., 2000., 380.), LC(1., 0.2, 0.1), 16., 900., false);

	// Old mine
	Box(V(5800., -200., 400.), V(500., 1200., 800.), Pal.RockA);
	Box(V(5548., -200., 180.), V(10., 360., 360.), 0x0E0A08, false, false);
	Box(V(5540., -390., 190.), V(30., 30., 380.), Pal.WoodDark, false, false);
	Box(V(5540., -10., 190.), V(30., 30., 380.), Pal.WoodDark, false, false);
	Box(V(5540., -200., 390.), V(30., 420., 30.), Pal.WoodDark, false, false);
	Sign(V(5520., -200., 450.), 180., "SULFUR MINE - KEEP OUT", FC(255, 230, 120), 40.);
	Glow(V(5560., -200., 150.), V(10., 200., 200.), 0xFFAA33);
	Lamp(V(5450., -200., 250.), LC(1., 0.6, 0.2), 14., 900., false);

	// Campfires & cacti
	let Fires = [ V(2600., -3200., 0.), V(4200., -600., 0.), V(2700., 4800., 0.) ];
	for (const F of Fires)
	{
		for (let i = 0; i < 6; ++i)
		{
			Ball(F.add(R(0., i * 60., 0.).Vector().mul(70.)).add(V(0, 0, 10.)), V(50., 50., 30.), Pal.StoneDark, false);
		}
		Glow(F.add(V(0, 0, 40.)), V(70., 70., 80.), 0xFF7A1A, 3);
		Lamp(F.add(V(0, 0, 120.)), LC(1., 0.5, 0.2), 14., 1200., false);
	}
	let Cacti = [ V(2500., -2400., 0.), V(4100., -5600., 0.), V(5700., -5300., 0.), V(4200., 2400., 0.),
		V(2600., 3000., 0.), V(5700., 4200., 0.), V(3600., 5700., 0.), V(5600., 600., 0.) ];
	for (let i = 0; i < 8; ++i)
	{
		Cactus(Cacti[i], 220. + (i % 3) * 80.);
	}

	JumpPad(V(4300., -3000., 0.), V(5300., -2600., 970.));
	JumpPad(V(4300., 2700., 0.), V(5300., 2800., 870.));
	JumpPad(V(3700., 4350., 0.), V(4500., 4950., 720.));
	JumpPad(V(2450., -145., 0.), V(3000., -145., 770.));

	Station('AmmoCrate', V(2400., -2600., 0.), 0., 2000, -1, "Ammo");

	SpawnAt(V(2400., -5600., 0.), 5);
	SpawnAt(V(2400., -1500., 0.), 5);
	SpawnAt(V(2400., 2500., 0.), 5);
	SpawnAt(V(2400., 5600., 0.), 5);
	SpawnAt(V(4100., -700., 0.), 5);
	SpawnAt(V(5600., -1000., 0.), 5);
	SpawnAt(V(5700., 4000., 0.), 5);
	SpawnAt(V(3300., 5700., 0.), 5);
}

// The crypt: a round chamber far below the town, reached only through the hatch that opens when the
// Gravedigger dies. A great seal cut into the floor, a ring of columns, cairns of stacked stone and hanging lamps.
export const VAULT = { X: 0, Y: 24000, R: 1500 };
export function BuildVault(M, GM, TH) {
  const { Box, Glow, Cyl, Ball, Lamp, Sign } = M;
  // the last room is the same shape on every map; each map dresses it in its own colours
  const T = Object.assign({ floor: 0x1a0e14, floor2: 0x2a141c, wedgeA: 0x6f6a5e, wedgeB: 0x121016, glow: 0xFFCD5A, colA: 0x3a1420, colB: 0x2a0e18, cap: 0xFFCD5A, slit: 0xFF4A2A, lamp: [1., 0.3, 0.15], cairn: [0x5a5348, 0x7a7264, 0x4a443c, 0x8f8672], chand: 0xFFCD5A, chandGlow: 0xFFE27A, chandLamp: [1., 0.75, 0.35], sign: 'NO ONE LEAVES DEADWATER', signCol: [255, 205, 90] }, TH || {});
  const C = V(VAULT.X, VAULT.Y, 0.), R0 = VAULT.R;
  Cyl(C.add(V(0, 0, -40.)), R0 * 2 + 500., 80., T.floor, true, false);                    // floor slab
  Cyl(C.add(V(0, 0, 1.)), R0 * 2 + 60., 2., T.floor2, false, false);
  // the seal: wedges of pale stone and black slate round a glowing hub
  for (let i = 0; i < 16; ++i)
  {
    const a = (i + 0.5) / 16 * Math.PI * 2;
    for (let k = 1; k <= 4; ++k)
    {
      const r = k * 320.;
      Cyl(C.add(V(Math.cos(a) * r, Math.sin(a) * r, 2.5)), 150. + k * 60., 1., (i & 1) ? T.wedgeA : T.wedgeB, false, false);
    }
  }
  Glow(C.add(V(0, 0, 4.)), V(360., 360., 3.), T.glow, 1);
  for (let i = 0; i < 4; ++i) { const a = i / 4 * Math.PI * 2 + 0.4; Glow(C.add(V(Math.cos(a) * (R0 - 40.), Math.sin(a) * (R0 - 40.), 4.)), V(120., 120., 3.), T.glow, 1); }
  // wall of columns with gold caps, and a dark drum behind them
  for (let i = 0; i < 44; ++i)
  {
    const a = i / 44 * Math.PI * 2, P = C.add(V(Math.cos(a) * (R0 + 110.), Math.sin(a) * (R0 + 110.), 0));
    Cyl(P.add(V(0, 0, 450.)), 235., 900., (i & 1) ? T.colA : T.colB, true, false);
    Cyl(P.add(V(0, 0, 915.)), 270., 30., T.cap, false, false);
    if (i % 4 === 0) { Glow(P.add(V(-Math.cos(a) * 130., -Math.sin(a) * 130., 520.)), V(60., 60., 90.), T.slit, 3); Lamp(P.add(V(-Math.cos(a) * 200., -Math.sin(a) * 200., 520.)), LC(T.lamp[0], T.lamp[1], T.lamp[2]), 12., 1300., false); }
  }
  // cairns along the edge
  for (let i = 0; i < 12; ++i)
  {
    const a = i / 12 * Math.PI * 2 + 0.13, P = C.add(V(Math.cos(a) * (R0 - 150.), Math.sin(a) * (R0 - 150.), 0)), n = 3 + (i * 7) % 5;
    for (let k = 0; k < n; ++k) Cyl(P.add(V((k % 2) * 9., (k % 3) * 5., 12. + k * 24.)), 120. - k * 9., 22., T.cairn[(i + k) % 4], k === 0, false);
  }
  // chandeliers
  for (let i = 0; i < 5; ++i)
  {
    const a = i / 4 * Math.PI * 2, r = i === 4 ? 0. : 760., P = C.add(V(Math.cos(a) * r, Math.sin(a) * r, 880.));
    Cyl(P, 260., 16., T.chand, false, false); Glow(P.add(V(0, 0, -30.)), V(180., 180., 40.), T.chandGlow, 1);
    Lamp(P.add(V(0, 0, -80.)), LC(T.chandLamp[0], T.chandLamp[1], T.chandLamp[2]), 16., 1800., false);
  }
  Sign(C.add(V(-R0 + 60., 0, 620.)), 0., T.sign, FC(T.signCol[0], T.signCol[1], T.signCol[2]), 90.);
}

// The outskirts: four districts built for moving fast. Blocks of flat-roofed buildings at mixed heights with ramps up,
// plank bridges between neighbours, and masts, water towers and cranes to grapple from. Laid out on a street grid so
// there is always open ground between blocks.
export function BuildOutskirts(M, GM) {
  const { Box, Cyl, Glow, Floor, Ramp, StreetLamp, Barrel, Crate, Cactus, Car, SpawnAt, Lamp } = M;
  const DOORS = [[-1600, -6000], [6000, -4300], [6000, 3850], [-1450, 6000], [-6000, -8000], [8000, -6000], [6000, 8000], [-8000, 6000], [-10600, -2000], [2000, -10600], [10600, 2000], [-2000, 10600]];
  const ZONES = [
    { z: 7, x0: -10500, y0: -10500, x1: -6000, y1: 6000, ground: 0x8a6f52, walls: [0x9c6b4a, 0x7a5a48, 0xb08a5a, 0x6a5a52], roof: 0x4a3a34, trim: 0x3a2a26 },
    { z: 8, x0: -6000, y0: -10500, x1: 10500, y1: -6000, ground: 0x7a7a52, walls: [0x8a3a2a, 0xa8926a, 0x6a4a3a, 0x9a8a72], roof: 0x3a3430, trim: 0xc8b48a },
    { z: 9, x0: 6000, y0: -6000, x1: 10500, y1: 10500, ground: 0x5a5a62, walls: [0x6a7078, 0x4a5058, 0x8a4a2a, 0x7a8088], roof: 0x2a2c32, trim: 0xe0ac2a },
    { z: 10, x0: -10500, y0: 6000, x1: 6000, y1: 10500, ground: 0x6e6a5a, walls: [0x5a6a5a, 0x7a6a4a, 0x8a7a6a, 0x4a4a52], roof: 0x33302c, trim: 0x8a8a90 },
  ];
  const rnd = (a, b) => FMath.FRandRange(a, b), CELL = 1500;
  for (const Z of ZONES) {
    Floor(V2(Z.x0, Z.y0), V2(Z.x1, Z.y1), 1., Z.ground);
    const nx = Math.floor((Z.x1 - Z.x0 - 600) / CELL), ny = Math.floor((Z.y1 - Z.y0 - 600) / CELL), ox = (Z.x1 - Z.x0 - nx * CELL) / 2, oy = (Z.y1 - Z.y0 - ny * CELL) / 2;
    const grid = [], free = [];
    for (let i = 0; i < nx; ++i) for (let j = 0; j < ny; ++j) {
      const cx = Z.x0 + ox + (i + 0.5) * CELL, cy = Z.y0 + oy + (j + 0.5) * CELL;
      if (DOORS.some(([dx, dy]) => Math.hypot(cx - dx, cy - dy) < 1300)) { free.push([cx, cy]); continue; }
      const roll = rnd(0, 1);
      if (M.AreaBlocked && M.AreaBlocked(cx - 700, cy - 700, cx + 700, cy + 700)) continue;   // something already stands here (cliff, mesa, an old-town building): leave it be
      if (roll < 0.6) {
        const w = rnd(620, 1000), d = rnd(620, 1000), H = [380, 380, 560, 560, 820, 1100, 1500][Math.floor(rnd(0, 6.99))], col = Z.walls[Math.floor(rnd(0, 3.99))];
        const bx = cx + rnd(-80, 80), by = cy + rnd(-80, 80);
        Box(V(bx, by, H * 0.5), V(w, d, H), col);                                             // the building
        Box(V(bx, by, H + 8.), V(w + 24., d + 24., 16.), Z.roof, true, false);                // roof slab
        for (const s of [-1, 1]) { Box(V(bx + s * (w / 2 + 2.), by, H + 40.), V(16., d + 24., 50.), Z.trim, true, false); Box(V(bx, by + s * (d / 2 + 2.), H + 40.), V(w + 24., 16., 50.), Z.trim, true, false); }
        for (let f = 1; f * 280 < H - 80; ++f) Box(V(bx, by, f * 280.), V(w + 6., d + 6., 12.), Z.trim, false, false);   // floor bands
        const top = rnd(0, 1);
        if (top < 0.3) { for (const [lx, ly] of [[-50, -50], [50, -50], [-50, 50], [50, 50]]) Box(V(bx + lx, by + ly, H + 110.), V(14., 14., 190.), Z.trim, true, false); Cyl(V(bx, by, H + 300.), 210., 200., 0x8a5a3a, true, false); Cyl(V(bx, by, H + 410.), 230., 20., Z.roof, true, false); }   // water tower
        else if (top < 0.65) { Box(V(bx + w * 0.3, by - d * 0.3, H + 320.), V(18., 18., 620.), 0x2a2a30, true, false); Box(V(bx + w * 0.3, by - d * 0.3, H + 560.), V(160., 12., 12.), 0x2a2a30, true, false); Glow(V(bx + w * 0.3, by - d * 0.3, H + 640.), V(26., 26., 26.), 0xFF3A2A, 3); }   // radio mast with a beacon
        else if (top < 0.85) { Box(V(bx, by + d * 0.3, H + 60.), V(180., 120., 90.), 0x6a707c, true, false); Box(V(bx - w * 0.25, by - d * 0.2, H + 45.), V(110., 110., 60.), 0x5a606c, true, false); }   // rooftop units
        if (H <= 560 && rnd(0, 1) < 0.6) { const side = rnd(0, 1) < 0.5 ? -1 : 1; Ramp(V(bx + side * (w / 2 + 40.), by - d / 2 + 60., 0.), V(bx + side * (w / 2 + 40.), by + d / 2 - 60., H + 16.), 110., Z.trim); }   // a way up from the street
        grid.push({ i, j, bx, by, w, d, H });
      } else {
        free.push([cx, cy]);
        if (roll < 0.72) {   // crane: the best grapple point on the block
          for (const [lx, ly] of [[-90, -90], [90, -90], [-90, 90], [90, 90]]) Box(V(cx + lx, cy + ly, 900.), V(26., 26., 1800.), 0xe0ac2a, true, true);   // taller than any roof, so the arm clears them
          for (let f = 1; f <= 5; ++f) Box(V(cx, cy, f * 300.), V(210., 210., 14.), 0xe0ac2a, false, false);
          Box(V(cx, cy, 1820.), V(240., 240., 40.), 0x2a2a30, true, false); Box(V(cx + 180., cy, 1870.), V(820., 40., 40.), 0xe0ac2a, true, false); Box(V(cx - 300., cy, 1870.), V(220., 120., 100.), 0x4a4a52, true, false);
          Box(V(cx + 540., cy, 1700.), V(8., 8., 300.), 0x2a2a30, false, false); Box(V(cx + 540., cy, 1530.), V(50., 50., 50.), 0x2a2a30, true, false);
        } else if (roll < 0.86) { for (let k = 0; k < 4; ++k) { const px = cx + rnd(-350, 350), py = cy + rnd(-350, 350); if (k % 2) Crate(V(px, py, 0.), rnd(70, 130)); else Barrel(V(px, py, 0.), [0x8a3a2a, 0x3a5a6a, 0x6a6a3a][k % 3]); } }
        else if (roll < 0.93) Car(V(cx + rnd(-200, 200), cy + rnd(-200, 200), 0.), rnd(0, 360), [0x8a3a2a, 0x3a5a6a, 0x8a7a4a][Math.floor(rnd(0, 2.99))]);
        else Cactus(V(cx + rnd(-300, 300), cy + rnd(-300, 300), 0.), rnd(180, 320));
      }
    }
    // plank bridges between neighbouring roofs of similar height
    for (const A of grid) for (const B of grid) {
      if (!((B.i === A.i + 1 && B.j === A.j) || (B.j === A.j + 1 && B.i === A.i)) || Math.abs(A.H - B.H) > 200) continue;
      const along = B.i !== A.i, h = Math.min(A.H, B.H) + 22.;
      if (along) { const x0 = A.bx + A.w / 2, x1 = B.bx - B.w / 2, y = (A.by + B.by) / 2; if (x1 > x0 && Math.abs(A.by - B.by) < 300) Box(V((x0 + x1) / 2, y, h), V(x1 - x0 + 60., 90., 12.), 0x6a4a32, true, false); }
      else { const y0 = A.by + A.d / 2, y1 = B.by - B.d / 2, x = (A.bx + B.bx) / 2; if (y1 > y0 && Math.abs(A.bx - B.bx) < 300) Box(V(x, (y0 + y1) / 2, h), V(90., y1 - y0 + 60., 12.), 0x6a4a32, true, false); }
    }
    // spawns and a few lamps on open ground
    free.forEach(([fx, fy], k) => { if (k % 2 === 0) SpawnAt(V(fx + rnd(-200, 200), fy + rnd(-200, 200), 0.), Z.z); else if (k % 5 === 1) StreetLamp(V(fx + 500., fy + 500., 0.), rnd(0, 360)); });
    for (let k = 0; k < 6; ++k) SpawnAt(V(rnd(Z.x0 + 500, Z.x1 - 500), rnd(Z.y0 + 500, Z.y1 - 500), 0.), Z.z);
  }
}

// The Badlands: one open ring around the whole town, built for moving fast. Rock spires and arches to grapple and
// wall-run, buttes to climb, and a skyway of plank spans on posts that circles the entire map above the ground.
export function BuildBadlands(M, GM) {
  const { Box, Cyl, Glow, Floor, Ramp, Cactus, DeadTree, Car, SpawnAt, StreetLamp, Lamp, Mesa } = M;
  const rnd = (a, b) => FMath.FRandRange(a, b), ZN = 11, IN = 10700, OUT = 14900, SKY = 12800, SH = 620;
  const GATES = [[-10600, -2000], [2000, -10600], [10600, 2000], [-2000, 10600]];
  const Rock = [Pal.RockA, Pal.RockB, Pal.RedRock];
  // red hardpan underfoot, in four strips round the ring
  Floor(V2(-OUT, -OUT), V2(OUT, -IN), 1., 0x9a5a3c); Floor(V2(-OUT, IN), V2(OUT, OUT), 1., 0x9a5a3c);
  Floor(V2(-OUT, -IN), V2(-IN, IN), 1., 0x9a5a3c); Floor(V2(IN, -IN), V2(OUT, IN), 1., 0x9a5a3c);
  // ---- the skyway: spans with jumpable gaps, a tower at each corner, and a ramp up beside every gate
  const span = (x0, y0, x1, y1) => {
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, alongX = Math.abs(x1 - x0) > Math.abs(y1 - y0), len = Math.abs(alongX ? x1 - x0 : y1 - y0);
    Box(V(cx, cy, SH), alongX ? V(len, 190., 16.) : V(190., len, 16.), 0x6a4a32, true, false);
    Box(V(cx, cy, SH - 14.), alongX ? V(len, 30., 14.) : V(30., len, 14.), 0x3a2a22, false, false);
    for (const s of [-0.38, 0.38]) Box(V(cx + (alongX ? s * len : 0), cy + (alongX ? 0 : s * len), SH * 0.5 - 8.), V(26., 26., SH - 16.), 0x4a3426, true, true);
  };
  const SPAN = 1000, GAPW = 430;
  for (const side of [0, 1, 2, 3]) {
    for (let t = -SKY + 600; t + SPAN <= SKY - 600; t += SPAN + GAPW) {
      const a = t, b = t + SPAN;
      if (side === 0) span(a, -SKY, b, -SKY); else if (side === 1) span(a, SKY, b, SKY); else if (side === 2) span(-SKY, a, -SKY, b); else span(SKY, a, SKY, b);
    }
  }
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    const cx = sx * SKY, cy = sy * SKY;
    Box(V(cx, cy, SH * 0.5), V(520., 520., SH), Rock[(sx + sy + 2) % 3], true, true); Box(V(cx, cy, SH + 8.), V(700., 700., 16.), 0x6a4a32, true, false);
    Box(V(cx, cy, SH + 420.), V(30., 30., 820.), 0x2a2a30, true, false); Glow(V(cx, cy, SH + 850.), V(60.), 0xFF8A3A, 3);       // beacon mast: a grapple point you can see from anywhere
    Ramp(V(cx - sx * 1500., cy - sy * 360., 0.), V(cx - sx * 360., cy - sy * 360., SH + 16.), 170., 0x6a4a32);
  }
  for (const [gx, gy] of GATES) {
    const ox = Math.abs(gx) > Math.abs(gy) ? Math.sign(gx) : 0, oy = ox ? 0 : Math.sign(gy);
    // from just outside the gate, a ramp straight up onto the skyway
    Ramp(V(gx + ox * 700., gy + oy * 700., 0.), V(gx + ox * (SKY - 10600 - 120), gy + oy * (SKY - 10600 - 120), SH + 16.), 180., 0x6a4a32);
    for (const s of [-1, 1]) { const lx = gx + ox * 420 + (ox ? 0 : s * 420), ly = gy + oy * 420 + (ox ? s * 420 : 0); Box(V(lx, ly, 260.), V(26., 26., 520.), 0x2a2a30, true, false); Glow(V(lx, ly, 540.), V(46.), 0xFFC860, 3); }
  }
  // ---- the ground: spires, arches and buttes either side of the skyway line
  const CELL = 1150, free = [];
  for (let cx = -OUT + CELL / 2; cx < OUT; cx += CELL) for (let cy = -OUT + CELL / 2; cy < OUT; cy += CELL) {
    const d = Math.max(Math.abs(cx), Math.abs(cy));
    if (d < IN + 500 || d > OUT - 500) continue;
    if (Math.abs(d - SKY) < 520) continue;                                                     // keep the skyway's run clear
    if (GATES.some(([gx, gy]) => Math.hypot(cx - gx, cy - gy) < 2300)) { free.push([cx, cy]); continue; }
    if (Math.abs(Math.abs(cx) - SKY) < 1700 && Math.abs(Math.abs(cy) - SKY) < 1700) { free.push([cx, cy]); continue; }   // corner towers and their ramps
    const roll = rnd(0, 1), x = cx + rnd(-220, 220), y = cy + rnd(-220, 220);
    if (roll < 0.26) {   // spire with a step beside it
      const H = [520, 700, 900, 1200, 1600][Math.floor(rnd(0, 4.99))], w = rnd(260, 480), col = Rock[Math.floor(rnd(0, 2.99))], yaw = rnd(0, 90);
      Box(V(x, y, H * 0.5), V(w, w * rnd(0.8, 1.2), H), col, true, true, yaw); Box(V(x, y, H + 7.), V(w + 40., w + 40., 14.), 0x7A3A22, true, false, yaw);
      Box(V(x, y, H * 0.62), V(w + 16., w + 16., 14.), 0x7A3A22, false, false, yaw);
      const sx = x + rnd(-1, 1) * (w + 90), sy = y + (rnd(0, 1) < 0.5 ? -1 : 1) * (w + 60), h2 = H * rnd(0.4, 0.6);
      Box(V(sx, sy, h2 * 0.5), V(w * 0.7, w * 0.7, h2), Rock[Math.floor(rnd(0, 2.99))], true, true, yaw + 20.); Box(V(sx, sy, h2 + 6.), V(w * 0.7 + 30., w * 0.7 + 30., 12.), 0x7A3A22, true, false, yaw + 20.);
      if (H >= 1200) Glow(V(x, y, H + 33.), V(40.), 0xFF8A3A, 2);
    } else if (roll < 0.36) {   // arch
      const along = rnd(0, 1) < 0.5, H = rnd(520, 760), g = rnd(320, 420), col = Rock[Math.floor(rnd(0, 2.99))];
      for (const s of [-1, 1]) Box(V(x + (along ? s * g : 0), y + (along ? 0 : s * g), H * 0.5), V(240., 240., H), col, true, true);
      Box(V(x, y, H + 60.), along ? V(g * 2 + 360., 280., 120.) : V(280., g * 2 + 360., 120.), col, true, false); Box(V(x, y, H + 126.), along ? V(g * 2 + 380., 300., 12.) : V(300., g * 2 + 380., 12.), 0x7A3A22, true, false);
    } else if (roll < 0.44) {   // butte with a way up
      const sz = rnd(620, 820), H = rnd(280, 420);
      Mesa(V2(x, y), V2(sz, sz), H); Ramp(V(x - sz / 2 - 420., y, 0.), V(x - sz / 2 + 40., y, H), 150., 0x7A3A22);
    } else if (roll < 0.5) { Box(V(x, y, 700.), V(28., 28., 1400.), 0x2a2a30, true, false); Box(V(x, y, 1380.), V(260., 14., 14.), 0x2a2a30, true, false); Glow(V(x, y, 1420.), V(50.), 0x8fdcff, 3); free.push([cx, cy]); }   // signal mast
    else { free.push([cx, cy]); if (roll < 0.6) Cactus(V(x, y, 0.), rnd(200, 360)); else if (roll < 0.66) DeadTree(V(x, y, 0.), rnd(300, 460)); else if (roll < 0.7) Car(V(x, y, 0.), rnd(0, 360), [0x8a3a2a, 0x3a5a6a, 0x8a7a4a][Math.floor(rnd(0, 2.99))]); }
  }
  free.forEach(([fx, fy], k) => { if (k % 3 === 0) SpawnAt(V(fx + rnd(-250, 250), fy + rnd(-250, 250), 0.), ZN); else if (k % 9 === 1) StreetLamp(V(fx + 300., fy + 300., 0.), rnd(0, 360)); });
}
