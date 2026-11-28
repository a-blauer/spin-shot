# Loose parts inside the sculpted props of a destination: shapes.py [room]
import json, subprocess, sys
room = int(sys.argv[1]) if len(sys.argv) > 1 else 1
js = open('dst/shapescan.js').read()
enter = f"const g=__dmh,D=g.descent;g.godMode=true;g.tip=()=>{{}};g.phaseTimer=0;__sim(30);if(D.room!=={room}){{D.enter({room});__sim(5);}}g.toSpawn=0;g.spawned=0;for(const E of g.enemies){{E.dead=true;E.remove=true;}}__sim(10);'a'"
st = [{"js": "const g=__dmh;g.descent.clear();__sim(30);window.__ST=1;'st'"}] if 'st' in sys.argv else []   # shapes.py [room] st: the stations' sculpts as well
json.dump({"w": 480, "h": 270, "query": "&map=6&scan=1", "steps": [{"js": enter}, {"wait": 200}] + st + [{"js": js}]}, open('/tmp/dshape.json', 'w'))
o = subprocess.run(['python3', 'shot_fl.py', '/tmp/dshape.json'], capture_output=True, text=True, timeout=1500).stdout
t = [l for l in o.split('\n') if l.startswith('js> {')]
if not t: print(o[-3000:]); sys.exit()
d = json.loads(t[-1][4:]); json.dump(d, open('/tmp/dshape.res', 'w'))
print('shapes', d['shapes'], 'ms', d['ms'], 'with loose parts', len(d['loose']))
for k, nc, nl, L in sorted(d['loose'], key=lambda r: -r[2]): print(f'  {nl:3d}/{nc:4d} | {k[:60]} | {L[:4]}')
