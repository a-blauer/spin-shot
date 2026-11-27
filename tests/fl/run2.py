import json,sys,subprocess,collections,re
m=sys.argv[1]; js=open('fl/scan2.js').read()
json.dump({"w":640,"h":360,"query":f"&map={m}&scan=1&stack=1","steps":[{"js":"__sim(10);'a'"},{"wait":500},{"js":js}]},open(f'fl/s{m}.json','w'))
o=subprocess.run(['python3','shot_fl.py',f'fl/s{m}.json'],capture_output=True,text=True,timeout=600).stdout
t=[l for l in o.split('\n') if l.startswith('js> {')]
d=json.loads(t[-1][4:]); json.dump(d,open(f'fl/s{m}.res','w'))
src=open('/tmp/fldist/game.js').read().split('\n')
def where(st):
    # first frame outside world.js: map bundle line -> module + text
    for fr in (st or '').split('|'):
        mm=re.search(r':(\d+):(\d+)\)?$',fr.strip())
        if not mm: continue
        ln=int(mm.group(1))
        mod=None
        for k in range(ln-1,-1,-1):
            if src[k].lstrip().startswith('// src/'): mod=src[k].strip()[3:]; break
        if mod and not mod.endswith('/world.js') and 'mapkit' not in mod:
            t=src[ln-1]
            if any(h in t for h in ('deco: (','tile: (','const sh = (','B = (d, y, z','candle: (','solid: (')): continue
            return f'{mod}:{ln} '+t.strip()[:150]
    return '?'
c=collections.defaultdict(list)
for r in d['sample']: c[where(r[8])].append(r)
print(m,'instances',d['n'],'floating',d['floating'])
for k,v in sorted(c.items(),key=lambda kv:-len(kv[1])): print(len(v),'|',k,'| e.g.',v[0][3:8])
