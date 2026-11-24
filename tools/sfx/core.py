"""Polyshot sound design kit. Everything is synthesised here (numpy/scipy): nothing is sampled or borrowed.
   Building blocks: band-limited oscillators, coloured noise, causal and time-varying filters, modal resonators
   (struck metal, wood, glass, stone), a source-filter voice (creatures), synthetic rooms, dynamics, and a writer that
   masters each sound and measures it. Mono for anything that lives in the world; stereo for interface and stingers."""
import numpy as np, subprocess, os, json
from scipy import signal
from scipy.signal import fftconvolve, resample_poly

SR = 44100
OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'audio'))
rng = np.random.default_rng(1)
MANIFEST = {}

def seed(s):
    global rng
    rng = np.random.default_rng(s)
def n_(d): return max(1, int(round(d * SR)))
def t_(d): return np.arange(n_(d)) / SR
def db(x): return 10 ** (x / 20)
def arr(v, n): return np.broadcast_to(np.asarray(v, float), (n,)).copy() if np.ndim(v) == 0 else np.asarray(v, float)[:n] if len(v) >= n else np.pad(np.asarray(v, float), (0, n - len(v)), mode='edge')

# ---- envelopes
def line(pts, d, exp=False):
    """A breakpoint curve: pts = [(seconds, value), ...]."""
    t = t_(d); xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    return np.exp(np.interp(t, xs, np.log(np.maximum(ys, 1e-6)))) if exp else np.interp(t, xs, ys)
def perc(d, tau, a=0.001, hold=0.0):
    """Attack, optional hold, exponential fall."""
    t = t_(d); return np.minimum(1, t / max(a, 1e-5)) * np.exp(-np.maximum(0, t - a - hold) / tau)
def swell(d, peak=0.6, p=2.0):
    """Rises to a peak part-way through and falls away (0..1)."""
    t = t_(d) / d; return np.where(t < peak, (t / peak) ** p, ((1 - t) / (1 - peak)) ** 1.5)
def fade(x, a=0.0005, r=0.01):
    x = np.array(x, float); na, nr = min(len(x) // 2, n_(a)), min(len(x) // 2, n_(r))
    w = np.ones(len(x)); w[:na] = np.linspace(0, 1, na); w[-nr:] = 0.5 * (1 + np.cos(np.linspace(0, np.pi, nr)))
    return (x.T * w).T

# ---- sources
def _blep(p, dt):
    y = np.zeros_like(p); m = p < dt; t = p[m] / dt[m]; y[m] = t + t - t * t - 1
    m = p > 1 - dt; t = (p[m] - 1) / dt[m]; y[m] = t * t + t + t + 1; return y
def osc(f, d=None, shape='sine', ph=0.0, pw=0.5):
    """Band-limited oscillator. f is Hz: a number (needs d) or an array."""
    n = n_(d) if d is not None else len(f); f = arr(f, n); dt = np.clip(f / SR, 1e-6, 0.45); p = (ph + np.cumsum(dt)) % 1
    if shape == 'sine': return np.sin(2 * np.pi * p)
    if shape == 'tri': return 4 * np.abs(p - 0.5) - 1
    if shape == 'saw': return 2 * p - 1 - _blep(p, dt)
    y = np.where(p < pw, 1.0, -1.0) + _blep(p, dt) - _blep((p + 1 - pw) % 1, dt); return y   # square / pulse
def fm(fc, ratio, index, d=None, ph=0.0):
    """Two-operator FM: carrier fc, modulator fc*ratio, index (may be arrays)."""
    n = n_(d) if d is not None else len(fc); fc = arr(fc, n); idx = arr(index, n)
    pm = 2 * np.pi * np.cumsum(fc * ratio) / SR; return np.sin(2 * np.pi * np.cumsum(fc) / SR + ph + idx * np.sin(pm))
def noise(d, color='white'):
    n = n_(d); x = rng.standard_normal(n)
    if color == 'white': return x / 3
    X = np.fft.rfft(x); f = np.fft.rfftfreq(n, 1 / SR); f[0] = f[1] if n > 1 else 1
    X *= {'pink': f ** -0.5, 'brown': f ** -1.0, 'blue': f ** 0.5}[color]; y = np.fft.irfft(X, n); return y / (np.abs(y).max() + 1e-9)
def dust(d, rate, tau=0.0008, amp_var=0.7):
    """Random ticks (debris, crackle, droplets): `rate` per second (number or array), each a tiny decaying spike."""
    n = n_(d); r = arr(rate, n); hits = rng.random(n) < r / SR; x = np.zeros(n); x[hits] = (1 - amp_var * rng.random(hits.sum())) * rng.choice([-1, 1], hits.sum())
    k = np.exp(-np.arange(n_(tau * 8)) / (tau * SR)); return fftconvolve(x, k)[:n]

# ---- filters (causal: a zero-phase filter rings before the hit, and a transient must start on time)
def _sos(kind, f, o):
    f = np.clip(np.asarray(f, float), 15, SR / 2 - 200); return signal.butter(o, f if np.ndim(f) == 0 else list(f), btype=kind, fs=SR, output='sos')
def lp(x, f, o=2): return signal.sosfilt(_sos('low', f, o), x, axis=0)
def hp(x, f, o=2): return signal.sosfilt(_sos('high', f, o), x, axis=0)
def bp(x, lo, hi, o=2): return signal.sosfilt(_sos('band', (lo, hi), o), x, axis=0)
def _rbj(kind, f, q, g=0.0):
    w = 2 * np.pi * min(max(f, 15), SR / 2 - 200) / SR; c, s = np.cos(w), np.sin(w); al = s / (2 * q); A = 10 ** (g / 40)
    if kind == 'lp': b = [(1 - c) / 2, 1 - c, (1 - c) / 2]; a = [1 + al, -2 * c, 1 - al]
    elif kind == 'hp': b = [(1 + c) / 2, -(1 + c), (1 + c) / 2]; a = [1 + al, -2 * c, 1 - al]
    elif kind == 'bp': b = [al, 0, -al]; a = [1 + al, -2 * c, 1 - al]
    elif kind == 'peak': b = [1 + al * A, -2 * c, 1 - al * A]; a = [1 + al / A, -2 * c, 1 - al / A]
    elif kind == 'loshelf':
        sq = 2 * np.sqrt(A) * al; b = [A * ((A + 1) - (A - 1) * c + sq), 2 * A * ((A - 1) - (A + 1) * c), A * ((A + 1) - (A - 1) * c - sq)]; a = [(A + 1) + (A - 1) * c + sq, -2 * ((A - 1) + (A + 1) * c), (A + 1) + (A - 1) * c - sq]
    else:
        sq = 2 * np.sqrt(A) * al; b = [A * ((A + 1) + (A - 1) * c + sq), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - sq)]; a = [(A + 1) - (A - 1) * c + sq, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - sq]
    return np.array(b) / a[0], np.array(a) / a[0]
def eq(x, kind, f, q=0.7, g=0.0): b, a = _rbj(kind, f, q, g); return signal.lfilter(b, a, x, axis=0)
def tv(x, kind, f, q=1.0, block=48):
    """A filter whose frequency (and Q) move: f, q are numbers or arrays the length of x."""
    n = len(x); f = arr(f, n); q = arr(q, n); y = np.empty(n); zi = np.zeros(2)
    for i in range(0, n, block):
        b, a = _rbj(kind, f[i], q[i]); y[i:i + block], zi = signal.lfilter(b, a, x[i:i + block], zi=zi)
    return y
def comb(x, f, fb=0.7): d = max(1, int(SR / f)); b = np.zeros(d + 1); b[0] = 1; a = np.zeros(d + 1); a[0] = 1; a[d] = -fb; return signal.lfilter(b, a, x)

# ---- resonant bodies
def modal(partials, d, strike=None, f0=1.0):
    """Struck object: partials = [(Hz or ratio, decay seconds, gain), ...]. With a `strike` (a short burst) the partials
    are rung by it, so the attack has the grain of the thing that hit it."""
    t = t_(d); y = np.zeros(len(t))
    for f, tau, g in partials: y += g * np.sin(2 * np.pi * f * f0 * t + rng.uniform(0, 6.28)) * np.exp(-t / tau)
    if strike is not None: y = fftconvolve(strike, y)[:len(t)]
    return y / (np.abs(y).max() + 1e-9)
BELL = [(0.5, 1.0, 0.45), (1.0, 0.9, 1.0), (1.183, 0.7, 0.55), (1.506, 0.6, 0.5), (2.0, 0.5, 0.6), (2.514, 0.35, 0.3), (2.662, 0.3, 0.25), (3.011, 0.26, 0.22), (4.166, 0.16, 0.12), (5.433, 0.1, 0.08)]
def plate(f, n=9, tau=0.05, spread=1.0, bright=0.8):
    """Partials of a small stiff metal part (inharmonic, quickly damped)."""
    return [(f * (1 + 0.62 * k * spread + 0.31 * k * k * spread) * rng.uniform(0.97, 1.03), tau / (1 + 0.5 * k), bright ** k) for k in range(n)]
def wood(f, n=5, tau=0.03): return [(f * r * rng.uniform(0.97, 1.03), tau / (1 + k), 0.6 ** k) for k, r in enumerate([1, 2.57, 4.93, 6.4, 8.1][:n])]

# ---- voice: a throat (glottal pulses, breath, roughness) through a mouth (moving formants)
VOWEL = {'a': (730, 1090, 2440, 3400), 'o': (570, 840, 2410, 3300), 'u': (300, 870, 2240, 3200), 'e': (530, 1840, 2480, 3500), 'i': (270, 2290, 3010, 3600),
         'uh': (640, 1190, 2390, 3400), 'ae': (660, 1720, 2410, 3500), 'er': (490, 1350, 1690, 3300), 'oo': (440, 1020, 2240, 3200)}
def voice(d, f0, path, tract=1.0, breath=0.12, jitter=0.03, rough=0.0, rough_hz=45, sub=0.0, tilt=1400, q=6.0, growl=0.0):
    """f0: Hz (number or array). path: [(0..1, vowel), ...]. tract > 1 is a bigger animal (formants fall)."""
    n = n_(d); f0 = arr(f0, n)
    wob = lp(rng.standard_normal(n), 9, 2); wob /= np.abs(wob).max() + 1e-9
    f = f0 * (1 + jitter * wob) * (1 + 0.006 * np.sin(2 * np.pi * 5.3 * t_(d)))
    src = lp(osc(f, shape='saw'), tilt, 1) + 0.5 * lp(osc(f, shape='pulse', pw=0.18), tilt * 1.6, 1)
    if sub: src = src + sub * lp(osc(f / 2, shape='saw'), tilt, 1) * (0.6 + 0.4 * np.sin(2 * np.pi * np.cumsum(f / 3) / SR))
    if growl: src = src * (1 - growl * (0.5 + 0.5 * osc(f * 0.5 + 3, shape='tri')))
    if rough:
        r = lp(rng.standard_normal(n), rough_hz, 2); r = r / (np.abs(r).max() + 1e-9); src = src * (1 - rough * (0.5 + 0.5 * r)) + rough * 0.5 * src * (osc(rough_hz * (1 + 0.3 * wob)) > 0)
    br = hp(rng.standard_normal(n), 1800, 1) / 3 * (0.6 + 0.4 * np.abs(osc(f)))
    ex = src + breath * br * 3
    ts = [p[0] for p in path]; tt = np.linspace(0, 1, n); y = np.zeros(n)
    for k, gain in enumerate([1.0, 0.7, 0.4, 0.22]):
        fk = np.interp(tt, ts, [VOWEL[p[1]][k] for p in path]) / tract
        y += gain * tv(ex, 'bp', fk, q + k * 1.5)
    return y / (np.abs(y).max() + 1e-9)

# ---- space
def room_ir(rt=0.5, pre=0.004, bright=5000, dark=1200, stereo=False, early=6):
    n = n_(rt * 1.3 + pre + 0.05); t = np.arange(n) / SR; chans = []
    for c in range(2 if stereo else 1):
        x = rng.standard_normal(n) * np.exp(-6.9 * t / rt); hi = lp(x, bright, 1); lo = lp(x, dark, 1); w = np.clip(t / rt, 0, 1); y = hi * (1 - w) + lo * w
        ir = np.zeros(n + n_(pre)); ir[n_(pre):] = y * 0.5
        for k in range(early): i = n_(pre + rng.uniform(0.004, 0.045)); ir[i] += rng.choice([-1, 1]) * rng.uniform(0.3, 0.8) * 0.9 ** k
        chans.append(ir / np.sqrt(np.sum(ir ** 2)))
    return np.stack(chans, 1) if stereo else chans[0]
def verb(x, rt=0.5, wet=0.2, pre=0.004, bright=5000, dark=1200, stereo=False, tail=True):
    """Put a sound in a room. Returns mono, or stereo (n, 2) when asked (or when given stereo)."""
    x = np.asarray(x, float); st = stereo or x.ndim == 2; ir = room_ir(rt, pre, bright, dark, st)
    n = len(x) + (len(ir) if tail else 0)
    if st:
        xs = x if x.ndim == 2 else np.stack([x, x], 1); out = np.zeros((n, 2)); out[:len(x)] = xs
        for c in range(2): w = fftconvolve(xs[:, c], ir[:, c])[:n]; out[:len(w), c] += wet * w * 0.5
        return out
    out = np.zeros(n); out[:len(x)] = x; w = fftconvolve(x, ir)[:n]; out[:len(w)] += wet * w * 0.5; return out

# ---- dynamics, placement
def sat(x, drive=2.0): return np.tanh(np.asarray(x) * drive) / np.tanh(drive)
def nrm(x, peak=1.0): x = np.asarray(x, float); return x * (peak / (np.abs(x).max() + 1e-9))
def lay(*parts, d=None):
    """Layer parts: each is an array, or (array, start seconds), or (array, start, gain). Mono and stereo mix freely."""
    items = [(p, 0.0, 1.0) if not isinstance(p, tuple) else (p[0], p[1], p[2] if len(p) > 2 else 1.0) for p in parts]
    st = any(np.ndim(p[0]) == 2 for p in items); n = n_(d) if d else max(n_(s) + len(x) for x, s, g in items)
    out = np.zeros((n, 2)) if st else np.zeros(n)
    for x, s, g in items:
        x = np.asarray(x, float); i = n_(s) if s > 0 else 0; j = min(n, i + len(x))
        if j <= i: continue
        if st and x.ndim == 1: x = np.stack([x, x], 1)
        out[i:j] += g * x[:j - i]
    return out
def pan(x, p=0.0):
    """Mono to stereo at position p (-1 left .. 1 right), equal power."""
    a = (p + 1) * np.pi / 4; return np.stack([np.cos(a) * x, np.sin(a) * x], 1)
def wide(x, ms=11.0, amt=0.5):
    """Mono to stereo with width: the sides get a short decorrelated copy, the middle stays solid."""
    x = np.asarray(x, float); dly = np.zeros(len(x)); k = n_(ms / 1000); dly[k:] = x[:-k] if k < len(x) else 0; s = hp(dly, 300, 1) * amt
    return np.stack([x + s, x - s], 1)
def pitch(x, ratio): return resample_poly(x, 1000, max(1, int(round(1000 * ratio))), axis=0)
def gate_silence(x, thr=-58):
    m = np.abs(x).max(axis=1) if x.ndim == 2 else np.abs(x); idx = np.where(m > db(thr) * (m.max() + 1e-9))[0]
    return x if not len(idx) else x[max(0, idx[0] - 8):min(len(x), idx[-1] + n_(0.012))]

# ---- metering (K-weighted, so a level means roughly how loud it sounds rather than how big the wave is)
_K1 = _rbj('hishelf', 1680, 0.707, 4.0); _K2 = _rbj('hp', 38, 0.5)
def kwin(x, ms=100):
    m = x.mean(axis=1) if x.ndim == 2 else x; m = signal.lfilter(*_K2, signal.lfilter(*_K1, m)); w = min(len(m), n_(ms / 1000))
    c = np.cumsum(np.concatenate([[0], m * m])); return 10 * np.log10(max(1e-12, np.max(c[w:] - c[:-w]) / w))
def bands(x):
    m = x.mean(axis=1) if x.ndim == 2 else x; X = np.abs(np.fft.rfft(m)) ** 2; f = np.fft.rfftfreq(len(m), 1 / SR); tot = X.sum() + 1e-20
    return [round(float(X[(f >= a) & (f < b)].sum() / tot), 3) for a, b in [(0, 60), (60, 250), (250, 2000), (2000, 6000), (6000, 22050)]] + [int((f * X).sum() / tot)]

# How much of each sound's energy has to sit above 250 Hz. A big hit made mostly of bass is a thump on headphones and
# nothing at all on a laptop; these shares are what make it read everywhere (by base name, variants included).
TOP = dict(S_Explosion=0.45, S_Slam=0.38, S_Stomp=0.34, S_Blunt=0.36, S_Kill=0.42, S_Heartbeat=0.14, S_Land=0.4, S_Step0=0.45, S_Step1=0.45, S_Step2=0.45, S_Step3=0.45, S_Gib=0.5, S_HitFlesh=0.55, S_HitFlesh2=0.5,
           S_Hurt=0.55, S_BossRoar=0.62, S_Launcher=0.42, S_Door=0.45, S_Enter=0.4, S_Phase=0.42, S_RoundStart=0.45, S_JumpPad=0.5, S_Wings=0.5, S_EnemyDie=0.6, S_Flame=0.55, S_Groan0=0.62, S_Groan1=0.62, S_Groan2=0.62,
           S_Groan3=0.62, S_Snarl=0.7, S_Attack=0.65, S_Splat=0.6, S_Dash=0.6, S_SlotStop=0.45, S_Buy=0.55, S_Deny=0.4, S_Lose=0.5, S_Beam=0.6, S_ShieldBreak=0.6, S_Shield=0.55, S_Blink=0.55, S_Tide=0.55, S_SwingBig=0.6,
           S_MagIn=0.6, S_Rack=0.65, S_ShellIn=0.6, S_Switch=0.6, S_Bench=0.6, S_Fit=0.6, S_Unfit=0.6, S_Revive=0.5, S_Clear=0.6, S_LevelUp=0.6, S_PowerUp=0.6)
# Short, spiky sounds (clicks, ticks, links of chain) are rounded off a little, the way tape or a console would: the same
# sound sits a few dB louder for the same peak, so the game does not have to lean on its limiter to make them heard.
DENSE = dict(S_Rack=2.2, S_ShellIn=2.4, S_Chain=2.4, S_HitMarker=2.2, S_MagIn=1.8, S_MagOut=1.8, S_Dry=1.8, S_Zap=1.8, S_HitWall=1.8, S_Switch=1.6, S_SlotTick=1.8, S_UIMove=1.6, S_Frost=1.8, S_Crit=1.6, S_Headshot=1.6,
             S_SlotPull=1.8, S_SlotStop=1.6, S_Stomp=1.6, S_Kill=1.5, S_HitFlesh=1.5, S_HitFlesh2=1.5, S_Blade=1.5, S_Blunt=1.5, S_Step0=1.5, S_Step1=1.5, S_Step2=1.5, S_Step3=1.5, S_Bench=1.6, S_Unfit=1.8, S_Fit=1.6,
             S_Explosion=2.8, S_Launcher=2.0, S_Blink=2.0, S_Wallrun=2.0, S_Slam=2.2, S_Door=1.6, S_Gib=1.7, S_Land=1.7, S_Enter=1.6, S_Phase=1.8, S_ShieldBreak=1.7, S_Plasma=1.4, S_JumpPad=1.6, S_Grapple=1.6, S_Spit=1.6, S_Wings=1.6)
def top_share(x, share, split=250):
    """Bring up everything above `split` until it holds `share` of the energy (never turns it down). The split is done
    in the frequency domain with a gentle slope, so the two halves add back to exactly the original."""
    n0 = len(x); k = n_(0.05); x = np.concatenate([np.zeros((k,) + x.shape[1:]), x, np.zeros((k,) + x.shape[1:])])   # room either side: the transform wraps round
    X = np.fft.rfft(x, axis=0); f = np.fft.rfftfreq(len(x), 1 / SR); w = 1 / (1 + (split / np.maximum(f, 1)) ** 4); w = w[:, None] if x.ndim == 2 else w
    hi = np.fft.irfft(X * w, len(x), axis=0); lo = x - hi; x, lo, hi = x[k:k + n0], lo[k:k + n0], hi[k:k + n0]; el, eh = float(np.sum(lo ** 2)), float(np.sum(hi ** 2))
    if eh < 1e-9 or eh / (el + eh) >= share: return x
    return lo + hi * min(8.0, np.sqrt(share * el / ((1 - share) * eh)))
def out(name, x, peak=-1.5, a=0.0003, r=0.012, keep_head=False, loop=False, br=None):
    """Master and write one sound: DC and rumble out, silence trimmed, ends faded, peak set, mp3 written, stats kept."""
    x = np.asarray(x, float); x = hp(x, 42, 2)   # nothing below what the game's own high-pass lets through: it only eats headroom
    base = name.split('_')[0] + '_' + name.split('_')[1]
    if base in TOP: x = top_share(x, TOP[base])
    if base in DENSE: x = sat(nrm(x), DENSE[base])
    if not loop:
        if not keep_head: x = gate_silence(x)
        x = fade(x, a, r)
    x = nrm(x, db(peak)); st = x.ndim == 2
    os.makedirs(OUT, exist_ok=True); path = os.path.join(OUT, name + '.mp3')
    subprocess.run(['ffmpeg', '-v', 'quiet', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2' if st else '1', '-i', '-', '-c:a', 'libmp3lame', '-b:a', br or ('160k' if st else '112k'), path],
                   input=np.clip(x, -1, 1).astype(np.float32).tobytes(), check=True)
    b = bands(x); MANIFEST[name] = dict(dur=round(len(x) / SR, 3), kwin=round(kwin(x), 2), stereo=st, bands=b[:5], cen=b[5], crest=round(20 * np.log10(np.abs(x).max() / (np.sqrt(np.mean(x ** 2)) + 1e-9)), 1))
    return x
def save_manifest(path='/tmp/sfx_manifest.json'):
    old = json.load(open(path)) if os.path.exists(path) else {}
    old.update(MANIFEST); json.dump(old, open(path, 'w'), indent=0)
