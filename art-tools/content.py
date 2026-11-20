#!/usr/bin/env python3
"""
Dead Man's Hand content tables.

Edit the lists below, then run:   python tools/content.py
It regenerates:
  Source/DeadMansHand/DMHContent.inl   (compiled into the game)
  docs/CONTENT.md                      (human-readable reference)
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ---------------------------------------------------------------- WEAPONS
# name, class, rarity, mode, dmg, rate, mag, reserve, reload, spread, pellets, auto, range,
# splash, pierce, projspeed, burn, slow, chains, money/hit, critbonus, color, wallcost, desc
W = [
 ("Tin Star", "Pistol", "Common", "Hitscan", 46, 5.0, 12, 96, 1.1, 1.2, 1, False, 6000, 0, 0, 0, 0, 0, 0, 0, 0.0, 0xB8B8B8, 0,
  "Starting revolver."),
 ("Saloon Six", "Pistol", "Uncommon", "Hitscan", 140, 2.2, 6, 54, 2.0, 0.6, 1, False, 8000, 0, 1, 0, 0, 0, 0, 0, 0.05, 0x8E5A2B, 500,
  "Heavy revolver. Shots pierce one enemy."),
 ("Penny Pusher", "Pistol", "Common", "Hitscan", 20, 14.0, 26, 182, 1.5, 3.5, 1, True, 5000, 0, 0, 0, 0, 0, 0, 0, 0.0, 0xC7A24A, 750,
  "Full-auto pistol."),
 ("Snake Eyes", "Pistol", "Rare", "Hitscan", 28, 7.0, 30, 210, 1.6, 2.0, 2, False, 6000, 0, 0, 0, 0, 0, 0, 0, 0.10, 0x9A2C2C, 0,
  "Twin pistols. Two bullets per shot."),
 ("Back-Alley", "SMG", "Common", "Hitscan", 21, 12.0, 30, 210, 1.8, 3.0, 1, True, 5500, 0, 0, 0, 0, 0, 0, 0, 0.0, 0x5C6B73, 1000,
  "Basic SMG."),
 ("Hornet's Nest", "SMG", "Uncommon", "Hitscan", 20, 18.0, 50, 300, 2.0, 3.8, 1, True, 5000, 0, 0, 0, 0, 0, 0, 0, 0.0, 0xE0B22E, 1300,
  "Very high fire rate."),
 ("Card Sharp", "SMG", "Rare", "Hitscan", 30, 13.0, 40, 280, 1.7, 2.4, 1, True, 6000, 0, 1, 0, 0, 0, 0, 0, 0.25, 0x2C6E9A, 0,
  "+25% crit chance. Shots pierce."),
 ("Quarter Horse", "Rifle", "Common", "Hitscan", 44, 5.5, 14, 140, 1.9, 0.8, 1, False, 9000, 0, 0, 0, 0, 0, 0, 0, 0.0, 0x7A5C3A, 1200,
  "Semi-auto carbine."),
 ("Lawman AR", "Rifle", "Uncommon", "Hitscan", 40, 9.5, 30, 270, 2.1, 1.6, 1, True, 9000, 0, 0, 0, 0, 0, 0, 0, 0.0, 0x3E4F3A, 1400,
  "Automatic rifle."),
 ("Long Odds", "Rifle", "Rare", "Hitscan", 75, 6.5, 25, 200, 2.2, 0.5, 1, True, 11000, 0, 1, 0, 0, 0, 0, 0, 0.05, 0x4A4A6A, 0,
  "Battle rifle. Pierces one enemy."),
 ("Jackpot", "Rifle", "Epic", "Hitscan", 52, 11.0, 45, 360, 2.0, 1.4, 1, True, 10000, 0, 0, 0, 0, 0, 0, 2, 0.05, 0xF2C230, 0,
  "Automatic rifle. Every hit pays $2."),
 ("Sawbuck", "Shotgun", "Common", "Hitscan", 22, 2.2, 2, 48, 1.7, 7.0, 9, False, 2200, 0, 0, 0, 0, 0, 0, 0, 0.0, 0x6B4226, 900,
  "Double-barrel shotgun."),
 ("Dealer's Pump", "Shotgun", "Uncommon", "Hitscan", 24, 1.5, 6, 54, 2.6, 6.0, 8, False, 2600, 0, 0, 0, 0, 0, 0, 0, 0.0, 0x8A6E4B, 1500,
  "Pump-action shotgun."),
 ("Full House", "Shotgun", "Rare", "Hitscan", 15, 4.0, 12, 96, 2.4, 6.5, 8, True, 2400, 0, 0, 0, 0, 0, 0, 0, 0.0, 0xB03A2E, 0,
  "Automatic drum shotgun."),
 ("Dragon's Breath", "Shotgun", "Epic", "Hitscan", 20, 2.2, 8, 64, 2.4, 7.5, 10, False, 2000, 0, 0, 0, 22, 0, 0, 0, 0.0, 0xFF6A1A, 0,
  "Shotgun. Pellets set enemies on fire."),
 ("Iron Mule", "LMG", "Uncommon", "Hitscan", 34, 10.0, 100, 400, 4.0, 2.6, 1, True, 9000, 0, 0, 0, 0, 0, 0, 0, 0.0, 0x4F5A4F, 1800,
  "Belt-fed machine gun. Large magazine."),
 ("Gatling Gambler", "LMG", "Epic", "Hitscan", 28, 22.0, 200, 600, 5.0, 4.0, 1, True, 8000, 0, 0, 0, 0, 0, 0, 0, 0.0, 0x9C7A3C, 0,
  "Minigun. Spins up as it fires."),
 ("Widowmaker", "Sniper", "Rare", "Hitscan", 420, 1.1, 5, 40, 2.8, 0.0, 1, False, 20000, 0, 3, 0, 0, 0, 0, 0, 0.10, 0x2B2B2B, 0,
  "Bolt-action sniper. Pierces several enemies."),
 ("Railroad Spike", "Sniper", "Epic", "Hitscan", 800, 0.8, 4, 32, 3.0, 0.0, 1, False, 25000, 0, 99, 0, 0, 0, 0, 0, 0.0, 0x6FA8DC, 0,
  "Railgun. Pierces everything in a line."),
 ("Dynamite Dan", "Launcher", "Uncommon", "Grenade", 190, 1.5, 6, 36, 2.6, 2.0, 1, False, 4000, 340, 0, 2200, 0, 0, 0, 0, 0.0, 0xC0392B, 1600,
  "Lobs bouncing dynamite."),
 ("Boomtown", "Launcher", "Rare", "Rocket", 420, 1.0, 4, 24, 2.8, 0.5, 1, False, 12000, 420, 0, 3800, 0, 0, 0, 0, 0.0, 0x7D3C98, 0,
  "Rocket launcher."),
 ("Fireworks Finale", "Launcher", "Epic", "Rocket", 130, 1.2, 4, 28, 2.6, 6.0, 4, False, 10000, 260, 0, 3000, 0, 0, 0, 0, 0.0, 0xE84393, 0,
  "Four rockets per shot."),
 ("Tesla Coil", "Energy", "Rare", "Chain", 62, 4.0, 20, 160, 2.0, 0.5, 1, False, 4500, 0, 0, 0, 0, 0, 4, 0, 0.0, 0x74B9FF, 0,
  "Lightning chains to four more enemies."),
 ("Will-o'-Wisp", "Energy", "Rare", "Plasma", 72, 6.0, 30, 240, 2.0, 1.0, 1, True, 8000, 130, 0, 4200, 0, 0.3, 0, 0, 0.0, 0x55EFC4, 0,
  "Orbs that explode and slow."),
 ("Frostbite Beam", "Energy", "Uncommon", "Beam", 15, 20.0, 100, 400, 2.5, 0.0, 1, True, 1900, 0, 0, 0, 0, 0.5, 0, 0, 0.0, 0xA6E3FF, 1500,
  "Continuous beam that slows."),
 ("Hellfire Hose", "Energy", "Rare", "Flame", 9, 20.0, 120, 480, 2.6, 8.0, 3, True, 950, 0, 1, 0, 40, 0, 0, 0, 0.0, 0xFF4500, 0,
  "Flamethrower. Short range."),
 ("Buzzsaw", "Wonder", "Epic", "Saw", 170, 2.5, 8, 64, 2.2, 0.0, 1, False, 6000, 0, 6, 2600, 0, 0, 0, 0, 0.0, 0xD0D0D0, 0,
  "Bouncing saw blades. Each hits up to six enemies."),
 ("The House Always Wins", "Wonder", "Legendary", "Chain", 140, 5.0, 20, 200, 2.0, 0.5, 1, True, 6000, 150, 0, 0, 0, 0, 3, 5, 0.10, 0xFFD700, 0,
  "Explosive chain lightning. $5 per hit."),
 ("Dead Man's Hand", "Wonder", "Legendary", "Plasma", 56, 3.0, 15, 150, 2.0, 8.0, 5, False, 9000, 110, 2, 3600, 0, 0, 0, 0, 0.15, 0xF5F5F5, 0,
  "Throws five exploding, piercing cards."),
 ("Black Cat", "Wonder", "Legendary", "Hitscan", 700, 1.2, 7, 49, 2.6, 0.0, 1, False, 30000, 0, 99, 0, 0, 0, 0, 0, 0.50, 0x1A1A1A, 0,
  "Sniper with +50% crit chance."),
]

# ---------------------------------------------------------------- UPGRADES
# name, rarity, stacks, [(stat, value)...], trigger, fx, chance, magnitude, cooldown, desc, inspired by
C, U, R, E, L, X = "Common", "Uncommon", "Rare", "Epic", "Legendary", "Cursed"
UP = [
 # ---- COMMON
 ("Hollow Points", C, 10, [("Damage", .10)], None, None, 0, 0, 0, "+10% damage.", "RoR2 Crowbar-style stat item"),
 ("Quick Hands", C, 10, [("ReloadSpeed", .14)], None, None, 0, 0, 0, "+14% reload speed.", "Gungeon"),
 ("Hair Trigger", C, 10, [("FireRate", .10)], None, None, 0, 0, 0, "+10% fire rate.", "RoR2 Soldier's Syringe"),
 ("Extended Mag", C, 10, [("MagSize", .20)], None, None, 0, 0, 0, "+20% magazine size.", "CoD Extended Mags"),
 ("Bandolier", C, 10, [("ReserveAmmo", .30)], "OnKill", "RefundAmmo", .08, .25, 0, "+30% reserve ammo. Kills have an 8% chance to refill 25% of your mag.", "RoR2 Bandolier"),
 ("Running Shoes", C, 10, [("MoveSpeed", .08)], None, None, 0, 0, 0, "+8% move speed.", "RoR2 Paul's Goat Hoof"),
 ("Spring Heels", C, 10, [("JumpPower", .12)], None, None, 0, 0, 0, "+12% jump height.", "Classic platformer"),
 ("Tough Hide", C, 10, [("MaxHealth", 25)], None, None, 0, 0, 0, "+25 max health.", "CoD Juggernog (lite)"),
 ("Bandage Roll", C, 10, [("HealthRegen", 1.5)], None, None, 0, 0, 0, "+1.5 health per second.", "RoR2 Cautious Slug"),
 ("Lucky Penny", C, 10, [("LuckFind", .20)], None, None, 0, 0, 0, "+20% clover drop chance.", "Isaac Lucky Foot"),
 ("Loose Change", C, 10, [("MoneyGain", .10)], None, None, 0, 0, 0, "+10% money from all sources.", "Brotato Harvesting"),
 ("Lens Shard", C, 10, [("CritChance", .05)], None, None, 0, 0, 0, "+5% crit chance.", "RoR2 Lens-Maker's Glasses"),
 ("Steady Grip", C, 10, [("Spread", .20), ("HeadshotDamage", .10)], None, None, 0, 0, 0, "20% tighter spread, +10% headshot damage.", "CoD Steady Aim"),
 ("Scrap Plating", C, 10, [("Armor", 12)], None, None, 0, 0, 0, "+12 armor.", "RoR2 Repulsion Armor (lite)"),
 ("Bloodletter", C, 10, [], "OnHit", "Bleed", .12, .8, 0, "12% chance on hit to bleed for 80% of the hit over 3s.", "RoR2 Tri-Tip Dagger"),
 ("Matchbook", C, 10, [], "OnHit", "Ignite", .10, .50, 0, "10% chance on hit to ignite for 50% of the hit per second.", "Gungeon Hot Lead"),
 ("Cold Rounds", C, 10, [], "OnHit", "Freeze", .15, .50, 0, "15% chance on hit to slow the target by 50%.", "Hades Demeter boons"),
 ("Slide Grease", C, 10, [("SlideBoost", .20)], None, None, 0, 0, 0, "+20% slide speed.", "Titanfall slide-hop"),
 ("Coffee Thermos", C, 10, [], "OnDash", "Haste", 1.0, .20, 0, "Dashing grants +20% move speed for 4s.", "RoR2 Energy Drink"),
 ("Wind Chime", C, 10, [("AirControl", .25), ("MoveSpeed", .06)], None, None, 0, 0, 0, "+25% air control, +6% move speed.", "Quake air strafing"),
 ("Rusty Shiv", C, 10, [("EliteDamage", .25)], None, None, 0, 0, 0, "+25% damage to elites.", "RoR2 Armor-Piercing Rounds"),
 ("Pry Bar", C, 10, [("BossDamage", .25)], None, None, 0, 0, 0, "+25% damage to bosses.", "RoR2 Crowbar"),
 ("Skeleton Key", C, 10, [("CasinoDiscount", .08)], None, None, 0, 0, 0, "Casino prices 8% cheaper.", "Isaac Steam Sale"),
 ("Piggy Bank", C, 10, [("Interest", .03)], None, None, 0, 0, 0, "Earn 3% interest on your cash each round (cap $2,000).", "Balatro interest"),
 ("Dash Boots", C, 10, [("DashCooldown", .15)], None, None, 0, 0, 0, "Dash recharges 15% faster.", "Hades Greatest Reflex"),
 ("Grapple Oil", C, 10, [("GrappleCooldown", .20)], None, None, 0, 0, 0, "Grapple recharges 20% faster.", "Titanfall 2 grapple"),
 ("Climber's Chalk", C, 10, [("WallRunTime", .75), ("MoveSpeed", .04)], None, None, 0, 0, 0, "+0.75s wall-run time, +4% move speed.", "Titanfall 2"),
 ("Hot Lead", C, 10, [], "OnCrit", "Ignite", 1.0, .25, 0, "Crits ignite for 25% of the hit per second.", "Gungeon Hot Lead"),
 ("Medkit", C, 10, [], "OnHurt", "Heal", 1.0, 15, 2.0, "Taking damage heals 15 HP shortly after (2s cooldown).", "RoR2 Medkit"),
 ("Monster Tooth", C, 10, [], "OnKill", "Heal", 1.0, 5, 0, "Kills heal 5 HP.", "RoR2 Monster Tooth"),
 ("Coin Purse", C, 10, [], "OnKill", "Money", .25, 30, 0, "25% chance on kill to gain an extra $30.", "Gunfire Reborn coin scrolls"),
 ("Headhunter Scope", C, 10, [("HeadshotDamage", .25)], None, None, 0, 0, 0, "+25% headshot damage.", "Sulfur scopes"),
 ("Momentum Rounds", C, 10, [("SpeedDamage", .20)], None, None, 0, 0, 0, "+20% damage per 1000 speed.", "Titanfall momentum"),
 ("Featherweight", C, 10, [("AirDamage", .12)], None, None, 0, 0, 0, "+12% damage while airborne.", "Gunfire Reborn airborne scrolls"),
 ("Horseshoe Magnet", C, 10, [("PickupRange", .60), ("MoneyGain", .08)], None, None, 0, 0, 0, "+60% pickup range, +8% money.", "Vampire Survivors Attractorb"),
 ("Steel Toes", C, 10, [("SlideDamage", .15), ("SlideBoost", .08)], None, None, 0, 0, 0, "+15% damage while sliding, +8% slide speed.", "Titanfall slide-hop"),
 # ---- UNCOMMON
 ("Hopper's Feather", U, 3, [("ExtraJumps", 1)], None, None, 0, 0, 0, "+1 mid-air jump.", "RoR2 Hopoo Feather"),
 ("Spare Battery", U, 3, [("DashCharges", 1)], None, None, 0, 0, 0, "+1 dash charge.", "Hades Athena/Hermes"),
 ("Ukulele Wire", U, 5, [], "OnHit", "Chain", .15, .35, 0, "15% chance on hit to arc 35% damage to 3 nearby enemies.", "RoR2 Ukulele"),
 ("Wisp Jar", U, 5, [], "OnKill", "Explode", .35, 1.0, 0, "35% chance kills explode for 100% Power.", "RoR2 Will-o'-the-wisp"),
 ("Gasoline Can", U, 5, [], "OnKill", "Ignite", 1.0, .5, 0, "Kills ignite nearby enemies for 50% Power per second.", "RoR2 Gasoline"),
 ("Topaz Brooch", U, 5, [], "OnKill", "Shield", 1.0, 8, 0, "Kills grant 8 overshield.", "RoR2 Topaz Brooch"),
 ("Leech Seed", U, 5, [("Lifesteal", .03)], None, None, 0, 0, 0, "Heal 3% of damage dealt.", "RoR2 Leeching Seed"),
 ("Tailwind Ribbon", U, 5, [], "OnSlide", "Haste", 1.0, .30, 0, "Sliding grants +30% move speed for 4s.", "RoR2 Red Whip"),
 ("Sticky Dynamite", U, 5, [], "OnHit", "Explode", .10, 1.2, 0, "10% chance on hit to blow up for 120% of the hit.", "RoR2 Sticky Bomb"),
 ("ATG Rocket", U, 5, [], "OnHit", "Missile", .10, 2.0, 0, "10% chance on hit to fire a homing rocket for 200% of the hit.", "RoR2 AtG Missile"),
 ("Tri-Tip", U, 5, [], "OnHit", "Bleed", .18, 1.0, 0, "18% chance on hit to bleed for 100% of the hit.", "RoR2 Tri-Tip Dagger"),
 ("Quick-Draw Holster", U, 5, [], "OnReload", "Rage", 1.0, .20, 0, "Reloading grants +20% damage for 4s.", "Gungeon Ammo Belt synergies"),
 ("Blast Holster", U, 5, [], "OnReload", "Shockwave", 1.0, 1.0, 1.0, "Reloading releases a shockwave for 100% Power.", "Gungeon Blast Helmet"),
 ("Thunderclap Boots", U, 5, [], "OnAirJump", "Nova", 1.0, 1.0, .5, "Mid-air jumps release a burst for 100% Power.", "Risk of Rain Loader"),
 ("Parkour Tape", U, 5, [], "OnWallRun", "Rage", 1.0, .15, 0, "While wall-running: +15% damage.", "Titanfall 2"),
 ("Hookshot Spring", U, 3, [], "OnGrapple", "ResetDash", 1.0, 1, 0, "Grappling refunds a dash charge.", "Apex Pathfinder"),
 ("Dash Blades", U, 5, [("DashDamage", 70)], None, None, 0, 0, 0, "Dashing through enemies deals 70 damage (scales each round).", "Hades dash strike"),
 ("Energy Drink", U, 5, [("MoveSpeed", .12), ("SlideBoost", .10)], None, None, 0, 0, 0, "+12% move speed, +10% slide speed.", "RoR2 Energy Drink"),
 ("Gambler's Monocle", U, 5, [("CritChance", .08), ("CritDamage", .15)], None, None, 0, 0, 0, "+8% crit chance, +15% crit damage.", "Balatro"),
 ("Bounty Poster", U, 5, [("EliteDamage", .20)], "OnEliteKill", "Money", 1.0, 150, 0, "+20% elite damage. Elite kills pay $150.", "Borderlands bounties"),
 ("Rabbit's Foot", U, 3, [], "OnEliteKill", "Clover", .5, 1, 0, "Elite kills have a 50% chance to grant +1 Luck.", "Isaac Rabbit's Foot"),
 ("Fuel Cell", U, 5, [("DashCooldown", .20), ("GrappleCooldown", .20)], None, None, 0, 0, 0, "Dash and grapple recharge 20% faster.", "RoR2 Fuel Cell"),
 ("Rebar Rounds", U, 3, [("Pierce", 1)], None, None, 0, 0, 0, "Bullets pierce +1 enemy.", "Gungeon piercing"),
 ("Buckshot Extender", U, 5, [("Multishot", .35)], None, None, 0, 0, 0, "35% chance per shot to fire an extra projectile.", "Isaac 20/20"),
 ("Adrenal Gland", U, 5, [("LowHealthDamage", .30), ("HealthRegen", 1)], None, None, 0, 0, 0, "+30% damage under 35% HP, +1 HP/s.", "Isaac Bloody Lust"),
 ("Blast Powder", U, 5, [("ExplosionRadius", .30), ("Damage", .06)], None, None, 0, 0, 0, "+30% explosion radius, +6% damage.", "Gungeon Bomb mods"),
 ("Hard Hat", U, 5, [("Armor", 25), ("MoveSpeed", -.03)], None, None, 0, 0, 0, "+25 armor, -3% move speed.", "Brotato trade-offs"),
 ("Cowboy Spurs", U, 5, [("SlideDamage", .25), ("SlideBoost", .15)], None, None, 0, 0, 0, "+25% damage while sliding, +15% slide speed.", "Titanfall"),
 ("Mag Coupler", U, 5, [("MagSize", .35)], None, None, 0, 0, 0, "+35% magazine size.", "CoD dual mags"),
 ("Thorny Vest", U, 5, [("Thorns", 40), ("Armor", 5)], None, None, 0, 0, 0, "Enemies that hit you take 40 damage (scales each round). +5 armor.", "RoR2 Razorwire"),
 ("High Ground", U, 5, [("AirDamage", .25), ("JumpPower", .08)], None, None, 0, 0, 0, "+25% airborne damage, +8% jump height.", "Gunfire Reborn"),
 ("Comp Card", U, 5, [("CasinoDiscount", .12), ("MoneyGain", .10)], None, None, 0, 0, 0, "Casino 12% cheaper, +10% money.", "Casino comps"),
 ("Mantle Spikes", U, 5, [], "OnMantle", "Nova", 1.0, 1.5, 1.0, "Vaulting a ledge blasts nearby enemies for 150% Power.", "Sulfur kick"),
 ("Second Barrel", U, 5, [], "OnHeadshot", "Explode", .5, .8, 0, "50% chance headshots explode for 80% of the hit.", "Gungeon"),
 # ---- RARE
 ("Behemoth Shell", R, 3, [], "OnHit", "Explode", 1.0, .30, 0, "Every hit explodes for 30% of the hit.", "RoR2 Brilliant Behemoth"),
 ("Spirit Daggers", R, 3, [], "OnKill", "Missile", 1.0, 1.5, 0, "Kills launch a homing dagger for 150% Power.", "RoR2 Ceremonial Dagger"),
 ("Winter's Halo", R, 3, [], "Periodic", "Freeze", 1.0, .50, 3.0, "Every 3s, chill all enemies near you by 50%.", "Hades Demeter"),
 ("Tesla Battery", R, 3, [], "Periodic", "Chain", 1.0, .6, 1.5, "Every 1.5s, zap nearby enemies for 60% Power.", "RoR2 Unstable Tesla Coil"),
 ("Storm Caller", R, 3, [], "OnCrit", "Chain", 1.0, .45, 0, "Crits arc 45% damage to 3 nearby enemies.", "Hades Zeus"),
 ("Executioner's Hood", R, 3, [], "OnHit", "Execute", 1.0, .15, 0, "Hits instantly kill non-bosses under 15% health.", "RoR2 Old Guillotine"),
 ("Vampire Fang", R, 3, [("Lifesteal", .06)], "OnKill", "Heal", 1.0, 3, 0, "Heal 6% of damage dealt; kills heal 3.", "Isaac Charm of the Vampire"),
 ("Kinetic Converter", R, 3, [("SpeedDamage", .45), ("MoveSpeed", .05)], None, None, 0, 0, 0, "+45% damage per 1000 speed, +5% speed.", "Titanfall momentum"),
 ("Heavy Barrel", R, 3, [("Damage", .30), ("Knockback", .30), ("FireRate", -.10)], None, None, 0, 0, 0, "+30% damage, +30% knockback, -10% fire rate.", "Brotato trade-offs"),
 ("Wind Walker", R, 3, [("ExtraJumps", 1), ("DashCharges", 1), ("AirControl", .20)], None, None, 0, 0, 0, "+1 jump, +1 dash, +20% air control.", "Hades Hermes"),
 ("Mercury Sandals", R, 3, [("MoveSpeed", .20), ("SlideBoost", .20), ("WallRunTime", 1.0)], None, None, 0, 0, 0, "+20% speed, +20% slide speed, +1s wall-run.", "Hermes"),
 ("Deadeye Glass", R, 3, [("HeadshotDamage", .50), ("Spread", .30)], None, None, 0, 0, 0, "+50% headshot damage, 30% tighter spread.", "Sulfur scopes"),
 ("Ammo Printer", R, 3, [], "Periodic", "RefundAmmo", 1.0, .10, 2.0, "Every 2s, refill 10% of your magazine.", "Gungeon Ammo Synthesizer"),
 ("Gilded Rounds", R, 3, [], "OnHit", "Money", .20, 6, 0, "20% chance per hit to earn $6.", "Borderlands Gold weapons"),
 ("Barrier Coil", R, 3, [], "Periodic", "Shield", 1.0, 30, 6.0, "Every 6s, gain 30 overshield.", "RoR2 Personal Shield Generator"),
 ("Afterburner", R, 3, [], "OnDash", "Explode", 1.0, 1.5, 0, "Dashing leaves an explosion for 150% Power.", "Hades Athena dash"),
 ("Fire Walker", R, 3, [], "OnSlide", "Ignite", 1.0, .6, 0, "Sliding ignites nearby enemies for 60% Power per second.", "Titanfall fire trails"),
 ("Overclock", R, 3, [("FireRate", .25), ("ReloadSpeed", .15)], None, None, 0, 0, 0, "+25% fire rate, +15% reload speed.", "CoD Double Tap"),
 ("Marked Cards", R, 3, [("CritChance", .10)], "OnCrit", "Bleed", .5, .8, 0, "+10% crit. Crits have 50% to bleed for 80%.", "Balatro"),
 ("Croupier's Rake", R, 3, [("Interest", .06), ("MoneyGain", .15)], None, None, 0, 0, 0, "+6% interest, +15% money.", "Balatro To the Moon"),
 ("Grapple Shock", R, 3, [], "OnGrapple", "Shockwave", 1.0, 1.5, 0, "Grappling releases a shockwave for 150% Power.", "Apex/Titanfall"),
 ("Phantom Step", R, 3, [("DashDamage", 150)], "OnDash", "Shield", 1.0, 15, 0, "Dash damage +150 (scales each round); dashes grant 15 overshield.", "Hades"),
 # ---- EPIC
 ("Chain Reaction", E, 2, [], "OnKill", "Explode", 1.0, 2.5, 0, "Every kill explodes for 250% Power.", "RoR2 Will-o'-the-wisp+"),
 ("Double Down", E, 2, [("Multishot", 1.0)], None, None, 0, 0, 0, "+1 projectile on every shot.", "Isaac 20/20"),
 ("Time Dilator", E, 2, [], "OnDash", "Freeze", 1.0, .70, 0, "Dashing freezes enemies around you (70% slow).", "Superhot"),
 ("Bloodlust Engine", E, 2, [], "OnKill", "Rage", 1.0, .25, 0, "Kills grant +25% damage for 4s.", "Doom Blood Punch"),
 ("Storm Anchor", E, 2, [], "OnGrapple", "Chain", 1.0, 1.5, 0, "Grappling unleashes lightning for 150% Power.", "Titanfall 2"),
 ("Air Supremacy", E, 2, [("AirDamage", .50), ("ExtraJumps", 1)], None, None, 0, 0, 0, "+50% airborne damage, +1 jump.", "Gunfire Reborn"),
 ("Lucky Seven", E, 2, [("CritChance", .07), ("ProcChance", .27), ("LuckFind", .77)], None, None, 0, 0, 0, "+7% crit, +27% proc chance, +77% clover find.", "Balatro Oops! All 6s"),
 ("Overflow Rounds", E, 2, [("Pierce", 3), ("Damage", .25)], None, None, 0, 0, 0, "+3 pierce, +25% damage.", "Gungeon"),
 ("Overdrive", E, 2, [], "OnDash", "Rage", 1.0, .40, 0, "Dashing grants +40% damage for 4s.", "Hades dash boons"),
 ("Momentum Core", E, 2, [("SpeedDamage", .80), ("MoveSpeed", .10)], None, None, 0, 0, 0, "+80% damage per 1000 speed, +10% speed.", "Titanfall"),
 ("Wild Card", E, 2, [("ProcChance", .40)], "OnHit", "Chain", .08, .55, 0, "+40% proc chance; 8% on hit to arc for 55%.", "Balatro"),
 ("Hex Bullets", E, 2, [], "OnHit", "Freeze", .25, .5, 0, "25% chance on hit to slow 50%; slowed enemies take +15% damage.", "Hades"),
 # ---- LEGENDARY
 ("Phoenix Feather", L, 1, [("Revives", 1)], None, None, 0, 0, 0, "Once per round, rise from death with full health.", "CoD Quick Revive"),
 ("Bottomless Chamber", L, 1, [("AmmoSave", .50)], None, None, 0, 0, 0, "50% chance shots cost no ammo.", "Gungeon Bottomless clip"),
 ("Royal Flush", L, 1, [("Damage", .25), ("FireRate", .25), ("MoveSpeed", .25)], None, None, 0, 0, 0, "+25% damage, fire rate and speed.", "Balatro Flush"),
 ("Ace of Spades", L, 1, [("CritChance", .10)], "OnCrit", "Execute", 1.0, .30, 0, "+10% crit. Crits kill non-bosses under 30% HP.", "Ace of Spades"),
 ("Storm Crown", L, 1, [], "Periodic", "Chain", 1.0, .8, .8, "Every 0.8s, lightning strikes nearby for 80% Power.", "RoR2 Charged Perforator"),
 ("Midas Touch", L, 1, [("MoneyGain", .25)], "OnKill", "Money", 1.0, 50, 0, "+25% money; every kill pays $50 extra.", "Midas"),
 ("Hermes' Wings", L, 1, [("ExtraJumps", 2), ("DashCharges", 2), ("MoveSpeed", .20)], None, None, 0, 0, 0, "+2 jumps, +2 dashes, +20% speed.", "Hades Hermes"),
 ("Four-Leaf Crown", L, 1, [("LuckFind", 1.5)], "OnRoundStart", "Clover", 1.0, 1, 0, "+150% clover find; +1 Luck every round.", "Isaac Lucky Foot"),
 # ---- CURSED (Skull jackpots)
 ("Glass Cannon", X, 1, [("Damage", .60), ("MaxHealth", -60)], None, None, 0, 0, 0, "+60% damage. -60 max health.", "RoR2 Shaped Glass"),
 ("Blood Pact", X, 1, [("Lifesteal", .10), ("HealthRegen", -4), ("MaxHealth", -25)], None, None, 0, 0, 0, "Heal 10% of damage dealt. No natural regen. -25 max HP.", "Isaac Devil deals"),
 ("Devil's Dice", X, 1, [("ProcChance", .60), ("Armor", -30)], None, None, 0, 0, 0, "+60% proc chance. -30 armor.", "Isaac D6"),
 ("Loan Shark", X, 1, [("MoneyGain", .60), ("CasinoDiscount", -.25)], None, None, 0, 0, 0, "+60% money. Casino 25% pricier.", "Balatro Credit Card"),
 ("Berserker's Brand", X, 1, [("FireRate", .40), ("Spread", -.50)], None, None, 0, 0, 0, "+40% fire rate. 50% wider spread.", "Gungeon curses"),
 ("Hollow Bones", X, 1, [("MoveSpeed", .30), ("ExtraJumps", 1), ("MaxHealth", -40)], None, None, 0, 0, 0, "+30% speed, +1 jump. -40 max HP.", "Brotato Ghost"),
 ("Cursed Coin", X, 1, [("LuckFind", 1.5), ("Damage", -.15)], None, None, 0, 0, 0, "+150% clover find. -15% damage.", "Isaac curses"),
 ("Death Wish", X, 1, [("LowHealthDamage", 1.0), ("MaxHealth", -30)], "OnHurt", "Rage", 1.0, .30, 0, "+100% damage under 35% HP; getting hit grants +30% damage. -30 max HP.", "Isaac Bloody Lust"),

 # ---- melee
 ("Whetstone", C, 10, [("MeleeDamage", .20)], None, None, 0, 0, 0, "+20% melee damage.", "melee"),
 ("Quick Wrists", C, 8, [("MeleeSpeed", .12)], None, None, 0, 0, 0, "+12% melee swing speed.", "melee"),
 ("Long Reach", C, 5, [("MeleeRange", .12)], None, None, 0, 0, 0, "+12% melee reach.", "melee"),
 ("Brass Knuckles", C, 6, [("MeleeDamage", .12), ("MeleeKnock", .25)], None, None, 0, 0, 0, "+12% melee damage, +25% melee knockback.", "melee"),
 ("Butcher's Apron", U, 5, [("MeleeLifesteal", .04)], None, None, 0, 0, 0, "Melee hits heal 4% of the damage dealt.", "melee"),
 ("Wide Swing", U, 4, [("MeleeCleave", 1), ("MeleeArc", .15)], None, None, 0, 0, 0, "Melee hits 1 more enemy and swings 15% wider.", "melee"),
 ("Serrated Edge", U, 5, [("MeleeBleed", .35)], None, None, 0, 0, 0, "Melee hits bleed for 35% of the damage over 3 seconds.", "melee"),
 ("Pickpocket", U, 5, [("MeleeMoney", 12)], None, None, 0, 0, 0, "Melee hits pay $12 extra.", "melee"),
 ("Cheap Shot", U, 5, [("MeleeCrit", .12)], None, None, 0, 0, 0, "+12% melee crit chance.", "melee"),
 ("Hot Iron", R, 3, [("MeleeBurn", 30), ("MeleeDamage", .10)], None, None, 0, 0, 0, "Melee hits set enemies on fire. +10% melee damage.", "melee"),
 ("Live Wire", R, 3, [("MeleeShock", .40)], None, None, 0, 0, 0, "Melee hits arc 40% of the damage to 2 nearby enemies.", "melee"),
 ("Bayonet Drill", R, 3, [("MeleeAmmo", .25)], None, None, 0, 0, 0, "Melee kills refill 25% of your magazine.", "melee"),
 ("Second Wind", R, 3, [("MeleeDashReset", 1), ("MeleeSpeed", .08)], None, None, 0, 0, 0, "Melee kills refill a dash. +8% swing speed.", "melee"),
 ("Riot Guard", R, 3, [("MeleeGuard", .20)], None, None, 0, 0, 0, "Take 20% less damage for 2 seconds after a melee hit.", "melee"),
 ("Headsman", E, 2, [("MeleeExecute", .18)], None, None, 0, 0, 0, "Melee kills any normal enemy below 18% health outright.", "melee"),
 ("Whirlwind", E, 2, [("MeleeArc", .60), ("MeleeCleave", 3), ("MeleeSpeed", .10)], None, None, 0, 0, 0, "Much wider swings that hit 3 more enemies. +10% swing speed.", "melee"),
 ("Berserker", E, 2, [("MeleeFrenzy", .08)], None, None, 0, 0, 0, "Each melee kill adds +8% melee damage and swing speed for 6 seconds, up to 5 times.", "melee"),
 ("Executioner's Hood", L, 1, [("MeleeDamage", 1.0), ("MeleeExecute", .12), ("MeleeLifesteal", .05)], None, None, 0, 0, 0, "+100% melee damage. Executes below 12% health. Melee heals 5%.", "melee"),
]

# ---------------------------------------------------------------- ENEMIES
# name, AI, shape, hp mult, speed, dmg, range, cd, scale, body, head, money, minround, weight, desc
EN = [
 ("Shambler", "Walker", "Humanoid", 1.0, 210, 28, 140, 1.2, 1.0, 0x7E9B6B, 0x9DB88A, 60, 1, 10.0, "The classic. Slow, hungry, endless."),
 ("Sprinter", "Runner", "Humanoid", 0.8, 520, 22, 140, 1.0, 0.95, 0x9B6B6B, 0xC48A8A, 70, 3, 4.0, "Fresh and fast. Arms flailing."),
 ("Gutter Crawler", "Crawler", "Crawler", 0.6, 360, 18, 120, 0.8, 0.8, 0x6B5B4E, 0x8A7A6A, 60, 4, 3.0, "Legless and low. Hard to hit, easy to trip over."),
 ("Bloater", "Bloater", "Bloated", 2.2, 170, 45, 200, 1.0, 1.25, 0xC9C46A, 0xE0DC8A, 90, 5, 2.0, "Bursts in a caustic blast when killed or close."),
 ("Spitter", "Spitter", "Humanoid", 0.9, 260, 18, 1900, 2.6, 1.0, 0x5FB35F, 0x8FE38F, 80, 6, 2.5, "Keeps its distance and lobs acid."),
 ("Leaper", "Leaper", "Crawler", 0.85, 420, 24, 140, 1.0, 0.9, 0x8B6BB3, 0xAE8FD6, 80, 7, 2.5, "Pounces from far away. Watch the rooftops."),
 ("Carrion Wisp", "Flyer", "Flyer", 0.5, 460, 12, 130, 0.9, 0.7, 0x4B3B5B, 0xE05A5A, 50, 8, 2.5, "Flying skull-bat. Ignores walls and doors."),
 ("Brute", "Brute", "Brute", 4.5, 250, 55, 200, 1.6, 1.6, 0x6E4E3E, 0x8E6E5E, 200, 9, 1.2, "Hulking slab of meat. Ground-pounds."),
 ("Screamer", "Screamer", "Robed", 1.2, 300, 16, 140, 1.2, 1.0, 0xD8D0C8, 0xF0E8E0, 120, 10, 1.2, "Its shriek makes nearby enemies frenzied."),
 ("Burrower", "Burrower", "Crawler", 1.5, 300, 30, 150, 1.1, 1.0, 0x8A6A3A, 0xAA8A5A, 120, 11, 1.2, "Tunnels under the street to pop up beside you."),
 ("Gilded Ghoul", "Gilded", "Humanoid", 1.6, 470, 0, 0, 1.0, 0.9, 0xE8C547, 0xFFE27A, 600, 4, 0.35, "Runs away. Drops a fortune and maybe a clover."),
 ("Riot Ghoul", "Shield", "Humanoid", 2.2, 240, 30, 150, 1.3, 1.1, 0x4A5A6A, 0x6A7A8A, 150, 12, 1.0, "Carries a door as a shield. Flank it."),
 ("Hex Priest", "Priest", "Robed", 1.4, 250, 14, 1500, 2.0, 1.05, 0x3A2A4A, 0x9A7ABA, 160, 13, 0.9, "Heals the horde. Kill it first."),
]

AFFIX = [
 ("Blazing", "Leaves fire on the ground and burns on hit.", 0xFF6A1A),
 ("Frozen", "Hits slow you heavily.", 0x9AD8FF),
 ("Shielded", "Overshield equal to half its health.", 0x6FA8FF),
 ("Vampiric", "Heals 50% of damage it deals; regenerates.", 0xB0103A),
 ("Splitting", "Splits into two smaller copies on death.", 0x7CFC00),
 ("Hasted", "+60% move and attack speed.", 0xFFF06A),
 ("Armored", "Takes 50% less damage from the front and body shots.", 0x9A9A9A),
 ("Blinking", "Teleports toward you every few seconds.", 0xD070FF),
 ("Gilded", "Triple money, guaranteed clover drop.", 0xFFD700),
 ("Volatile", "Explodes violently on death.", 0xFF3030),
]

# name, title, hp mult, speed, dmg, scale, body, head, attacks, minion, reward, desc
BOSS = [
 ("Big Tony", "The Pit Boss", 15, 300, 45, 2.8, 0x2E2E3A, 0xB88A6A, ["Charge", "Slam", "Summon"], 0, 2500,
  "The casino's enforcer, still collecting debts. Charges in straight lines and calls in the floor staff."),
 ("The Abomination", "Stitched Mass", 32, 260, 55, 3.4, 0x8A5A5A, 0xC08A7A, ["Leap", "Slam", "Ring"], 1, 3500,
  "A dozen enemies sewn into one. Leaps across the map and sends out shockwave rings."),
 ("Mother Carrion", "Queen of the Wisps", 30, 220, 35, 3.0, 0x3B2B4B, 0xE05A5A, ["Volley", "Summon", "Barrage"], 6, 4000,
  "Births wisps from her ribcage and rains bile from the sky."),
 ("The Croupier", "Dealer of Fates", 28, 340, 40, 2.6, 0x1A3A2A, 0xEDE3C8, ["Teleport", "Ring", "Volley"], 4, 4500,
  "Blinks around the map dealing razor cards. Its roulette rings close in."),
 ("The Gravedigger", "Owner of the House", 40, 320, 60, 3.6, 0x111111, 0xF2C230, ["Charge", "Teleport", "Barrage", "Summon", "Ring", "Slam"], 7, 7000,
  "The house itself, walking. Uses every trick in the deck."),
 ("The Last Dealer", "The House Always Wins", 70, 250, 55, 4.4, 0x1a0e14, 0xFFD24A, [], 1, 25000,
  "Waits in the vault under the Lucky Stiff. Deals cards, spins the wheel and burns the room down around you."),
]

# ---------------------------------------------------------------- GENERATION
def cstr(s):
    return 'TEXT("' + s.replace('\\', '\\\\').replace('"', '\\"') + '")'

def fl(v):
    s = repr(float(v))
    return s + "f"

def gen():
    o = []
    o.append("// GENERATED by tools/content.py - edit that file, not this one.")
    o.append("#pragma once\n")
    o.append("static const FDMHWeaponDef GDMHWeapons[] = {")
    for w in W:
        (n, cl, ra, mo, dm, rt, mg, rs, rl, sp, pe, au, rg, spl, pi, ps, bu, sl, ch, mph, cb, col, wc, ds) = w
        o.append(f"\t{{ {cstr(n)}, {cstr(ds)}, EDMHWeaponClass::{cl}, EDMHRarity::{ra}, EDMHFireMode::{mo}, "
                 f"{fl(dm)}, {fl(rt)}, {mg}, {rs}, {fl(rl)}, {fl(sp)}, {pe}, {'true' if au else 'false'}, {fl(rg)}, "
                 f"{fl(spl)}, {pi}, {fl(ps)}, {fl(bu)}, {fl(sl)}, {ch}, {mph}, {fl(cb)}, 0x{col:06X}u, {wc} }},")
    o.append("};\n")
    o.append("static const FDMHUpgradeDef GDMHUpgrades[] = {")
    for u in UP:
        (n, ra, st, mods, tr, fx, chn, mag, cd, ds, insp) = u
        ms = []
        for i in range(3):
            if i < len(mods):
                ms.append(f"{{ EDMHStat::{mods[i][0]}, {fl(mods[i][1])} }}")
            else:
                ms.append("{ EDMHStat::None, 0.0f }")
        o.append(f"\t{{ {cstr(n)}, {cstr(ds)}, EDMHRarity::{ra}, {st}, {{ {', '.join(ms)} }}, "
                 f"EDMHTrigger::{tr or 'None'}, EDMHProcFx::{fx or 'None'}, {fl(chn)}, {fl(mag)}, {fl(cd)} }},")
    o.append("};\n")
    o.append("static const FDMHEnemyDef GDMHEnemies[] = {")
    for e in EN:
        (n, ai, sh, hp, spd, dmg, rng, cd, sc, bc, hc, mon, mr, wt, ds) = e
        o.append(f"\t{{ {cstr(n)}, {cstr(ds)}, EDMHEnemyAI::{ai}, EDMHShape::{sh}, {fl(hp)}, {fl(spd)}, {fl(dmg)}, {fl(rng)}, "
                 f"{fl(cd)}, {fl(sc)}, 0x{bc:06X}u, 0x{hc:06X}u, {mon}, {mr}, {fl(wt)} }},")
    o.append("};\n")
    o.append("static const FDMHAffixDef GDMHAffixes[] = {")
    for a in AFFIX:
        o.append(f"\t{{ {cstr(a[0])}, {cstr(a[1])}, 0x{a[2]:06X}u }},")
    o.append("};\n")
    o.append("static const FDMHBossDef GDMHBosses[] = {")
    for b in BOSS:
        (n, t, hp, spd, dmg, sc, bc, hc, atk, mi, rw, ds) = b
        mask = " | ".join(f"(1u << (uint32)EDMHBossAttack::{a})" for a in atk)
        o.append(f"\t{{ {cstr(n)}, {cstr(t)}, {cstr(ds)}, {fl(hp)}, {fl(spd)}, {fl(dmg)}, {fl(sc)}, 0x{bc:06X}u, 0x{hc:06X}u, {mask}, {mi}, {rw} }},")
    o.append("};\n")
    open(os.path.join(ROOT, "Source/DeadMansHand/DMHContent.inl"), "w").write("\n".join(o) + "\n")

    # docs
    d = ["# Dead Man's Hand: Content Reference", "",
         "Generated from `tools/content.py`. Edit that file and run `python tools/content.py` to change content.", "",
         f"**{len(W)} weapons · {len(UP)} upgrades · {len(EN)} creature types · {len(AFFIX)} elite affixes · {len(BOSS)} bosses**", ""]
    d += ["## Weapons", "", "| # | Weapon | Class | Rarity | Fire | Dmg | RPS | Mag | Wall buy | Notes |", "|---|---|---|---|---|---|---|---|---|---|"]
    for i, w in enumerate(W):
        pel = f"{w[4]}x{w[10]}" if w[10] > 1 else f"{w[4]}"
        d.append(f"| {i+1} | **{w[0]}** | {w[1]} | {w[2]} | {w[3]} | {pel} | {w[5]} | {w[6]} | {('$'+str(w[22])) if w[22] else 'casino only'} | {w[23]} |")
    d += ["", "## Upgrades", "", "| # | Upgrade | Rarity | Max stacks | Effect | Inspired by |", "|---|---|---|---|---|---|"]
    for i, u in enumerate(UP):
        d.append(f"| {i+1} | **{u[0]}** | {u[1]} | {u[2]} | {u[9]} | {u[10]} |")
    d += ["", "## Creatures", "", "| Creature | Behaviour | HP x | Speed | From round | Notes |", "|---|---|---|---|---|---|"]
    for e in EN:
        d.append(f"| **{e[0]}** | {e[1]} | {e[3]} | {e[4]} | {e[12]} | {e[14]} |")
    d += ["", "## Elite affixes", "", "Elites start appearing on round 4. They get 1 affix, 2 from round 10, 3 from round 20, plus 2.5x health and a bigger reward.", "",
          "| Affix | Effect |", "|---|---|"]
    for a in AFFIX:
        d.append(f"| **{a[0]}** | {a[1]} |")
    d += ["", "## Bosses", "", "A boss arrives every 5th round (5, 10, 15, 20, 25, then the cycle repeats, getting harder).", "",
          "| Boss | Title | Attacks | Notes |", "|---|---|---|---|"]
    for b in BOSS:
        d.append(f"| **{b[0]}** | {b[1]} | {', '.join(b[8])} | {b[11]} |")
    open(os.path.join(ROOT, "docs/CONTENT.md"), "w").write("\n".join(d) + "\n")
    print(f"weapons={len(W)} upgrades={len(UP)} enemies={len(EN)} affixes={len(AFFIX)} bosses={len(BOSS)}")

if __name__ == "__main__":
    gen()
