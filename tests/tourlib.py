import json
LOOK='window.__lk=(px,py,pz,tx,ty,tz)=>{const g=__dmh,P=g.player;window.__dmhHold=false;P.pos.set(px,pz+114,py);P.vel.set(0,0,0);const T=new P.pos.constructor(tx-px,tz-pz,ty-py).normalize();P.pitch=Math.asin(T.y);let best=0,bd=-9;for(let k=0;k<256;k++){P.yaw=k*Math.PI/128;P.updateCamera(0.016);g.camera.updateMatrixWorld(true);const d=new P.pos.constructor();g.camera.getWorldDirection(d);const dot=d.x*T.x+d.z*T.z;if(dot>bd){bd=dot;best=P.yaw;}}P.yaw=best;P.updateCamera(0.016);g.vm.hidden=true;g.render&&g.render();window.__dmhHold=true;return 1};'
INIT="const g=__dmh,P=g.player;g.godMode=true;g.hud.helpT=-5;for(let i=0;i<g.zones.length;i++)g.unlockZone(i,true);for(const I of g.interactables)if(I.type==='Door'&&!I.open)g.openDoor(I);g.phase='Intermission';g.phaseTimer=1e9;window.__dmhHold=true;1"

def tour(name, q, views):
    steps=[{"js":LOOK+"1"},{"js":INIT}]; n=0
    for v in views:
        if isinstance(v, str): steps.append({"js":v}); continue
        steps.append({"js":"__lk(%s)"%','.join(map(str,v))}); steps.append({"wait":250}); steps.append({"shot":"%s_%d"%(name,n)}); n+=1
    json.dump({"query":q,"steps":steps}, open('tour_%s.json'%name,'w')); return n
def sheet(name, n, cols=3):
    from PIL import Image
    rows=(n+cols-1)//cols; sh=Image.new('RGB',(cols*640,rows*360))
    for i in range(n): sh.paste(Image.open('out/%s_%d.png'%(name,i)).resize((640,360)),((i%cols)*640,(i//cols)*360))
    sh.save('out/%s_sheet.png'%name)
