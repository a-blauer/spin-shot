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
 ("Copperhead", "Pistol", "Common", "Hitscan", 20, 14.0, 26, 182, 1.5, 3.5, 1, True, 5000, 0, 0, 0, 0, 0, 0, 0, 0.0, 0xC7A24A, 750,
  "Full-auto pistol."),
 ("Sidewinders", "Pistol", "Rare", "Hitscan", 28, 7.0, 30, 210, 1.6, 2.0, 2, False, 6000, 0, 0, 0, 0, 0, 0, 0, 0.10, 0x9A2C2C, 0,
  "Twin pistols. Two bullets per shot."),
 ("Back-Alley", "SMG", "Common", "Hitscan", 21, 12.0, 30, 210, 1.8, 3.0, 1, True, 5500, 0, 0, 0, 0, 0, 0, 0, 0.0, 0x5C6B73, 1000,
  "Basic SMG."),
 ("Hornet's Nest", "SMG", "Uncommon", "Hitscan", 20, 18.0, 50, 300, 2.0, 3.8, 1, True, 5000, 0, 0, 0, 0, 0, 0, 0, 0.0, 0xE0B22E, 1300,
  "Very high fire rate."),
 ("Rustler", "SMG", "Rare", "Hitscan", 30, 13.0, 40, 280, 1.7, 2.4, 1, True, 6000, 0, 1, 0, 0, 0, 0, 0, 0.25, 0x2C6E9A, 0,
  "+25% crit chance. Shots pierce."),
 ("Quarter Horse", "Rifle", "Common", "Hitscan", 44, 5.5, 14, 140, 1.9, 0.8, 1, False, 9000, 0, 0, 0, 0, 0, 0, 0, 0.0, 0x7A5C3A, 1200,
  "Semi-auto carbine."),
 ("Lawman AR", "Rifle", "Uncommon", "Hitscan", 40, 9.5, 30, 270, 2.1, 1.6, 1, True, 9000, 0, 0, 0, 0, 0, 0, 0, 0.0, 0x3E4F3A, 1400,
  "Automatic rifle."),
 ("Long Rider", "Rifle", "Rare", "Hitscan", 75, 6.5, 25, 200, 2.2, 0.5, 1, True, 11000, 0, 1, 0, 0, 0, 0, 0, 0.05, 0x4A4A6A, 0,
  "Battle rifle. Pierces one enemy."),
 ("Gold Rush", "Rifle", "Epic", "Hitscan", 52, 11.0, 45, 360, 2.0, 1.4, 1, True, 10000, 0, 0, 0, 0, 0, 0, 2, 0.05, 0xF2C230, 0,
  "Automatic rifle. Every hit pays $2."),
 ("Sawbuck", "Shotgun", "Common", "Hitscan", 22, 2.2, 2, 48, 1.7, 7.0, 9, False, 2200, 0, 0, 0, 0, 0, 0, 0, 0.0, 0x6B4226, 900,
  "Double-barrel shotgun."),
 ("Homesteader", "Shotgun", "Uncommon", "Hitscan", 30, 1.5, 6, 54, 2.6, 6.0, 8, False, 2600, 0, 0, 0, 0, 0, 0, 0, 0.0, 0x8A6E4B, 1500,
  "Pump-action shotgun."),
 ("Stampede", "Shotgun", "Rare", "Hitscan", 15, 4.0, 12, 96, 2.4, 6.5, 8, True, 2400, 0, 0, 0, 0, 0, 0, 0, 0.0, 0xB03A2E, 0,
  "Automatic drum shotgun."),
 ("Dragon's Breath", "Shotgun", "Epic", "Hitscan", 26, 2.2, 8, 64, 2.4, 7.5, 10, False, 2000, 0, 0, 0, 22, 0, 0, 0, 0.0, 0xFF6A1A, 0,
  "Shotgun. Pellets set enemies on fire."),
 ("Iron Mule", "LMG", "Uncommon", "Hitscan", 34, 10.0, 100, 400, 4.0, 2.6, 1, True, 9000, 0, 0, 0, 0, 0, 0, 0, 0.0, 0x4F5A4F, 1800,
  "Belt-fed machine gun. Large magazine."),
 ("Thresher", "LMG", "Epic", "Hitscan", 28, 22.0, 200, 600, 5.0, 4.0, 1, True, 8000, 0, 0, 0, 0, 0, 0, 0, 0.0, 0x9C7A3C, 0,
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
 ("Tesla Coil", "Energy", "Rare", "Chain", 72, 4.0, 20, 160, 2.0, 0.5, 1, False, 4500, 0, 0, 0, 0, 0, 4, 0, 0.0, 0x74B9FF, 0,
  "Lightning chains to four more enemies."),
 ("Will-o'-Wisp", "Energy", "Rare", "Plasma", 72, 6.0, 30, 240, 2.0, 1.0, 1, True, 8000, 130, 0, 4200, 0, 0.3, 0, 0, 0.0, 0x55EFC4, 0,
  "Orbs that explode and slow."),
 ("Frostbite Beam", "Energy", "Uncommon", "Beam", 15, 20.0, 100, 400, 2.5, 0.0, 1, True, 1900, 0, 0, 0, 0, 0.5, 0, 0, 0.0, 0xA6E3FF, 1500,
  "Continuous beam that slows."),
 ("Hellfire Hose", "Energy", "Rare", "Flame", 9, 20.0, 120, 480, 2.6, 8.0, 3, True, 950, 0, 1, 0, 24, 0, 0, 0, 0.0, 0xFF4500, 0,
  "Flamethrower. Short range."),
 ("Buzzsaw", "Wonder", "Epic", "Saw", 225, 2.5, 8, 64, 2.2, 0.0, 1, False, 6000, 0, 6, 2600, 0, 0, 0, 0, 0.0, 0xD0D0D0, 0,
  "Bouncing saw blades. Each hits up to six enemies."),
 ("Thunderhead", "Wonder", "Legendary", "Chain", 140, 5.0, 20, 200, 2.0, 0.5, 1, True, 6000, 150, 0, 0, 0, 0, 3, 5, 0.10, 0xFFD700, 0,
  "Explosive chain lightning. $5 per hit."),
 ("Fan of Knives", "Wonder", "Legendary", "Plasma", 56, 3.0, 15, 150, 2.0, 8.0, 5, False, 9000, 110, 2, 3600, 0, 0, 0, 0, 0.15, 0xF5F5F5, 0,
  "Throws a fan of five exploding, piercing blades."),
 ("Black Cat", "Wonder", "Legendary", "Hitscan", 700, 1.2, 7, 49, 2.6, 0.0, 1, False, 30000, 0, 99, 0, 0, 0, 0, 0, 0.30, 0x1A1A1A, 0,
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
 ("Skeleton Key", C, 10, [("CasinoDiscount", .08)], None, None, 0, 0, 0, "Everything costs 8% less.", "Isaac Steam Sale"),
 ("Piggy Bank", C, 10, [("Interest", .03)], None, None, 0, 0, 0, "Earn 3% interest on your cash each round (cap $200).", "Balatro interest"),
 ("Dash Boots", C, 10, [("DashCooldown", .15)], None, None, 0, 0, 0, "Dash recharges 15% faster.", "Hades Greatest Reflex"),
 ("Grapple Oil", C, 10, [("GrappleCooldown", .20)], None, None, 0, 0, 0, "Grapple recharges 20% faster.", "Titanfall 2 grapple"),
 ("Climber's Chalk", C, 10, [("WallRunTime", .75), ("MoveSpeed", .04)], None, None, 0, 0, 0, "+0.75s wall-run time, +4% move speed.", "Titanfall 2"),
 ("Hot Lead", C, 10, [], "OnCrit", "Ignite", 1.0, .25, 0, "Crits ignite for 25% of the hit per second.", "Gungeon Hot Lead"),
 ("Medkit", C, 10, [], "OnHurt", "Heal", 1.0, 15, 2.0, "Taking damage heals 15 HP shortly after (2s cooldown).", "RoR2 Medkit"),
 ("Monster Tooth", C, 10, [], "OnKill", "Heal", 1.0, 5, 0, "Kills heal 5 HP.", "RoR2 Monster Tooth"),
 ("Coin Purse", C, 10, [], "OnKill", "Money", .25, 30, 0, "25% chance on kill to gain about $3 extra.", "Gunfire Reborn coin scrolls"),
 ("Headhunter Scope", C, 10, [("HeadshotDamage", .25)], None, None, 0, 0, 0, "+25% headshot damage.", "Sulfur scopes"),
 ("Momentum Rounds", C, 10, [("SpeedDamage", .20)], None, None, 0, 0, 0, "+20% damage per 1000 speed above a walk.", "Titanfall momentum"),
 ("Featherweight", C, 10, [("AirDamage", .12)], None, None, 0, 0, 0, "+12% damage while airborne.", "Gunfire Reborn airborne scrolls"),
 ("Horseshoe Magnet", C, 10, [("PickupRange", .60), ("MoneyGain", .08)], None, None, 0, 0, 0, "+60% pickup range, +8% money.", "Vampire Survivors Attractorb"),
 # ---- UNCOMMON
 ("Hopper's Feather", U, 3, [("ExtraJumps", 1)], None, None, 0, 0, 0, "+1 mid-air jump.", "RoR2 Hopoo Feather"),
 ("Spare Battery", U, 3, [("DashCharges", 1)], None, None, 0, 0, 0, "+1 dash charge.", "Hades Athena/Hermes"),
 ("Ukulele Wire", U, 5, [], "OnHit", "Chain", .15, .35, 0, "15% chance on hit to arc 35% damage to 3 nearby enemies.", "RoR2 Ukulele"),
 ("Wisp Jar", U, 5, [], "OnKill", "Explode", .35, 1.0, 0, "35% chance kills explode for 100% Power.", "RoR2 Will-o'-the-wisp"),
 ("Gasoline Can", U, 5, [], "OnKill", "Ignite", 1.0, .5, 0, "Kills ignite nearby enemies for 50% Power per second.", "RoR2 Gasoline"),
 ("Topaz Brooch", U, 5, [], "OnKill", "Shield", 1.0, 8, 0, "Kills grant 8 overshield (up to 6 a second).", "RoR2 Topaz Brooch"),
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
 ("Marksman's Monocle", U, 5, [("CritChance", .08), ("CritDamage", .15)], None, None, 0, 0, 0, "+8% crit chance, +15% crit damage.", "Balatro"),
 ("Bounty Poster", U, 5, [("EliteDamage", .20)], "OnEliteKill", "Money", 1.0, 150, 0, "+20% elite damage. Elite kills pay $15.", "Borderlands bounties"),
 ("Fuel Cell", U, 5, [("DashCooldown", .20), ("GrappleCooldown", .20)], None, None, 0, 0, 0, "Dash and grapple recharge 20% faster.", "RoR2 Fuel Cell"),
 ("Rebar Rounds", U, 3, [("Pierce", 1)], None, None, 0, 0, 0, "Bullets pierce +1 enemy.", "Gungeon piercing"),
 ("Buckshot Extender", U, 5, [("Multishot", .35)], None, None, 0, 0, 0, "+35% projectiles. The extras deal half damage.", "Isaac 20/20"),
 ("Adrenal Gland", U, 5, [("LowHealthDamage", .30), ("HealthRegen", 1)], None, None, 0, 0, 0, "+30% damage under 35% HP, +1 HP/s.", "Isaac Bloody Lust"),
 ("Blast Powder", U, 5, [("ExplosionRadius", .30), ("Damage", .06)], None, None, 0, 0, 0, "+30% explosion radius, +6% damage.", "Gungeon Bomb mods"),
 ("Hard Hat", U, 5, [("Armor", 25), ("MoveSpeed", -.03)], None, None, 0, 0, 0, "+25 armor, -3% move speed.", "Brotato trade-offs"),
 ("Cowboy Spurs", U, 5, [("SlideDamage", .25), ("SlideBoost", .15)], None, None, 0, 0, 0, "+25% damage while sliding, +15% slide speed.", "Titanfall"),
 ("Mag Coupler", U, 5, [("MagSize", .35)], None, None, 0, 0, 0, "+35% magazine size.", "CoD dual mags"),
 ("Thorny Vest", U, 5, [("Thorns", 40), ("Armor", 5)], None, None, 0, 0, 0, "Enemies that hit you take 40 damage (scales each round). +5 armor.", "RoR2 Razorwire"),
 ("High Ground", U, 5, [("AirDamage", .25), ("JumpPower", .08)], None, None, 0, 0, 0, "+25% airborne damage, +8% jump height.", "Gunfire Reborn"),
 ("Trade License", U, 5, [("CasinoDiscount", .12), ("MoneyGain", .10)], None, None, 0, 0, 0, "Everything costs 12% less, +10% money.", "Casino comps"),
 ("Mantle Spikes", U, 5, [], "OnMantle", "Nova", 1.0, 1.5, 1.0, "Vaulting a ledge blasts nearby enemies for 150% Power.", "Sulfur kick"),
 ("Second Barrel", U, 5, [], "OnHeadshot", "Explode", .5, .8, 0, "50% chance headshots explode for 80% of the hit.", "Gungeon"),
 # ---- RARE
 ("Behemoth Shell", R, 3, [], "OnHit", "Explode", 1.0, .30, 0, "Every hit explodes for 30% of the hit.", "RoR2 Brilliant Behemoth"),
 ("Spirit Daggers", R, 3, [], "OnKill", "Missile", 1.0, 1.0, 0, "Kills launch a homing dagger for 100% Power.", "RoR2 Ceremonial Dagger"),
 ("Winter's Halo", R, 3, [], "Periodic", "Freeze", 1.0, .50, 3.0, "Every 3s, chill all enemies near you by 50%.", "Hades Demeter"),
 ("Storm Caller", R, 3, [], "OnCrit", "Chain", 1.0, .45, 0, "Crits arc 45% damage to 3 nearby enemies.", "Hades Zeus"),
 ("Executioner's Hood", R, 3, [], "OnHit", "Execute", 1.0, .15, 0, "Hits instantly kill non-bosses under 15% health.", "RoR2 Old Guillotine"),
 ("Vampire Fang", R, 3, [("Lifesteal", .06)], "OnKill", "Heal", 1.0, 3, 0, "Heal 6% of damage dealt; kills heal 3.", "Isaac Charm of the Vampire"),
 ("Heavy Barrel", R, 3, [("Damage", .30), ("Knockback", .30), ("FireRate", -.10)], None, None, 0, 0, 0, "+30% damage, +30% knockback, -10% fire rate.", "Brotato trade-offs"),
 ("Wind Walker", R, 3, [("ExtraJumps", 1), ("DashCharges", 1), ("AirControl", .20)], None, None, 0, 0, 0, "+1 jump, +1 dash, +20% air control.", "Hades Hermes"),
 ("Mercury Sandals", R, 3, [("MoveSpeed", .20), ("SlideBoost", .20), ("WallRunTime", 1.0)], None, None, 0, 0, 0, "+20% speed, +20% slide speed, +1s wall-run.", "Hermes"),
 ("Deadeye Glass", R, 3, [("HeadshotDamage", .50), ("Spread", .30)], None, None, 0, 0, 0, "+50% headshot damage, 30% tighter spread.", "Sulfur scopes"),
 ("Ammo Printer", R, 3, [], "Periodic", "RefundAmmo", 1.0, .10, 2.0, "Every 2s, refill 10% of your magazine.", "Gungeon Ammo Synthesizer"),
 ("Gilded Rounds", R, 3, [], "OnHit", "Money", .20, 6, 0, "20% chance per hit to earn 60 cents.", "Borderlands Gold weapons"),
 ("Barrier Coil", R, 3, [], "Periodic", "Shield", 1.0, 30, 6.0, "Every 6s, gain 30 overshield.", "RoR2 Personal Shield Generator"),
 ("Afterburner", R, 3, [], "OnDash", "Explode", 1.0, 1.5, 0, "Dashing leaves an explosion for 150% Power.", "Hades Athena dash"),
 ("Fire Walker", R, 3, [], "OnSlide", "Ignite", 1.0, .6, 0, "Sliding ignites nearby enemies for 60% Power per second.", "Titanfall fire trails"),
 ("Overclock", R, 3, [("FireRate", .25), ("ReloadSpeed", .15)], None, None, 0, 0, 0, "+25% fire rate, +15% reload speed.", "CoD Double Tap"),
 ("Notched Rounds", R, 3, [("CritChance", .10)], "OnCrit", "Bleed", .5, .8, 0, "+10% crit. Crits have 50% to bleed for 80%.", "Balatro"),
 ("Tax Collector", R, 3, [("Interest", .06), ("MoneyGain", .15)], None, None, 0, 0, 0, "+6% interest, +15% money.", "Balatro To the Moon"),
 ("Grapple Shock", R, 3, [], "OnGrapple", "Shockwave", 1.0, 1.5, 0, "Grappling releases a shockwave for 150% Power.", "Apex/Titanfall"),
 ("Phantom Step", R, 3, [("DashDamage", 150)], "OnDash", "Shield", 1.0, 15, 0, "Dash damage +150 (scales each round); dashes grant 15 overshield.", "Hades"),
 # ---- EPIC
 ("Chain Reaction", E, 2, [], "OnKill", "Explode", 1.0, 1.2, 0, "Every kill explodes for 120% Power.", "RoR2 Will-o'-the-wisp+"),
 ("Split Rounds", E, 2, [("Multishot", 1.0)], None, None, 0, 0, 0, "Doubles your projectiles. The extras deal half damage.", "Isaac 20/20"),
 ("Time Dilator", E, 2, [], "OnDash", "Freeze", 1.0, .70, 0, "Dashing freezes enemies around you (70% slow).", "Superhot"),
 ("Bloodlust Engine", E, 2, [], "OnKill", "Rage", 1.0, .25, 0, "Kills grant +25% damage for 4s.", "Doom Blood Punch"),
 ("Storm Anchor", E, 2, [], "OnGrapple", "Chain", 1.0, 1.5, 0, "Grappling unleashes lightning for 150% Power.", "Titanfall 2"),
 ("Air Supremacy", E, 2, [("AirDamage", .50), ("ExtraJumps", 1)], None, None, 0, 0, 0, "+50% airborne damage, +1 jump.", "Gunfire Reborn"),
 ("Seventh Son", E, 2, [("CritChance", .07), ("ProcChance", .27)], None, None, 0, 0, 0, "+7% crit chance, +27% proc chance.", "Balatro Oops! All 6s"),
 ("Overflow Rounds", E, 2, [("Pierce", 3), ("Damage", .25)], None, None, 0, 0, 0, "+3 pierce, +25% damage.", "Gungeon"),
 ("Overdrive", E, 2, [], "OnDash", "Rage", 1.0, .40, 0, "Dashing grants +40% damage for 4s.", "Hades dash boons"),
 ("Momentum Core", E, 2, [("SpeedDamage", .80), ("MoveSpeed", .10)], None, None, 0, 0, 0, "+80% damage per 1000 speed above a walk, +10% speed.", "Titanfall"),
 ("Loose Wire", E, 2, [("ProcChance", .40)], "OnHit", "Chain", .08, .55, 0, "+40% proc chance; 8% on hit to arc for 55%.", "Balatro"),
 ("Hex Bullets", E, 2, [], "OnHit", "Freeze", .25, .5, 0, "25% chance on hit to slow 50%; slowed enemies take +15% damage.", "Hades"),
 # ---- LEGENDARY
 ("Phoenix Feather", L, 1, [("Revives", 1)], None, None, 0, 0, 0, "Rise from death with full health. Recharges every third round.", "CoD Quick Revive"),
 ("Bottomless Chamber", L, 1, [("AmmoSave", .50)], None, None, 0, 0, 0, "50% chance shots cost no ammo.", "Gungeon Bottomless clip"),
 ("Outlaw's Nerve", L, 1, [("Damage", .25), ("FireRate", .25), ("MoveSpeed", .25)], None, None, 0, 0, 0, "+25% damage, fire rate and speed.", "Balatro Flush"),
 ("Death Warrant", L, 1, [("CritChance", .10)], "OnCrit", "Execute", 1.0, .30, 0, "+10% crit. Crits kill non-bosses under 30% HP.", "Death Warrant"),
 ("Storm Crown", L, 1, [], "Periodic", "Chain", 1.0, .5, 1.0, "Every second, lightning strikes nearby for 50% Power.", "RoR2 Charged Perforator"),
 ("Midas Touch", L, 1, [("MoneyGain", .25)], "OnKill", "Money", 1.0, 30, 0, "+25% money; every kill pays about $3 extra.", "Midas"),
 ("Hermes' Wings", L, 1, [("ExtraJumps", 2), ("DashCharges", 2), ("MoveSpeed", .20)], None, None, 0, 0, 0, "+2 jumps, +2 dashes, +20% speed.", "Hades Hermes"),
 # ---- CURSED (Skull jackpots)
 ("Glass Cannon", X, 1, [("Damage", .60), ("MaxHealth", -60)], None, None, 0, 0, 0, "+60% damage. -60 max health.", "RoR2 Shaped Glass"),
 ("Blood Pact", X, 1, [("Lifesteal", .10), ("HealthRegen", -4), ("MaxHealth", -25)], None, None, 0, 0, 0, "Heal 10% of damage dealt. No natural regen. -25 max HP.", "Isaac Devil deals"),
 ("Devil's Bargain", X, 1, [("ProcChance", .60), ("Armor", -30)], None, None, 0, 0, 0, "+60% proc chance. -30 armor.", "Isaac D6"),
 ("Loan Shark", X, 1, [("MoneyGain", .60), ("CasinoDiscount", -.25)], None, None, 0, 0, 0, "+60% money. Everything costs 25% more.", "Balatro Credit Card"),
 ("Berserker's Brand", X, 1, [("FireRate", .40), ("Spread", -.50)], None, None, 0, 0, 0, "+40% fire rate. 50% wider spread.", "Gungeon curses"),
 ("Hollow Bones", X, 1, [("MoveSpeed", .30), ("ExtraJumps", 1), ("MaxHealth", -40)], None, None, 0, 0, 0, "+30% speed, +1 jump. -40 max HP.", "Brotato Ghost"),
 ("Cursed Coin", X, 1, [("MoneyGain", .6), ("Damage", -.15)], None, None, 0, 0, 0, "+60% money. -15% damage.", "Isaac curses"),
 ("Death Wish", X, 1, [("LowHealthDamage", 1.0), ("MaxHealth", -30)], "OnHurt", "Rage", 1.0, .30, 0, "+100% damage under 35% HP; getting hit grants +30% damage. -30 max HP.", "Isaac Bloody Lust"),

 # ---- melee
 ("Whetstone", C, 10, [("MeleeDamage", .20)], None, None, 0, 0, 0, "+20% melee damage.", "melee"),
 ("Quick Wrists", C, 8, [("MeleeSpeed", .12)], None, None, 0, 0, 0, "+12% melee swing speed.", "melee"),
 ("Long Reach", C, 5, [("MeleeRange", .12)], None, None, 0, 0, 0, "+12% melee reach.", "melee"),
 ("Brass Knuckles", C, 6, [("MeleeDamage", .12), ("MeleeKnock", .25)], None, None, 0, 0, 0, "+12% melee damage, +25% melee knockback.", "melee"),
 ("Butcher's Apron", U, 5, [("MeleeLifesteal", .04)], None, None, 0, 0, 0, "Melee hits heal 4% of the damage dealt.", "melee"),
 ("Wide Swing", U, 4, [("MeleeCleave", 1), ("MeleeArc", .15)], None, None, 0, 0, 0, "Melee hits 1 more enemy and swings 15% wider.", "melee"),
 ("Serrated Edge", U, 5, [("MeleeBleed", .35)], None, None, 0, 0, 0, "Melee hits bleed for 35% of the damage over 3 seconds.", "melee"),
 ("Pickpocket", U, 5, [("MeleeMoney", 12)], None, None, 0, 0, 0, "Melee hits pay $1.20 extra.", "melee"),
 ("Cheap Shot", U, 5, [("MeleeCrit", .12)], None, None, 0, 0, 0, "+12% melee crit chance.", "melee"),
 ("Hot Iron", R, 3, [("MeleeBurn", 30), ("MeleeDamage", .10)], None, None, 0, 0, 0, "Melee hits set enemies on fire. +10% melee damage.", "melee"),
 ("Live Wire", R, 3, [("MeleeShock", .40)], None, None, 0, 0, 0, "Melee hits arc 40% of the damage to 2 nearby enemies.", "melee"),
 ("Bayonet Drill", R, 3, [("MeleeAmmo", .25)], None, None, 0, 0, 0, "Melee kills refill 25% of your magazine.", "melee"),
 ("Second Wind", R, 3, [("MeleeDashReset", 1), ("MeleeSpeed", .08)], None, None, 0, 0, 0, "Melee kills refill a dash. +8% swing speed.", "melee"),
 ("Riot Guard", R, 3, [("MeleeGuard", .20)], None, None, 0, 0, 0, "Take 20% less damage for 2 seconds after a melee hit.", "melee"),
 ("Headsman", E, 2, [("MeleeExecute", .18)], None, None, 0, 0, 0, "Melee kills any normal enemy below 18% health outright.", "melee"),
 ("Whirlwind", E, 2, [("MeleeArc", .60), ("MeleeCleave", 3), ("MeleeSpeed", .10)], None, None, 0, 0, 0, "Much wider swings that hit 3 more enemies. +10% swing speed.", "melee"),
 ("Berserker", E, 2, [("MeleeFrenzy", .08)], None, None, 0, 0, 0, "Each melee kill adds +8% melee damage and swing speed for 6 seconds, up to 5 times.", "melee"),
 ("Hangman's Mask", L, 1, [("MeleeDamage", 1.0), ("MeleeExecute", .12), ("MeleeLifesteal", .05)], None, None, 0, 0, 0, "+100% melee damage. Executes below 12% health. Melee heals 5%.", "melee"),
 # ---- GUN MODIFIERS (workbench only; they live on one gun)
 ("Underbarrel Launcher", R, 1, [("AltLauncher", 1)], None, None, 0, 0, 0, "Aim and fire to lob a grenade from this gun. 5 second cooldown.", "CoD underbarrel"),
 ("Gravity Coil", E, 1, [("AltGravity", 1)], None, None, 0, 0, 0, "Aim and fire to throw a singularity that drags enemies in, then bursts. 10 second cooldown.", "Titanfall gravity star"),
 ("Rail Capacitor", E, 1, [("AltRail", 1)], None, None, 0, 0, 0, "Aim and fire for a charged beam through everything in its line. 6 second cooldown.", "Quake railgun"),
 ("Flak Tube", U, 1, [("AltBuck", 1)], None, None, 0, 0, 0, "Aim and fire for a point-blank blast of buckshot. 4 second cooldown.", "Masterkey"),
 ("Active Reload", U, 1, [("ActiveReload", 1)], None, None, 0, 0, 0, "Press reload again inside the marked window to finish at once and load a hot magazine: +35% damage.", "Gears of War"),
 ("Echo Chamber", R, 1, [("EchoShot", 1)], None, None, 0, 0, 0, "Every shot is followed by a free second shot at half damage.", "Destiny"),
 ("Ricochet Rounds", U, 2, [("Ricochet", 1)], None, None, 0, 0, 0, "Bullets skip to another enemy nearby for 60% damage.", "Borderlands"),
 ("Closer", U, 2, [("LastRounds", .5)], None, None, 0, 0, 0, "The last third of the magazine deals +50% damage.", "Destiny"),
 ("Opening Shot", U, 2, [("FirstShot", 1.5)], None, None, 0, 0, 0, "The first shot of every magazine deals +150% damage.", "Hades"),
 ("Fan the Hammer", U, 1, [("FullAuto", 1), ("FireRate", .15)], None, None, 0, 0, 0, "This gun fires for as long as you hold the trigger, and 15% faster.", "Westerns"),
 ("Reaper's Feed", R, 2, [("KillReload", 2)], None, None, 0, 0, 0, "Kills put 2 rounds straight back in the magazine.", "Destiny"),
 ("Steady Aim", U, 2, [("SteadyAim", .6)], None, None, 0, 0, 0, "Aim for a moment without firing: the next shot deals +60% damage.", "Sniper Elite"),
 ("Shrapnel Jacket", R, 2, [("Shrapnel", .25)], None, None, 0, 0, 0, "Kills burst into shrapnel: 25% of the shot's damage to enemies nearby.", "RoR2"),
 ("Hollow Charge", R, 2, [("Pierce", 2), ("Damage", .1)], None, None, 0, 0, 0, "Shots pierce 2 more enemies, +10% damage.", "AP rounds"),
 ("Twin Link", E, 1, [("Multishot", 1)], None, None, 0, 0, 0, "Fires a twin of every projectile at half damage.", "Gungeon"),
 ("Drum Magazine", U, 2, [("MagSize", .6)], None, None, 0, 0, 0, "+60% magazine size.", "Thompson drum"),
 # ---- CLASS PERKS (only offered to that class)
 ("Battering Ram", U, 3, [("AbilityCooldown", .2)], None, None, 0, 0, 0, "Bull Rush recharges 20% faster.", "Brawler"),
 ("Bone Breaker", R, 2, [("AbilityPower", .6)], None, None, 0, 0, 0, "Bull Rush hits 60% harder and staggers what survives.", "Brawler"),
 ("Iron Gut", U, 3, [("MaxHealth", 25), ("Armor", 4)], None, None, 0, 0, 0, "+25 max health, +4 armor.", "Brawler"),
 ("Blood Frenzy", L, 1, [("MeleeAbilityReset", 1)], None, None, 0, 0, 0, "Every kill with a melee swing takes a second off Bull Rush's cooldown.", "Brawler"),
 ("Meat Shield", R, 2, [("RushGuard", .2)], None, None, 0, 0, 0, "Take 20% less damage for 3 seconds after a Bull Rush.", "Brawler"),
 ("Overclocked Servos", U, 4, [("TurretRate", .15)], None, None, 0, 0, 0, "Your turret fires 15% faster.", "Engineer"),
 ("Bored-Out Barrel", U, 4, [("TurretDamage", .2)], None, None, 0, 0, 0, "Your turret deals 20% more damage.", "Engineer"),
 ("Twin Mount", L, 1, [("TurretCount", 1)], None, None, 0, 0, 0, "Deploy a second turret. It fires a built-in sentry gun.", "Engineer"),
 ("Shock Fence", R, 2, [("TurretShock", 1)], None, None, 0, 0, 0, "Your turret zaps and slows enemies that come close to it.", "Engineer"),
 ("Field Repairs", E, 1, [("TurretAura", 1)], None, None, 0, 0, 0, "Near your turret you regenerate 4 health a second and reload 30% faster.", "Engineer"),
 ("Slow Hands", U, 3, [("AbilityDuration", 1.5)], None, None, 0, 0, 0, "Deadeye lasts 1.5 seconds longer.", "Gunslinger"),
 ("Trick Holster", U, 3, [("AbilityCooldown", .2)], None, None, 0, 0, 0, "Deadeye recharges 20% faster.", "Gunslinger"),
 ("Dead to Rights", E, 1, [("DeadeyeExtend", .4)], None, None, 0, 0, 0, "Kills during Deadeye extend it by 0.4 seconds, up to 4 seconds each time.", "Gunslinger"),
 ("Two-Gun Kid", L, 1, [("SwapReload", 1)], None, None, 0, 0, 0, "Swapping guns reloads the one you put away, and you deal +20% damage for 2 seconds.", "Gunslinger"),
 ("Fanning Practice", R, 3, [("FireRate", .12), ("MoveSpeed", .06)], None, None, 0, 0, 0, "+12% fire rate, +6% move speed.", "Gunslinger"),
 ("Eagle Eye", U, 4, [("HeadshotDamage", .3)], None, None, 0, 0, 0, "+30% headshot damage.", "Sniper"),
 ("Crow's Nest", R, 2, [("AirDamage", .3)], None, None, 0, 0, 0, "+30% damage while airborne.", "Sniper"),
 ("Marked for Death", L, 1, [("HeadMark", .3)], None, None, 0, 0, 0, "Headshots mark the target: it takes 30% more damage from everything for 5 seconds.", "Sniper"),
 ("Steady Breath", E, 2, [("AdsCrit", .2)], None, None, 0, 0, 0, "+20% crit chance while aiming.", "Sniper"),
 ("Reel Spring", U, 3, [("GrappleCooldown", .3)], None, None, 0, 0, 0, "Grapple recharges 30% faster.", "Sniper"),
 ("Bigger Boom", U, 3, [("ExplosionRadius", .15)], None, None, 0, 0, 0, "+15% explosion radius.", "Bomber"),
 ("Bomb Belt", R, 2, [("GrenadeCap", 2)], None, None, 0, 0, 0, "Carry 2 more grenades.", "Bomber"),
 ("Short Fuse", U, 3, [("AbilityCooldown", .2)], None, None, 0, 0, 0, "Satchel Charge recharges 20% faster.", "Bomber"),
 ("Daisy Chain", E, 1, [("BlastChain", .5)], None, None, 0, 0, 0, "Enemies killed by a blast explode for half its damage.", "Bomber"),
 ("Fire in the Hole", L, 1, [("AbilityPower", 1)], None, None, 0, 0, 0, "Satchel Charge bursts into four more bombs.", "Bomber"),

 # ================================================================ SECOND SET
 # Twice the pool. Built around conditions (who you hit, from where, in what shape), ways of not dying that are not
 # just "more health", things that fire off your class ability, pickups, multi-kills and a broken shield, and a
 # second row of blades-in-hand perks. Sources: Risk of Rain 2, Hades, Dead Cells, Slay the Spire, Gunfire Reborn,
 # Enter the Gungeon, Brotato, Vampire Survivors.
 # ---- COMMON
 ("Crowbar", C, 10, [("FullHealthDamage", .20)], None, None, 0, 0, 0, "+20% damage to enemies above 90% health.", "RoR2 Crowbar"),
 ("Focus Lens", C, 10, [("CloseDamage", .12)], None, None, 0, 0, 0, "+12% damage to enemies within 6 meters.", "RoR2 Focus Crystal"),
 ("Spyglass", C, 10, [("FarDamage", .15)], None, None, 0, 0, 0, "+15% damage to enemies beyond 20 meters.", "Gunfire Reborn long-range scrolls"),
 ("Vulture's Eye", C, 10, [("StatusDamage", .15)], None, None, 0, 0, 0, "+15% damage to burning, bleeding or slowed enemies.", "Hades Privileged Status"),
 ("Clean Bill", C, 10, [("HealthyDamage", .10)], None, None, 0, 0, 0, "+10% damage while you are above 90% health.", "Dead Cells full-health mutations"),
 ("Tin Plate", C, 5, [("PlateArmor", 3)], None, None, 0, 0, 0, "Every hit you take is reduced by 3 (never by more than 60%).", "RoR2 Repulsion Armor Plate"),
 ("Rabbit Reflexes", C, 5, [("BlockChance", .07)], None, None, 0, 0, 0, "7% chance to shrug off a hit completely.", "RoR2 Tougher Times"),
 ("Pocket Watch", C, 10, [("AbilityCooldown", .08), ("GrappleCooldown", .08)], None, None, 0, 0, 0, "Your class ability recharges 8% faster.", "RoR2 Alien Head (lite)"),
 ("Canteen", C, 10, [("HealBoost", .15)], None, None, 0, 0, 0, "+15% to all healing.", "RoR2 Rejuvenation Rack (lite)"),
 ("Rattlesnake Skin", C, 10, [], "OnHurt", "Haste", 1.0, .25, 3.0, "Taking damage grants +25% move speed for 4s.", "Slay the Spire reactive relics"),
 ("Pocket Sand", C, 10, [], "OnHurt", "Freeze", 1.0, .35, 4.0, "Taking damage slows nearby enemies by 35% (4s cooldown).", "Hades revenge boons"),
 ("Powder Horn", C, 10, [], "OnMultiKill", "RefundAmmo", 1.0, .15, 0, "Killing 3 enemies in quick succession refills 15% of your magazine.", "RoR2 Bandolier"),
 ("Buzzard Feather", C, 10, [("AirGuard", .08), ("AirControl", .15)], None, None, 0, 0, 0, "Take 8% less damage while airborne. +15% air control.", "Titanfall"),
 ("Blood Sausage", C, 10, [("CritHeal", 2)], None, None, 0, 0, 0, "Critical hits heal 2.", "RoR2 Harvester's Scythe"),
 ("Hobnail Boots", C, 10, [("SlideDamage", .10), ("DashDamage", 30)], None, None, 0, 0, 0, "+10% damage while sliding. Dashing through enemies deals 30 damage (scales each round).", "Dead Cells"),
 ("Lead Weight", C, 10, [("MeleeHeavy", .25)], None, None, 0, 0, 0, "Heavy blows and chain finishers deal +25% damage.", "Hades Heavy Knuckle"),
 ("Duelist's Sash", C, 10, [("MeleeArmor", 15)], None, None, 0, 0, 0, "+15 armor while your blade is drawn.", "Dead Cells shields"),
 # ---- UNCOMMON
 ("Old Guillotine", U, 3, [("EliteExecute", .10)], None, None, 0, 0, 0, "Elites below 10% health are culled instantly.", "RoR2 Old Guillotine"),
 ("Trophy Rack", U, 3, [("KillHealth", 1)], None, None, 0, 0, 0, "Every 8 kills permanently adds +1 max health (up to +60).", "RoR2 Infusion"),
 ("Shield Generator", U, 5, [("ShieldRegen", 20)], None, None, 0, 0, 0, "After 4 seconds without being hit, regenerate up to 20 overshield.", "RoR2 Personal Shield Generator"),
 ("Static Vest", U, 5, [], "OnHurt", "Chain", 1.0, .8, 2.0, "Taking damage zaps nearby enemies for 80% Power (2s cooldown).", "Hades Zeus revenge"),
 ("Cold Snap", U, 5, [], "OnShieldBreak", "Freeze", 1.0, .60, 0, "When your overshield breaks, enemies near you are slowed by 60%.", "Gunfire Reborn shield scrolls"),
 ("Showman's Cape", U, 5, [], "OnAbility", "Haste", 1.0, .30, 6.0, "Using your class ability grants +30% move speed for 4s (6s cooldown).", "Hades cast boons"),
 ("Battle Hymn", U, 5, [], "OnAbility", "Rage", 1.0, .20, 10.0, "Using your class ability grants +20% damage for 4s (10s cooldown).", "RoR2 skill-use items"),
 ("Triple Threat", U, 5, [], "OnMultiKill", "Explode", 1.0, 1.2, 0, "Killing 3 enemies in quick succession sets off an explosion for 120% Power.", "Vampire Survivors"),
 ("Hot Streak", U, 5, [("StreakDamage", .03), ("MoveSpeed", .04)], None, None, 0, 0, 0, "+3% damage per kill in a streak (up to 10 kills; streak bonuses cap at +60%), +4% move speed.", "RoR2 Berzerker's Pauldron"),
 ("Money Belt", U, 5, [("MoneyDamage", .005)], None, None, 0, 0, 0, "+0.5% damage for every $100 you are carrying (up to $2,000).", "Isaac Money = Power"),
 ("Locksmith's Picks", U, 3, [("ChestLuck", .10)], None, None, 0, 0, 0, "+10% chance a chest holds the better of its two rarities.", "Slay the Spire chest relics"),
 ("Paymaster", U, 5, [("RoundMoney", 300), ("Interest", .02)], None, None, 0, 0, 0, "+$30 at the end of every round, +2% interest.", "Brotato harvesting"),
 ("Smoke Pellet", U, 3, [("DashGuard", .30), ("DashCooldown", .10)], None, None, 0, 0, 0, "Take 30% less damage for 1.5 seconds after a dash. Dash recharges 10% faster.", "Hades Divine Dash"),
 ("Surgeon's Kit", U, 5, [("HealBoost", .30), ("HealthRegen", 1.0)], None, None, 0, 0, 0, "+30% to all healing, +1 health per second.", "RoR2 Rejuvenation Rack"),
 ("Stopwatch", U, 3, [], "OnEliteKill", "Cooldown", 1.0, 3, 0, "Elite kills take 3 seconds off your class ability.", "RoR2 Bandolier / Hardlight"),
 ("Iron Lung", U, 3, [("SecondWind", .25)], None, None, 0, 0, 0, "Once a round, dropping below 25% health restores 25% of your max health.", "Hades Death Defiance (lite)"),
 ("Fencer's Glove", U, 5, [("MeleeRange", .15), ("MeleeCrit", .06)], None, None, 0, 0, 0, "+15% melee reach, +6% melee crit chance.", "Dead Cells"),
 ("Concussion", U, 3, [("MeleeStun", .8)], None, None, 0, 0, 0, "Heavy blows stun what they hit for 0.8 seconds.", "RoR2 Stun Grenade"),
 ("War Drum", U, 5, [], "OnMeleeKill", "Haste", 1.0, .30, 0, "Melee kills grant +30% move speed for 4s.", "Dead Cells Vengeance"),
 # ---- RARE
 ("Vulture's Due", R, 3, [("EliteExecute", .18), ("EliteDamage", .20)], None, None, 0, 0, 0, "Elites below 18% health are culled instantly. +20% elite damage.", "RoR2 Old Guillotine"),
 ("Sharpshooter's Creed", R, 3, [("FarDamage", .50), ("CritDamage", .20)], None, None, 0, 0, 0, "+50% damage to enemies beyond 20 meters, +20% crit damage.", "Gunfire Reborn"),
 ("Close Quarters", R, 3, [("CloseDamage", .40), ("BlockChance", .06)], None, None, 0, 0, 0, "+40% damage to enemies within 6 meters. 6% chance to shrug off a hit.", "RoR2 Focus Crystal"),
 ("Opportunist", R, 3, [("StatusDamage", .50), ("FullHealthDamage", .25)], None, None, 0, 0, 0, "+50% damage to burning, bleeding or slowed enemies. +25% to enemies above 90% health.", "Hades Privileged Status"),
 ("Titan's Belt", R, 3, [("MaxHealth", 60), ("HealthDamage", .02)], None, None, 0, 0, 0, "+60 max health. +2% damage per 25 max health above 150.", "Brotato"),
 ("Second Skin", R, 3, [("PlateArmor", 6), ("Armor", 10)], None, None, 0, 0, 0, "Every hit you take is reduced by 6 (never by more than 60%). +10 armor.", "RoR2 Repulsion Armor Plate"),
 ("Guardian Angel", R, 2, [], "OnHurt", "Invuln", 1.0, 1.2, 15.0, "Taking a hit makes you untouchable for 1.2 seconds (15s cooldown).", "Isaac Holy Mantle"),
 ("Aegis", R, 3, [("Overheal", 60), ("HealBoost", .20)], None, None, 0, 0, 0, "Healing above full health becomes overshield (up to 60). +20% healing.", "RoR2 Aegis"),
 ("Reactive Plating", R, 3, [("ShieldRegen", 25)], "OnShieldBreak", "Shockwave", 1.0, 1.5, 0, "Regenerate up to 25 overshield. When it breaks, a shockwave hits for 150% Power.", "Borderlands nova shields"),
 ("Encore", R, 3, [], "OnAbility", "Shield", 1.0, 35, 12.0, "Using your class ability grants 35 overshield (12s cooldown).", "Hades"),
 ("Grand Finale", R, 3, [], "OnAbility", "Nova", 1.0, 2.5, 8.0, "Using your class ability releases a burst for 250% Power (8s cooldown).", "Hades cast boons"),
 ("Overtime", R, 3, [], "OnMultiKill", "Cooldown", 1.0, 1.5, 0, "Killing 3 enemies in quick succession takes 1.5 seconds off your class ability.", "RoR2 Hardlight Afterburner"),
 ("Massacre", R, 3, [], "OnMultiKill", "Rage", 1.0, .30, 0, "Killing 3 enemies in quick succession grants +30% damage for 4s.", "Doom"),
 ("Master Key", R, 2, [("ChestLuck", .20), ("ChestRefund", .10)], None, None, 0, 0, 0, "+20% chance a chest holds the better rarity. Chests refund 10%.", "Slay the Spire"),
 ("Featherfall", R, 3, [("AirGuard", .30), ("AirDamage", .20), ("AirControl", .20)], None, None, 0, 0, 0, "Take 30% less damage while airborne. +20% airborne damage and air control.", "Titanfall"),
 ("Heart of Oak", R, 2, [("SecondWind", .40), ("MaxHealth", 30)], None, None, 0, 0, 0, "Once a round, dropping below 25% health restores 40% of your max health. +30 max health.", "Hades Death Defiance"),
 ("Reaper's Whetstone", R, 3, [("MeleeDamage", .30), ("MeleeHeavy", .30)], None, None, 0, 0, 0, "+30% melee damage. Heavy blows and finishers deal a further +30%.", "Dead Cells"),
 ("Powder Charge", R, 3, [], "OnMeleeKill", "Explode", 1.0, 1.5, 0, "Melee kills explode for 150% Power.", "RoR2 Will-o'-the-wisp"),
 ("Iron Curtain", R, 3, [("MeleeArmor", 35), ("MeleeGuard", .10)], None, None, 0, 0, 0, "+35 armor while your blade is drawn. Take 10% less damage for 2 seconds after a melee hit.", "Dead Cells shields"),
 ("Adrenal Surge", R, 3, [], "OnMeleeKill", "Cooldown", 1.0, 1, 0, "Melee kills take a second off your class ability.", "RoR2 Hardlight Afterburner"),
 # ---- EPIC
 ("Iron Will", E, 1, [("HitCap", .40)], None, None, 0, 0, 0, "No single hit can take more than 40% of your max health.", "RoR2 one-shot protection"),
 ("Bulwark", E, 2, [("BlockChance", .20), ("PlateArmor", 5)], None, None, 0, 0, 0, "20% chance to shrug off a hit. Every hit you take is reduced by 5.", "RoR2 Tougher Times"),
 ("Predator", E, 2, [("FullHealthDamage", .60), ("CloseDamage", .30)], None, None, 0, 0, 0, "+60% damage to enemies above 90% health, +30% to enemies within 6 meters.", "Dead Cells Ambush"),
 ("Tyrant's Purse", E, 2, [("MoneyDamage", .02), ("RoundMoney", 500)], None, None, 0, 0, 0, "+2% damage for every $100 you are carrying (up to $2,000). +$50 at the end of every round.", "Isaac Money = Power"),
 ("Unbroken", E, 2, [("StreakDamage", .08), ("HealthyDamage", .20)], None, None, 0, 0, 0, "+8% damage per kill in a streak (streak bonuses cap at +60%). +20% damage above 90% health.", "Hades"),
 ("Curtain Call", E, 1, [], "OnAbility", "Invuln", 1.0, 1.5, 12.0, "Using your class ability makes you untouchable for 1.5 seconds (12s cooldown).", "Hades Athena"),
 ("Feeding Frenzy", E, 2, [("Lifesteal", .03)], "OnMultiKill", "Heal", 1.0, 30, 0, "Killing 3 enemies in quick succession heals up to 30. Heal 3% of damage dealt.", "Doom glory kills"),
 ("Lich's Bargain", E, 2, [("KillHealth", 2), ("HealBoost", .30)], None, None, 0, 0, 0, "Every 8 kills adds +1 max health (up to +120). +30% to all healing.", "RoR2 Infusion"),
 ("Vanguard", E, 2, [("ShieldRegen", 50), ("Overheal", 50)], None, None, 0, 0, 0, "Regenerate up to 50 overshield out of combat. Healing above full becomes overshield (up to 50).", "RoR2 Transcendence"),
 ("Mirror Shard", E, 1, [("ShieldRegen", 20)], "OnShieldBreak", "Invuln", 1.0, 1.0, 8.0, "Regenerate up to 20 overshield. When it breaks you are untouchable for a second (8s cooldown).", "Isaac Holy Mantle"),
 ("Giant Slayer", E, 2, [("MeleeHeavy", .80), ("MeleeStun", 1.0)], None, None, 0, 0, 0, "Heavy blows and finishers deal +80% damage and stun for a second.", "Hades Heavy Knuckle"),
 ("Bladestorm", E, 2, [("MeleeSpeed", .10)], "OnMeleeKill", "Nova", 1.0, 2.0, 0, "Melee kills release a burst for 200% Power. +10% swing speed.", "Dead Cells"),
 # ---- LEGENDARY
 ("Avalanche", L, 1, [("StreakDamage", .10)], "OnMultiKill", "Explode", 1.0, 2.5, 0, "+10% damage per kill in a streak (streak bonuses cap at +60%). Triple kills explode for 250% Power.", "Vampire Survivors"),
 ("Gold Fever", L, 1, [("MoneyDamage", .03), ("MoneyGain", .30)], None, None, 0, 0, 0, "+3% damage for every $100 you are carrying (up to $2,000). +30% money.", "Isaac Money = Power"),
 ("Colossus", L, 1, [("MaxHealth", 100), ("HealthDamage", .03), ("PlateArmor", 4)], None, None, 0, 0, 0, "+100 max health. +3% damage per 25 max health above 150. Hits are reduced by 4.", "Brotato"),
 ("Apex Predator", L, 1, [("FullHealthDamage", 1.0), ("EliteExecute", .20)], None, None, 0, 0, 0, "+100% damage to enemies above 90% health. Elites below 20% health are culled.", "RoR2 Crowbar + Guillotine"),
 ("Master of Ceremonies", L, 1, [("AbilityCooldown", .40), ("GrappleCooldown", .40)], "OnAbility", "Rage", 1.0, .40, 12.0, "Your class ability recharges 40% faster. Using it grants +40% damage for 4s (12s cooldown).", "RoR2 Alien Head"),
 ("Treasure Hunter", L, 1, [("ChestLuck", .35), ("ChestRefund", .25)], "OnChest", "Shield", 1.0, 40, 0, "+35% chance a chest holds the better rarity, chests refund 25%, and opening one grants 40 overshield.", "Slay the Spire"),
 ("Warlord's Banner", L, 1, [("MeleeDamage", .60), ("MeleeArmor", 40), ("MeleeHeavy", .50)], None, None, 0, 0, 0, "+60% melee damage, heavy blows a further +50%, and +40 armor while your blade is drawn.", "Dead Cells"),
 # ---- CLASS PERKS, second row
 ("Quick Draw", U, 3, [("SwapSpeed", .40), ("ReloadSpeed", .08)], None, None, 0, 0, 0, "Swap guns 40% faster. +8% reload speed.", "Gunslinger"),
 ("Gun Belt", U, 3, [("ReserveAmmo", .25), ("MagSize", .10)], None, None, 0, 0, 0, "+25% reserve ammo, +10% magazine size.", "Gunslinger"),
 ("Dead Aim", R, 2, [("CritChance", .10), ("Spread", .20)], None, None, 0, 0, 0, "+10% crit chance, 20% tighter spread.", "Gunslinger"),
 ("High Noon", E, 2, [("DeadeyeCrit", .30)], None, None, 0, 0, 0, "+30% crit chance during Deadeye.", "Gunslinger"),
 ("Loaded for Bear", L, 1, [("DeadeyeReload", 1), ("AbilityDuration", 1.0)], None, None, 0, 0, 0, "Deadeye reloads every gun you carry and lasts a second longer.", "Gunslinger"),
 ("Knuckle Wraps", U, 3, [("MeleeSpeed", .12), ("MeleeDamage", .15)], None, None, 0, 0, 0, "+12% swing speed, +15% melee damage.", "Brawler"),
 ("Thick Skull", U, 3, [("Armor", 12), ("BlockChance", .08)], None, None, 0, 0, 0, "+12 armor. 8% chance to shrug off a hit completely.", "Brawler"),
 ("Haymaker", R, 2, [("MeleeHeavy", .60)], None, None, 0, 0, 0, "Heavy blows and chain finishers deal +60% damage.", "Brawler"),
 ("Unstoppable", E, 2, [("RushShield", 40)], None, None, 0, 0, 0, "Bull Rush leaves you with 40 overshield and +30% move speed for 3 seconds.", "Brawler"),
 ("Juggernaut", L, 1, [("MaxHealth", 50), ("HealthMelee", .04)], None, None, 0, 0, 0, "+50 max health. +4% melee damage per 25 max health above 150.", "Brawler"),
 ("Long Barrel", U, 3, [("TurretRange", .30)], None, None, 0, 0, 0, "Your turret sees and shoots 30% farther.", "Engineer"),
 ("Tool Belt", U, 3, [("Armor", 10), ("ReloadSpeed", .12)], None, None, 0, 0, 0, "+10 armor, +12% reload speed.", "Engineer"),
 ("Incendiary Belt", R, 2, [("TurretBurn", 25)], None, None, 0, 0, 0, "Your turret's shots set enemies on fire.", "Engineer"),
 ("Remote Detonator", E, 2, [("TurretBlast", 1)], None, None, 0, 0, 0, "Calling your turret to a new spot blows up the old one for 300% Power.", "Engineer"),
 ("Overwatch", L, 1, [("TurretRate", .35), ("TurretDamage", .35), ("TurretRange", .25)], None, None, 0, 0, 0, "Your turret fires 35% faster, hits 35% harder and reaches 25% farther.", "Engineer"),
 ("Spotter's Scope", U, 3, [("HeadshotDamage", .20), ("FarDamage", .15)], None, None, 0, 0, 0, "+20% headshot damage. +15% damage to enemies beyond 20 meters.", "Sniper"),
 ("Light Pack", U, 3, [("GrappleCooldown", .20), ("AirControl", .25), ("MoveSpeed", .05)], None, None, 0, 0, 0, "Grapple recharges 20% faster. +25% air control, +5% move speed.", "Sniper"),
 ("Patient Hunter", R, 2, [("StillDamage", .30)], None, None, 0, 0, 0, "+30% damage while aiming and standing still.", "Sniper"),
 ("Second Opinion", E, 2, [("HeadCrit", 1)], None, None, 0, 0, 0, "After a headshot kill, your next shot within 3 seconds is a guaranteed crit.", "Sniper"),
 ("Killshot", L, 1, [("HeadExecute", .30)], None, None, 0, 0, 0, "Headshots kill any non-boss enemy below 30% health outright.", "Sniper"),
 ("Powder Keg", U, 3, [("GrenadeDamage", .25)], None, None, 0, 0, 0, "+25% grenade and Satchel Charge damage.", "Bomber"),
 ("Deep Pockets", U, 3, [("GrenadeCap", 1), ("PickupRange", .40)], None, None, 0, 0, 0, "Carry 1 more grenade. +40% pickup range.", "Bomber"),
 ("Scorched Earth", R, 2, [("BlastBurn", .15)], None, None, 0, 0, 0, "Everything your explosions hit burns for 15% of the blast each second.", "Bomber"),
 ("Recycler", E, 2, [("GrenadeSave", .25)], None, None, 0, 0, 0, "25% chance a thrown grenade is not used up.", "Bomber"),
 ("Carpet Bomber", L, 1, [("ClusterAll", 1)], None, None, 0, 0, 0, "Every grenade bursts into five more.", "Bomber"),
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
 ("Gilded Ghoul", "Gilded", "Humanoid", 1.6, 470, 0, 0, 1.0, 0.9, 0xE8C547, 0xFFE27A, 600, 4, 0.35, "Runs away. Drops a fortune if you catch it."),
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
 ("Gilded", "Triple money and a money bag.", 0xFFD700),
 ("Volatile", "Explodes violently on death.", 0xFF3030),
]

# name, title, hp mult, speed, dmg, scale, body, head, attacks, minion, reward, desc
BOSS = [
 ("Big Tony", "The Foreman", 15, 300, 45, 2.8, 0x2E2E3A, 0xB88A6A, ["Charge", "Sweep", "Hook", "Summon", "Slam"], 0, 2500,
  "The stockyard's enforcer. Sidestep his charge and he is winded; stand in his chain's line and he drags you into a swing."),
 ("The Abomination", "Stitched Mass", 32, 260, 55, 3.4, 0x8A5A5A, 0xC08A7A, ["Leap", "Pools", "Sweep", "Ring"], 1, 3500,
  "A dozen enemies sewn into one. It leaps, spits bile that poisons the ground, and sheds crawlers as it comes apart."),
 ("Mother Carrion", "Queen of the Wisps", 30, 220, 35, 3.0, 0x3B2B4B, 0xE05A5A, ["Volley", "Dive", "Barrage", "Summon"], 6, 4000,
  "Dives along a marked line and rains bile. Twice she wards herself: nothing hurts her until her wisps are dead."),
 ("The Undertaker", "Keeper of the Nails", 28, 340, 40, 2.6, 0x1A3A2A, 0xEDE3C8, ["Ambush", "NailWall", "Teleport", "Ring"], 4, 4500,
  "Vanishes and swings from behind you, and lays walls of nails with a single gap to find."),
 ("The Gravedigger", "Warden of Deadwater", 40, 320, 60, 3.6, 0x111111, 0xF2C230, ["Charge", "Hook", "Sweep", "NailWall", "Pools", "Barrage", "Ambush", "Ring", "Summon"], 7, 7000,
  "The town itself, walking. Every trick the others had, and a ward of its own at half health."),
 ("The Founder", "Father of Deadwater Gulch", 70, 250, 55, 4.4, 0x1a0e14, 0xFFD24A, [], 1, 25000,
  "Waits in the crypt under the clock tower. Throws blades, lights the seal and burns the room down around you."),
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
