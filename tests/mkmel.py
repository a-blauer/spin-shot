import json,sys
lo,hi=int(sys.argv[1]),int(sys.argv[2])
steps=[{"js":"window.__dmhHold = true; const g = __dmh, P = g.player; g.godMode = true; g.phase='Intermission'; g.phaseTimer=1e9; g.hud.helpT=0; P.pos.set(-1500,114,-400); P.yaw=2.2; P.pitch=0.05; P.setWield(true); __sim(50); 1"}]
for i in range(lo,hi):
    steps.append({"js":f"const P=__dmh.player; P.giveWeapon({1000+i}); __sim(70); __dmh.vm.mgName"})
    steps.append({"shot":f"ml_{i}_idle"})
    for s in range(3):
        steps.append({"js":f"const P=__dmh.player; __sim(60); P.meleeCd=0;P.meleeHitT=-1; P.meleeComboT={0 if s==0 else 1}; P.meleeCombo={(s+2)%3}; P.meleeSwing(); const n=Math.round(__dmh.vm.mDur*60*0.6*(0.16+0.84*0.45)); __sim(n); __dmh.vm.mMove+' '+n"})
        steps.append({"shot":f"ml_{i}_s{s}"})
json.dump({"w":640,"h":360,"steps":steps},open('mel.json','w'))
