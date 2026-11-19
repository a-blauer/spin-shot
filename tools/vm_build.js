	switch (W.cls)
	{
	case 'Pistol':
	{
		const bRevolver = NameHas("Six") || NameHas("Star");
		if (bRevolver)
		{
			this.Box(V(4., 0., 6.), V(12., 4.6, 7.), Metal);
			this.Part(this.gun, 1, V(5., 0., 6.), V(8.5, 8.5, 8.), MetalLight, R(90., 0., 0.));
			for (let i = 0; i < 3; ++i)
			{
				this.Part(this.gun, 1, V(9.2, -2.2 + i * 2.2, 7.5 - (i == 1 ? 1.5 : 0.)), V(1.6, 1.6, 0.6), MetalDark, R(90., 0., 0.));
			}
			this.Tube(V(19., 0., 7.), 3.4, 20., Metal);
			this.Box(V(19., 0., 9.2), V(20., 2., 1.6), MetalDark);
			this.Box(V(28., 0., 10.3), V(1.5, 1.2, 2.), Trim, null, TrimGlow);
			this.Box(V(-3., 0., -2.), V(6., 4.4, 13.), Wood, R(-18., 0., 0.));
			this.Box(V(-5.5, 0., 8.5), V(4., 2., 3.), MetalDark, R(30., 0., 0.)); // hammer
			MuzzleAt = V(29.5, 0., 7.);
			EjectAt = V(5., 3., 6.);
			SightZ = 10.5;
		}
		else
		{
			this.Box(V(6., 0., 6.5), V(20., 4.2, 5.), Metal);                  // slide
			this.Box(V(6., 0., 3.4), V(17., 3.6, 2.6), MetalDark);             // frame
			this.Box(V(6., 2.2, 7.), V(4., 0.4, 2.), Accent, null, 0.3);
			this.Box(V(-1., 0., -2.5), V(5.6, 3.8, 12.), Wood, R(-15., 0., 0.));
			this.Box(V(15.5, 0., 9.4), V(1.4, 1.2, 1.6), Trim, null, TrimGlow);
			this.Box(V(-3., 0., 9.4), V(1.6, 3., 1.6), MetalDark);
			MuzzleAt = V(16.5, 0., 6.5);
			SightZ = 10.;
		}
		this.MagRoot = this.scene_(V(-1., 0., -6.));
		this.Box(V(0., 0., -3.), V(4.4, 3., 4.), MetalDark, R(-15., 0., 0.), 0., this.MagRoot);
		if (NameHas("Snake"))
		{
			// twin pistol: a second gun in the support hand
			this.Box(V(10., -12., 4.), V(20., 4.2, 5.), Metal);
			this.Box(V(3., -12., -4.), V(5.6, 3.8, 11.), Wood, R(-15., 0., 0.));
			SupportRest = V(3., -12., -4.);
		}
		else
		{
			SupportRest = V(0., -4.5, -4.);  // cupping the trigger hand
		}
		BarrelLen = 18.;
		break;
	}
	case 'SMG':
	{
		this.Box(V(8., 0., 6.), V(28., 5., 7.), Metal);
		this.Box(V(8., 0., 10.), V(22., 2., 1.2), MetalDark);
		this.Tube(V(28., 0., 6.5), 3., 12., MetalDark);
		this.Box(V(-1., 0., -2.), V(5., 4., 11.), MetalDark, R(-12., 0., 0.));
		this.Box(V(-12., 0., 5.), V(16., 2.6, 3.), MetalDark);                   // wire stock
		this.Box(V(-19., 0., 3.), V(2., 3., 8.), MetalDark);
		this.Box(V(14., 2.6, 6.), V(10., 0.4, 4.), Accent, null, 0.25);
		this.Box(V(2., 0., 11.2), V(5., 3., 2.6), MetalDark);
		this.Box(V(16., 0., 11.), V(1.4, 1.2, 2.), Trim, null, TrimGlow);
		this.MagRoot = this.scene_(V(9., 0., 2.));
		this.Box(V(0., 0., -7.), V(4., 2.8, 14.), MetalDark, R(8., 0., 0.), 0., this.MagRoot);
		MuzzleAt = V(34., 0., 6.5);
		SupportRest = V(20., 0., 2.);
		SightZ = 12.;
		break;
	}
	case 'Rifle':
	case 'Sniper':
	{
		const bSniper = W.cls == 'Sniper';
		const bRail = NameHas("Rail");
		const Furn = bRail ? Metal : (NameHas("Jackpot") ? hex(0xD9A52A) : Wood);
		this.Box(V(6., 0., 6.), V(26., 5., 7.), Metal);                          // receiver
		this.Box(V(28., 0., 5.), V(22., 5.4, 6.), Furn);                         // handguard
		this.Tube(V(bSniper ? 50. : 44., 0., 6.), 2.8, bSniper ? 34. : 22., MetalDark);
		this.Box(V(-14., 0., 3.), V(20., 4.6, 8.), Furn, R(-6., 0., 0.)); // stock
		this.Box(V(-1., 0., -2.), V(5., 4., 11.), Furn, R(-14., 0., 0.));
		this.Box(V(22., 2.9, 5.), V(16., 0.4, 2.), Accent, null, bRail ? 1.2 : 0.25);
		this.Box(V(22., -2.9, 5.), V(16., 0.4, 2.), Accent, null, bRail ? 1.2 : 0.25);
		if (bSniper)
		{
			this.Tube(V(6., 0., 13.), 5., 22., MetalDark);
			this.Tube(V(-5.5, 0., 13.), 6., 3., Metal);
			this.Tube(V(17.5, 0., 13.), 6.4, 3., Metal);
			this.Box(V(6., 0., 10.), V(4., 2., 3.), MetalDark);
			this.Part(this.gun, 2, V(10., 4., 7.), V(3.), MetalLight);  // bolt knob
			SightZ = 13.;
		}
		else
		{
			this.Box(V(4., 0., 11.), V(8., 3.4, 3.), MetalDark);                    // red-dot body
			this.Box(V(6.5, 0., 12.5), V(0.6, 2.2, 2.2), hex(0xFF3A2A), null, 2.);
			SightZ = 12.5;
		}
		this.MagRoot = this.scene_(V(12., 0., 2.));
		this.Box(V(0., 0., -6.), V(5., 3.2, 12.), MetalDark, R(12., 0., 0.), 0., this.MagRoot);
		MuzzleAt = V(bSniper ? 67. : 55., 0., 6.);
		SupportRest = V(28., 0., 1.5);
		BarrelLen = MuzzleAt.X;
		break;
	}
	case 'Shotgun':
	{
		const bDouble = NameHas("Sawbuck");
		const bDrum = NameHas("Full House");
		this.Box(V(4., 0., 6.), V(18., 5.4, 7.), Metal);
		if (bDouble)
		{
			this.Tube(V(30., -1.8, 7.), 3.8, 38., MetalDark);
			this.Tube(V(30., 1.8, 7.), 3.8, 38., MetalDark);
			this.Box(V(22., 0., 4.), V(18., 6., 3.), Wood);
			SupportRest = V(22., 0., 1.);
		}
		else
		{
			this.Tube(V(32., 0., 8.), 3.8, 40., MetalDark);
			this.Tube(V(30., 0., 3.8), 3.4, 34., Metal);                                   // magazine tube
			this.PumpRoot = this.scene_(V(24., 0., 3.8));
			this.Part(this.PumpRoot, 1, V(0,0,0), V(6., 6., 13.), Wood, R(90., 0., 0.));
			for (let i = 0; i < 3; ++i)
			{
				this.Part(this.PumpRoot, 1, V(-4. + i * 4., 0., 0.), V(6.4, 6.4, 0.8), hex(0x5A3220), R(90., 0., 0.));
			}
			SupportRest = V(24., 0., 1.);
		}
		this.Box(V(-14., 0., 3.), V(22., 5., 8.), Wood, R(-8., 0., 0.));
		this.Box(V(-1., 0., -2.), V(5., 4., 10.), Wood, R(-16., 0., 0.));
		this.Box(V(49., 0., 10.), V(1.4, 1.4, 1.4), Trim, null, 0.4 + TrimGlow);
		this.Box(V(10., 2.9, 6.), V(8., 0.4, 3.), Accent, null, 0.25);
		if (bDrum)
		{
			this.MagRoot = this.scene_(V(8., 0., 1.));
			this.Part(this.MagRoot, 1, V(0., 0., -6.), V(13., 13., 6.), MetalDark, R(0., 0., 90.));
		}
		else
		{
			this.MagRoot = this.scene_(V(6., 0., 5.));
			this.Part(this.MagRoot, 1, V(0., 0., 0.), V(3.4, 3.4, 6.), hex(0xC8202A), R(90., 0., 0.)); // shell in hand
			this.Part(this.MagRoot, 1, V(-3.2, 0., 0.), V(3.6, 3.6, 1.2), Brass, R(90., 0., 0.));
		}
		MuzzleAt = V(51., 0., 8.);
		SightZ = 10.5;
		BarrelLen = 50.;
		break;
	}
	case 'LMG':
	{
		const bGatling = NameHas("Gatling");
		this.Box(V(6., 0., 6.), V(30., 8., 10.), Metal);
		this.Box(V(-14., 0., 4.), V(18., 5., 9.), Wood, R(-6., 0., 0.));
		this.Box(V(-1., 0., -2.), V(5., 4., 11.), MetalDark, R(-14., 0., 0.));
		if (bGatling)
		{
			this.SpinPart = this.scene_(V(36., 0., 6.));
			this.spinAxis = 'z';
			this.Part(this.SpinPart, 1, V(0, 0, 0), V(10., 10., 34.), MetalDark, R(90., 0., 0.));
			for (let i = 0; i < 6; ++i)
			{
				const A = i * 60.;
				this.Part(this.SpinPart, 1, V(0., Math.cos(d2r(A)) * 3.4, Math.sin(d2r(A)) * 3.4), V(2.4, 2.4, 42.), MetalLight, R(90., 0., 0.));
			}
			MuzzleAt = V(56., 0., 6.);
		}
		else
		{
			this.Tube(V(38., 0., 7.), 4., 34., MetalDark);
			for (let i = 0; i < 5; ++i)
			{
				this.Tube(V(26. + i * 4., 0., 7.), 5.4, 1.2, Metal);
			}
			MuzzleAt = V(56., 0., 7.);
		}
		this.Box(V(4., 0., 12.5), V(14., 6., 2.4), MetalDark);
		this.Box(V(12., 4.2, 6.), V(12., 0.4, 6.), Accent, null, 0.25);
		this.MagRoot = this.scene_(V(8., -5., 1.));
		this.Box(V(0., -3., -4.), V(12., 7., 10.), hex(0x5A6040), null, 0., this.MagRoot); // ammo box
		for (let i = 0; i < 4; ++i)
		{
			this.Part(this.MagRoot, 1, V(-4. + i * 2.7, 1., 1.5), V(1.6, 1.6, 4.), Brass, R(0., 0., 0.));
		}
		SupportRest = V(26., 0., 1.);
		SightZ = 13.5;
		BarrelLen = MuzzleAt.X;
		break;
	}
	case 'Launcher':
	{
		const bDynamite = NameHas("Dynamite");
		if (bDynamite)
		{
			// a satchel launcher: wooden stock + wide tube with a stick of dynamite peeking out
			this.Tube(V(18., 0., 8.), 9., 40., Metal);
			this.Tube(V(39., 0., 8.), 10., 3., Accent, 0.2);
			this.Box(V(-8., 0., 4.), V(18., 5., 8.), Wood);
			this.MagRoot = this.scene_(V(40., 0., 8.));
			this.Part(this.MagRoot, 1, V(2., 0., 0.), V(5., 5., 10.), hex(0xC8282A), R(90., 0., 0.));
			this.Part(this.MagRoot, 1, V(8., 0., 0.), V(0.8, 0.8, 4.), hex(0xE8D8B0), R(90., 0., 0.));
		}
		else
		{
			this.Tube(V(14., 0., 9.), 11., 56., hex(0x4A5A3A));
			this.Tube(V(42., 0., 9.), 12.4, 4., MetalDark);
			this.Tube(V(-14., 0., 9.), 12.4, 4., MetalDark);
			this.Box(V(10., -7., 12.), V(10., 3., 6.), MetalDark);                   // sight box
			this.Box(V(18., 0., 9.), V(16., 11.6, 2.), Accent, null, 0.25);
			this.MagRoot = this.scene_(V(44., 0., 9.));
			this.Part(this.MagRoot, 3, V(4., 0., 0.), V(8., 8., 12.), hex(0xC8282A), R(-90., 0., 0.)); // rocket tip
		}
		this.Box(V(-1., 0., -1.), V(5., 4., 10.), MetalDark, R(-12., 0., 0.));
		this.Box(V(14., 0., 0.), V(5., 4., 9.), MetalDark, R(-8., 0., 0.));
		MuzzleAt = V(46., 0., 9.);
		SupportRest = V(14., 0., -2.);
		SightZ = 16.;
		BarrelLen = 46.;
		break;
	}
	case 'Energy':
	case 'Wonder':
	default:
	{
		const bFlame = W.mode == 'Flame';
		const bSaw = W.mode == 'Saw';
		const bCards = NameHas("Dead Man");
		this.Box(V(6., 0., 6.), V(24., 7., 9.), bFlame ? hex(0x8A2A1A) : Metal);
		this.Box(V(-1., 0., -2.), V(5., 4., 11.), MetalDark, R(-14., 0., 0.));
		this.Box(V(-12., 0., 4.), V(14., 5., 7.), MetalDark, R(-8., 0., 0.));
		if (bSaw)
		{
			this.SpinPart = this.scene_(V(30., 0., 8.));
			this.spinAxis = 'x';
			this.Part(this.SpinPart, 1, V(0, 0, 0), V(22., 22., 1.4), MetalLight, R(0., 0., 90.));
			this.Box(V(22., 0., 8.), V(10., 4., 4.), Accent, null, 0.4);
			MuzzleAt = V(38., 0., 8.);
		}
		else if (bCards)
		{
			for (let i = 0; i < 5; ++i)
			{
				this.Box(V(26., -6. + i * 3., 10. + Math.Abs(i - 2) * -1.2), V(1., 6., 9.), i % 2 ? hex(0xF4EEDF) : hex(0xB01828), R(0., 0., (i - 2) * 14.), 0.3);
			}
			MuzzleAt = V(30., 0., 10.);
		}
		else if (bFlame)
		{
			this.Tube(V(28., 0., 7.), 5., 24., MetalDark);
			this.Tube(V(41., 0., 7.), 7., 3., Metal);
			this.Part(this.gun, 1, V(4., 0., -9.), V(10., 10., 22.), hex(0xC8302A), R(90., 0., 0.)); // tank
			this.Box(V(43., 0., 4.5), V(2., 2., 2.), hex(0x5AB0FF), null, 2.);  // pilot light
			MuzzleAt = V(43., 0., 7.);
		}
		else
		{
			// coils / emitter
			this.Tube(V(26., 0., 6.5), 4., 22., MetalDark);
			for (let i = 0; i < 4; ++i)
			{
				this.Tube(V(18. + i * 5., 0., 6.5), 7., 1.8, Accent, 1.2);
			}
			this.Part(this.gun, 2, V(38., 0., 6.5), V(5.), DMHArt::Lerp(Accent, FLinearColor::White, 0.4), null, 2.5);
			MuzzleAt = V(40., 0., 6.5);
		}
		this.Box(V(4., 3.8, 6.), V(14., 0.4, 5.), Accent, null, 0.9);
		this.Box(V(4., 0., 11.5), V(8., 3., 2.), MetalDark);
		this.MagRoot = this.scene_(V(6., 0., 1.));
		this.Part(this.MagRoot, 1, V(0., 0., -4.), V(6., 6., 8.), Accent, null, 1.4); // cell
		SupportRest = V(22., 0., 1.);
		SightZ = 12.5;
		BarrelLen = MuzzleAt.X;
		break;
	}
	}