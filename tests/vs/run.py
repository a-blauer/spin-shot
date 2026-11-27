import json,subprocess,collections,re,sys
js=open('vs/vscan.js').read()
src0=open('/tmp/fldist/game.js').read().split('\n')
bv=next(i for i,l in enumerate(src0) if 'function buildVillage(' in l)
LO=next(i for i in range(bv,0,-1) if src0[i].lstrip().startswith('// src/'))+1
HI=next(i for i in range(bv,len(src0)) if src0[i].lstrip().startswith('// src/'))+1
HELP=[i+1 for i in range(LO,HI) if any(k in src0[i] for k in ('const S3 = (pair','const lit = (','const hang = (','const paper = (','const shroomExtras = ('))]
json.dump({"w":480,"h":270,"query":"&map=6&scan=1&stack=1","steps":[{"js":f"const g=__dmh;window.__LO={LO};window.__HI={HI};window.__HELP={HELP};__sim(10);g.villageRT.enter();__sim(20);'a'"},{"wait":300},{"js":js}]},open('vs/s.json','w'))
o=subprocess.run(['python3','shot_fl.py','vs/s.json'],capture_output=True,text=True,timeout=900).stdout
t=[l for l in o.split('\n') if l.startswith('js> {')]
if not t: print(o[-2000:]); sys.exit()
d=json.loads(t[-1][4:]); json.dump(d,open('vs/s.res','w'))
src=open('/tmp/fldist/game.js').read().split('\n')
def where(st):
    for fr in (st or '').split('|'):
        mm=re.search(r':(\d+):(\d+)\)?$',fr.strip())
        if not mm: continue
        ln=int(mm.group(1)); mod=None
        for k in range(ln-1,-1,-1):
            if src[k].lstrip().startswith('// src/'): mod=src[k].strip()[3:]; break
        if mod and not mod.endswith('/world.js') and 'mapkit' not in mod:
            t=src[ln-1]
            if any(h in t for h in ('const S = (pair','const lit = (','const hang = (')): continue
            return f'{mod}:{ln} '+t.strip()[:140]
    return '?'
print('items',d['n'],'cols',d['ncol'])
SOFT=('flower(','fern(','grassTuft(','toadstoolCluster(','Ramp(','pumpkin(','cabbage(')
for key,idx in (('walk',6),('ghost',5)):
    c=collections.defaultdict(list)
    for r in d[key]:
        w=where(r[idx]); ctx=' '.join(src[int(re.search(r':(\d+) ',w).group(1))-2:int(re.search(r':(\d+) ',w).group(1))]) if re.search(r':(\d+) ',w) else ''
        if any(k in w or k in ctx for k in SOFT): continue
        c[w].append(r[:idx])
    print('==',key,len(d[key]))
    for k,v in sorted(c.items(),key=lambda kv:-len(kv[1])): print(len(v),'|',k,'| e.g.',v[:3])

print('== clip',len(d['clip']))
for r in sorted(d['clip'],key=lambda r:-r[1]):
    a,b=r[0].split('>'); print(r[1],'|',src[int(a)-1].strip()[:90] if a!='0' else '?','  IN  ',src[int(b)-1].strip()[:90] if b!='0' else '?','| at',r[2:5])
