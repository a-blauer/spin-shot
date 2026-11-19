import { V, V2, R, LC, FC, BOX, Pal, FMath } from './mapkit.js';

export function BuildGroundAndBounds(M, GM) {
  const { Box, BoxRot, Glow, Cyl, Ball, ConeShape, Blocker, Ramp, Floor, Wall, Lamp, Sign, Building, StreetLamp, Barrel, Crate, Cactus, PalmTree, DeadTree, Car, Wagon, Headstone, Boxcar, Mesa, JumpPad, Billboard, Station, WallBuy, Door, SpawnAt, AddInstance, Foliage, SurfaceDecal, RotFromXY, Arch, Wedge, Pyramid, Oct, Ring, Mausoleum, Fountain, GasPump, BoxYaw } = M;
	// Ground slab
	Box(V(0., 0., -50.), V(12600., 12600., 100.), Pal.Sand, true, false);
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

	// Outer perimeter: tall canyon walls
	let NoGaps = [];
	Wall(V2(-6100., -6100.), V2(-6100., 6100.), 950., 200., Pal.RockA, NoGaps, true);
	Wall(V2(6100., -6100.), V2(6100., 6100.), 950., 200., Pal.RockA, NoGaps, true);
	Wall(V2(-6100., -6100.), V2(6100., -6100.), 950., 200., Pal.RockA, NoGaps, true);
	Wall(V2(-6100., 6100.), V2(6100., 6100.), 950., 200., Pal.RockA, NoGaps, true);
	// Cliff tops: stacked rock strata resting on the canyon walls, stepping in as they rise
	const CliffCols = [Pal.RockA, Pal.RockB, Pal.RedRock];
	for (let i = 0; i < 26; ++i)
	{
		let T = -6200. + i * 500. + FMath.FRandRange(-60., 60.);
		const sides = [[-6150., T, 1], [6150., T, 1], [T, -6150., 0], [T, 6150., 0]];
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
	Wall(V2(-6000., -2000.), V2(-2000., -2000.), 520., 80., Pal.Adobe, Gap(1800., 2200.), true);   // Motel | Main
	Wall(V2(-2000., -6000.), V2(-2000., -2000.), 520., 80., Pal.Adobe, Gap(1800., 2200.), true);   // Motel | Chapel
	Wall(V2(-2000., -2000.), V2(-2000., 2000.), 520., 80., Pal.Adobe, Gap(1800., 2200.), true);    // Main | Plaza
	Wall(V2(-2000., 2000.), V2(-2000., 6000.), 520., 80., Pal.Adobe, Gap(1800., 2200.), true);     // Main | Rail
	Wall(V2(-2000., -2000.), V2(2000., -2000.), 520., 80., Pal.Adobe, Gap(1800., 2200.), true);    // Chapel | Plaza
	Wall(V2(-2000., 2000.), V2(2000., 2000.), 520., 80., Pal.Adobe, Gap(1800., 2200.), true);      // Plaza | Rail
	Wall(V2(2000., -6000.), V2(2000., -2000.), 520., 80., Pal.Adobe, Gap(1800., 2200.), true);     // Chapel | Mesa
	Wall(V2(2000., -2000.), V2(2000., 2000.), 520., 80., Pal.Adobe, Gap(1800., 2200.), true);      // Plaza | Mesa
	Wall(V2(2000., 2000.), V2(2000., 6000.), 520., 80., Pal.Adobe, Gap(1800., 2200.), true);       // Rail | Mesa
}

export function BuildDoors(M, GM) {
  const { Box, BoxRot, Glow, Cyl, Ball, ConeShape, Blocker, Ramp, Floor, Wall, Lamp, Sign, Building, StreetLamp, Barrel, Crate, Cactus, PalmTree, DeadTree, Car, Wagon, Headstone, Boxcar, Mesa, JumpPad, Billboard, Station, WallBuy, Door, SpawnAt, AddInstance, Foliage, SurfaceDecal, RotFromXY, Arch, Wedge, Pyramid, Oct, Ring, Mausoleum, Fountain, GasPump, BoxYaw } = M;
	Door(V(-4000., -2000., 0.), 90., 750, 0, 1);
	Door(V(-2000., -4000., 0.), 0., 1000, 0, 2);
	Door(V(-2000., 0., 0.), 0., 1000, 1, 4);
	Door(V(0., -2000., 0.), 90., 1250, 2, 4);
	Door(V(-2000., 4000., 0.), 0., 1000, 1, 3);
	Door(V(0., 2000., 0.), 90., 1250, 4, 3);
	Door(V(2000., -4000., 0.), 0., 1500, 2, 5);
	Door(V(2000., 4000., 0.), 0., 1500, 3, 5);
	Door(V(2000., 0., 0.), 0., 1500, 4, 5);
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
	Box(V(-4550., -3650., 50.), V(220., 50., 10.), Pal.Cream, false, false);
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
	WallBuy("Penny Pusher", V(-3200., -5198., 0.), 90.);

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
	Glow(V(-3150., 5350., 40.), V(120., 120., 30.), 0xFF6A1A, 1);

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
	Billboard(V(-4000., -250., 430.), 1000., 0., "THE LUCKY STIFF  >>");
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

	WallBuy("Back-Alley", V(-3002., 1300., 0.), 180.);
	WallBuy("Sawbuck", V(-5098., 300., 0.), 0.);

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
	WallBuy("Dealer's Pump", V(-468., -4800., 0.), 0.);

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
	WallBuy("Quarter Horse", V(648., -2980., 0.), 180.);

	DeadTree(V(-1200., -5300., 0.), 520.);
	DeadTree(V(1600., -2500., 0.), 460.);
	DeadTree(V(-300., -3400., 0.), 380.);
	Lamp(V(-700., -3200., 160.), LC(0.5, 1., 0.6), 8., 1200., true);
	Lamp(V(400., -2300., 160.), LC(0.5, 1., 0.6), 8., 1000., true);

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

export function BuildCasino(M, GM) {
  const { Box, BoxRot, Glow, Cyl, Ball, ConeShape, Blocker, Ramp, Floor, Wall, Lamp, Sign, Building, StreetLamp, Barrel, Crate, Cactus, PalmTree, DeadTree, Car, Wagon, Headstone, Boxcar, Mesa, JumpPad, Billboard, Station, WallBuy, Door, SpawnAt, AddInstance, Foliage, SurfaceDecal, RotFromXY, Arch, Wedge, Pyramid, Oct, Ring, Mausoleum, Fountain, GasPump, BoxYaw } = M;
	// Shell: X[-900,900] Y[-1100,1100], entrance on the -X wall.
	let H = 900.;
	let NoGap = [];
	let Entrance = [];
	Entrance.push(V2(840., 1360.));
	Wall(V2(-900., -1100.), V2(-900., 1100.), H, 80., Pal.CasinoRed, Entrance, false);
	Wall(V2(900., -1100.), V2(900., 1100.), H, 80., Pal.CasinoRed, NoGap, false);
	Wall(V2(-900., -1100.), V2(900., -1100.), H, 80., Pal.CasinoRed, NoGap, false);
	Wall(V2(-900., 1100.), V2(900., 1100.), H, 80., Pal.CasinoRed, NoGap, false);
	Box(V(-900., 0., 660.), V(80., 520., 480.), Pal.CasinoRed, true, false); // lintel
	Box(V(0., 0., H + 20.), V(1900., 2300., 40.), Pal.CasinoBlack, true, false);
	Box(V(0., 0., 3.), V(1720., 2120., 4.), Pal.Carpet, false, false);
	for (let i = -3; i <= 3; ++i)
	{
		Box(V(i * 240., 0., 6.), V(30., 2100., 2.), Pal.Gold, false, false);
	}
	// Gold trim bands and marquee bulbs on the facade
	Box(V(-948., 0., 860.), V(16., 2300., 40.), Pal.Gold, true, false);
	Box(V(-948., 0., 440.), V(16., 2300., 20.), Pal.Gold, false, false);
	for (let i = 0; i < 22; ++i)
	{
		Glow(V(-960., -1050. + i * 100., 820.), V(22.), Pal.Bulb, 2);
	}
	for (let i = 0; i < 4; ++i)
	{
		let Y = (i < 2 ? -1. : 1.) * (i % 2 ? 800. : 450.);
		Cyl(V(-980., Y, 450.), 80., 900., Pal.Gold, true, true);
	}
	// Entrance canopy (walkable)
	Box(V(-1080., 0., 440.), V(360., 900., 30.), Pal.CasinoBlack, true, false);
	Glow(V(-1080., 0., 422.), V(320., 860., 4.), Pal.Bulb);
	Box(V(-1240., -420., 210.), V(30., 30., 420.), Pal.Gold);
	Box(V(-1240., 420., 210.), V(30., 30., 420.), Pal.Gold);
	Sign(V(-1262., 0., 470.), 180., "OPEN EVERY THIRD NIGHT", FC(255, 220, 140), 34.);

	// Rooftop sign, dice and card
	Box(V(-850., 0., 1120.), V(40., 1800., 360.), Pal.CasinoBlack, true, false);
	Glow(V(-874., 0., 1290.), V(4., 1760., 14.), Pal.Neon);
	Glow(V(-874., 0., 950.), V(4., 1760., 14.), Pal.Neon);
	Sign(V(-878., 0., 1150.), 180., "THE LUCKY STIFF", FC(255, 200, 70), 190.);
	Sign(V(-878., 0., 1010.), 180., "CASINO  -  HOTEL  -  CREMATORIUM", FC(255, 120, 170), 50.);
	BoxRot(V(300., -500., 1080.), V(260.), Pal.Cream, R(20., 30., 10.), true);
	BoxRot(V(500., -150., 1060.), V(220.), Pal.CasinoRed, R(-15., 70., 25.), true);
	Glow(V(300., -500., 1080.).add(R(20., 30., 10.).RotateVector(V(132., 0, 0))), V(4., 60., 60.), 0x111111, 0, R(20., 30., 10.));
	Box(V(300., 600., 1150.), V(20., 380., 500.), Pal.Cream, true, false, -20.);
	BoxRot(V(300., 600., 1150.).add(R(0., -20., 0.).RotateVector(V(-12., 0, 0))), V(4., 140., 140.), Pal.CasinoRed, R(0., -20., 45.), false);
	Lamp(V(-1100., 0., 1150.), LC(1., 0.45, 0.65), 50., 2400., false);
	Lamp(V(-1300., 0., 300.), LC(1., 0.75, 0.4), 20., 1400., false);

	// Interior lights
	Lamp(V(-400., -500., 700.), LC(1., 0.6, 0.4), 14., 1300., true);
	Lamp(V(-400., 500., 700.), LC(1., 0.4, 0.6), 14., 1300., true);
	Lamp(V(400., -500., 700.), LC(0.6, 1., 0.6), 14., 1300., true);
	Lamp(V(400., 500., 700.), LC(1., 0.85, 0.4), 14., 1300., true);
	Cyl(V(0., 0., 760.), 500., 20., Pal.Gold, false, false);
	for (let i = 0; i < 12; ++i)
	{
		let D = R(0., i * 30., 0.).Vector();
		Glow(V(0., 0., 700.).add(D.mul(230.)), V(18., 18., 80.), 0xFFF2CC, 1);
	}

	GM.CasinoBounds = BOX(V(-900., -1100., -200.), V(900., 1100., 1200.));
	GM.CasinoOutside = V(-1550., 0., 120.);

	// Casino doors (opened by the game mode on casino nights)
	Station('Door', V(-900., 0., 0.), 0., -1, -1, "The Lucky Stiff", V(70., 520., 420.));

	// Stations
	Station('Slots', V(-300., 950., 0.), -90., 750, -1, "Fortune Slots");
	Station('Slots', V(50., 950., 0.), -90., 750, -1, "Fortune Slots");
	Station('Slots', V(400., 950., 0.), -90., 750, -1, "Fortune Slots");
	Station('ArmsRoulette', V(-100., -990., 0.), 90., 950, -1, "Arms Roulette");
	Station('MoneyTable', V(150., 0., 0.), 0., 0, -1, "Double or Nothing");
	Station('UpgradeCounter', V(780., -450., 0.), 180., 0, -1, "Pawn Counter");
	Station('StatBooth', V(780., 450., 0.), 180., 0, -1, "Tonic Bar");
	Station('HighRoller', V(550., -1040., 0.), 90., 5000, -1, "High Roller Vault");
	Station('ExitBell', V(-720., 600., 0.), 0., 0, -1, "Last Call");
	Station('AmmoCrate', V(-720., -600., 0.), 0., 0, -1, "Ammo");
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
	// Skull
	Ball(V(3000., 1650., 320.), V(560., 520., 480.), Pal.Bone, true);
	Ball(V(3000., 1900., 180.), V(380., 300., 240.), 0xD8CCB0, true);
	Ball(V(2860., 1880., 380.), V(120.), 0x1A1214, false);
	Ball(V(3140., 1880., 380.), V(120.), 0x1A1214, false);
	Glow(V(2860., 1930., 380.), V(30.), 0xFF3020, 2);
	Glow(V(3140., 1930., 380.), V(30.), 0xFF3020, 2);
	ConeShape(V(2720., 1600., 620.), V(110., 110., 320.), Pal.Bone, true, R(0., 0., -25.));
	ConeShape(V(3280., 1600., 620.), V(110., 110., 320.), Pal.Bone, true, R(0., 0., 25.));
	GM.NavBlockBox(BOX(V(2720., 1380., 0.), V(3280., 2060., 500.)), 1);
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

// The vault: a round counting room far outside the town, reached only through the hatch that opens when the
// Gravedigger dies. A roulette floor, a ring of columns, chip stacks and hanging lamps.
export const VAULT = { X: 0, Y: 9800, R: 1500 };
export function BuildVault(M, GM) {
  const { Box, Glow, Cyl, Ball, Lamp, Sign } = M;
  const C = V(VAULT.X, VAULT.Y, 0.), R0 = VAULT.R;
  Cyl(C.add(V(0, 0, -40.)), R0 * 2 + 500., 80., 0x1a0e14, true, false);                    // floor slab
  Cyl(C.add(V(0, 0, 1.)), R0 * 2 + 60., 2., 0x2a141c, false, false);
  // roulette wedges, alternating red and black, with a gold hub
  for (let i = 0; i < 16; ++i)
  {
    const a = (i + 0.5) / 16 * Math.PI * 2;
    for (let k = 1; k <= 4; ++k)
    {
      const r = k * 320.;
      Cyl(C.add(V(Math.cos(a) * r, Math.sin(a) * r, 2.5)), 150. + k * 60., 1., (i & 1) ? 0x8a1218 : 0x0e080c, false, false);
    }
  }
  Glow(C.add(V(0, 0, 4.)), V(360., 360., 3.), 0xFFCD5A, 1);
  for (let i = 0; i < 4; ++i) { const a = i / 4 * Math.PI * 2 + 0.4; Glow(C.add(V(Math.cos(a) * (R0 - 40.), Math.sin(a) * (R0 - 40.), 4.)), V(120., 120., 3.), 0xFFCD5A, 1); }
  // wall of columns with gold caps, and a dark drum behind them
  for (let i = 0; i < 44; ++i)
  {
    const a = i / 44 * Math.PI * 2, P = C.add(V(Math.cos(a) * (R0 + 110.), Math.sin(a) * (R0 + 110.), 0));
    Cyl(P.add(V(0, 0, 450.)), 235., 900., (i & 1) ? 0x3a1420 : 0x2a0e18, true, false);
    Cyl(P.add(V(0, 0, 915.)), 270., 30., 0xFFCD5A, false, false);
    if (i % 4 === 0) { Glow(P.add(V(-Math.cos(a) * 130., -Math.sin(a) * 130., 520.)), V(60., 60., 90.), 0xFF4A2A, 3); Lamp(P.add(V(-Math.cos(a) * 200., -Math.sin(a) * 200., 520.)), LC(1., 0.3, 0.15), 12., 1300., false); }
  }
  // chip stacks along the edge
  for (let i = 0; i < 12; ++i)
  {
    const a = i / 12 * Math.PI * 2 + 0.13, P = C.add(V(Math.cos(a) * (R0 - 150.), Math.sin(a) * (R0 - 150.), 0)), n = 3 + (i * 7) % 5;
    for (let k = 0; k < n; ++k) Cyl(P.add(V((k % 2) * 6., 0, 12. + k * 24.)), 120., 22., [0xc8211b, 0xf2e8d5, 0x1f8a4c, 0xFFCD5A][(i + k) % 4], k === 0, false);
  }
  // chandeliers
  for (let i = 0; i < 5; ++i)
  {
    const a = i / 4 * Math.PI * 2, r = i === 4 ? 0. : 760., P = C.add(V(Math.cos(a) * r, Math.sin(a) * r, 880.));
    Cyl(P, 260., 16., 0xFFCD5A, false, false); Glow(P.add(V(0, 0, -30.)), V(180., 180., 40.), 0xFFE27A, 1);
    Lamp(P.add(V(0, 0, -80.)), LC(1., 0.75, 0.35), 16., 1800., false);
  }
  Sign(C.add(V(-R0 + 60., 0, 620.)), 0., "THE HOUSE ALWAYS WINS", FC(255, 205, 90), 90.);
}
