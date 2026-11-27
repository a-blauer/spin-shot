import json, subprocess, sys
from PIL import Image, ImageDraw
js = open('vs2/reach.js').read()
json.dump({"w": 480, "h": 270, "query": "&map=6&scan=1", "steps": [{"js": "const g=__dmh;__sim(10);g.villageRT.enter();__sim(20);'a'"}, {"wait": 300}, {"js": js}]}, open('vs2/_reach.json', 'w'))
o = subprocess.run(['python3', 'shot_fl.py', 'vs2/_reach.json'], capture_output=True, text=True, timeout=900).stdout
t = [l for l in o.split('\n') if l.startswith('js> {')]
d = json.loads(t[-1][4:])
bad = [s for s in d['stations'] if not s[3]]
print('reachable cells', d['reach'], 'stations', len(d['stations']), 'unreachable', bad)
rows = d['map'].strip('\n').split('\n'); N = len(rows); S = 5
im = Image.new('RGB', (N * S, N * S), (40, 40, 40)); dr = ImageDraw.Draw(im)
for j, r in enumerate(rows):
    for i, ch in enumerate(r):
        if ch != ' ': dr.rectangle([i * S, j * S, i * S + S - 1, j * S + S - 1], fill=(170, 60, 60) if ch == '#' else (90, 140, 80))
H = 3450
for s in d['stations']:
    x, y = (s[1] + H) / 40 * S, (H - s[2]) / 40 * S
    dr.ellipse([x - 5, y - 5, x + 5, y + 5], outline=(255, 255, 0) if s[3] else (255, 0, 255), width=2)
im.save('/tmp/reach.png')
