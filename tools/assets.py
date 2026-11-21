"""
Builds the web assets from the shared art pipeline in ../DeadMansHand:
  public/atlas_*.png + public/atlas.json   (all sprites packed into a few atlases, with UV rects)
  public/parts.json                         (creature puppet part table)
  public/audio/*.mp3                        (sound effects)
  src/content.json                          (weapons, upgrades, enemies, affixes, bosses)
"""
import importlib.util
import json
import os
import subprocess
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.dirname(HERE)
SRC = os.path.abspath(os.path.join(WEB, '..', 'DeadMansHand'))
SPR = os.path.join(SRC, 'RawArt', 'Sprites')
AUD = os.path.join(SRC, 'RawArt', 'Audio')
PUB = os.path.join(WEB, 'public')

PAD = 4


def pack(images, width):
    """Shelf packer: images = [(name, Image)] sorted by height desc. Returns (placements, height)."""
    x = y = shelf_h = 0
    out = {}
    for name, im in images:
        w, h = im.width + PAD * 2, im.height + PAD * 2
        if x + w > width:
            y += shelf_h
            x = 0
            shelf_h = 0
        out[name] = (x + PAD, y + PAD, im.width, im.height)
        x += w
        shelf_h = max(shelf_h, h)
    return out, y + shelf_h


def atlases():
    groups = {
        'creatures': ['Creatures'],
        'fx': ['FX', 'Decals', 'Props', 'Icons'],
    }
    for k in range(1, 9):
        if os.path.isdir(os.path.join(SPR, 'Creatures%d' % k)):
            groups['creatures%d' % k] = ['Creatures%d' % k]
    meta = {}
    for aname, folders in groups.items():
        ims = []
        for f in folders:
            d = os.path.join(SPR, f)
            for fn in sorted(os.listdir(d)):
                if fn.endswith('.png'):
                    im = Image.open(os.path.join(d, fn)).convert('RGBA')
                    if aname == 'fx' and max(im.size) > 256 and not fn.startswith(('I_Scope', 'P_DeadTree', 'P_Cloud')):
                        im.thumbnail((256, 256), Image.LANCZOS)
                    ims.append((fn[:-4], im))
        ims.sort(key=lambda t: -t[1].height)
        width = 4096 if aname.startswith('creatures') else 2048
        place, height = pack(ims, width)
        H = 1
        while H < height:
            H *= 2
        atlas = Image.new('RGBA', (width, H), (0, 0, 0, 0))
        for name, im in ims:
            x, y, w, h = place[name]
            # edge extrude (replicate border pixels into padding) to avoid bleeding
            big = im.resize((w + 2, h + 2), Image.NEAREST)
            big.paste(im, (1, 1))
            atlas.paste(big, (x - 1, y - 1))
            atlas.paste(im, (x, y))
            meta[name] = {'atlas': aname, 'u0': x / width, 'v0': y / H, 'u1': (x + w) / width, 'v1': (y + h) / H, 'w': w, 'h': h}
        atlas.save(os.path.join(PUB, 'atlas_%s.png' % aname), optimize=True)
        print('atlas', aname, width, H, len(ims))
    json.dump(meta, open(os.path.join(PUB, 'atlas.json'), 'w'))


def parts():
    p = json.load(open(os.path.join(SPR, 'Creatures', 'parts.json')))
    for k in range(1, 9):
        f = os.path.join(SPR, 'Creatures%d' % k, 'parts.json')
        if os.path.exists(f):
            p += json.load(open(f))
    json.dump(p, open(os.path.join(PUB, 'parts.json'), 'w'))


def audio():
    os.makedirs(os.path.join(PUB, 'audio'), exist_ok=True)
    for fn in sorted(os.listdir(AUD)):
        if fn.endswith('.wav'):
            dst = os.path.join(PUB, 'audio', fn[:-4] + '.mp3')
            if os.path.exists(dst) and os.path.getmtime(dst) > os.path.getmtime(os.path.join(AUD, fn)):
                continue
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', os.path.join(AUD, fn), '-ac', '1', '-b:a', '96k', dst], check=True)
    print('audio', len(os.listdir(os.path.join(PUB, 'audio'))))


def content():
    spec = importlib.util.spec_from_file_location('content', os.path.join(SRC, 'tools', 'content.py'))
    c = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(c)
    W = [dict(zip(['name', 'cls', 'rarity', 'mode', 'dmg', 'rate', 'mag', 'reserve', 'reload', 'spread', 'pellets', 'auto', 'range',
                   'splash', 'pierce', 'projSpeed', 'burn', 'slow', 'chains', 'moneyPerHit', 'critBonus', 'color', 'wallCost', 'desc'], w)) for w in c.W]
    U = []
    for u in c.UP:
        (n, ra, st, mods, tr, fx, chn, mag, cd, ds, insp) = u
        U.append({'name': n, 'rarity': ra, 'stacks': st, 'mods': [[m[0], m[1]] for m in mods], 'trigger': tr, 'fx': fx,
                  'chance': chn, 'mag': mag, 'cd': cd, 'desc': ds, 'insp': insp})
    EK = ['name', 'ai', 'shape', 'hp', 'speed', 'dmg', 'range', 'cd', 'scale', 'body', 'head', 'money', 'minRound', 'weight', 'desc']
    E = [dict(zip(EK, e), map=0, art=c.EN_ART[i]) for i, e in enumerate(c.EN)]
    for e in c.ENX:
        d = dict(zip(EK, e[2:17]), map=e[0], art=e[1]); d.update(e[17]); E.append(d)
    A = [{'name': a[0], 'desc': a[1], 'color': a[2]} for a in c.AFFIX]
    BK = ['name', 'title', 'hp', 'speed', 'dmg', 'scale', 'body', 'head', 'attacks', 'minion', 'reward', 'desc']
    B = []
    for i, b in enumerate(c.BOSS):
        d = dict(zip(BK, b), map=0, art=c.BOSS_ART[i]); d.update(c.BOSS_EXTRA[i]); B.append(d)
    B[4]['last'] = 1
    names = [e['name'] for e in E]
    for b in c.BOSSX:
        d = dict(zip(BK, b[2:14]), map=b[0], art=b[1]); d.update(b[14]); d['minion'] = names.index(d['minion']); B.append(d)
    json.dump({'weapons': W, 'upgrades': U, 'enemies': E, 'affixes': A, 'bosses': B}, open(os.path.join(WEB, 'src', 'content.json'), 'w'), indent=0)
    print('content', len(W), len(U), len(E), len(A), len(B))


if __name__ == '__main__':
    os.makedirs(PUB, exist_ok=True)
    atlases()
    parts()
    audio()
    content()
