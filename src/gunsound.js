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
  'Penny Pusher':    { crack: [4600, 1.4, 0.4, 0.028], body: [300, 120, 0.04, 0.3, 'triangle'], tail: [2600, 0.07, 0.08] },
  'Snake Eyes':      { crack: [2800, 1.1, 0.55, 0.05], body: [190, 60, 0.08, 0.5, 'triangle'], tail: [1500, 0.2, 0.18], double: 0.035 },
  // SMGs
  'Back-Alley':      { crack: [3600, 1.2, 0.45, 0.032], body: [240, 95, 0.05, 0.4, 'triangle'], tail: [2000, 0.09, 0.1], mech: [0.03, 5200, 0.04, 1] },
  "Hornet's Nest":   { crack: [5200, 2.2, 0.36, 0.022], body: [340, 150, 0.035, 0.28, 'sawtooth'], tail: [3000, 0.05, 0.06], tone: ['sawtooth', 620, 420, 0.03, 0.06, 0] },
  'Card Sharp':      { crack: [4100, 3.0, 0.42, 0.03], body: [260, 100, 0.045, 0.38, 'triangle'], tail: [2400, 0.08, 0.09], tone: ['triangle', 1700, 1200, 0.05, 0.07, 0] },
  // rifles
  'Quarter Horse':   { crack: [2400, 0.8, 0.7, 0.06], body: [170, 52, 0.11, 0.7, 'sine'], tail: [1300, 0.36, 0.26], mech: [0.2, 2200, 0.08, 2] },
  'Lawman AR':       { crack: [3000, 1.0, 0.55, 0.04], body: [200, 70, 0.07, 0.55, 'triangle'], tail: [1700, 0.16, 0.16], mech: [0.04, 4600, 0.04, 1] },
  'Long Odds':       { crack: [2100, 0.7, 0.78, 0.07], body: [150, 44, 0.14, 0.8, 'sine'], tail: [1000, 0.5, 0.32] },
  'Jackpot':         { crack: [3400, 1.6, 0.5, 0.036], body: [220, 80, 0.06, 0.5, 'triangle'], tail: [1900, 0.13, 0.13], tone: ['sine', 2100, 2100, 0.09, 0.06, 0] },
  // shotguns
  'Sawbuck':         { crack: [1300, 0.5, 0.95, 0.11], body: [120, 34, 0.2, 0.95, 'sine'], tail: [800, 0.5, 0.42] },
  "Dealer's Pump":   { crack: [1100, 0.5, 1.0, 0.12], body: [105, 30, 0.24, 1.0, 'sine'], tail: [700, 0.6, 0.46], mech: [0.26, 1500, 0.16, 2] },
  'Full House':      { crack: [1600, 0.6, 0.8, 0.08], body: [140, 44, 0.13, 0.8, 'sine'], tail: [1000, 0.3, 0.3], mech: [0.05, 3200, 0.05, 1] },
  "Dragon's Breath": { crack: [1000, 0.4, 0.9, 0.16], body: [110, 30, 0.22, 0.9, 'sine'], tail: [2400, 0.7, 0.4], tone: ['sawtooth', 240, 90, 0.3, 0.1, 18] },
  // LMGs
  'Iron Mule':       { crack: [2200, 0.8, 0.62, 0.05], body: [150, 50, 0.1, 0.72, 'sine'], tail: [1200, 0.2, 0.2], mech: [0.045, 3000, 0.06, 1] },
  'Gatling Gambler': { crack: [2900, 1.2, 0.46, 0.03], body: [180, 70, 0.05, 0.5, 'triangle'], tail: [1500, 0.08, 0.1], tone: ['square', 95, 95, 0.045, 0.07, 0] },
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
  'The House Always Wins': { crack: [2600, 1.0, 0.6, 0.05], body: [180, 55, 0.12, 0.7, 'sine'], tail: [1400, 0.35, 0.25], tone: ['sine', 1320, 1980, 0.22, 0.16, 0] },
  "Dead Man's Hand": { crack: [2300, 0.9, 0.75, 0.07], body: [150, 44, 0.15, 0.8, 'sine'], tail: [1100, 0.45, 0.3], tone: ['triangle', 330, 165, 0.35, 0.12, 0] },
  'Black Cat':       { crack: [1500, 0.5, 1.0, 0.1], body: [90, 22, 0.5, 1.1, 'sine'], tail: [600, 1.6, 0.55], tone: ['sawtooth', 1900, 240, 0.45, 0.14, 11] },
};
const FALLBACK = { crack: [2800, 1, 0.55, 0.045], body: [200, 70, 0.08, 0.5, 'triangle'], tail: [1600, 0.18, 0.16] };
let noise = null;

export function gunSound(audio, name, vol = 1, quiet = false) {
  const ctx = audio.ctx; if (!ctx || ctx.state !== 'running') return;
  const p = P[name] || FALLBACK, t = ctx.currentTime, out = audio.master, v = vol * (quiet || p.soft ? 0.45 : 1), det = 1 + (Math.random() * 2 - 1) * 0.035;
  if (!noise) { noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const env = (g, peak, decay, at = t) => { g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), at + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.002 + decay); };
  const nz = (type, freq, q, peak, decay, at = t) => {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noise; s.playbackRate.value = det; f.type = type; f.frequency.value = freq * det; f.Q.value = q; env(g, peak, decay, at);
    s.connect(f); f.connect(g); g.connect(out); s.start(at, Math.random() * 1.5); s.stop(at + decay + 0.05);
  };
  const osc = (wave, f0, f1, decay, peak, trem, at = t) => {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = wave;
    o.frequency.setValueAtTime(f0 * det, at); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1 * det), at + decay); env(g, peak, decay, at);
    if (trem) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = trem; lg.gain.value = f0 * 0.12; l.connect(lg); lg.connect(o.frequency); l.start(at); l.stop(at + decay + 0.05); }
    o.connect(g); g.connect(out); o.start(at); o.stop(at + decay + 0.05);
  };
  const shot = (at) => {
    if (p.crack) nz('bandpass', p.crack[0], p.crack[1], p.crack[2] * v, p.crack[3], at);
    if (p.body) osc(p.body[4], p.body[0], p.body[1], p.body[2], p.body[3] * v * 0.8, 0, at);
    if (p.tail && !quiet) nz('lowpass', p.tail[0], 0.5, p.tail[2] * v, p.tail[1], at + 0.01);
    if (p.tone) osc(p.tone[0], p.tone[1], p.tone[2], p.tone[3], p.tone[4] * v, p.tone[5], at);
  };
  shot(t);
  if (p.double) shot(t + p.double);                                                           // two barrels a hair apart
  if (p.mech && !quiet) for (let i = 0; i < p.mech[3]; i++) nz('bandpass', p.mech[1] * (1 - i * 0.18), 6, p.mech[2] * vol, 0.03, t + p.mech[0] + i * 0.09);
}
