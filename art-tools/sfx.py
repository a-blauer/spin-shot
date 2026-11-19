"""
Procedural sound effects for Dead Man's Hand (numpy/scipy synthesis) -> RawArt/Audio/*.wav (44.1 kHz mono 16-bit).
Punchy, slightly cartoony weapon sounds (layered transient + body + noise tail + room), gore, mobility and casino sounds.
"""
import math
import os
import wave

import numpy as np
from scipy import signal

SR = 44100
OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'RawArt', 'Audio'))
rng = np.random.default_rng(7)


def t_(dur):
    return np.arange(int(SR * dur)) / SR


def noise(dur):
    return rng.uniform(-1, 1, int(SR * dur))


def env_exp(dur, decay, attack=0.002):
    t = t_(dur)
    a = np.clip(t / max(attack, 1e-5), 0, 1)
    return a * np.exp(-t / decay)


def lp(x, hz, order=2):
    b, a = signal.butter(order, min(hz, SR / 2 - 100) / (SR / 2), 'low')
    return signal.lfilter(b, a, x)


def hp(x, hz, order=2):
    b, a = signal.butter(order, hz / (SR / 2), 'high')
    return signal.lfilter(b, a, x)


def bp(x, lo, hi, order=2):
    b, a = signal.butter(order, [lo / (SR / 2), min(hi, SR / 2 - 100) / (SR / 2)], 'band')
    return signal.lfilter(b, a, x)


def sweep(f0, f1, dur, shape='exp', wave_='sine'):
    t = t_(dur)
    if shape == 'exp':
        f = f0 * (f1 / f0) ** (t / dur)
    else:
        f = f0 + (f1 - f0) * t / dur
    ph = 2 * np.pi * np.cumsum(f) / SR
    if wave_ == 'sine':
        return np.sin(ph)
    if wave_ == 'square':
        return np.sign(np.sin(ph))
    if wave_ == 'saw':
        return 2 * ((ph / (2 * np.pi)) % 1.0) - 1
    if wave_ == 'tri':
        return 2 * np.abs(2 * ((ph / (2 * np.pi)) % 1.0) - 1) - 1


def tone(f, dur, wave_='sine'):
    return sweep(f, f, dur, wave_=wave_)


def pad(x, dur):
    n = int(SR * dur)
    if len(x) >= n:
        return x[:n]
    return np.concatenate([x, np.zeros(n - len(x))])


def mix(*parts):
    n = max(len(p) for p in parts)
    out = np.zeros(n)
    for p in parts:
        out[:len(p)] += p
    return out


def at(x, sec, total=None):
    z = np.zeros(int(SR * sec))
    y = np.concatenate([z, x])
    return y if total is None else pad(y, total)


def room(x, size=0.25, wet=0.25, damp=3000):
    ir = noise(size) * env_exp(size, size / 5, attack=0.001)
    ir = lp(ir, damp)
    ir[0] = 0
    y = signal.fftconvolve(x, ir)[:len(x) + int(SR * size)]
    y = y / (np.max(np.abs(y)) + 1e-9) * np.max(np.abs(x))
    return mix(x, y * wet)


def sat(x, drive=2.0):
    return np.tanh(x * drive) / np.tanh(drive)


def norm(x, peak=0.89):
    m = np.max(np.abs(x)) + 1e-9
    return x / m * peak


def fade(x, ms=8):
    n = min(len(x), int(SR * ms / 1000))
    x = x.copy()
    x[-n:] *= np.linspace(1, 0, n)
    return x


def write(name, x, peak=0.89):
    os.makedirs(OUT, exist_ok=True)
    x = fade(norm(x, peak))
    data = (x * 32767).astype(np.int16)
    with wave.open(os.path.join(OUT, name + '.wav'), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


# ------------------------------------------------------------------ building blocks
def gunshot(dur=0.5, body_hz=110, body_drop=0.35, crack_hz=5000, tail=0.18, noise_lp=3500, drive=2.5, weight=1.0, room_size=0.35):
    click = hp(noise(0.012), 2500) * env_exp(0.012, 0.0025, 0.0003)
    crack = bp(noise(dur), 1200, crack_hz) * env_exp(dur, 0.025, 0.0005)
    body = sweep(body_hz * 2.2, body_hz * body_drop, dur) * env_exp(dur, 0.06 * weight, 0.001)
    rumble = lp(noise(dur), 300) * env_exp(dur, 0.12 * weight, 0.003) * 1.4
    tailn = lp(noise(dur), noise_lp) * env_exp(dur, tail, 0.004) * 0.6
    x = mix(click * 0.8, crack * 1.0, body * 1.3 * weight, rumble * weight, tailn)
    x = sat(x, drive)
    return room(x, room_size, 0.35)


def mech_click(f=2400, dur=0.05, decay=0.006):
    n = bp(noise(dur), f * 0.6, f * 1.6) * env_exp(dur, decay, 0.0003)
    r = tone(f * 0.9, dur) * env_exp(dur, decay * 0.6) * 0.4
    return mix(n, r)


def thunk(f=180, dur=0.12):
    return mix(sweep(f * 1.6, f * 0.7, dur) * env_exp(dur, 0.025), lp(noise(dur), 1500) * env_exp(dur, 0.01) * 0.6)


def squelch(dur=0.25, f=500, seed=0):
    r = np.random.default_rng(seed)
    n = r.uniform(-1, 1, int(SR * dur))
    mod = 0.5 + 0.5 * np.sin(2 * np.pi * t_(dur) * r.uniform(18, 30))
    x = bp(n, f * 0.4, f * 2.2) * mod * env_exp(dur, dur / 3.5, 0.003)
    gl = sweep(f * 0.8, f * 0.3, dur) * env_exp(dur, dur / 5) * 0.5
    return sat(mix(x, gl), 2)


def whoosh(dur=0.35, lo=300, hi=2500, up=True):
    t = t_(dur)
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    n = noise(dur)
    out = np.zeros_like(n)
    steps = 24
    seg = len(n) // steps
    for i in range(steps):
        k = i / steps if up else 1 - i / steps
        f = lo + (hi - lo) * k
        s = bp(n[max(0, i * seg - 400):(i + 1) * seg], f * 0.6, f * 1.4)[-seg:]
        out[i * seg:i * seg + len(s)] = s
    return out * e


def growl(dur=0.9, f=90, seed=0, rough=0.7):
    r = np.random.default_rng(seed)
    t = t_(dur)
    vib = 1 + 0.06 * np.sin(2 * np.pi * r.uniform(4, 8) * t) + 0.04 * r.uniform(-1, 1, len(t))
    f_t = f * (1 + 0.25 * np.sin(np.pi * t / dur)) * vib
    ph = 2 * np.pi * np.cumsum(f_t) / SR
    saw = 2 * ((ph / (2 * np.pi)) % 1.0) - 1
    am = 1 + rough * r.uniform(-1, 1, len(t))
    am = lp(am, 60)
    x = saw * am
    # vowel formants
    form = mix(bp(x, 500, 900) * 1.0, bp(x, 1000, 1500) * 0.6, bp(x, 2300, 2900) * 0.25)
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 0.6
    return sat(form * e, 2.2)


def chime(freqs, dur=0.6, decay=0.25, wave_='sine'):
    x = np.zeros(int(SR * dur))
    for i, f in enumerate(freqs):
        s = tone(f, dur, wave_) * env_exp(dur, decay, 0.002) + tone(f * 2.01, dur) * env_exp(dur, decay * 0.5) * 0.3
        x += s
    return x


def arpeggio(notes, step=0.07, dur_each=0.35, wave_='square', decay=0.12):
    total = step * len(notes) + dur_each
    x = np.zeros(int(SR * total))
    for i, f in enumerate(notes):
        s = lp(tone(f, dur_each, wave_), 4000) * env_exp(dur_each, decay, 0.002) * 0.5 + tone(f, dur_each) * env_exp(dur_each, decay) * 0.5
        st = int(SR * step * i)
        x[st:st + len(s)] += s
    return x


def coin(f=1800):
    a = chime([f], 0.12, 0.05, 'square')
    b = chime([f * 1.335], 0.4, 0.12, 'square')
    return lp(mix(a * 0.6, at(b, 0.07) * 0.8), 6000)


def N(semi, base=440.0):
    return base * 2 ** (semi / 12)


# ------------------------------------------------------------------ sounds
def build():
    # weapons
    write('S_Pistol', gunshot(0.45, body_hz=150, crack_hz=6000, tail=0.12, weight=0.8))
    write('S_Revolver', gunshot(0.7, body_hz=95, crack_hz=4500, tail=0.25, weight=1.3, drive=3.5))
    write('S_SMG', gunshot(0.3, body_hz=170, crack_hz=7000, tail=0.07, weight=0.6, room_size=0.2))
    write('S_Rifle', gunshot(0.55, body_hz=120, crack_hz=6500, tail=0.16, weight=1.0, drive=3))
    write('S_Shotgun', mix(gunshot(0.8, body_hz=70, crack_hz=4000, tail=0.3, noise_lp=2500, weight=1.8, drive=4),
                          bp(noise(0.25), 800, 3000) * env_exp(0.25, 0.05) * 0.5))
    write('S_LMG', gunshot(0.42, body_hz=100, crack_hz=5500, tail=0.12, weight=1.2, drive=3.2, room_size=0.25))
    write('S_Sniper', mix(gunshot(1.4, body_hz=80, crack_hz=9000, tail=0.6, weight=1.6, drive=4, room_size=0.9),
                         at(lp(noise(1.0), 600) * env_exp(1.0, 0.4) * 0.4, 0.15)))
    write('S_Launcher', mix(thunk(90, 0.4) * 1.5, whoosh(0.5, 400, 2000) * 0.6, lp(noise(0.3), 800) * env_exp(0.3, 0.06)))
    z = sweep(2400, 300, 0.25, wave_='square') * env_exp(0.25, 0.07)
    write('S_Energy', mix(lp(z, 5000), sweep(900, 120, 0.3) * env_exp(0.3, 0.1), bp(noise(0.2), 3000, 9000) * env_exp(0.2, 0.03) * 0.4))
    write('S_Plasma', mix(lp(sweep(1400, 200, 0.35, wave_='saw'), 3000) * env_exp(0.35, 0.09), sweep(400, 60, 0.35) * env_exp(0.35, 0.12)))
    fl = lp(noise(0.6), 1800) * (0.7 + 0.3 * np.sin(2 * np.pi * 13 * t_(0.6)))
    write('S_Flame', fl * np.minimum(1, t_(0.6) / 0.05) * np.exp(-np.maximum(0, t_(0.6) - 0.4) / 0.08))
    zap = bp(noise(0.35), 2000, 8000) * (np.abs(np.sin(2 * np.pi * 60 * t_(0.35))) > 0.6) * env_exp(0.35, 0.12)
    write('S_Chain', mix(zap, sweep(3000, 800, 0.35, wave_='square') * env_exp(0.35, 0.05) * 0.2))
    saw = tone(110, 0.5, 'saw') * (0.6 + 0.4 * np.sin(2 * np.pi * 30 * t_(0.5)))
    write('S_Saw', mix(lp(saw, 2500), bp(noise(0.5), 1500, 5000) * 0.3) * env_exp(0.5, 0.4))
    write('S_Beam', lp(tone(220, 0.5, 'saw') * (1 + 0.5 * np.sin(2 * np.pi * 40 * t_(0.5))), 2500) * env_exp(0.5, 0.5, 0.02))

    # weapon handling
    write('S_Dry', mech_click(3000, 0.06, 0.004))
    write('S_MagOut', mix(mech_click(1800, 0.12, 0.012), at(thunk(300, 0.1) * 0.5, 0.03)))
    write('S_MagIn', mix(thunk(260, 0.12), at(mech_click(2600, 0.08, 0.006) * 1.2, 0.035)))
    write('S_Rack', mix(mech_click(1500, 0.1, 0.012), at(mech_click(2200, 0.12, 0.01) * 1.3, 0.11), at(thunk(200, 0.1) * 0.6, 0.12)))
    write('S_ShellIn', mix(mech_click(2000, 0.08, 0.007), thunk(400, 0.08) * 0.5))
    write('S_Switch', mix(whoosh(0.2, 600, 2400) * 0.5, at(mech_click(2000, 0.1, 0.01), 0.12)))
    write('S_ShellDrop', mix(*[at(chime([4200 + i * 300], 0.12, 0.03) * (0.6 - i * 0.15), i * 0.07) for i in range(3)]))

    # impacts / gore
    write('S_HitFlesh', mix(squelch(0.18, 700, 1), thunk(140, 0.08) * 0.7))
    write('S_HitFlesh2', mix(squelch(0.2, 550, 2), thunk(120, 0.08) * 0.7))
    write('S_Headshot', mix(squelch(0.22, 900, 3), mech_click(1200, 0.08, 0.01) * 0.9, at(chime([N(19)], 0.3, 0.08), 0.0) * 0.5))
    write('S_Crit', mix(chime([N(24), N(31)], 0.35, 0.09, 'tri') * 0.8, thunk(200, 0.06) * 0.4))
    write('S_HitMarker', hp(mech_click(4000, 0.04, 0.003), 1500))
    write('S_Kill', mix(squelch(0.35, 400, 4) * 1.2, thunk(90, 0.2), at(squelch(0.2, 300, 5) * 0.6, 0.06)))
    write('S_Gib', mix(squelch(0.5, 350, 6) * 1.2, at(squelch(0.3, 600, 7), 0.05), lp(noise(0.3), 500) * env_exp(0.3, 0.07)))
    write('S_HitWall', mix(bp(noise(0.12), 1500, 6000) * env_exp(0.12, 0.012), thunk(500, 0.06) * 0.3))
    write('S_Ricochet', mix(sweep(3800, 1600, 0.3) * env_exp(0.3, 0.12) * 0.5, bp(noise(0.05), 2000, 6000) * env_exp(0.05, 0.01)))
    write('S_Explosion', room(sat(mix(sweep(120, 30, 1.6) * env_exp(1.6, 0.25) * 1.8, lp(noise(1.6), 900) * env_exp(1.6, 0.35, 0.004) * 1.2,
                                     bp(noise(0.3), 1000, 5000) * env_exp(0.3, 0.04)), 3), 0.6, 0.4, 1200))
    write('S_Splat', mix(squelch(0.25, 300, 9), lp(noise(0.15), 1200) * env_exp(0.15, 0.03)))

    # enemies
    for i in range(4):
        write('S_Groan%d' % i, growl(0.8 + i * 0.15, 80 + i * 14, seed=10 + i))
    write('S_Snarl', growl(0.45, 160, seed=20, rough=1.0))
    write('S_Screech', mix(growl(0.9, 520, seed=21, rough=0.4), bp(noise(0.9), 3000, 7000) * np.sin(np.pi * t_(0.9) / 0.9) * 0.4))
    write('S_EnemyDie', mix(growl(0.6, 110, seed=22) * np.exp(-t_(0.6) / 0.25), at(squelch(0.25, 300, 23), 0.1)))
    write('S_Spit', mix(squelch(0.25, 900, 24), whoosh(0.3, 800, 2400) * 0.5))
    write('S_Attack', mix(whoosh(0.25, 500, 2200) * 0.8, growl(0.3, 200, seed=25) * 0.6))
    write('S_BossRoar', room(mix(growl(1.8, 55, seed=30, rough=1.1), growl(1.8, 82, seed=31) * 0.6), 0.5, 0.35, 1500))
    write('S_Stomp', mix(sweep(80, 30, 0.6) * env_exp(0.6, 0.12) * 1.5, lp(noise(0.6), 400) * env_exp(0.6, 0.15)))
    write('S_Wings', mix(*[at(lp(noise(0.12), 800) * env_exp(0.12, 0.03), i * 0.13) for i in range(4)]))

    # player
    write('S_Jump', mix(whoosh(0.18, 400, 1600) * 0.6, thunk(160, 0.06) * 0.6))
    write('S_AirJump', mix(whoosh(0.28, 600, 3000), chime([N(7)], 0.25, 0.06, 'tri') * 0.25))
    write('S_Land', mix(thunk(110, 0.18) * 1.2, lp(noise(0.12), 1200) * env_exp(0.12, 0.025)))
    for i in range(4):
        r = np.random.default_rng(40 + i)
        n = r.uniform(-1, 1, int(SR * 0.1))
        write('S_Step%d' % i, mix(bp(n, 300 + i * 60, 2500) * env_exp(0.1, 0.012), thunk(120 + i * 10, 0.06) * 0.6))
    write('S_Slide', bp(noise(0.7), 500, 3000) * np.minimum(1, t_(0.7) / 0.03) * np.exp(-t_(0.7) / 0.4))
    write('S_Dash', mix(whoosh(0.3, 400, 4000, up=True) * 1.2, thunk(200, 0.05) * 0.3))
    write('S_Grapple', mix(mech_click(1600, 0.08, 0.008), whoosh(0.35, 1200, 4000) * 0.7, at(thunk(300, 0.1), 0.3)))
    write('S_Slam', room(sat(mix(sweep(140, 30, 0.8) * env_exp(0.8, 0.15) * 1.6, lp(noise(0.8), 700) * env_exp(0.8, 0.2)), 2.5), 0.4, 0.3))
    write('S_Hurt', mix(thunk(150, 0.15), squelch(0.15, 400, 50) * 0.6, lp(noise(0.2), 1200) * env_exp(0.2, 0.05) * 0.5))
    hb = mix(thunk(55, 0.18) * 1.2, at(thunk(48, 0.18), 0.2))
    write('S_Heartbeat', pad(hb, 0.9))
    write('S_JumpPad', mix(sweep(200, 1200, 0.35, wave_='square') * env_exp(0.35, 0.15) * 0.4, whoosh(0.4, 500, 3000)))
    write('S_Wallrun', bp(noise(0.5), 1500, 4000) * 0.5 * np.sin(np.pi * t_(0.5) / 0.5))

    # casino / ui
    write('S_Coin', coin())
    write('S_Cash', mix(mech_click(1800, 0.12, 0.02), at(chime([N(24), N(28), N(31)], 0.8, 0.25), 0.05)))
    write('S_Buy', mix(coin(1500), at(thunk(250, 0.1) * 0.5, 0.0)))
    write('S_Deny', mix(tone(140, 0.3, 'square') * env_exp(0.3, 0.12), tone(147, 0.3, 'square') * env_exp(0.3, 0.12)) * 0.5)
    write('S_SlotTick', mech_click(3200, 0.05, 0.004))
    write('S_SlotStop', mix(thunk(220, 0.15), mech_click(2000, 0.08, 0.01)))
    write('S_SlotPull', mix(mech_click(800, 0.3, 0.06), at(thunk(150, 0.2), 0.25)))
    write('S_Win', arpeggio([N(0), N(4), N(7), N(12)], 0.07, 0.3))
    write('S_Jackpot', mix(arpeggio([N(0), N(4), N(7), N(12), N(16), N(19), N(24)], 0.06, 0.5),
                          at(mix(*[at(coin(1600 + i * 120) * 0.5, i * 0.05) for i in range(12)]), 0.3)))
    write('S_Lose', arpeggio([N(7, 220), N(6, 220), N(5, 220), N(0, 220)], 0.18, 0.4, 'saw', 0.2))
    write('S_Luck', mix(chime([N(12), N(19), N(24)], 1.0, 0.35, 'tri'), at(chime([N(28)], 0.6, 0.2), 0.12) * 0.6))
    write('S_PowerUp', mix(arpeggio([N(0), N(7), N(12), N(19)], 0.05, 0.4, 'tri'), whoosh(0.5, 600, 4000) * 0.3))
    write('S_Door', mix(lp(noise(0.9), 600) * env_exp(0.9, 0.3), sweep(90, 60, 0.9, wave_='saw') * env_exp(0.9, 0.35) * 0.4, at(thunk(80, 0.3), 0.7)))
    write('S_UIMove', mech_click(2600, 0.04, 0.003) * 0.6)
    write('S_UISelect', chime([N(12), N(19)], 0.25, 0.06, 'tri'))
    bell = sum(tone(f, 3.0) * env_exp(3.0, d, 0.002) * a for f, d, a in ((220, 1.6, 1.0), (440 * 1.19, 1.0, 0.5), (660 * 1.5, 0.6, 0.35), (880 * 2.0, 0.4, 0.25)))
    write('S_RoundStart', mix(bell, at(bell * 0.7, 0.9)))
    write('S_RoundEnd', mix(arpeggio([N(-5, 220), N(0, 220), N(4, 220), N(7, 220)], 0.25, 1.2, 'tri', 0.5)))
    write('S_CasinoOpen', mix(arpeggio([N(0), N(4), N(7), N(11), N(12), N(16)], 0.09, 0.8, 'square', 0.3), at(bell * 0.4, 0.5)))
    write('S_Upgrade', mix(arpeggio([N(0), N(5), N(9), N(12)], 0.06, 0.5, 'tri', 0.25), at(chime([N(24)], 0.8, 0.3), 0.2) * 0.6))
    write('S_LevelUp', mix(arpeggio([N(0), N(4), N(7), N(12), N(7), N(12), N(16)], 0.08, 0.5, 'square', 0.2)))

    # ambience loops (seamless-ish)
    d = 8.0
    wind = lp(noise(d), 500) * (0.6 + 0.4 * np.sin(2 * np.pi * t_(d) / d * 2)) + bp(noise(d), 900, 1600) * 0.15 * (0.5 + 0.5 * np.sin(2 * np.pi * t_(d) / d * 3 + 1))
    xf = int(SR * 0.5)
    wind[:xf] = wind[:xf] * np.linspace(0, 1, xf) + wind[-xf:] * np.linspace(1, 0, xf)
    write('S_AmbWind', wind[:-xf], peak=0.5)
    hum = lp(tone(60, d, 'saw'), 400) * 0.3 + lp(noise(d), 300) * 0.2
    chatter = bp(noise(d), 400, 1800) * 0.2 * (0.5 + 0.5 * np.sin(2 * np.pi * t_(d) * 0.7))
    jingles = np.zeros(int(SR * d))
    for i in range(10):
        st = rng.uniform(0, d - 1)
        c = coin(1400 + rng.uniform(0, 800)) * 0.35
        k = int(SR * st)
        jingles[k:k + len(c)] += c[:len(jingles) - k]
    casino = hum + chatter + jingles
    casino[:xf] = casino[:xf] * np.linspace(0, 1, xf) + casino[-xf:] * np.linspace(1, 0, xf)
    write('S_AmbCasino', casino[:-xf], peak=0.5)
    print('wrote', len(os.listdir(OUT)), 'sounds')


if __name__ == '__main__':
    build()
