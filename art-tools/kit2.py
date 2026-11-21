"""Shared builders for the creature packs of the later maps. Everything stands on the anatomy kit in creatures.py."""
import math
import random
from types import SimpleNamespace
from vectorkit import Part, ellipse, blobby, limb, path_limb, rect, shade, light, mixc
from creatures import (BODY, HEAD, ARM_B, ARM_F, LEG_B, LEG_F, TAIL, WING_B, WING_F, PROP, INK, BONE, BLOOD, GOLD, SOCKET,
                       part, S, P, M, mv, lerp, rrect, hat, fig, torso_pts, ribs, skull, hand2, arm2, leg2, body, trousers_top, wound, splat,
                       skirt, F1, wing, feathers)

POSE = dict(L=((-60, 246), (-66, 192), -96), R=((62, 250), (60, 196), -84))


def man(cn, H=400, w=1.0, hw=1.0, skin='#8f9d7c', top='#cdbf9f', pants='#54453c', boot='#3a2c26', slump=0.4, belly=0.0, chest=1.0,
        jaw=0.5, eye='#f1e3a0', hair=None, gaunt=1.0, teeth=(5, 4), brow=1.0, ears=True, hx=0, torn=(0.3, 0.0), bare_feet=False,
        leg_bulk=1.0, foot_w=1.0, stance=None, pose=None, sleeve=True, sleeve_to=(0.6, 0.3), claw=None, curl=(0.3, 0.2), hr=None, arm_bulk=1.0,
        belt='#2e2420', half=None, sh=None, legs=True, neck=True):
    """A standing figure: legs, trunk, head, arms. Returns the parts by name so the caller can dress them.
    `pose` gives each arm's elbow, wrist (in 400-figure units) and hand angle; `stance` = (hip x, knee x, ankle x) for a broad build."""
    F = fig(H, w, hw); k = F['k']
    m = SimpleNamespace(F=F, k=k, cn=cn, extra=[])
    m.legs = []
    if legs:
        for i, side in enumerate((-1, 1)):
            kw = dict(hip=(side * stance[0] * k, 198 * k), knee=(side * stance[1] * k, 104 * k), ank=(side * stance[2] * k, 16 * k)) if stance else {}
            m.legs.append(leg2(cn, side, F, pants, skin, torn=torn[i], boot=boot, bulk=leg_bulk, bare_foot=bare_feet, foot_w=foot_w, **kw))
    m.b, m.td = body(cn, F, top, belly=belly, chest=chest, slump=slump, half=half)
    if belt is not None:
        trousers_top(m.b, m.td, F, pants, belt=belt or None)
    m.h, m.hd, m.L = skull(cn, F, skin, cx=hx * k, jaw=jaw, eye=eye, hair=hair, gaunt=gaunt, teeth=teeth, brow=brow, ears=ears, neck=neck)
    m.X, m.Y, m.u = m.L['X'], m.L['Y'], m.L['u']
    pose = pose or POSE
    arms = []
    for i, (side, key) in enumerate(((-1, 'L'), (1, 'R'))):
        el, wr, ang = pose[key]
        kw = dict(sh=(side * sh[0] * k, sh[1] * k)) if sh else {}
        arms.append(arm2(cn, side, F, skin, sleeve=top if sleeve else None, sleeve_to=sleeve_to[i], el=(el[0] * k, el[1] * k), wr=(wr[0] * k, wr[1] * k),
                         hand_ang=ang, curl=curl[i], claw=claw, hr=hr * k if hr else None, bulk=arm_bulk, **kw))
    m.aL, m.aR = arms
    m.parts = lambda: m.legs + m.extra + [m.b, m.h, m.aL, m.aR]
    return m


def q(k, pts):
    return [(x * k, y * k) for x, y in pts]


def bird_leg(cn, side, hipx, k, col, plume=None, seed=0):
    """A bird's leg: knee forward, hock back, three toes and a spur."""
    role = LEG_F if side > 0 else LEG_B
    p = part('%s_%s' % (cn, role), role, (side * hipx * k, 196 * k), 0)
    if plume:
        feathers(p, (side * (hipx - 2) * k, 200 * k), (side * (hipx + 8) * k, 110 * k), 5, plume, 0.7, seed=seed + side)
    S(p, path_limb([(side * hipx * k, 150 * k), (side * (hipx + 10) * k, 104 * k), (side * (hipx - 2) * k, 54 * k), (side * (hipx + 2) * k, 12 * k)], [9 * k, 6.5 * k, 5 * k, 5.5 * k]), col)
    for i in range(5):
        p.flat(rect((side * hipx - 5) * k, (22 + i * 8) * k, (side * hipx + 5) * k, (24 + i * 8) * k), shade(col, 0.66), smooth=False)
    for dx in (-22, 0, 22):
        p.flat(path_limb([(side * (hipx + 2) * k, 12 * k), ((side * (hipx + 2) + dx) * k, 4 * k)], [4.6 * k, 3.2 * k], n_end=4), col)
        p.flat([((side * (hipx + 2) + dx - 3) * k, 6 * k), ((side * (hipx + 2) + dx + 3) * k, 6 * k), ((side * (hipx + 2) + dx * 1.45) * k, -2 * k + 2)], '#1c1614', smooth=False)
    return p
