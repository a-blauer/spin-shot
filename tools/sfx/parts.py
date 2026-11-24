"""Compound gestures the sounds are built from: a contact, a thud, air moving, something wet, something dragged."""
from core import *

def click(f=3000, d=0.03, tau=0.004, n=6, bright=0.75, spread=1.0):
    """A small hard part meeting another: a millisecond of contact ringing a few damped, inharmonic partials."""
    strike = hp(noise(0.003), 1500) * perc(0.003, 0.0008, 0.0002)
    return modal(plate(f, n, tau, spread, bright), d, strike)
def thud(f=90, d=0.18, drop=0.5, tau=0.05, knock=0.4, a=0.002):
    """A soft heavy contact: a tone that falls as it lands, with the dull knock of the surface."""
    y = osc(line([(0, f), (d, f * max(drop, min(1, 50 / f)))], d, True)) * perc(d, tau, a)
    k = lp(noise(d, 'brown'), f * 4) * perc(d, tau * 0.5, 0.001)
    return y + knock * nrm(k)
def whoosh(d, f0, f1, f2=None, q=1.5, peak=0.5, color='pink', p=1.6):
    """Air moving past: a band of noise that sweeps, loudest as it goes by."""
    fc = line([(0, f0), (d * peak, f1), (d, f2 or f0)], d, True)
    return nrm(tv(noise(d, color), 'bp', fc, q) * swell(d, peak, p))
def squelch(d=0.2, f=600, wet=1.0):
    """Wet flesh: noise through a few fast-moving resonances, and bubbles."""
    n = noise(d, 'pink'); y = np.zeros(n_(d))
    for k in range(3):
        f0 = f * rng.uniform(0.6, 2.2); fc = f0 * (1 + 0.6 * np.sin(2 * np.pi * rng.uniform(6, 18) * t_(d) + rng.uniform(0, 6)))
        y += tv(n, 'bp', fc, rng.uniform(3, 7))
    y *= perc(d, d * 0.35, 0.004); pk = np.abs(y).max()
    for _ in range(int(4 * wet)):
        t0 = rng.uniform(0, d * 0.6); bd = rng.uniform(0.012, 0.03)
        b = osc(line([(0, rng.uniform(300, 700)), (bd, rng.uniform(900, 1800))], bd, True)) * perc(bd, bd * 0.4, 0.002)
        i = n_(t0); j = min(len(y), i + len(b)); y[i:j] += 0.3 * pk * b[:j - i]
    return nrm(y)
def scrape(d, lo=400, hi=3500, grain=60):
    """A gritty drag: band noise with a rough, uneven grain."""
    g = lp(np.abs(rng.standard_normal(n_(d))), grain, 1); g = g / g.max()
    return nrm(bp(noise(d, 'pink'), lo, hi) * (0.35 + 0.65 * g))
def cloth(d, lo=350, hi=2200, peak=0.4):
    return nrm(bp(noise(d, 'pink'), lo, hi, 1) * swell(d, peak, 1.2))
def debris(d, rate0=2500, rate1=150, lo=1500, tau=0.0007):
    """Bits of stone and dirt coming down after an impact."""
    return nrm(hp(dust(d, line([(0, rate0), (d, rate1)], d, True), tau), lo) * perc(d, d * 0.4, 0.003))
def boom(d, f0=95, f1=44, tau=0.25, a=0.004):
    """The low end of something big: a sine dropping through the chest. It never goes below what a speaker can make, and
    it carries its own harmonics (and a knock in the low mids) so it still reads on a laptop."""
    f1 = max(f1, 50); f = line([(0, f0), (d * 0.35, (f0 + f1) / 2 * 0.85), (d, f1)], d, True); y = osc(f) * perc(d, tau, a)
    h = hp(sat(y, 5), 120, 1) * perc(d, tau * 0.8, a); k = bp(noise(d, 'pink'), 110, 420, 1) * perc(d, tau * 0.35, 0.001)
    return 0.8 * y + 0.5 * h + 0.35 * nrm(k)
def rumble(d, hz):
    """Low noise with the unplayable bottom taken off."""
    return bp(noise(d, 'brown'), 48, max(90, hz * 1.7), 2)
def tone(f, d, tau, shape='sine', a=0.003, vib=0.0, det=0.0):
    """One musical note with a soft start; `det` adds a second, slightly sharp voice for warmth."""
    t = t_(d); fr = f * (1 + vib * np.sin(2 * np.pi * 5.5 * t)); y = osc(fr, shape=shape)
    if det: y = 0.6 * y + 0.4 * osc(fr * (1 + det), shape=shape, ph=0.3)
    return y * perc(d, tau, a)
def N(semi, base=220.0): return base * 2 ** (semi / 12)   # semitones above A3: the score is in A minor, so is the interface
