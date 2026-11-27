# Polyshot: five new raid bosses (draft 2, revised after review)

Context: Polyshot is a first-person three.js CoD-zombies-style roguelite. The run is the Descent: 20 rooms, a boss every 5th, and a final raid at the bottom. Today the only raid is the Mother Mold (`src/raid.js`). It's a colossal god behind a stone island that can only be hurt after the team carries cinders from killed Bearers to three pyres. Three lit pyres make it kneel for a short damage phase, then a shockwave purges the pyres. It ends with a final stand on a clock, plus an enrage clock over the whole fight.

The five new raids rotate with it, so a run's last room is one of six. The final boss now also holds a rescued gnome hostage in a hanging cage, or guards a machine. Beating it frees the gnome or the machine for the town.

Constraints:
- Play is solo or co-op for 2-4. The host runs the fight; guests see it through hazards (telegraphed markers and rings that hurt on expiry) and a small state array.
- Everything dangerous must be a telegraphed hazard or an enemy.
- The enemy faction is the Blight (fungal).
- Players are gnome-sized gunslingers with guns, a blade, grenades, a class ability, a dash, wall-runs, slides and a grapple.
- Design rules: no alt-fire, no triggers on multikills, nothing on first or last bullet.
- Each fight must be learnable on a first attempt. Telegraphs come first and the words on the boss bar tell you what to do.
- Each fight runs 4-8 minutes and has an enrage clock.
- Each boss gets a custom Blender model (sculpted, rigged by parts, high quality), and each gets its own arena.

Common shape (Destiny-style):
- The boss is immune until the team does the encounter's "work".
- The work opens a damage phase, which is short and loud.
- A reset follows, then the work again, harder.
- At low health a final stand begins: a timed burn with the work removed and pressure up.
- Adds keep coming throughout.

---

## 1. The Choir of Rot (Sporecaller Matriarch)
**Arena:** the Spore Cathedral. A round nave about 7000 across. Four great hollow organ-stalks stand at the compass points, each with a coloured glyph (spiral, eye, crescent, star). The Matriarch hangs at the north end from a web of mycelium like a chandelier, a robed thing with a crown of trumpet mushrooms. The hostage cage hangs from her web.

**Work: the Hymn (pattern).**
- She sings a sequence of glyphs, shown one by one on her crown and on the boss bar: three glyphs in cycle 1, four in cycle 2, five in cycle 3.
- Players shoot the stalks' glowing sound-sacs in that order. Each correct hit chimes and lights the glyph.
- A wrong stalk, or a 25-second timeout, triggers Discord: a cathedral-wide shout (a ring hazard you can only avoid by standing inside one of the four "hush" circles at the base of the stalks) and a fresh sequence.
- The order completes into Resonance, and she falls from the web onto the nave floor: damage phase, 20 s.

**Pressure while she sings:**
- Spore notes are slow homing orbs (enemies with low HP) that pop into gas puddles.
- Choirboys are Shrieker adds whose scream silences your gun for 2 s within 600 if not killed.

**Damage phase:** she is on the floor, but she sweeps a scream cone (a line of markers) that you must slide or wall-run past.

**Final stand (15%):** all four stalks sing at once. The order is still shown, but each stalk only accepts its hit while its sac is glowing (they pulse in turn), on a 40 s clock.

**Co-op:** the sequence is shared; anyone can hit any stalk. With 3 or more players, two adjacent glyphs must be hit within 1.5 s of each other (shown as a linked pair).

**Model brief:**
- A tall gaunt figure in tattered moss robes.
- Arms like trailing roots ending in long fingers.
- A face of gill-folds.
- A crown of 6 trumpet mushrooms that glow in the glyph colours.
- Hangs upside-down-ish from the web in phase A, crouches in phase B.
- Parts: body, two arms, head, crown (glowing).

## 2. The Drowned Bell (the Cistern Leviathan)
**Arena:** the Flooded Reservoir. A circular cistern about 8000 across, mostly shallow rot-water.
- Six raised stone platforms sit in a ring.
- Three valve wheels stand on platforms at 120°.
- A great bronze bell hangs in the middle over a drain grate.
- The Leviathan, a vast eel-like fungal worm with a lantern-lure, circles under the water and surfaces between platforms.
- The machine or the cage sits on the central drain under the bell.

**Work: Drain the Cistern.**
- Turning a valve means standing on its plate for 8 s (a hold, with a progress ring), interrupted by damage.
- Each turned valve lowers the water a step. The rot-water floor deals damage over time and stacks "Waterlogged" (slow). Platforms are safe.
- Three valves lower the water and expose the drain and the Leviathan's gills as it thrashes.
- Ring the bell by shooting it to stun it: damage phase, 22 s, with its gill-sacs open as weak points.

**Pressure:**
- Lure-light gaze: a slow sweeping beam (markers) that pulls whoever it catches toward the water.
- Surface slams: a marker on a platform, which then breaks off for 20 s.
- Spore leeches: swimmer adds that leap onto platforms.

**Reset:** the valves spin back and the water rises over 6 s. Get to a platform.

**Final stand:** the water drains fully and the Leviathan coils around the bell. You fight on the cistern floor, the gills are exposed, and its tail sweeps (rings) on a 35 s clock.

**Co-op:** valves can be turned at the same time. With 2 or more players, a valve holder is "Anchored" (can't move), so others must cover them.

**Model brief:**
- A long segmented worm, 6-8 segments, of shelf-fungus plates over pale flesh.
- A frilled head with a lantern-lure on a stalk.
- Gill-slits along the neck that glow when open.
- Segments are separate parts so it can be animated as a sine wave.

## 3. The Hive Mind (the Mycelial Brain)
**Arena:** the Root Web. A chasm crossed by thick root bridges joining five pod-islands in a pentagon.
- The Brain hangs in the centre on root tendons: a vast pulsing brain-cap of folded fungus with tendrils.
- Falling into the chasm throws you back with damage.

**Work: Sever the Links.**
- Five Nodes (pods on the islands) are each tethered to the Brain by a glowing root-cable.
- A Node dies only to sustained fire (high HP) and regrows after 8 s unless another Node dies within 6 s of it. Kills must come in pairs, or the third and later kills must fall within the window: a chain. The boss bar shows the window as a shrinking ring.
- All five cut makes the Brain drop to the central island: damage phase, 20 s.

**Mechanic: the Infection.**
- Every 30 s one player is marked Infected, with a 15 s fuse.
- At zero they burst for heavy area damage and spawn adds.
- Cleanse by standing in one of the two Bloom pools, which move between islands each cycle, or by touching another player, which passes the infection on with a fresh fuse but "Immune" for 20 s for the giver. Solo, a Bloom is always available.

**Pressure:**
- Tendril whips: line markers along the bridges.
- Thought spikes: a ring that rises from a random island.
- Grasping Mycel adds root you briefly.

**Final stand:** the nodes are gone. The Brain floats free and drifts between islands, so you chase it over the bridges, with Infection every 15 s, on a 40 s clock.

**Co-op:** paired node kills are natural for 2 or more. Solo, the regrow window is 10 s and the Brain's tethers glow brighter on the next-due node.

**Model brief:**
- A huge folded brain-cap (gyri as fungal folds) with a spore-glow in the fissures.
- A ring of 8 hanging tendrils.
- A ragged frill underneath.
- Three eye-pits that open in the damage phase.
- Parts: cap, frill, tendrils (8), eyes (3).

## 4. The Fruiting Spire (the Canopy Mother) - replaces the Lantern-Eater
**Arena:** a vertical shaft around a colossal mushroom stalk. Four tiers of shelf caps, wall-run panels and grapple knots between them. The Mother is a ring of eyes under the top cap; the cage hangs from its gills.
**Work: Climb.** The floor is a rising Rot Tide (fire puddles, a ring as its pulse warning). Spore-bladders glow one tier at a time and can only be seen or reached from that tier. Burst a tier's bladders and the cap droops a tier and the tide drops. Four tiers bring her to eye level: damage phase, 20 s. Reset: she shakes the caps (markers on every cap), everyone drops, the tide rises faster.
**Bar:** IMMUNE - CLIMB, BURST HER BLADDERS 2/4.
**Scaling:** 2 bladders per tier solo, 2 + players in groups; anyone can burst any.
**Final stand:** the caps fall away; hold the top tier on a clock while the tide climbs.
**Why:** the only fight that tests the movement kit (wall-run, grapple, slide). Falling costs height, never a life.
**Model brief:** a colossal stalk with gill-folded caps; the Mother is a crown of 8 glowing eyes and a lipped maw under the top cap, with drooping veils. Parts: stalk, caps (4), eye ring, maw, veils.

## 5. The Graft Sisters (Twin Mothers)
**Arena:** the Split Garden. Two mirrored grove-platforms separated by a chasm, joined by a narrow living bridge in the middle and two spore-launchers (bounce pads) at the ends.
- Sister Bloom (red, flesh) holds the west grove; Sister Wither (pale, ash) holds the east.
- The hostage cage hangs over the bridge.

**Work: Cross-Grafting.**
- Each Sister is immune to damage from players carrying her own sister's Graft. Players are Grafted (Bloom or Wither) by standing in their own grove's seed patch for a while.
- To hurt Bloom you need Wither's Graft, so you work one side, cross, and fight the other.
- Each Sister has a heart-seed that opens when her side's three spore-pods are burst.

**The rule:** both Sisters must fall within 12 s of each other. If one dies alone, the other revives her at 40% health and enrages.

**Pressure:**
- Bloom: tendril snares and blood-blossom puddles.
- Wither: an ash wind that pushes players toward the chasm, and creeping ash rings.

**Damage:**
- Each Sister has her own health bar; there is no separate damage phase.
- Her own work (pods) opens her heart-seed for 15 s.
- The team must judge when to finish each one together.

**Final stand:** when both are under 20% they fuse at the bridge into one two-headed form that alternates which half is vulnerable every 6 s, Bloom or Wither, by colour. Matching Graft is needed, and the team uses the seed patches nearby on a 40 s clock.

**Co-op:** a natural split, two on each side. Solo is a dance: bounce across, burst pods, crack one heart, cross, crack the other. The 12 s window is 20 s solo.

**Model brief:**
- Two tall elegant figures, one a red fleshy rose-and-fungus gown, the other pale ash and bracket-fungus lace.
- Each has long grafted arms of vines and a veiled face.
- Parts per sister: body, arms, head, veil.
- The fused form is the two bodies back to back.

---

## Revisions from the review
- Choir: the whole sequence shows on the bar with ticks. Discord is a 3 s warning, then a carpet of markers with gaps at the hush circles (not a ring). Choirboys slow for 2 s instead of silencing. No timed linked pair: with 3+ players two stalks light at once and either order counts.
- Bell: valves are 600-radius capture circles; damage pauses progress (no reset) and more players turn faster. Anchored is cut. The lure is a marker sweep that applies Waterlogged, not a pull. One platform breaks at a time, for 10 s. Water level is one state value.
- Hive Mind: a cut Node stays dead 12 s (15 s solo); the Brain drops when all five are down at once. Five pips with timers on the bar. Infection is cleansed only in a Bloom pool; two players cleansing together get a short damage buff. Markers, not rings, on the bridges.
- Sisters: immunity is by place: Bloom can only be hurt from the Ash Grove, Wither only from the Rose Grove. Under 25% a Sister shields until her twin is under 25% too, then both open for a 20 s shared damage phase. The ash wind slows instead of pushing.
- Nothing needs voice chat or precise timing between players. Rings stay away from edges (they knock back).

## Shared technical notes
- Same model as `src/raid.js`: a Raid class per fight, host-run, phases, state() and sync().
- Hazards are markers, rings and lines.
- A gnome cage or machine prop goes in each arena, opened on victory.
- Enrage clock: about 8 min.
- HP scales by player count as now.
