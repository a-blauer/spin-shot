# A sheet of sculpted props, each framed on its own: sheet.py TAG "JS list" [cols cw ch]
#   the list is JS evaluated in the page: [{shape: __dprops.barn(1), yaw: 0.7, pitch: 0.35, zoom: 1, label: 'barn'}, ...]
#   (__dprops dest_props.js, __wprops dest_props_wood.js, __sprops station_shapes.js, __vprops/__vshapes the village's)
import json, sys, subprocess, base64
tag = sys.argv[1]; lst = sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 3; cw = int(sys.argv[4]) if len(sys.argv) > 4 else 640; ch = int(sys.argv[5]) if len(sys.argv) > 5 else 480
steps = [{"js": "const g=__dmh;g.godMode=true;__sim(20);1"}, {"wait": 400},
         {"js": "window.__sheet=__shapeSheet(%s,%d,%d,%d);window.__sheet.length" % (lst, cols, cw, ch)},
         {"js": "window.__sheet"}]
json.dump({"w": 640, "h": 360, "steps": steps}, open('/tmp/sheet_tmp.json', 'w'))
out = subprocess.run(['timeout', '600', 'python3', 'shot_fl.py', '/tmp/sheet_tmp.json'], capture_output=True, text=True).stdout
line = [l for l in out.split('\n') if l.startswith('js> data:image')]
if not line: print(out[-2500:]); sys.exit(1)
open(f'/tmp/sh_{tag}.jpg', 'wb').write(base64.b64decode(line[-1][4:].split(',', 1)[1])); print('ok', f'/tmp/sh_{tag}.jpg')
