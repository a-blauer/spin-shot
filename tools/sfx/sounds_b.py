"""Creatures and bosses, explosions, the elements, melee, and the things in the world you use."""
from parts import *

def groan(d, f, path, tract=1.28, rough=0.45, sub=0.45, breath=0.3, env=None, gurgle=0.0, hz=36):
    v = voice(d, f, path, tract, breath=breath, jitter=0.08, rough=rough, rough_hz=hz, sub=sub, tilt=950)
    if gurgle: g = lp(np.abs(rng.standard_normal(n_(d))), 22, 1); g /= g.max(); v = v * (1 - gurgle + gurgle * g) + 0.25 * gurgle * squelch(d, 420, 3.0)
    return nrm(v * (env if env is not None else line([(0, 0), (0.08, 1), (d * 0.6, 0.8), (d, 0)], d)))

def build():
    # ---------------------------------------------------------------- the dead
    G = [  # (dur, f0 curve, mouth, extra)
        (0.82, [(0, 96), (0.2, 104), (0.82, 70)], [(0, 'uh'), (1, 'o')], dict(rough=0.4)),
        (0.98, [(0, 78), (0.45, 112), (0.98, 74)], [(0, 'o'), (0.5, 'a'), (1, 'uh')], dict(rough=0.5, sub=0.6)),
        (1.12, [(0, 88), (0.5, 80), (1.12, 62)], [(0, 'u'), (0.6, 'o'), (1, 'uh')], dict(rough=0.55, gurgle=0.6, breath=0.2)),
        (1.28, [(0, 120), (0.3, 104), (1.28, 82)], [(0, 'ae'), (0.5, 'uh'), (1, 'er')], dict(rough=0.35, breath=0.6, sub=0.3)),
    ]
    for i, (d, fc, pth, kw) in enumerate(G):
        for v in range(2):
            seed(200 + i * 10 + v); k = 1.0 if not v else rng.uniform(0.88, 1.14)
            out('S_Groan%d' % i + ('' if not v else '_1'), groan(d, line([(t, f * k) for t, f in fc], d, True), pth, 1.28 * (1 if not v else rng.uniform(0.94, 1.08)), **kw))
    for v, sd in enumerate([240, 241]):
        seed(sd); d = 0.46; f = line([(0, 172), (0.1, 190), (d, 118)], d, True) * (1 if not v else 0.9)
        s = voice(d, f, [(0, 'ae'), (0.5, 'a'), (1, 'uh')], 1.15, breath=0.3, jitter=0.06, rough=0.85, rough_hz=56, growl=0.5, sub=0.5, tilt=1500)
        rasp = bp(noise(d), 1500, 4200) * (0.5 + 0.5 * osc(52, d, 'square')) * swell(d, 0.25, 1.2)
        out('S_Snarl' + ('' if not v else '_1'), sat(lay((s * line([(0, 0), (0.03, 1), (0.3, 0.8), (d, 0)], d), 0, 1), (nrm(rasp), 0, 0.3)), 1.6))
    for v, sd in enumerate([242, 243]):
        seed(sd); d = 0.9; k = 1 if not v else 1.12; f = line([(0, 520 * k), (0.12, 860 * k), (0.5, 800 * k), (d, 560 * k)], d, True) * (1 + 0.025 * np.sin(2 * np.pi * 23 * t_(d)))
        s = voice(d, f, [(0, 'i'), (0.3, 'ae'), (1, 'e')], 0.95, breath=0.35, jitter=0.05, rough=0.6, rough_hz=92, sub=0.75, tilt=2600, q=5)
        air = tv(noise(d), 'bp', f * 3.1, 4) * swell(d, 0.2, 1.3)
        out('S_Screech' + ('' if not v else '_1'), lp(sat(lay((s * line([(0, 0), (0.04, 1), (0.6, 0.85), (d, 0)], d), 0, 1), (nrm(air), 0, 0.28)), 1.8), 7500))
    for v, sd in enumerate([244, 245]):
        seed(sd); d = 0.24; f = line([(0, 196), (0.05, 215), (d, 128)], d, True) * (1 if not v else 0.92)
        s = voice(d, f, [(0, 'a'), (1, 'uh')], 1.15, breath=0.3, rough=0.8, rough_hz=60, growl=0.4, sub=0.4, tilt=1500) * perc(d, 0.08, 0.008)
        out('S_Attack' + ('' if not v else '_1'), lay((s, 0, 1), (whoosh(0.2, 500, 2800, 900, 1.6, 0.4), 0.03, 0.55), (nrm(hp(noise(0.03), 3000) * perc(0.03, 0.006)), 0.11, 0.15)))
    seed(246); out('S_Spit', lay((nrm(bp(noise(0.1), 700, 2600) * swell(0.1, 0.7, 2) * (0.6 + 0.4 * osc(70, 0.1, 'square'))), 0, 0.7), (nrm(thud(260, 0.06, 0.5, 0.014, 0.6)), 0.1, 0.9), (squelch(0.14, 1100, 1.5), 0.1, 0.6),
                                 (whoosh(0.2, 1200, 3600, 2400, 2.2, 0.2), 0.11, 0.4)))
    seed(247); flap = lambda g: lay((nrm(rumble(0.11, 800) * swell(0.11, 0.45, 1.5)), 0, 1), (nrm(bp(noise(0.05), 900, 3200) * perc(0.05, 0.012, 0.004)), 0.07, 0.4)) * g
    out('S_Wings', lay((flap(1.0), 0), (flap(0.85), 0.15), (flap(0.7), 0.3)))
    # ---------------------------------------------------------------- bosses
    seed(250); d = 2.0
    a = voice(d, line([(0, 80), (0.3, 112), (1.2, 98), (d, 62)], d, True), [(0, 'o'), (0.35, 'a'), (1, 'uh')], 1.62, breath=0.25, jitter=0.07, rough=0.75, rough_hz=30, sub=0.4, growl=0.45, tilt=900)
    b = voice(d, line([(0, 150), (0.3, 205), (1.2, 180), (d, 105)], d, True), [(0, 'a'), (0.4, 'ae'), (1, 'uh')], 1.32, breath=0.3, jitter=0.06, rough=0.85, rough_hz=48, sub=0.6, tilt=1700)
    nz = tv(noise(d, 'pink'), 'bp', line([(0, 300), (0.35, 950), (d, 240)], d, True), 1.2)
    e = line([(0, 0), (0.09, 1), (1.1, 0.85), (d, 0)], d)
    roar = sat(lay((a * e, 0, 1.0), (b * e, 0, 0.32), (nrm(nz) * e, 0, 0.4), (osc(line([(0, 64), (d, 46)], d, True)) * e, 0, 0.25)), 2.4)
    out('S_BossRoar', verb(hp(roar, 55, 2), 1.1, 0.3, 0.012, 3800, 900), r=0.2)
    seed(251); out('S_Stomp', lay((nrm(boom(0.42, 100, 52, 0.09)), 0, 1), (nrm(lp(noise(0.05), 1500) * perc(0.05, 0.012, 0.0006)), 0, 0.55), (debris(0.42, 900, 60, 900, 0.0014), 0.01, 0.3), (nrm(rumble(0.5, 120) * perc(0.5, 0.16, 0.01)), 0, 0.5)))
    seed(252); crunch = sat(bp(noise(0.3, 'pink'), 180, 1300) * perc(0.3, 0.09, 0.001), 3)
    out('S_Slam', verb(lay((nrm(hp(noise(0.02), 1200) * perc(0.02, 0.005, 0.0003)), 0, 0.7), (nrm(boom(0.9, 108, 50, 0.2)), 0, 1), (nrm(crunch), 0, 0.6), (debris(1.0, 2200, 70, 700, 0.0016), 0.02, 0.35),
                            (nrm(rumble(1.0, 110) * perc(1.0, 0.3, 0.01)), 0, 0.5)), 0.7, 0.18, 0.01, 3000, 800), r=0.15)
    # ---------------------------------------------------------------- explosions
    for v, sd in enumerate([260, 261, 262]):
        seed(sd); k = [1.0, 0.9, 1.1][v]; d = 1.25
        body = sat(tv(noise(0.55, 'pink'), 'lp', line([(0, 4200 * k), (0.12, 1500 * k), (0.55, 260)], 0.55, True), 0.8) * perc(0.55, 0.13, 0.001), 3.2)
        out('S_Explosion' + ('' if not v else '_%d' % v), verb(lay((nrm(hp(noise(0.022), 1400) * perc(0.022, 0.004, 0.0002)), 0, 0.85), (nrm(body), 0, 0.85), (nrm(boom(1.0, 120 * k, 50, 0.21)), 0.002, 1.0),
                (debris(0.95, 3200, 60, 1100, 0.0012), 0.05, 0.3), (nrm(rumble(d, 150) * perc(d, 0.34, 0.02)), 0.01, 0.5), (nrm(bp(noise(0.5), 300, 1100) * perc(0.5, 0.2, 0.05)), 0.06, 0.2)), 0.85, 0.2, 0.014, 3200, 700), r=0.2)
    # ---------------------------------------------------------------- the elements
    seed(270); ch = lay(*[(click(rng.uniform(1700, 3300), 0.05, rng.uniform(0.008, 0.018), 7, 0.8, 0.6), t, g) for t, g in zip(np.cumsum(rng.uniform(0.018, 0.06, 9)), np.linspace(1, 0.3, 9))])
    out('S_Chain', lp(lay((ch, 0, 1), (scrape(0.36, 1800, 6000, 300) * perc(0.36, 0.12, 0.004), 0, 0.2), (nrm(thud(170, 0.06, 0.6, 0.014)), 0.01, 0.3)), 6500))
    for v, sd in enumerate([271, 272, 273]):
        seed(sd); d = 0.3; hz = rng.uniform(96, 128)
        buzz = hp(noise(d), 1400) * (0.25 + 0.75 * (osc(hz, d, 'pulse', pw=0.3) > 0)) * perc(d, 0.1, 0.001)
        crk = hp(dust(d, line([(0, 4500), (d, 250)], d, True), 0.0004), 3000) * perc(d, 0.12, 0.001)
        zap = fm(line([(0, rng.uniform(1500, 2100)), (0.09, 320)], 0.09, True), 2.5, 6) * perc(0.09, 0.03, 0.0005)
        out('S_Zap' + ('' if not v else '_%d' % v), lp(lay((nrm(buzz), 0, 0.7), (nrm(crk), 0, 0.5), (zap, 0, 0.55), (click(4200, 0.02, 0.003, 5), 0, 0.5), (nrm(thud(140, 0.06, 0.5, 0.014)), 0, 0.35)), 8500))
    seed(274); d = 0.6; hum = (osc(110, d, 'saw') + osc(111.6, d, 'saw', 0.4) + 0.6 * osc(220.7, d, 'saw', 0.2)) / 2.6
    bm = tv(hum, 'bp', line([(0, 380), (0.12, 1700), (d, 1300)], d, True), 2.2) + 0.25 * hum
    out('S_Beam', lay((nrm(bm) * line([(0, 0), (0.07, 1), (0.42, 0.9), (d, 0)], d), 0, 1), (nrm(hp(noise(d), 3500) * line([(0, 0), (0.08, 1), (d, 0)], d)), 0, 0.2),
                      (fm(line([(0, 300), (0.1, 1400)], 0.1, True), 3.01, 4) * perc(0.1, 0.05, 0.004), 0, 0.3), (nrm(boom(0.3, 90, 50, 0.08)), 0.05, 0.4)))
    seed(275); d = 0.34; f = line([(0, 300), (d, 1500)], d, True); trem = 0.6 + 0.4 * osc(line([(0, 14), (d, 46)], d), shape='tri')
    out('S_Energy', lay(((0.6 * osc(f) + 0.4 * fm(f, 2.0, 2.5)) * trem * line([(0, 0), (d * 0.8, 1), (d, 0.6)], d), 0, 1), (nrm(tv(noise(d), 'bp', f * 2.4, 3) * line([(0, 0), (d, 1)], d)), 0, 0.35)), r=0.04)
    seed(276); d = 0.62
    fl = tv(noise(d, 'pink'), 'lp', line([(0, 320), (0.14, 2600), (d, 500)], d, True), 0.9) * swell(d, 0.22, 1.4)
    out('S_Flame', lay((nrm(fl), 0, 1), (nrm(hp(dust(d, line([(0, 300), (0.2, 1400), (d, 150)], d), 0.0006), 1800) * swell(d, 0.3, 1)), 0, 0.3), (nrm(boom(0.3, 75, 42, 0.09, 0.02)), 0.02, 0.6),
                       (nrm(rumble(d, 200) * (0.6 + 0.4 * osc(17, d)) * swell(d, 0.3, 1)), 0, 0.5)))
    seed(277); d = 0.5; f = line([(0, 85), (0.16, 235), (d, 205)], d, True)
    grind = bp(noise(d), 1800, 5200) * (0.3 + 0.7 * (osc(f * 6, shape='pulse', pw=0.25) > 0))
    out('S_Saw', lay((sat(comb(osc(f, shape='saw'), 310, 0.5), 1.8) * line([(0, 0), (0.05, 1), (0.4, 0.9), (d, 0)], d), 0, 1), (nrm(grind) * line([(0, 0), (0.15, 1), (d, 0)], d), 0, 0.4)))
    seed(278); out('S_Launcher', lay((nrm(boom(0.26, 155, 52, 0.065)), 0, 1), (nrm(hp(noise(0.03), 900) * perc(0.03, 0.007, 0.0004)), 0, 0.5), (modal(wood(185, 4, 0.05), 0.2, lp(noise(0.004), 1500)), 0, 0.6), (whoosh(0.4, 400, 1400, 500, 1.2, 0.25), 0.03, 0.4)))
    seed(279); d = 0.35; out('S_Plasma', lay((fm(line([(0, 920), (d, 240)], d, True), 1.41, line([(0, 5), (d, 1)], d)) * perc(d, 0.1, 0.002), 0, 1), (nrm(hp(noise(0.1), 2500) * perc(0.1, 0.03, 0.001)), 0, 0.3), (nrm(thud(120, 0.1, 0.5, 0.03)), 0, 0.5)))
    for v, sd in enumerate([280, 281]):
        seed(sd); d = 0.46
        sh = lay(*[(click(rng.uniform(3400, 6200), 0.07, rng.uniform(0.006, 0.02), 6, 0.8, 0.4), t, rng.uniform(0.3, 1)) for t in np.sort(rng.uniform(0, 0.2, 14))])
        out('S_Frost' + ('' if not v else '_1'), lp(lay((click(2600, 0.05, 0.008, 8, 0.85, 0.5), 0, 1), (sh, 0.004, 0.7), (nrm(thud(200, 0.07, 0.55, 0.018, 0.9)), 0, 0.6),
                (whoosh(d, 3500, 8000, 5000, 1.5, 0.15, 'white'), 0, 0.3), (nrm(hp(dust(d, line([(0, 1200), (d, 100)], d, True), 0.0003), 4500)), 0.02, 0.3)), 9500))
    seed(282); out('S_Blink', lay((whoosh(0.22, 300, 3200, 3600, 2.0, 0.92, 'pink', 2.5), 0, 0.8), (nrm(thud(150, 0.1, 0.45, 0.022, 0.5)), 0.2, 1), (fm(line([(0, 1600), (0.12, 260)], 0.12, True), 1.5, 3) * perc(0.12, 0.04, 0.001), 0.2, 0.5),
                                  (nrm(hp(noise(0.08), 4000) * perc(0.08, 0.02, 0.001)), 0.2, 0.25)))
    seed(283); d = 0.6; f = line([(0, 118), (0.25, 236), (d, 236)], d, True)
    hum = (fm(f, 2.0, 1.5) + fm(f * 1.006, 2.0, 1.5, ph=1.0)) * line([(0, 0), (0.12, 1), (d, 0)], d)
    out('S_Shield', lay((nrm(hum), 0, 1), (modal([(1890, 0.3, 1), (2836, 0.22, 0.6), (3780, 0.16, 0.4), (5300, 0.1, 0.2)], 0.5), 0.22, 0.3), (nrm(thud(120, 0.1, 0.5, 0.03)), 0.22, 0.7), (whoosh(0.25, 800, 3000, 2600, 1.6, 0.9), 0, 0.3)))
    seed(284); gl = lay(*[(click(rng.uniform(2400, 5600), 0.12, rng.uniform(0.01, 0.04), 7, 0.85, 0.35), t, rng.uniform(0.3, 1)) for t in np.sort(rng.uniform(0, 0.3, 22))])
    out('S_ShieldBreak', lp(lay((gl, 0, 1), (fm(line([(0, 900), (0.4, 90)], 0.4, True), 1.5, line([(0, 4), (0.4, 0.5)], 0.4)) * perc(0.4, 0.13, 0.002), 0, 0.6), (nrm(boom(0.4, 100, 40, 0.1)), 0, 0.8),
                            (nrm(hp(noise(0.03), 2000) * perc(0.03, 0.006, 0.0003)), 0, 0.6), (debris(0.5, 2000, 100, 3000, 0.0004), 0.05, 0.3)), 10000))
    seed(285); d = 1.6; w = tv(noise(d, 'pink'), 'bp', line([(0, 260), (0.7, 950), (d, 380)], d, True), 0.9) * swell(d, 0.45, 1.6)
    bub = lay(*[(osc(line([(0, f0), (0.03, f0 * 2.2)], 0.03, True)) * perc(0.03, 0.01, 0.002), t, rng.uniform(0.2, 0.6)) for t, f0 in zip(rng.uniform(0.2, 1.3, 26), rng.uniform(250, 900, 26))])
    out('S_Tide', lay((nrm(w), 0, 1), (bub, 0, 0.3), (nrm(hp(dust(d, line([(0, 200), (0.7, 2500), (d, 300)], d), 0.0005), 2500) * swell(d, 0.5, 1.5)), 0, 0.3), (nrm(rumble(d, 140) * swell(d, 0.45, 1.5)), 0, 0.5)))
    # ---------------------------------------------------------------- melee
    for v, sd in enumerate([290, 291, 292]):
        seed(sd); k = [1.0, 1.14, 0.9][v]
        out('S_Swing' + ('' if not v else '_%d' % v), lay((whoosh(0.2, 520 * k, 3300 * k, 950 * k, 2.3, 0.45), 0, 1), (whoosh(0.22, 220, 900, 320, 1.2, 0.45), 0, 0.5), (nrm(hp(noise(0.2), 6000) * swell(0.2, 0.45, 2.5)), 0, 0.12)))
    seed(293); out('S_SwingBig', lay((whoosh(0.34, 260, 1900, 420, 1.6, 0.5), 0, 1), (whoosh(0.34, 120, 520, 180, 1.0, 0.5), 0, 0.7), (nrm(hp(noise(0.34), 4500) * swell(0.34, 0.5, 2.5)), 0, 0.14), (cloth(0.3, 300, 1500, 0.4), 0, 0.2)))
    for v, sd in enumerate([294, 295]):
        seed(sd); sl = tv(noise(0.09), 'bp', line([(0, 2800), (0.09, 7200)], 0.09, True), 2.0) * perc(0.09, 0.03, 0.002)
        out('S_Blade' + ('' if not v else '_1'), lay((nrm(sl), 0, 0.8), (squelch(0.16, rng.uniform(700, 950), 1.5), 0.012, 0.7), (nrm(thud(rng.uniform(115, 140), 0.1, 0.5, 0.024, 0.7)), 0.008, 0.8), (modal(plate(3100, 6, 0.05, 0.4), 0.14), 0, 0.14)))
    for v, sd in enumerate([296, 297]):
        seed(sd); out('S_Blunt' + ('' if not v else '_1'), lay((nrm(boom(0.22, rng.uniform(88, 104), 44, 0.06)), 0, 1), (click(rng.uniform(800, 1050), 0.05, 0.008, 5, 0.6), 0.004, 0.4), (nrm(bp(noise(0.035), 600, 2600) * perc(0.035, 0.007, 0.0004)), 0, 0.6),
                (squelch(0.14, 480, 0.8), 0.01, 0.35), (modal(wood(260, 4, 0.03), 0.1), 0, 0.35)))
    # ---------------------------------------------------------------- the world
    seed(300); d = 0.56; dr = scrape(d, 140, 950, 24) * line([(0, 0), (0.08, 0.7), (0.45, 1), (d, 0.5)], d)
    out('S_Door', verb(lay((dr, 0, 0.7), (nrm(rumble(d, 110) * line([(0, 0), (0.1, 1), (d, 0.6)], d)), 0, 0.5), (nrm(boom(0.36, 92, 44, 0.09)), 0.55, 1), (click(700, 0.09, 0.02, 7, 0.75, 0.5), 0.55, 0.6),
                            (click(1500, 0.04, 0.006, 6), 0.63, 0.3), (debris(0.25, 500, 60, 1200, 0.001), 0.56, 0.12)), 0.6, 0.2, 0.008, 3200, 900), r=0.12)
    seed(301); d = 2.2; mallet = lp(noise(0.006), 2800) * perc(0.006, 0.002)
    bell = modal([(r, 0.95 * tau * 2.0, g) for r, tau, g in BELL], d, mallet, 392) + 0.5 * modal([(r * 1.004, 0.9 * tau * 2.0, g) for r, tau, g in BELL], d, mallet, 392)
    out('S_Bell', lay((nrm(bell), 0, 1), (nrm(thud(190, 0.05, 0.6, 0.012, 0.5)), 0, 0.25)), r=0.3)
    seed(302); out('S_Pickup', lay((tone(N(24), 0.14, 0.04, 'sine'), 0, 0.8), (tone(N(31), 0.22, 0.07, 'sine'), 0.06, 0.8), (fm(N(31) * np.ones(n_(0.2)), 3.5, line([(0, 2), (0.2, 0)], 0.2)) * perc(0.2, 0.05, 0.002), 0.06, 0.3),
                                   (click(4200, 0.03, 0.004, 4, 0.6), 0, 0.2)))
if __name__ == '__main__': build(); save_manifest(); print(len(MANIFEST), 'written')
