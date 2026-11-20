#!/usr/bin/env python3
"""Synthesised reload foley. The old S_ShellDrop was a single 4.5 kHz tone (it read as a chime).
   S_ShellDrop: revolver - the ejector rod shoves six empties out, then they land on packed dirt and boards.
   S_HullDrop : break action - two hollow hulls pop out of the chambers and thud on the ground.
   Everything is noise and very short, inharmonic, heavily damped partials: clatter, not a bell."""
import subprocess, sys, numpy as np
from scipy.signal import butter, sosfilt
SR = 44100
rng = np.random.default_rng(7)
def bp(x, lo, hi, order=2): return sosfilt(butter(order, [lo, hi], btype='band', fs=SR, output='sos'), x)
def lp(x, f, order=2): return sosfilt(butter(order, f, btype='low', fs=SR, output='sos'), x)
def burst(dur, tau): n = int(dur * SR); t = np.arange(n) / SR; return rng.standard_normal(n) * np.exp(-t / tau)
def tone(f, dur, tau, ph=0.0): n = int(dur * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * f * t + ph) * np.exp(-t / tau)
def put(buf, x, at, g=1.0):
    i = int(at * SR); j = min(len(buf), i + len(x)); buf[i:j] += x[:j - i] * g
def casing(amp=1.0, dull=1.0):
    """One brass case hitting the ground: a click, a few ms of damped inharmonic body, a low knock from the ground."""
    x = np.zeros(int(0.07 * SR))
    put(x, bp(burst(0.02, 0.0016), 1100, 6500 * dull), 0, 1.0)                 # the contact itself
    f0 = rng.uniform(1900, 3100) * dull
    for r, g, tau in ((1.0, 0.22, 0.007), (1.53, 0.16, 0.005), (2.37, 0.09, 0.004)):   # body: gone in under 20 ms
        put(x, tone(f0 * r * rng.uniform(0.97, 1.03), 0.03, tau, rng.uniform(0, 6.28)), 0.0004, g)
    put(x, tone(rng.uniform(170, 300), 0.05, 0.011), 0, 0.16)                  # what it landed on
    put(x, lp(burst(0.03, 0.006), 900), 0, 0.22)                                # dirt
    return x * amp
def shell_drop():
    out = np.zeros(int(0.86 * SR))
    # ejector: a short steel-on-brass scrape that ends in a stop
    n = int(0.055 * SR); t = np.arange(n) / SR
    scrape = bp(rng.standard_normal(n), 700, 3200) * np.sin(np.pi * t / t[-1]) ** 0.7
    put(out, scrape, 0.0, 0.5)
    put(out, bp(burst(0.02, 0.002), 500, 5000), 0.052, 0.9); put(out, tone(640, 0.04, 0.009), 0.052, 0.3); put(out, tone(210, 0.05, 0.014), 0.052, 0.18)
    # six empties fall for about a third of a second, land a few ms apart, and each skips once or twice
    for k in range(6):
        t0 = 0.33 + rng.uniform(0, 0.17); a = rng.uniform(0.55, 1.0)
        put(out, casing(a), t0)
        gap = rng.uniform(0.05, 0.085); put(out, casing(a * 0.42, 0.9), t0 + gap)
        if rng.random() < 0.6: put(out, casing(a * 0.18, 0.85), t0 + gap + rng.uniform(0.028, 0.045))
    return out
def hull_drop():
    out = np.zeros(int(0.8 * SR))
    for k, t0 in enumerate((0.0, 0.035)):                                       # two hulls leave the chambers: a hollow pop
        put(out, bp(burst(0.05, 0.007), 350, 1500), t0, 0.9); put(out, tone(rng.uniform(520, 640), 0.05, 0.012), t0, 0.22); put(out, bp(burst(0.012, 0.0015), 1500, 5000), t0, 0.35)
    for k in range(2):                                                          # and land: plastic and a brass base on dirt
        t0 = 0.36 + k * rng.uniform(0.05, 0.09) + rng.uniform(0, 0.02); a = rng.uniform(0.7, 1.0)
        for b, (dt, g) in enumerate(((0, 1.0), (rng.uniform(0.07, 0.1), 0.4))):
            put(out, bp(burst(0.04, 0.005), 300, 2600), t0 + dt, a * g); put(out, tone(rng.uniform(150, 230), 0.06, 0.016), t0 + dt, a * g * 0.3)
            put(out, tone(rng.uniform(900, 1300), 0.03, 0.006), t0 + dt, a * g * 0.2)
    return out
def finish(x, target=-15.0):
    x = sosfilt(butter(2, 90, btype='high', fs=SR, output='sos'), x)
    n = int(0.1 * SR); c = np.cumsum(np.concatenate([[0], x * x])); w = (c[n:] - c[:-n]).max() / n
    x = x * 10 ** ((target - 10 * np.log10(w + 1e-12)) / 20)
    x = np.tanh(x * 1.2) / 1.2                                                  # round off the tallest clicks
    f = int(0.03 * SR); x[-f:] *= np.linspace(1, 0, f)
    return x.astype(np.float32)
def enc(x, path):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-b:a', '128k', path], input=x.tobytes(), check=True)
if __name__ == '__main__':
    d = sys.argv[1] if len(sys.argv) > 1 else 'public/audio'
    enc(finish(shell_drop()), f'{d}/S_ShellDrop.mp3'); enc(finish(hull_drop()), f'{d}/S_HullDrop.mp3')
