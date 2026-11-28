# Room tests for any destination: roomtest.py KIND ROOM [spots] with DEST=key in the environment
#   nav: every open cell reachable from the spawn; chase: the horde reaches the player at each spot ("name,x,y;...");
#   boss: both of the run's bosses reach the player at each spot; tri: the place's own draw calls and triangles
import json, os, sys, subprocess
kind, room = sys.argv[1], int(sys.argv[2]); spots = sys.argv[3] if len(sys.argv) > 3 else ''
q = "&map=6" + (("&dest=" + os.environ["DEST"]) if os.environ.get("DEST") else "")
src = {'nav': 'dst/nav.json', 'chase': 'dst/chase.json', 'boss': 'dst/boss2.json', 'tri': '/tmp/dtri.json'}[kind]
d = json.load(open(src)); d['query'] = q
s0 = d['steps'][0]['js']
for a in ['D.room!==1){D.enter(1)', 'D.room!==2){D.enter(2)']: s0 = s0.replace(a, f'D.room!=={room}){{D.enter({room})')
if kind == 'tri' and 'D.enter(' not in s0: s0 = s0.replace("const g=__dmh,D=g.descent;", f"const g=__dmh,D=g.descent;if(D.room!=={room}){{D.enter({room});__sim(5);}}")
d['steps'][0]['js'] = s0
if kind == 'nav': d['steps'][1]['js'] = d['steps'][1]['js'].replace('cy-5250', 'cy+S0').replace('(()=>{const g=__dmh,', '(()=>{const g=__dmh,S0=g.descent.S().spawn[1]-g.descent.A().c[1],')
if kind in ('chase', 'boss') and spots:
    L = '[' + ','.join("['%s',%s,%s]" % tuple(p.split(',')) for p in spots.split(';') if p) + ']'
    import re
    d['steps'][1]['js'] = re.sub(r"const spots=\[.*?\]\];", "const spots=" + L + ";", d['steps'][1]['js'], count=1)
    if kind == 'boss': d['steps'][1]['js'] = d['steps'][1]['js'].replace('D.room=2;', f'D.room={room};')
json.dump(d, open('/tmp/roomtest.json', 'w'))
o = subprocess.run(['timeout', '2400', 'python3', 'shot_fl.py', '/tmp/roomtest.json'], capture_output=True, text=True).stdout
print([l for l in o.splitlines() if l.startswith('js> {')][-1:] or o[-1500:])
