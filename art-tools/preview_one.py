import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import vectorkit, sprites
from creatures import ROSTER
from PIL import Image
names = sys.argv[1].split(',')
ims = []
for cname, fn in ROSTER:
    if cname not in names: continue
    rendered = []
    for p in fn():
        svg, pw, ph, off, size = vectorkit.render_part(p, scale=sprites.PX_PER_UNIT, max_px=1024)
        rendered.append((p, sprites.render_png(svg, pw, ph), off, size))
    ims.append(sprites.compose(rendered))
W = sum(i.width for i in ims) + 40 * len(ims); H = max(i.height for i in ims) + 40
sheet = Image.new('RGBA', (W, H), (54, 78, 82, 255))
x = 20
for i in ims:
    sheet.alpha_composite(i, (x, H - 20 - i.height)); x += i.width + 40
sheet.save('/tmp/one.png'); print(sheet.size)
