// Every gun has its own synthesized shot, built from up to five layers at fire time:
//   crack  - a filtered noise snap (the report)            [centre Hz, Q, gain, decay s]
//   body   - a pitched thump that drops                     [start Hz, end Hz, decay s, gain, wave]
//   tail   - low-passed noise, the sound rolling away       [cutoff Hz, decay s, gain]
//   mech   - action noise after the shot (bolt, pump, ...)  [delay s, Hz, gain, count]
//   tone   - a pitched voice for the strange guns           [wave, start Hz, end Hz, decay s, gain, tremolo Hz]
// Nothing here is sampled or borrowed; the numbers below are the whole sound.
const P = {
  // pistols
  'Tin Star':        { crack: [3200, 0.9, 0.55, 0.045], body: [210, 70, 0.07, 0.5, 'triangle'], tail: [1800, 0.16, 0.16], mech: [0.05, 4200, 0.05, 1] },
  'Saloon Six':      { crack: [1900, 0.7, 0.8, 0.08], body: [150, 42, 0.16, 0.85, 'sine'], tail: [1100, 0.42, 0.3], mech: [0.16, 2600, 0.07, 1] },
  'Copperhead':    { crack: [4600, 1.4, 0.4, 0.028], body: [300, 120, 0.04, 0.3, 'triangle'], tail: [2600, 0.07, 0.08] },
  'Sidewinders':      { crack: [2800, 1.1, 0.55, 0.05], body: [190, 60, 0.08, 0.5, 'triangle'], tail: [1500, 0.2, 0.18], double: 0.035 },
  // SMGs
  'Back-Alley':      { crack: [3600, 1.2, 0.45, 0.032], body: [240, 95, 0.05, 0.4, 'triangle'], tail: [2000, 0.09, 0.1], mech: [0.03, 5200, 0.04, 1] },
  "Hornet's Nest":   { crack: [5200, 2.2, 0.36, 0.022], body: [340, 150, 0.035, 0.28, 'sawtooth'], tail: [3000, 0.05, 0.06], tone: ['sawtooth', 620, 420, 0.03, 0.06, 0] },
  'Rustler':      { crack: [4100, 3.0, 0.42, 0.03], body: [260, 100, 0.045, 0.38, 'triangle'], tail: [2400, 0.08, 0.09], tone: ['triangle', 1700, 1200, 0.05, 0.07, 0] },
  // rifles
  'Quarter Horse':   { crack: [2400, 0.8, 0.7, 0.06], body: [170, 52, 0.11, 0.7, 'sine'], tail: [1300, 0.36, 0.26], mech: [0.2, 2200, 0.08, 2] },
  'Lawman AR':       { crack: [3000, 1.0, 0.55, 0.04], body: [200, 70, 0.07, 0.55, 'triangle'], tail: [1700, 0.16, 0.16], mech: [0.04, 4600, 0.04, 1] },
  'Long Rider':       { crack: [2100, 0.7, 0.78, 0.07], body: [150, 44, 0.14, 0.8, 'sine'], tail: [1000, 0.5, 0.32] },
  'Gold Rush':         { crack: [3400, 1.6, 0.5, 0.036], body: [220, 80, 0.06, 0.5, 'triangle'], tail: [1900, 0.13, 0.13], tone: ['sine', 2100, 2100, 0.09, 0.06, 0] },
  // shotguns
  'Sawbuck':         { crack: [1300, 0.5, 0.95, 0.11], body: [120, 34, 0.2, 0.95, 'sine'], tail: [800, 0.5, 0.42] },
  "Homesteader":   { crack: [1100, 0.5, 1.0, 0.12], body: [105, 30, 0.24, 1.0, 'sine'], tail: [700, 0.6, 0.46], mech: [0.26, 1500, 0.16, 2] },
  'Stampede':      { crack: [1600, 0.6, 0.8, 0.08], body: [140, 44, 0.13, 0.8, 'sine'], tail: [1000, 0.3, 0.3], mech: [0.05, 3200, 0.05, 1] },
  "Dragon's Breath": { crack: [1000, 0.4, 0.9, 0.16], body: [110, 30, 0.22, 0.9, 'sine'], tail: [2400, 0.7, 0.4], tone: ['sawtooth', 240, 90, 0.3, 0.1, 18] },
  // LMGs
  'Iron Mule':       { crack: [2200, 0.8, 0.62, 0.05], body: [150, 50, 0.1, 0.72, 'sine'], tail: [1200, 0.2, 0.2], mech: [0.045, 3000, 0.06, 1] },
  'Thresher': { crack: [2900, 1.2, 0.46, 0.03], body: [180, 70, 0.05, 0.5, 'triangle'], tail: [1500, 0.08, 0.1], tone: ['square', 95, 95, 0.045, 0.07, 0] },
  // snipers
  'Widowmaker':      { crack: [2600, 0.6, 1.0, 0.07], body: [130, 30, 0.3, 1.0, 'sine'], tail: [900, 1.1, 0.5], mech: [0.45, 2000, 0.12, 2] },
  'Railroad Spike':  { crack: [1700, 0.5, 1.1, 0.1], body: [95, 24, 0.42, 1.1, 'sine'], tail: [650, 1.5, 0.6], tone: ['sine', 2900, 700, 0.5, 0.12, 0], mech: [0.6, 1300, 0.14, 1] },
  // launchers
  'Dynamite Dan':    { crack: [700, 0.6, 0.6, 0.09], body: [190, 60, 0.18, 0.8, 'sine'], tail: [500, 0.3, 0.3], tone: ['triangle', 520, 180, 0.16, 0.12, 0] },
  'Boomtown':        { crack: [500, 0.5, 0.8, 0.14], body: [120, 30, 0.34, 1.1, 'sine'], tail: [400, 0.6, 0.45], tone: ['sawtooth', 200, 60, 0.3, 0.1, 0] },
  'Fireworks Finale':{ crack: [1800, 0.8, 0.5, 0.06], body: [260, 110, 0.1, 0.5, 'triangle'], tail: [3000, 0.4, 0.25], tone: ['sine', 700, 2600, 0.28, 0.12, 0] },
  // energy
  'Tesla Coil':      { crack: [5200, 3.0, 0.5, 0.05], tail: [4200, 0.18, 0.16], tone: ['sawtooth', 1500, 180, 0.16, 0.2, 55] },
  "Will-o'-Wisp":    { crack: [2400, 2.0, 0.2, 0.05], tail: [1500, 0.25, 0.1], tone: ['sine', 480, 1250, 0.22, 0.26, 9] },
  'Frostbite Beam':  { crack: [6800, 4.0, 0.18, 0.03], tone: ['triangle', 2300, 2050, 0.07, 0.1, 30], soft: true },
  'Hellfire Hose':   { crack: [900, 0.4, 0.3, 0.09], tail: [1700, 0.16, 0.2], tone: ['sawtooth', 130, 100, 0.09, 0.07, 24], soft: true },
  // wonder weapons
  'Buzzsaw':         { crack: [3800, 2.5, 0.4, 0.05], body: [200, 90, 0.08, 0.4, 'sawtooth'], tone: ['sawtooth', 880, 1500, 0.3, 0.2, 70] },
  'Thunderhead': { crack: [2600, 1.0, 0.6, 0.05], body: [180, 55, 0.12, 0.7, 'sine'], tail: [1400, 0.35, 0.25], tone: ['sine', 1320, 1980, 0.22, 0.16, 0] },
  "Fan of Knives": { crack: [2300, 0.9, 0.75, 0.07], body: [150, 44, 0.15, 0.8, 'sine'], tail: [1100, 0.45, 0.3], tone: ['triangle', 330, 165, 0.35, 0.12, 0] },
  'Black Cat':       { crack: [1500, 0.5, 1.0, 0.1], body: [90, 22, 0.5, 1.1, 'sine'], tail: [600, 1.6, 0.55], tone: ['sawtooth', 1900, 240, 0.45, 0.14, 11] },
};
const FALLBACK = { crack: [2800, 1, 0.55, 0.045], body: [200, 70, 0.08, 0.5, 'triangle'], tail: [1600, 0.18, 0.16] };
let noise = null;

// Second pass at the voice. The first version led with a narrow band-passed "crack", which reads as a thin, hissy
// zap. A real shot is a broadband slap that loses its top end in a few milliseconds, sitting on a low thump, followed
// by a couple of early reflections and a dull tail. So: full-band click -> noise through a low-pass that sweeps down
// fast (the bang) -> sub thump -> two quiet echoes -> tail, all pushed through a soft clipper for weight.
// The table above still drives it: crack[0] sets how bright the bang starts, body the thump, tail the room.
// The pitched "tone" layer is now only used by the energy and wonder weapons; on ballistic guns it sounded synthetic.
let shaper = null, bus = null;
const TONAL = new Set(['Tesla Coil', "Will-o'-Wisp", 'Frostbite Beam', 'Hellfire Hose', 'Buzzsaw', 'Thunderhead', "Fan of Knives", 'Black Cat', "Dragon's Breath", 'Fireworks Finale']);
// ---- Recorded shots -------------------------------------------------------------------------------------------
// Powder guns play real recordings: single shots cut from the Free Firearm Sound Library (Ben Jaszczak et al., CC0),
// close-mic'd, two or three takes per gun so repeated fire never sounds stamped. The synth below is only the voice
// of the energy and wonder weapons, and the fallback for the first moments before a recording has loaded.
//   [recording, takes, pitch, gain, choke (fast guns cut the previous tail short), low-pass Hz, double-tap gap s]
//   [recording, takes, pitch, gain, choke (fast guns cut the previous tail short), low-pass Hz, double-tap gap s, body 0..1]
// Every take is mastered to the same loudness (tools/master_audio.py), so `gain` here is purely the mix: slow, heavy guns sit
// on top, guns that fire ten times a second sit lower because their shots add up. `body` is the low thump built under it.
const REC = {
  'Tin Star':        ['V', 2, 1.00, 0.74, 0, 0, 0, 0.35],      // .38 revolver
  'Saloon Six':      ['A', 2, 0.86, 0.95, 0, 0, 0, 0.7],       // .45, pitched down: a hand cannon
  'Copperhead':      ['R', 2, 1.04, 0.52, 1, 0, 0, 0.2],       // .22 pistol
  'Sidewinders':     ['F', 2, 1.00, 0.58, 0, 0, 0.04, 0.3],    // .380, two barrels
  'Back-Alley':      ['G', 3, 1.00, 0.56, 1, 0, 0, 0.25],      // 9mm submachine gun
  "Hornet's Nest":   ['P', 3, 1.08, 0.5, 1, 0, 0, 0.18],       // 7.62 Tokarev submachine gun
  'Rustler':         ['X', 3, 1.05, 0.6, 1, 3400, 0, 0.12],    // 9mm through a suppressor: the top is rolled off
  'Quarter Horse':   ['I', 2, 1.00, 0.85, 0, 0, 0, 0.55],      // .30-30 lever action
  'Lawman AR':       ['D', 2, 1.00, 0.6, 1, 0, 0, 0.35],       // 5.56
  'Long Rider':      ['U', 3, 0.97, 0.8, 0, 0, 0, 0.55],       // 7.62x39 carbine
  'Gold Rush':       ['C', 3, 1.03, 0.6, 1, 0, 0, 0.4],        // AK
  'Sawbuck':         ['O', 2, 0.96, 1.0, 0, 0, 0, 0.9],        // 12 gauge
  "Homesteader":     ['K', 2, 0.94, 1.0, 0, 0, 0, 0.85],       // 12 gauge pump
  'Stampede':        ['H', 2, 1.06, 0.78, 0, 0, 0, 0.65],      // 12 gauge
  "Dragon's Breath": ['N', 2, 0.84, 1.0, 0, 0, 0, 0.9],        // 12 gauge, slowed
  'Iron Mule':       ['C', 3, 0.88, 0.64, 1, 0, 0, 0.5],       // AK, slowed: heavier
  'Thresher':        ['T', 2, 1.04, 0.48, 1, 0, 0, 0.28],      // .300
  'Widowmaker':      ['W', 2, 0.96, 1.0, 0, 0, 0, 0.9],        // .30-06 bolt action
  'Railroad Spike':  ['M', 3, 0.78, 1.0, 0, 0, 0, 1],          // 7.62x54R, slowed
  'Dynamite Dan':    ['N', 2, 0.62, 0.9, 0, 1400, 0, 0.8],     // launchers: a slowed, muffled 12 gauge reads as a tube thump
  'Boomtown':        ['K', 2, 0.52, 1.0, 0, 1100, 0, 1],
};
const startOf = new WeakMap(), live = [];
function lead(buf) {   // mp3 decoding leaves a few ms of silence in front: find where the shot really starts
  let o = startOf.get(buf);
  if (o === undefined) { const d = buf.getChannelData(0); let i = 0; while (i < d.length && Math.abs(d[i]) < 0.03) i++; o = Math.max(0, i / buf.sampleRate - 0.001); startOf.set(buf, o); }
  return o;
}
export function preloadGunSounds(audio) { for (const k in REC) for (let i = 0; i < REC[k][1]; i++) audio.load(`guns/G_${REC[k][0]}${i}`); }
export function gunSound(audio, name, vol = 1, quiet = false) {
  const ctx = audio.ctx; if (!ctx || ctx.state !== 'running') return;
  const r = REC[name];
  if (!r || quiet) return synthShot(audio, name, vol, quiet);
  const [code, takes, pitch, gain, choke, lp, dbl, body] = r;
  let take = Math.floor(Math.random() * takes); if (take === r.last && takes > 1) take = (take + 1) % takes; r.last = take;
  const key = `guns/G_${code}${take}`, buf = audio.buffers.get(key);
  if (!buf) { audio.load(key); return synthShot(audio, name, vol, quiet); }
  const t = ctx.currentTime;
  if (choke) for (const g of live) { g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0, t + 0.03, 0.07); }
  const one = (at) => {
    const src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = buf; src.playbackRate.value = pitch * (1 + (Math.random() * 2 - 1) * 0.025); g.gain.value = gain * vol * (0.94 + Math.random() * 0.1);
    let node = src;
    if (lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; node.connect(f); node = f; }
    node.connect(g); g.connect((audio.gunBus || audio.master)); src.start(at, lead(buf));
    live.push(g); src.onended = () => { const i = live.indexOf(g); if (i >= 0) live.splice(i, 1); g.disconnect(); };
  };
  one(t); if (dbl) one(t + dbl);
  audio.gunBody(body || 0, vol); audio.duck(0.55 + 0.3 * (1 - (body || 0)), 0.08);   // weight under the crack, and the music steps back
}
function synthShot(audio, name, vol = 1, quiet = false) {
  const ctx = audio.ctx; if (!ctx || ctx.state !== 'running') return;
  const p = P[name] || FALLBACK, t = ctx.currentTime, det = 1 + (Math.random() * 2 - 1) * 0.04;
  const energy = !p.body;   // beam and arc weapons have no powder charge
  const v = vol * (quiet || p.soft ? 0.4 : 1) * 0.9;
  if (!noise) { noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  if (!bus) {
    shaper = ctx.createWaveShaper(); const c = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 511.5 - 1; c[i] = Math.tanh(x * 2.2) / Math.tanh(2.2); } shaper.curve = c; shaper.oversample = '2x';
    bus = ctx.createGain(); bus.gain.value = 0.85; bus.connect(shaper); shaper.connect((audio.gunBus || audio.master));
  }
  const env = (g, peak, attack, decay, at) => { g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime(Math.max(0.0002, peak), at + attack); g.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay); };
  // noise through a low-pass that closes from f0 to f1 over `sweep`
  const bang = (f0, f1, sweep, peak, decay, at, q = 0.7) => {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noise; s.playbackRate.value = det; f.type = 'lowpass'; f.Q.value = q;
    f.frequency.setValueAtTime(Math.min(16000, f0), at); f.frequency.exponentialRampToValueAtTime(Math.max(80, f1), at + sweep);
    env(g, peak, 0.001, decay, at); s.connect(f); f.connect(g); g.connect(bus); s.start(at, Math.random() * 1.5); s.stop(at + decay + 0.06);
  };
  const osc = (wave, f0, f1, decay, peak, trem, at) => {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = wave;
    o.frequency.setValueAtTime(f0 * det, at); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1 * det), at + decay); env(g, peak, 0.002, decay, at);
    if (trem) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = trem; lg.gain.value = f0 * 0.12; l.connect(lg); lg.connect(o.frequency); l.start(at); l.stop(at + decay + 0.05); }
    o.connect(g); g.connect(bus); o.start(at); o.stop(at + decay + 0.06);
  };
  const shot = (at) => {
    if (!energy) {
      const bright = p.crack[0], size = p.body[3], len = p.crack[3];   // size: 0.3 (pocket pistol) .. 1.1 (anti-materiel)
      bang(16000, 9000, 0.004, 0.5 * v, 0.006, at);                                                 // the click of ignition
      bang(Math.min(15000, bright * 3.2), 280 + (1 - Math.min(1, size)) * 500, 0.03 + len * 0.9, (0.55 + size * 0.45) * v, 0.05 + len * 1.6, at, 0.9);   // the bang
      osc('sine', p.body[0] * 0.9, Math.max(28, p.body[1] * 0.8), p.body[2] * 1.15, p.body[3] * v * 0.95, 0, at);    // the thump
      if (!quiet) {
        bang(2600, 500, 0.05, 0.16 * size * v, 0.07, at + 0.045 + size * 0.02);                     // first reflection
        bang(1500, 320, 0.08, 0.1 * size * v, 0.11, at + 0.11 + size * 0.05);                       // second, duller
        if (p.tail) bang(p.tail[0], 220, p.tail[1] * 0.7, p.tail[2] * v * 0.9, p.tail[1] * 1.2, at + 0.02, 0.5);
      }
    } else {
      bang(Math.min(15000, p.crack[0] * 2), 900, 0.03, p.crack[2] * v, p.crack[3] * 1.5, at, 2);
      if (p.tail && !quiet) bang(p.tail[0], 300, p.tail[1], p.tail[2] * v, p.tail[1], at + 0.01, 0.5);
    }
    if (p.tone && TONAL.has(name)) osc(p.tone[0], p.tone[1], p.tone[2], p.tone[3], p.tone[4] * v, p.tone[5], at);
  };
  shot(t);
  if (p.double) shot(t + p.double);
  // action noise: two short metallic ticks (a filtered click each), not a hiss
  if (p.mech && !quiet) for (let i = 0; i < p.mech[3]; i++) { const at = t + p.mech[0] + i * 0.085; bang(p.mech[1] * 2.2, p.mech[1] * 0.5, 0.012, p.mech[2] * vol * 1.6, 0.022, at, 4); osc('square', p.mech[1] * 0.42, p.mech[1] * 0.3, 0.018, p.mech[2] * vol * 0.25, 0, at); }
}
