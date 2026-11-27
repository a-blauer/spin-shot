# side-view sheets of guns as the workbench shows them: gsheet.py TAG tier idx,idx,... [cols cw ch yaw pitch]
import json, sys, subprocess, base64
tag = sys.argv[1]; tier = int(sys.argv[2]); ids = [int(x) for x in sys.argv[3].split(',')]
cols = int(sys.argv[4]) if len(sys.argv) > 4 else 4; cw = int(sys.argv[5]) if len(sys.argv) > 5 else 480; ch = int(sys.argv[6]) if len(sys.argv) > 6 else 300
yaw = sys.argv[7] if len(sys.argv) > 7 else 'undefined'; pitch = sys.argv[8] if len(sys.argv) > 8 else '0'
lst = ','.join('{def:%d,tier:%d,yaw:%s,pitch:%s}' % (i, tier, yaw, pitch) for i in ids)
steps = [{"js": "const g=__dmh,P=g.player;g.godMode=true;g.hud.helpT=0;g.phase='Intermission';g.phaseTimer=1e9;P.pos.set(-1500,114,0);__sim(10);1"},
         {"js": "window.__sheet=__gunSheet([%s],%d,%d,%d);window.__sheet.length" % (lst, cols, cw, ch)},
         {"js": "window.__sheet"}]
json.dump({"w": 640, "h": 360, "steps": steps}, open('/tmp/gsheet_tmp.json', 'w'))
out = subprocess.run(['timeout', '600', 'python3', 'shot_fl.py', '/tmp/gsheet_tmp.json'], capture_output=True, text=True).stdout
line = [l for l in out.split('\n') if l.startswith('js> data:image')]
if not line: print(out[-2000:]); sys.exit(1)
b = line[-1][4:].split(',', 1)[1]
open(f'/tmp/gs_{tag}.jpg', 'wb').write(base64.b64decode(b)); print('ok', f'/tmp/gs_{tag}.jpg')
