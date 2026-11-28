# Scans of a destination (the run's room ROOM, default 1): floating pieces, things you walk through, invisible walls,
# pieces clipped into other things' bodies. scan.py [room]
import json, os, subprocess, collections, re, sys
room = int(sys.argv[1]) if len(sys.argv) > 1 else 1
vjs = open('dst/dscan.js').read(); fjs = open('dst/fscan.js').read()
src0 = open('/tmp/fldist/game.js').read().split('\n')
bv = next(i for i, l in enumerate(src0) if 'function buildBramble(' in l)
LO = next(i for i in range(bv, 0, -1) if src0[i].lstrip().startswith('// src/')) + 1
HI = next(i for i in range(bv, len(src0)) if src0[i].lstrip().startswith('// src/')) + 1
HELP = sorted({i + 1 + k for i in range(LO, HI) if any(p in src0[i] for p in ('SOL = (', 'wall = (x0', 'roofSolid = (', 'hedge = (', 'close = (', 'fence = (', 'field = (')) for k in range(4)})
enter = f"window.__HELP={HELP};const g=__dmh,D=g.descent;g.godMode=true;g.tip=()=>{{}};g.phaseTimer=0;__sim(30);if(D.room!=={room}){{D.enter({room});__sim(5);}}g.toSpawn=0;g.spawned=0;for(const E of g.enemies){{E.dead=true;E.remove=true;}}__sim(10);window.__LO={LO};window.__HI={HI};'a'"
json.dump({"w": 480, "h": 270, "query": "&map=6&scan=1&stack=1" + (("&dest=" + os.environ["DEST"]) if os.environ.get("DEST") else ""), "steps": [{"js": enter}, {"wait": 300}, {"js": vjs}, {"js": fjs}]}, open('/tmp/dscan.json', 'w'))
o = subprocess.run(['python3', 'shot_fl.py', '/tmp/dscan.json'], capture_output=True, text=True, timeout=1500).stdout
t = [l for l in o.split('\n') if l.startswith('js> {')]
if len(t) < 2: print(o[-3000:]); sys.exit()
d = json.loads(t[-2][4:]); f = json.loads(t[-1][4:]); json.dump([d, f], open('/tmp/dscan.res', 'w'))
src = src0
def where(st):
    for fr in (st or '').split('|'):
        mm = re.search(r':(\d+):(\d+)\)?$', fr.strip())
        if not mm: continue
        ln = int(mm.group(1)); mod = None
        for k in range(ln - 1, -1, -1):
            if src[k].lstrip().startswith('// src/'): mod = src[k].strip()[3:]; break
        if mod and not mod.endswith('/world.js') and 'mapkit' not in mod and 'dest_kit' not in mod and not mod.endswith('/dest.js'):
            return f'{mod}:{ln} ' + src[ln - 1].strip()[:120]
    return '?'
print('instances', d['n'], 'bodies', d['ncol'])
print('-- walk-through (drawn at body height, nothing stops you):', len(d['walk']))
c = collections.defaultdict(list)
for r in d['walk']: c[where(r[6])].append(r[:6])
for k, v in sorted(c.items(), key=lambda kv: -len(kv[1])): print(' ', len(v), '|', k, '| e.g.', v[:3])
print('-- invisible walls (a body with nothing drawn in it):', len(d['ghost']))
c = collections.defaultdict(list)
for r in d['ghost']: c[where(r[5])].append(r[:5])
for k, v in sorted(c.items(), key=lambda kv: -len(kv[1])): print(' ', len(v), '|', k, '| e.g.', v[:3])
print('-- clipping:', len(d['clip']))
for r in d['clip'][:40]: print('  ', str(r)[:220])
print('-- floating:', f['floating'], 'of', f['n'])
c = collections.defaultdict(list)
for r in f['sample']: c[where(r[8] if len(r) > 8 else '')].append(r[3:8])
for k, v in sorted(c.items(), key=lambda kv: -len(kv[1])): print(' ', len(v), '|', k, '| e.g.', v[:3])
