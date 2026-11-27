#!/usr/bin/env python3
"""Review sheet for a sculpted creature: rev.py NAME [strain] [scale] [tag]
Row 1: front, left side, back, right side (eye level).  Row 2: 3/4 from above, face close-up, mid-stride, wind-up.
Writes /tmp/rev_<tag>.jpg"""
import json, sys, subprocess, math
from PIL import Image

name = sys.argv[1]; strain = int(sys.argv[2]) if len(sys.argv) > 2 else 0
scale = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0; tag = sys.argv[4] if len(sys.argv) > 4 else name
H = float(sys.argv[5]) if len(sys.argv) > 5 else 200 * scale   # creature height for framing
setup = """const g=__dmh;g.godMode=true;__sim(20);__village.enterVillage();__sim(30);window.__dmhHold=true;document.getElementById('hud').style.visibility='hidden';g.vm.scene.visible=false;
const P=g.player,V=P.pos.constructor;for(const E of g.enemies)E.remove=true;g.enemies.splice(0);const C=new V(41000,3000,79000);window.__C=C;const T=__THREE;const fl=new T.Mesh(new T.CylinderGeometry(900,900,20,48),new T.MeshBasicMaterial({color:0x6f6a60}));fl.position.set(C.x,C.y-10,C.z);g.scene.add(fl);const rg=new T.Mesh(new T.RingGeometry(880,900,64),new T.MeshBasicMaterial({color:0x4a463e,side:2}));rg.rotation.x=-Math.PI/2;rg.position.set(C.x,C.y+0.5,C.z);g.scene.add(rg);for(let i=0;i<8;i++){const t=new T.Mesh(new T.RingGeometry(100*i+98,100*i+100,64),new T.MeshBasicMaterial({color:0x5e5a52,side:2}));t.rotation.x=-Math.PI/2;t.position.set(C.x,C.y+0.4,C.z);g.scene.add(t);}
const E=g.spawnEnemy(0,new V(C.x,250,C.z),false,-1,1,1,0,false);E.emerge=0;E.puppet=new __Body3D('%s',%s,[1,1,1],[1,1,1],0);E.puppet.setStrain(%d);
window.__mv={vel:new V(0,0,0),face:new V(C.x,0,C.z+1000),windup:0};g.scene.traverse(o=>{if(o.material&&o.material.uniforms&&o.material.uniforms.sunDir)window.__sun=o.material.uniforms.sunDir});const eu=g.env.update.bind(g.env);g.env.update=function(...a){eu(...a);if(window.__sun&&window.__key)window.__sun.value.copy(window.__key);};E.update=function(dt){this.life+=dt;const m=window.__mv;if(window.__sun&&window.__key)window.__sun.value.copy(window.__key);this.puppet.tick(dt,new V(C.x,C.y,C.z),{vel:m.vel,grounded:true,faceToward:m.face,windup:m.windup,speedRef:200});};
__sim(30);g.fx.parts.length=0;window.__eo=g.camera.position.y-P.pos.y;JSON.stringify([window.__eo,E.puppet.is3D,Math.round(E.puppet.heightCm),E.puppet.parts.map(p=>p.role).join(',')])""" % (name, scale, strain)

def cam(ang, dist, h, look_h, pitch=None):
    # camera at angle ang (0 = in front of the creature, which faces +z) round C, looking at height look_h
    dx, dz = math.sin(ang) * dist, math.cos(ang) * dist
    yaw = math.atan2(dx, dz)
    pt = pitch if pitch is not None else -math.atan2(h - look_h, dist)
    return "const P=__dmh.player,C=window.__C;const f=()=>{P.pos.set(C.x+(%f),C.y+%f-window.__eo,C.z+(%f));P.vel&&P.vel.set(0,0,0);};f();P.yaw=%f;P.pitch=%f;window.__key=new P.pos.constructor(%f,0.9,%f).normalize();__sim(1);f();1" % (dx, h, dz, yaw, pt, math.sin(ang+0.6), math.cos(ang+0.6))

eye = H * 0.55; d = H * 0.72 + 50
steps = [{"js": "1"}, {"wait": 3000}, {"js": setup}]
shots = [
  (cam(0, d, eye, eye), None), (cam(math.pi / 2, d, eye, eye), None), (cam(math.pi, d, eye, eye), None), (cam(-math.pi / 2, d, eye, eye), None),
  (cam(0.7, d * 1.05, H * 1.35, eye), None), (cam(0.3, H * 0.4 + 70, H * 0.74, H * 0.74), None),
  (cam(math.pi / 2 + 0.25, d, eye, eye), "window.__mv.vel.set(0,0,180);__sim(12);1"), (cam(0.5, d, eye, eye), "window.__mv.vel.set(0,0,0);window.__mv.windup=1;__sim(20);1"),
]
for i, (c, pre) in enumerate(shots):
    if pre: steps.append({"js": pre})
    steps += [{"js": c}, {"wait": 120}, {"shot": "rv%d" % i}]
json.dump({"w": 640, "h": 480, "steps": steps}, open('/tmp/rev.json', 'w'))
out = subprocess.run(['python3', 'shot.py', '/tmp/rev.json'], capture_output=True, text=True, timeout=400, cwd='/home/claude/dmh-test')
for l in (out.stdout + out.stderr).splitlines():
    if l.startswith('js>') and l != 'js> 1' or 'rror' in l: print(l[:300])
ims = [Image.open('/home/claude/dmh-test/out/rv%d.png' % i).crop((140, 40, 500, 440)) for i in range(8)]
o = Image.new('RGB', (360 * 4, 400 * 2))
for i, im in enumerate(ims): o.paste(im, ((i % 4) * 360, (i // 4) * 400))
o.save('/tmp/rev_%s.jpg' % tag, quality=90)
print('/tmp/rev_%s.jpg' % tag)
