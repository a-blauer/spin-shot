"""Adds the Descent's creatures and bosses to src/content.json (run after assets.py content(); safe to run twice)."""
import json, os
P = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'content.json')
d = json.load(open(P))
d['enemies'] = [e for e in d['enemies'] if e.get('map') != 6]
d['bosses'] = [b for b in d['bosses'] if b.get('map') != 6]
EK = ['name', 'art', 'ai', 'shape', 'hp', 'speed', 'dmg', 'range', 'cd', 'scale', 'body', 'money', 'minRound', 'weight', 'desc']
E = [
 ('Skitterling', 'Skitterling', 'Runner', 'Crawler', 0.45, 520, 14, 130, 0.9, 1.0, 0x4a3a2c, 40, 1, 7, 'Never one. Count the legs and divide by eight.'),
 ('Webspinner', 'Webspinner', 'Spitter', 'Crawler', 1.6, 230, 24, 1500, 2.6, 1.0, 0x34303e, 110, 4, 2.2, 'Spits from across the room and waits for you to slow down.'),
 ('Ooze', 'Ooze', 'Walker', 'Bloated', 1.5, 190, 26, 150, 1.3, 1.5, 0x4a6a3a, 80, 2, 4, 'What is left when a room has not been opened for a long time. Cut it and there are two.', {'innate': ['Splitting']}),
 ('Watcher', 'Watcher', 'Flyer', 'Flyer', 0.8, 330, 20, 150, 1.4, 1.2, 0x8a3a4a, 90, 3, 3, 'It does not blink and it does not lose you.'),
 ('Cinder Hound', 'CinderHound', 'Runner', 'Humanoid', 0.9, 560, 26, 150, 1.0, 1.4, 0x3a2a26, 90, 3, 4, 'Faster than you. It knows it.', {'innate': ['Blazing']}),
 ('Scarab', 'Scarab', 'Walker', 'Crawler', 1.3, 260, 22, 140, 1.2, 1.2, 0x1e4a4a, 80, 2, 4, 'A shell that turns most of what you fire. Aim for the head.', {'innate': ['Armored']}),
 ('Hornet', 'Hornet', 'Flyer', 'Flyer', 0.6, 420, 18, 150, 1.1, 1.0, 0xe8b020, 70, 2, 3.4, 'You hear the room before you see it.'),
 ('Hooded Cobra', 'Cobra', 'Spitter', 'Robed', 1.1, 200, 30, 1700, 2.2, 1.3, 0x4a5a2a, 110, 5, 2.2, 'Stands as tall as you and spits further than you would think.'),
 ('Sporecap', 'Sporecap', 'Bloater', 'Bloated', 1.4, 210, 60, 160, 1.5, 1.4, 0x6a2420, 100, 3, 2.6, 'Do not let it reach you, and do not break it up close.'),
 ('Stone Golem', 'StoneGolem', 'Brute', 'Brute', 3.6, 230, 58, 200, 1.7, 1.6, 0x4e4e58, 220, 7, 1.3, 'Somebody built it to hold a door. The door is gone.', {'innate': ['Armored']}),
 ('Wraith', 'Wraith', 'Walker', 'Robed', 1.0, 300, 28, 150, 1.2, 1.0, 0x3a4a5a, 100, 5, 2.6, 'There, then nearer.', {'innate': ['Blinking']}),
 ('Fiend Bat', 'FiendBat', 'Flyer', 'Flyer', 0.5, 480, 16, 150, 1.0, 1.0, 0x3a2a34, 60, 1, 4, 'Comes off the ceiling in dozens.'),
 ('Scorpion', 'Scorpion', 'Burrower', 'Crawler', 1.3, 320, 34, 150, 1.3, 1.3, 0x8a5a2a, 110, 6, 2, 'Under the floor until it is under you.'),
 ('Mimic', 'Mimic', 'Gilded', 'Bloated', 2.2, 430, 0, 150, 1.5, 1.2, 0x6a4428, 600, 3, 1, 'It ate what was in the chest and kept the chest. Runs when seen.'),
 ('Snapvine', 'Snapvine', 'Leaper', 'Robed', 1.2, 300, 32, 150, 1.4, 1.3, 0x3a6a2a, 100, 6, 2.2, 'Holds still until you are close enough, then it is not holding still.'),
 ('Grub', 'Grub', 'Crawler', 'Crawler', 0.5, 300, 16, 130, 1.0, 1.3, 0xd8c8a0, 40, 1, 6, 'All mouth, in great number.'),
 ('Drift Jelly', 'Jelly', 'Flyer', 'Flyer', 0.9, 260, 22, 160, 1.5, 1.2, 0x3a4a8a, 90, 5, 2.2, 'Slow, and what it touches goes numb.', {'innate': ['Frozen']}),
 ('Shrieking Idol', 'Idol', 'Screamer', 'Robed', 1.8, 160, 18, 150, 1.6, 1.5, 0x6a6258, 160, 8, 1, 'While it screams, everything else in the room is faster.'),
 ('Egg Sac', 'EggSac', 'Totem', 'Bloated', 0.7, 0, 0, 0, 9, 1.6, 0xd8d4c8, 20, 99, 0, 'Burst it before it opens.', {'boss': 1, 'hatch': 7, 'hatchArt': 'Skitterling', 'hatchN': 3}),
 ('Tentacle', 'Tentacle', 'Totem', 'Bloated', 2.6, 0, 40, 520, 2.6, 1.8, 0x5a3a6a, 60, 99, 0, 'Part of something much bigger.', {'boss': 1}),
]
for e in E:
    x = dict(zip(EK, e[:15])); x.update(map=6, head=x['body']); x.update(e[15] if len(e) > 15 else {}); d['enemies'].append(x)
names = [e['art'] for e in d['enemies']]
BK = ['name', 'title', 'art', 'tier', 'hp', 'speed', 'dmg', 'scale', 'body', 'attacks', 'minion', 'reward', 'mech', 'desc']
B = [
 ('The Brood Mother', 'She Is Not Alone In There', 'BroodMother', 1, 13, 330, 40, 1.9, 0x3a2a3a, ['Leap', 'Volley', 'Sweep', 'Summon'], 'Skitterling', 2500, 'eggs', 'Lays sacs that hatch unless you burst them.'),
 ('Old Ironhide', 'Plate In Front, Hide Behind', 'Ironhide', 1, 14, 300, 46, 1.8, 0x4e3c30, ['Charge', 'Charge', 'Slam', 'Sweep'], 'CinderHound', 2500, 'front', 'Armoured from the front. Make it miss a charge, then get behind it.'),
 ('The Hive Queen', 'The Room Is Hers', 'HiveQueen', 1, 12, 280, 36, 1.4, 0xe8a020, ['Volley', 'Dive', 'Barrage'], 'Hornet', 2500, 'swarm', 'Never stops calling the swarm.'),
 ('King Ooze', 'Everything It Ever Ate', 'KingOoze', 1, 12, 250, 42, 1.9, 0x3a5a4a, ['Leap', 'Pools', 'Ring'], 'Ooze', 2500, 'split', 'Kill it and it is two. Kill those and they are four.'),
 ('The Lamplighter', 'Follow The Light', 'Lamplighter', 1, 13, 300, 38, 1.6, 0x22303e, ['Volley', 'Teleport', 'Ring', 'Ambush'], 'Watcher', 2500, 'decoy', 'Three lights in the dark and only one of them is the fish.'),
 ('Carapace', 'The Room Is Its Shell', 'Carapace', 2, 19, 280, 52, 1.5, 0x3a5a6a, ['Spin', 'Sweep', 'Slam', 'Hook', 'Spin'], 'Scarab', 3500, None, 'Rams across the room, again and again. Get out of its path.'),
 ('The Wyrm', 'Under The Floor', 'Wyrm', 2, 18, 320, 50, 2.0, 0xb8926a, ['Erupt', 'Pools', 'Erupt', 'Summon', 'Charge'], 'Grub', 3500, 'burrow', 'Goes under and comes up beneath you. Soft for a moment after.'),
 ('Thunderhead', 'Weather With A Face', 'Thunderhead', 2, 17, 260, 44, 1.7, 0x343a4c, ['Storm', 'Volley', 'Teleport', 'Ring', 'Storm'], 'Drift Jelly', 3500, 'storm', 'It never stops raining on you. Watch the floor.'),
 ('Ash and Ember', 'Two Of One Litter', 'TwinHound', 2, 11, 420, 44, 1.5, 0x2a2226, ['Charge', 'Leap', 'Sweep'], 'CinderHound', 3500, 'twin', 'Two of them. Whichever you leave for last remembers the other.'),
 ('The Furnace', 'It Has To Let The Heat Out', 'Furnace', 2, 20, 260, 56, 1.6, 0x3e3230, ['Slam', 'Barrage', 'Charge', 'Pools'], 'StoneGolem', 3500, 'heat', 'Every fourth thing it does is vent. It is soft while it cools.'),
 ('The Hydra', 'Leave It Alone And It Mends', 'Hydra', 3, 24, 270, 56, 1.5, 0x23483e, ['Volley', 'Pools', 'Sweep', 'Barrage', 'Hook'], 'Cobra', 5000, 'heads', 'Heals whenever you stop hurting it, and wakes another head as it weakens.'),
 ('The Mirror Queen', 'What You Send Comes Back', 'MirrorQueen', 3, 22, 330, 50, 1.3, 0x4a5a7a, ['NailWall', 'Teleport', 'Ring', 'Ambush'], 'Wraith', 5000, 'reflect', 'When she shines, hold your fire: it comes back at you.'),
 ('The Unblinking', 'It Looks And You Come', 'Unblinking', 3, 23, 240, 50, 1.4, 0x5a2a5a, ['Vortex', 'Volley', 'Barrage', 'Teleport', 'Vortex'], 'Watcher', 5000, 'vortex', 'Drags you toward it. Run against the pull and jump the rings.'),
 ('The Reaper', 'You See It When It Strikes', 'Mantis', 3, 21, 380, 60, 1.5, 0x5a8a3a, ['Ambush', 'Sweep', 'Leap', 'Charge'], 'Snapvine', 5000, 'stealth', 'Fades from sight between strikes, and is hard to hurt while faded.'),
 ('Grandfather Toad', 'The Mire Rises', 'Toad', 3, 25, 250, 58, 2.0, 0x3e4a2a, ['Tide', 'Hook', 'Leap', 'Pools', 'Summon'], 'Sporecap', 5000, 'tide', 'Floods the floor. The four raised slabs stay dry.'),
 ('The Bone Dragon', 'What Burns Where The Heart Was', 'BoneDragon', 4, 30, 300, 62, 1.5, 0xd8cfb8, ['Strafe', 'Dive', 'Barrage', 'Ring', 'Strafe'], 'FiendBat', 8000, 'strafe', 'Draws lines of fire through where you stand.'),
 ('The Clockwork Titan', 'Wound Up Long Ago', 'Titan', 4, 30, 270, 66, 1.7, 0x6a5226, ['Slam', 'Charge', 'NailWall', 'Barrage'], 'StoneGolem', 8000, 'ward', 'Shielded while its idols stand. Break them.', {'wardStages': 2, 'wardArt': 'Idol', 'wardText': 'SHIELDED  -  BREAK THE IDOLS'}),
 ('The Leviathan', 'Most Of It Is Still Below', 'Leviathan', 4, 30, 230, 60, 1.5, 0x3a2650, ['Hook', 'Pools', 'Ring', 'Volley'], 'Drift Jelly', 8000, 'ward', 'Cannot be hurt while its tentacles are up.', {'wardStages': 2, 'wardArt': 'Tentacle', 'wardText': 'IT IS GUARDED  -  KILL THE TENTACLES'}),
 ('The Devourer', 'A Mouth That Learned To Walk', 'Devourer', 4, 28, 300, 64, 1.9, 0x7a2a3a, ['Devour', 'Charge', 'Slam', 'Hook', 'Devour'], 'Grub', 8000, 'devour', 'Calls its food. Whatever you leave alive, it eats, and grows.'),
 ('The Nameless', 'It Is Looking At You Out Of All Of Them', 'Nameless', 4, 32, 290, 62, 1.3, 0x1e1a2a, ['Eclipse', 'NailWall', 'Ring', 'Teleport', 'Barrage', 'Ambush', 'Summon'], 'Wraith', 8000, 'eclipse', 'Puts out the light, all but one piece. Be standing in it.'),
]
nm = [e['name'] for e in d['enemies']]
for b in B:
    x = dict(zip(BK, b[:14])); x.update(map=6, head=x['body']); x.update(b[14] if len(b) > 14 else {})
    m = x['minion']; x['minion'] = names.index(m) if m in names else nm.index(m)
    d['bosses'].append(x)
json.dump(d, open(P, 'w'), indent=0)
print('content', len(d['enemies']), len(d['bosses']))
