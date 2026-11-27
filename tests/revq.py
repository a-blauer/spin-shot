# quick look at many sculpted creatures: revq.py TAG name:height,...  -> /tmp/revq_TAG.jpg (3/4 front + side each)
import sys, subprocess
from PIL import Image, ImageDraw
tag = sys.argv[1]; items = [x.split(':') for x in sys.argv[2].split(',')]
W, Hh = 360, 400; cols = 4
for name, h in items: subprocess.run(['python3', 'revone.py', name, '0', '1', name, h], capture_output=True, text=True, timeout=500)
rows = (len(items) * 2 + cols - 1) // cols
S = Image.new('RGB', (cols * W, rows * Hh)); d = ImageDraw.Draw(S); k = 0
for name, h in items:
    for v in 'ab':
        try: S.paste(Image.open(f'out/q_{name}_{v}.png').crop((140, 40, 500, 440)), ((k % cols) * W, (k // cols) * Hh))
        except Exception as e: print(name, e)
        d.rectangle(((k % cols) * W, (k // cols) * Hh, (k % cols) * W + 8 * len(name) + 8, (k // cols) * Hh + 16), fill=(0, 0, 0)); d.text(((k % cols) * W + 3, (k // cols) * Hh + 2), name, fill=(255, 220, 120)); k += 1
S.save(f'/tmp/revq_{tag}.jpg', quality=82); print('ok')
