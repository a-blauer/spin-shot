"""Interface, rewards, the casino, stingers and room tone. Stereo, and in A minor like the score."""
from parts import *

def pluck(f, d=0.6, bright=0.8, tau=None):
    """A tack-piano string: stiff, slightly sharp upper partials, a felt-and-wire strike."""
    tau = tau or min(0.9, 160 / f + 0.12); parts = []
    for k in range(1, 10):
        fk = f * k * np.sqrt(1 + 0.0007 * k * k)
        if fk < 9000: parts.append((fk, tau / (1 + 0.4 * (k - 1)), bright ** (k - 1) / k ** 0.6))
    return modal(parts, d, lp(noise(0.004), 4200) * perc(0.004, 0.0012))
def chime(f, d=0.8, tau=0.28, idx=2.2):
    """A small bright bell."""
    n = n_(d); return (0.7 * fm(f * np.ones(n), 3.5, line([(0, idx), (d, 0)], d)) + 0.3 * osc(f * 2.0, d)) * perc(d, tau, 0.002)
def coin(f=2500, d=0.3):
    c = lambda g, t: (modal([(f, 0.16, 1), (f * 1.52, 0.12, 0.6), (f * 2.71, 0.07, 0.35), (f * 3.6, 0.04, 0.15)], d, hp(noise(0.002), 2000) * perc(0.002, 0.0006)), t, g)
    return lay(c(1, 0), c(0.5, 0.07), c(0.25, 0.115))
def seq(notes, step, make, pans=None, gains=None):
    """Notes one after another, each placed across the stereo field."""
    return lay(*[(pan(make(f), (pans[i] if pans else (-0.35 + 0.7 * i / max(1, len(notes) - 1)))), i * step if np.isscalar(step) else step[i], gains[i] if gains else 1.0) for i, f in enumerate(notes)])
def hall(x, rt=0.7, wet=0.2): return verb(x, rt, wet, 0.01, 5200, 1500, stereo=True)
def loopbed(L, make, xf=1.0):
    """Continuous texture that joins its own tail: made a little long, the overhang cross-faded into the start."""
    x = make(L + xf); n, k = n_(L), n_(xf); w = np.sqrt(np.linspace(0, 1, k)); w = w[:, None] if x.ndim == 2 else w
    y = x[:n].copy(); y[:k] = x[:k] * w + x[n:n + k] * w[::-1]; return y
def wrap(x, L):
    """Events laid on a loop: whatever rings past the end comes round to the start."""
    n = n_(L); y = np.zeros((n,) + x.shape[1:])
    for i in range(0, len(x), n): seg = x[i:i + n]; y[:len(seg)] += seg
    return y
def cyc(L, k, ph=0.0): return np.sin(2 * np.pi * k * t_(L) / L + ph)   # a slow wave that fits the loop a whole number of times
def write_loop(name, y, peak=-6.0):
    m = lp(y.mean(axis=1), 150, 2); y = y - lp(y, 150, 2) + m[:, None]   # the bottom is kept in the middle: wide bass is hollow on headphones and gone in mono
    k = n_(0.5); out(name, np.concatenate([y[-k:], y, y[:k]]), peak=peak, loop=True, br='96k')   # half a second of itself either side: the loop points sit inside
def drip(f=None):
    f = f or rng.uniform(900, 1700); return osc(line([(0, f), (0.025, f * 1.9)], 0.025, True)) * perc(0.025, 0.008, 0.001)

def build():
    # ---------------------------------------------------------------- interface
    seed(400); out('S_UIMove', wide(lp(lay((modal(wood(1150, 3, 0.008), 0.04), 0, 1), (click(2600, 0.02, 0.003, 3, 0.5), 0, 0.3)), 6000), 6, 0.3), r=0.006)
    seed(401); out('S_UISelect', hall(lay((pan(pluck(N(24), 0.3, 0.7), -0.2), 0, 0.9), (pan(pluck(N(31), 0.35, 0.7), 0.2), 0.07, 1), (pan(chime(N(43), 0.3, 0.1, 1.2), 0.1), 0.07, 0.18)), 0.4, 0.14), r=0.08)
    seed(402); out('S_Deny', wide(lp(lay((tone(N(-9), 0.12, 0.05, 'tri', det=0.012), 0, 1), (tone(N(-10), 0.2, 0.07, 'tri', det=0.012), 0.11, 1), (nrm(thud(110, 0.06, 0.6, 0.015)), 0, 0.5), (nrm(thud(104, 0.06, 0.6, 0.015)), 0.11, 0.5)), 1800), 9, 0.3))
    seed(403); out('S_Buy', hall(lay((pan(nrm(thud(140, 0.1, 0.5, 0.024, 0.8)), 0), 0, 0.9), (pan(click(1300, 0.05, 0.008, 6, 0.7), -0.1), 0.004, 0.5), (pan(modal([(r, 0.5 * tau, g) for r, tau, g in BELL], 0.42, lp(noise(0.004), 5000), 1760), 0.15), 0.06, 0.55),
                                 (pan(coin(2350, 0.25), -0.3), 0.12, 0.35), (pan(coin(2900, 0.25), 0.3), 0.2, 0.3)), 0.4, 0.12), r=0.08)
    seed(404); out('S_Coin', lp(wide(lay((coin(2550, 0.34), 0, 1), (nrm(thud(240, 0.03, 0.6, 0.008)), 0, 0.2)), 7, 0.3), 8000), r=0.05)
    seed(405); out('S_Coin_1', lp(wide(lay((coin(2900, 0.34), 0, 1), (nrm(thud(250, 0.03, 0.6, 0.008)), 0, 0.2)), 7, 0.3), 8000), r=0.05)
    seed(406); ts = np.cumsum(rng.uniform(0.05, 0.11, 8))
    out('S_Cash', lp(hall(lay(*[(pan(coin(rng.uniform(2100, 3300), 0.26), rng.uniform(-0.5, 0.5)), t, g) for t, g in zip(ts, np.linspace(1, 0.5, 8))], (pan(cloth(0.3, 400, 2400, 0.3), 0), 0, 0.3), (pan(nrm(thud(150, 0.08, 0.5, 0.02)), 0), 0.02, 0.4)), 0.35, 0.1), 8500), r=0.08)
    # ---------------------------------------------------------------- rewards
    seed(410); up = seq([N(12), N(15), N(19), N(24)], 0.075, lambda f: pluck(f, 0.7, 0.75))
    out('S_Upgrade', hall(lay((up, 0, 1), (pan(chime(N(36), 0.7, 0.22), 0.25), 0.225, 0.35), (pan(chime(N(43), 0.6, 0.18, 1.5), -0.25), 0.3, 0.2), (wide(whoosh(0.3, 1500, 6000, 5000, 1.5, 0.85, 'white'), 9, 0.6), 0, 0.12)), 0.8, 0.22), r=0.2)
    seed(411); lv = seq([N(0), N(7), N(12), N(15), N(19), N(24)], 0.065, lambda f: pluck(f, 0.9, 0.78))
    out('S_LevelUp', hall(lay((pan(nrm(boom(0.3, 110, 55, 0.09)), 0), 0, 0.7), (lv, 0, 1), (pan(chime(N(36), 0.9, 0.3), -0.3), 0.39, 0.4), (pan(chime(N(43), 0.9, 0.3), 0.3), 0.39, 0.32), (pan(chime(N(48), 0.8, 0.25, 1.5), 0), 0.47, 0.22),
                              (wide(nrm(hp(dust(0.6, line([(0, 30), (0.3, 220), (0.6, 20)], 0.6), 0.0003), 5000)), 13, 0.8), 0.3, 0.1)), 0.9, 0.24), r=0.25)
    seed(412); d = 0.5; ch = sum(osc(N(s) * np.ones(n_(d)), shape='saw', ph=rng.random()) for s in (-12, -5, 0, 7)) / 4
    pw = tv(ch, 'lp', line([(0, 300), (0.3, 4200), (d, 2500)], d, True), 1.4) * line([(0, 0), (0.28, 1), (d, 0)], d)
    out('S_PowerUp', hall(lay((wide(nrm(pw), 12, 0.6), 0, 0.8), (wide(whoosh(0.3, 400, 4000, 3000, 1.4, 0.9), 9, 0.5), 0, 0.4), (pan(pluck(N(12), 0.5, 0.8), -0.2), 0.28, 0.7), (pan(pluck(N(19), 0.5, 0.8), 0.2), 0.28, 0.6),
                              (pan(chime(N(36), 0.5, 0.18), 0), 0.28, 0.3), (pan(nrm(boom(0.2, 120, 60, 0.06)), 0), 0.28, 0.5)), 0.6, 0.18), r=0.15)
    seed(413); pent = [N(24), N(27), N(29), N(31), N(34), N(36), N(39)]; order = [3, 5, 2, 6, 4, 6]
    out('S_Luck', hall(seq([pent[i] for i in order], 0.085, lambda f: chime(f, 0.6, 0.2, 1.8), pans=list(rng.uniform(-0.6, 0.6, 6)), gains=[0.7, 0.8, 0.7, 1, 0.8, 0.9]), 1.0, 0.3), r=0.25)
    seed(414); tr = seq([N(31), N(36)] * 6, 0.05, lambda f: chime(f, 0.2, 0.06, 2.5), pans=[-0.4, 0.4] * 6)
    rain = lay(*[(pan(coin(rng.uniform(2200, 3600), 0.22), rng.uniform(-0.8, 0.8)), t, rng.uniform(0.25, 0.6)) for t in np.sort(rng.uniform(0.1, 1.0, 16))])
    out('S_Jackpot', lp(hall(lay((tr, 0, 0.8), (rain, 0, 0.6), (seq([N(15), N(19), N(22), N(27)], 0.11, lambda f: pluck(f, 0.7, 0.8)), 0.6, 0.9), (pan(chime(N(39), 0.8, 0.3), 0), 0.93, 0.5), (pan(nrm(boom(0.3, 110, 50, 0.08)), 0), 0.6, 0.5)), 0.8, 0.2), 9000), r=0.2)
    seed(415); out('S_Win', hall(lay((seq([N(15), N(19), N(22)], 0.07, lambda f: pluck(f, 0.5, 0.8)), 0, 1), (pan(pluck(N(27), 0.5, 0.8), 0), 0.21, 1), (pan(chime(N(39), 0.4, 0.14), 0.2), 0.21, 0.35)), 0.5, 0.18), r=0.12)
    seed(416); out('S_Lose', hall(lp(lay((seq([N(7), N(5), N(3), N(0)], 0.19, lambda f: pluck(f, 0.8, 0.55), pans=[0.3, 0.1, -0.1, -0.3]), 0, 1), (pan(tone(N(-12), 0.6, 0.25, 'tri'), 0), 0.57, 0.6), (pan(nrm(thud(80, 0.2, 0.5, 0.06)), 0), 0.57, 0.6)), 2600), 0.9, 0.22), r=0.2)
    # ---------------------------------------------------------------- round and room stingers
    seed(420); d = 3.6; mallet = lp(noise(0.008), 2200) * perc(0.008, 0.003)
    toll = modal([(r, 2.6 * tau, g) for r, tau, g in BELL], d, mallet, 220) + 0.5 * modal([(r * 1.004, 2.4 * tau, g) for r, tau, g in BELL], d, mallet, 220)
    brass = tv(sum(osc(N(s) * np.ones(n_(1.6)), shape='saw', ph=rng.random()) for s in (-24, -17, -12)) / 3, 'lp', line([(0, 180), (0.5, 900), (1.6, 250)], 1.6, True), 1.0) * swell(1.6, 0.32, 1.5)
    out('S_RoundStart', hall(lay((wide(whoosh(0.5, 200, 1400, 1800, 1.2, 0.95, 'pink', 2.2), 14, 0.6), 0, 0.4), (pan(nrm(boom(0.9, 82, 32, 0.24)), 0), 0.48, 0.9), (wide(nrm(toll), 15, 0.4), 0.48, 0.9),
                                 (wide(nrm(brass), 17, 0.5), 0.45, 0.45), (pan(nrm(lp(noise(0.06), 900) * perc(0.06, 0.015, 0.0006)), 0), 0.48, 0.4)), 1.6, 0.26), r=0.5)
    seed(421); d = 2.0; toll = modal([(r, 1.5 * tau, g) for r, tau, g in BELL], d, lp(noise(0.006), 3000) * perc(0.006, 0.002), 440)
    out('S_RoundEnd', hall(lay((wide(nrm(toll), 13, 0.4), 0, 0.6), (seq([N(0), N(3), N(7), N(12)], 0.1, lambda f: pluck(f, 1.2, 0.7)), 0.02, 0.9), (pan(tone(N(-12), 1.2, 0.5, 'tri', a=0.03), 0), 0, 0.45), (pan(chime(N(24), 0.9, 0.35, 1.5), 0.2), 0.32, 0.25)), 1.2, 0.26), r=0.4)
    seed(422); out('S_Clear', hall(lay((pan(nrm(boom(0.4, 100, 45, 0.11)), 0), 0, 0.7), (seq([N(0), N(7), N(12), N(16), N(19)], 0.07, lambda f: pluck(f, 1.0, 0.8)), 0, 1), (pan(chime(N(28), 1.0, 0.35), -0.25), 0.3, 0.35), (pan(chime(N(31), 1.0, 0.35), 0.25), 0.3, 0.35),
                                   (pan(chime(N(36), 0.9, 0.3, 1.5), 0), 0.37, 0.25), (wide(whoosh(0.35, 800, 5000, 4000, 1.4, 0.9, 'white'), 11, 0.6), 0, 0.1)), 1.1, 0.26), r=0.3)
    seed(423); d = 1.1; air = tv(noise(d, 'pink'), 'bp', line([(0, 180), (0.3, 700), (d, 240)], d, True), 0.9) * swell(d, 0.3, 1.4)
    out('S_Enter', hall(lay((pan(nrm(boom(0.6, 78, 34, 0.16)), 0), 0.05, 1), (wide(nrm(air), 16, 0.7), 0, 0.5), (pan(click(600, 0.12, 0.03, 7, 0.7, 0.5), 0), 0.05, 0.5), (wide(nrm(modal([(r, 1.2 * tau, g) for r, tau, g in BELL], 1.0, lp(noise(0.006), 1200), 82)), 12, 0.4), 0.06, 0.35),
                            (wide(debris(0.5, 900, 60, 1500, 0.001), 9, 0.7), 0.1, 0.12)), 1.2, 0.3), r=0.4)
    seed(424); d = 0.75; rise = tv(noise(d, 'pink'), 'bp', line([(0, 150), (d, 2600)], d, True), 1.8) * line([(0, 0), (d * 0.9, 1), (d, 0.6)], d) ** 2
    clus = sum(modal([(r, 1.6 * tau, g) for r, tau, g in BELL], 1.6, lp(noise(0.006), 2500) * perc(0.006, 0.002), f) for f in (N(-12), N(-11), N(-6)))
    out('S_Phase', hall(lay((wide(nrm(rise), 15, 0.7), 0, 0.6), (pan(osc(line([(0, 60), (d, 180)], d, True)) * line([(0, 0), (d, 1)], d) ** 2, 0), 0, 0.4), (pan(nrm(boom(1.0, 105, 28, 0.28)), 0), d, 1), (pan(nrm(hp(noise(0.03), 1000) * perc(0.03, 0.006, 0.0003)), 0), d, 0.6),
                            (wide(nrm(clus), 17, 0.5), d, 0.6), (wide(nrm(sat(bp(noise(0.5, 'pink'), 150, 1200) * perc(0.5, 0.14, 0.002), 3)), 12, 0.6), d, 0.5)), 1.4, 0.28), r=0.4)
    # ---------------------------------------------------------------- parts and the bench
    seed(430); out('S_Part', hall(lay((pan(click(2300, 0.1, 0.02, 8, 0.82, 0.5), -0.1), 0, 0.8), (pan(nrm(thud(180, 0.05, 0.6, 0.012)), 0), 0, 0.4), (pan(chime(N(31), 0.3, 0.09, 1.6), -0.2), 0.05, 0.5), (pan(chime(N(36), 0.35, 0.11, 1.6), 0.2), 0.12, 0.55)), 0.4, 0.14), r=0.1)
    seed(431); rat = lay(*[(click(rng.uniform(2300, 2700), 0.03, 0.004, 5, 0.7), t, 0.6) for t in (0, 0.045, 0.085, 0.12)])
    out('S_Fit', hall(lay((pan(rat, -0.2), 0, 0.8), (pan(click(1500, 0.08, 0.014, 9, 0.8), 0), 0.17, 1), (pan(nrm(thud(150, 0.09, 0.55, 0.022, 0.8)), 0), 0.17, 0.9), (pan(pluck(N(19), 0.4, 0.75), -0.15), 0.21, 0.5), (pan(pluck(N(24), 0.45, 0.75), 0.15), 0.27, 0.55),
                          (pan(chime(N(43), 0.3, 0.1, 1.2), 0.1), 0.27, 0.14)), 0.4, 0.14), r=0.1)
    seed(432); rat = lay(*[(click(rng.uniform(2000, 2400), 0.03, 0.004, 5, 0.7), t, 0.6) for t in (0.1, 0.14, 0.185)])
    out('S_Unfit', hall(lay((pan(click(1350, 0.07, 0.012, 9, 0.8), 0), 0, 1), (pan(nrm(thud(170, 0.08, 0.6, 0.018, 0.8)), 0), 0, 0.8), (pan(rat, 0.2), 0, 0.7), (pan(pluck(N(19), 0.3, 0.6), 0), 0.12, 0.35), (pan(pluck(N(12), 0.3, 0.6), 0), 0.19, 0.35)), 0.35, 0.12), r=0.08)
    seed(433); cl = lay(*[(pan(click(rng.uniform(1400, 3200), 0.05, rng.uniform(0.006, 0.014), 7, 0.8, 0.6), rng.uniform(-0.5, 0.5)), t, rng.uniform(0.3, 0.8)) for t in np.sort(rng.uniform(0.1, 0.38, 7))])
    out('S_Bench', hall(lay((pan(click(1900, 0.04, 0.006, 6), -0.2), 0, 0.8), (pan(click(1700, 0.04, 0.006, 6), 0.2), 0.05, 0.8), (pan(modal(wood(210, 5, 0.06), 0.25, lp(noise(0.005), 1500)), 0), 0.09, 1), (cl, 0, 0.6), (pan(scrape(0.12, 300, 2500, 60) * swell(0.12, 0.4), 0), 0.08, 0.35)), 0.4, 0.14), r=0.1)
    seed(434); d = 0.5; inh = tv(noise(d, 'pink'), 'bp', line([(0, 400), (d, 2400)], d, True), 1.6) * line([(0, 0), (d * 0.85, 1), (d, 0)], d)
    out('S_Revive', hall(lay((wide(nrm(inh), 12, 0.7), 0, 0.6), (pan(lp(nrm(boom(0.2, 72, 48, 0.055, 0.008)), 420), 0), 0.02, 0.7), (pan(lp(nrm(boom(0.18, 62, 46, 0.045, 0.008)), 380), 0), 0.24, 0.6), (seq([N(12), N(19), N(24)], 0.08, lambda f: pluck(f, 0.7, 0.75)), 0.46, 0.9),
                             (pan(chime(N(36), 0.6, 0.22), 0), 0.62, 0.3)), 0.8, 0.22), r=0.2)
    # ---------------------------------------------------------------- the casino
    seed(440); rt = lay(*[(click(rng.uniform(1900, 2300), 0.03, 0.005, 6, 0.75), t, g) for t, g in zip([0, 0.07, 0.13, 0.18, 0.22, 0.255], np.linspace(0.6, 1, 6))])
    out('S_SlotPull', wide(lay((rt, 0, 0.8), (scrape(0.26, 500, 3000, 90) * line([(0, 0.2), (0.26, 1)], 0.26), 0, 0.3), (nrm(thud(130, 0.12, 0.5, 0.03, 0.8)), 0.29, 1), (modal(plate(420, 8, 0.1, 0.35, 0.8), 0.3), 0.3, 0.4), (click(1200, 0.05, 0.008, 6), 0.29, 0.5)), 8, 0.35))
    seed(441); out('S_SlotTick', lp(lay((click(1750, 0.03, 0.004, 5, 0.7), 0, 1), (modal(wood(600, 3, 0.01), 0.03), 0, 0.5)), 6500), r=0.005)
    seed(442); out('S_SlotStop', wide(lay((nrm(thud(165, 0.1, 0.55, 0.024, 0.8)), 0, 1), (click(1250, 0.05, 0.008, 7, 0.75), 0, 0.7), (chime(N(39), 0.14, 0.04, 1.2), 0.01, 0.22)), 7, 0.3))
    seed(443); riff = [N(12), N(15), N(19), N(24), N(22), N(19), N(15), N(19), N(27)]; when = [0, 0.16, 0.32, 0.48, 0.72, 0.88, 1.04, 1.2, 1.44]
    bass = seq([N(-12), N(-5), N(-9), N(-5), N(-9)], [0, 0.48, 0.96, 1.2, 1.44], lambda f: pluck(f, 0.9, 0.6), pans=[0] * 5)
    out('S_CasinoOpen', lp(hall(lay((seq(riff, when, lambda f: pluck(f, 0.8, 0.82), pans=list(rng.uniform(-0.4, 0.4, 9))), 0, 1), (bass, 0, 0.7), (pan(chime(N(39), 1.2, 0.4), 0.2), 1.44, 0.45), (pan(chime(N(43), 1.2, 0.4), -0.2), 1.52, 0.35),
                                    (lay(*[(pan(coin(rng.uniform(2200, 3400), 0.22), rng.uniform(-0.7, 0.7)), t, 0.3) for t in np.sort(rng.uniform(1.5, 2.3, 8))]), 0, 1)), 1.0, 0.22), 9000), r=0.4)
    # ---------------------------------------------------------------- room tone: stereo loops that join their own tails
    L = 8.0; T = t_(L)
    seed(450)
    def wind(d):
        ch = []
        for c in range(2):
            n = n_(d); t = np.arange(n) / SR; fc = 520 * 2 ** (0.7 * np.sin(2 * np.pi * t / L + c * 0.9) + 0.35 * np.sin(2 * np.pi * 3 * t / L + 1.7 * c))
            g = 0.55 + 0.3 * np.sin(2 * np.pi * 2 * t / L + 0.5 + c) + 0.15 * np.sin(2 * np.pi * 5 * t / L + 2.0 * c)
            w = tv(noise(d, 'pink'), 'bp', fc, 1.3) * g; wh = tv(noise(d), 'bp', 2100 * 2 ** (0.2 * np.sin(2 * np.pi * 2 * t / L + c)), 9) * np.clip(np.sin(2 * np.pi * t / L + 3 * c), 0, 1) ** 2
            ch.append(nrm(w) + 0.12 * nrm(wh))
        return np.stack(ch, 1)
    write_loop('S_AmbWind', loopbed(L, wind))
    seed(451)
    def murmur(d):
        ch = []
        for c in range(2):
            m = lp(np.abs(rng.standard_normal(n_(d))), 2.5, 1); m /= m.max(); ch.append(nrm(bp(noise(d, 'pink'), 180, 1100) * (0.5 + 0.5 * m)) + 0.08 * nrm(bp(noise(d), 2500, 5000) * m))
        return np.stack(ch, 1)
    ev = lay(*[(pan(chime(rng.choice([N(31), N(36), N(39), N(43)]), 0.3, 0.1, 1.5), rng.uniform(-0.8, 0.8)), t, rng.uniform(0.05, 0.14)) for t in rng.uniform(0, L, 14)],
             *[(pan(coin(rng.uniform(2200, 3300), 0.22), rng.uniform(-0.8, 0.8)), t, rng.uniform(0.04, 0.1)) for t in rng.uniform(0, L, 12)], d=L + 1)
    write_loop('S_AmbCasino', loopbed(L, murmur) * 0.7 + wrap(verb(ev, 0.6, 0.3, stereo=True, tail=False), L))
    def tone_bed(lo_hz, air, d):
        return np.stack([nrm(bp(noise(d, 'pink'), 60, lo_hz * 1.9)) * 0.9 + air * nrm(hp(noise(d), 3200)) for c in range(2)], 1)
    def drips(n, vol=0.3, rt=1.6):
        ev = lay(*[(pan(drip(), rng.uniform(-0.8, 0.8)), t, rng.uniform(0.3, 1) * vol) for t in rng.uniform(0, L, n)], d=L + 0.5)
        return wrap(verb(ev, rt, 0.7, 0.02, 4500, 1500, stereo=True), L)
    seed(452); far = lay(*[(pan(nrm(boom(0.5, 70, 38, 0.14)), rng.uniform(-0.6, 0.6)), t, 0.25) for t in (1.7, 5.9)], d=L)
    write_loop('S_AmbStone', loopbed(L, lambda d: tone_bed(170, 0.03, d)) * (0.85 + 0.15 * cyc(L, 1))[:, None] + drips(5, 0.1, 2.2) + wrap(verb(far, 2.0, 0.6, stereo=True), L) * 0.25)
    seed(453)
    def moan(d):
        ch = []
        for c in range(2):
            t = np.arange(n_(d)) / SR; fc = 230 * 2 ** (0.35 * np.sin(2 * np.pi * t / L + 2 * c) + 0.15 * np.sin(2 * np.pi * 3 * t / L + c)); ch.append(nrm(tv(noise(d, 'pink'), 'bp', fc, 5.5) * (0.55 + 0.45 * np.sin(2 * np.pi * 2 * t / L + 1.3 * c))) * 0.5 + nrm(rumble(d, 150)) * 0.6 + 0.04 * nrm(hp(noise(d), 3000)))
        return np.stack(ch, 1)
    write_loop('S_AmbCave', loopbed(L, moan) + drips(10, 0.3, 2.4))
    seed(454)
    def machine(d):
        t = np.arange(n_(d)) / SR; ch = []
        for c in range(2):
            h = sum(g * np.sin(2 * np.pi * f * (1 + 0.0015 * c) * t + rng.uniform(0, 6)) for f, g in [(60, 0.5), (120, 0.6), (180, 0.35), (240, 0.2), (361, 0.1)]) * (0.8 + 0.2 * np.sin(2 * np.pi * 4 * t / L + c))
            hiss = hp(noise(d), 2600) * np.clip(np.sin(2 * np.pi * 2 * t / L + 1.5 * c), 0, 1) ** 3
            ch.append(nrm(h) * 0.7 + nrm(rumble(d, 240)) * 0.4 + 0.1 * nrm(hiss))
        return np.stack(ch, 1)
    clank = lay(*[(pan(modal(plate(rng.uniform(260, 520), 9, 0.25, 0.4, 0.8), 0.8, lp(noise(0.004), 2000)), rng.uniform(-0.8, 0.8)), t, rng.uniform(0.1, 0.22)) for t in (0.9, 3.4, 4.1, 6.6)], d=L)
    write_loop('S_AmbMachine', loopbed(L, machine) + wrap(verb(clank, 1.6, 0.7, stereo=True), L))
    seed(455)
    def fire(d):
        ch = []
        for c in range(2):
            t = np.arange(n_(d)) / SR; fl = lp(np.abs(rng.standard_normal(n_(d))), 7, 1); fl /= fl.max()
            ch.append(nrm(rumble(d, 130)) * (0.7 + 0.3 * np.sin(2 * np.pi * 3 * t / L + c)) * 0.8 + nrm(lp(noise(d, 'pink'), 700) * (0.5 + 0.5 * fl)) * 0.35 + 0.22 * nrm(hp(dust(d, 26 + 22 * fl, 0.0005), 1500)))
        return np.stack(ch, 1)
    write_loop('S_AmbFire', loopbed(L, fire))
    seed(456)
    def water(d):
        ch = []
        for c in range(2):
            t = np.arange(n_(d)) / SR; lap = 0.5 + 0.5 * np.sin(2 * np.pi * 4 * t / L + 1.1 * c) * (0.6 + 0.4 * np.sin(2 * np.pi * t / L))
            ch.append(nrm(bp(noise(d, 'pink'), 350, 1700) * lap) * 0.5 + 0.14 * nrm(bp(dust(d, 420, 0.0006), 1800, 5200)) + nrm(rumble(d, 150)) * 0.45)
        return np.stack(ch, 1)
    write_loop('S_AmbWater', loopbed(L, water) + drips(8, 0.28, 1.8))
if __name__ == '__main__': build(); save_manifest(); print(len(MANIFEST), 'written')
