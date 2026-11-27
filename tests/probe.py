import json,subprocess,sys
def run(m, lines):
    js="window.__dmhHold=true;const g=__dmh;const f=(x,y)=>{const[cx,cy]=g.cellOf(x,y);return g.navFree(cx,cy)?'.':'#';};const L=%s;L.map(([x0,y0,x1,y1])=>{let s='';const n=Math.round(Math.hypot(x1-x0,y1-y0)/100);for(let i=0;i<=n;i++){const x=x0+(x1-x0)*i/n,y=y0+(y1-y0)*i/n;s+=f(x,y);}return s;}).join(' | ')"%json.dumps(lines)
    json.dump({"query":"&map=%d"%m,"steps":[{"js":js}]},open('probe.json','w'))
    out=subprocess.run(['timeout','100','python3','shot.py','probe.json'],capture_output=True,text=True).stdout
    print(m,[l for l in out.split('\n') if l.startswith('js>')])
run(1,[[0,-3600,0,-4800],[-150,-3600,-150,-4800],[150,-3600,150,-4800],[-4500,-3400,-4500,-2200],[-4650,-3400,-4650,-2200],[-4350,-3400,-4350,-2200],[-4500,3600,-4500,4800],[-4650,3600,-4650,4800],[-4350,3600,-4350,4800]])
run(5,[[-1900,0,-800,0],[-1900,-150,-800,-150],[-1900,150,-800,150],[1900,0,800,0],[1900,150,800,150],[1900,-150,800,-150],[1900,1830,800,1830],[1900,1680,800,1680],[1900,1980,800,1980],[-4500,-1400,-4500,-300],[-4650,-1400,-4650,-300],[-4350,-1400,-4350,-300],[4500,-1600,4500,-2700],[4350,-1600,4350,-2700],[4650,-1600,4650,-2700]])
