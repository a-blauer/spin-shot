# python3 pv.py NAME out.png [yaws] [el] [strain] [ref.png]
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bkit import preview
name, out = sys.argv[1], sys.argv[2]
yaws = [float(x) for x in (sys.argv[3] if len(sys.argv) > 3 else '0.5').split(',')]
preview(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', name + '.json'), out, yaws, float(sys.argv[4]) if len(sys.argv) > 4 else 0.06, int(sys.argv[5]) if len(sys.argv) > 5 else 0, zoom=float(os.environ.get('ZOOM', '1')))
if len(sys.argv) > 6:
    from PIL import Image
    a = Image.open(out); ref = Image.open(sys.argv[6]).convert('RGB'); ref = ref.resize((a.height * ref.width // ref.height, a.height))
    o = Image.new('RGB', (a.width + ref.width, a.height), (200, 200, 200)); o.paste(ref, (0, 0)); o.paste(a, (ref.width, 0)); o.save(out)
