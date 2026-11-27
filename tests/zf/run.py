import json,sys,subprocess,re,collections
m=sys.argv[1]
o=subprocess.run(['python3','shot_fl.py',f'zf/m{m}.json'],capture_output=True,text=True,timeout=600).stdout
t=[l for l in o.split('\n') if l.startswith('js> {')]
d=json.loads(t[-1][4:],strict=False); json.dump(d,open(f'zf/m{m}.res','w'))
src=open('/tmp/fldist/game.js').read().split('\n')
def where(st):
    for fr in (st or '').split('|'):
        mm=re.search(r':(\d+):(\d+)\)?$',fr.strip())
        if not mm: continue
        ln=int(mm.group(1)); mod=None
        for k in range(ln-1,-1,-1):
            if src[k].lstrip().startswith('// src/'): mod=src[k].strip()[7:]; break
        if mod and not mod.endswith('world.js'): return f'{mod}:{ln} '+src[ln-1].strip()[:120]
    return '?'
c=collections.Counter(); ex={}
for r in [r for r in d['sample'] if not (r[2]==1 and r[3]<0 and r[4]<120)]:
    a,b=sorted([where(r[7]),where(r[8])]); k=(a,b,'glow' if r[9] or r[10] else ''); c[k]+=1; ex.setdefault(k,r)
print('map',m,'instances',d['n'],'pairs',d['pairs'])
print("total visible", sum(c.values()))
for k,n in c.most_common(int(sys.argv[2]) if len(sys.argv)>2 else 25): print(n,k[2],'| axis',ex[k][2],ex[k][3],'v',ex[k][4],'area',ex[k][5],'\n   ',k[0],'\n   ',k[1])
