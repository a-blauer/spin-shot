import re
src = open('/home/claude/DeadMansHand/Source/DeadMansHand/DMHViewModel.cpp').read().split('\n')
# BuildModel switch: from 'switch (W.Class)' to the line before 'if (!MagRoot)'
a = next(i for i,l in enumerate(src) if l.strip() == 'switch (W.Class)')
b = next(i for i,l in enumerate(src) if l.strip() == 'if (!MagRoot)')
lines = src[a:b]
def tr(l):
    l = re.sub(r'(\d+\.\d*)f\b', r'\1', l); l = re.sub(r'(\d+)\.f\b', r'\1.0', l); l = re.sub(r'\b(\d+)f\b', r'\1', l)
    l = l.replace('FVector::ZeroVector', 'V(0,0,0)').replace('FRotator::ZeroRotator', 'null')
    l = l.replace('FVector(', 'V(').replace('FRotator(', 'R(')
    l = re.sub(r'TEXT\(("(?:[^"\\]|\\.)*")\)', r'\1', l)
    l = l.replace('DMHArt::Cylinder()', '1').replace('DMHArt::Sphere()', '2').replace('DMHArt::Cone()', '3').replace('DMHArt::Cube()', '0')
    l = l.replace('DMHData::Hex(', 'hex(').replace('FMath::', 'Math.').replace('Math.DegreesToRadians', 'd2r')
    l = re.sub(r'EDMHWeaponClass::(\w+)', r"'\1'", l); l = re.sub(r'EDMHFireMode::(\w+)', r"'\1'", l)
    l = re.sub(r'case \'(\w+)\':', r"case '\1':", l)
    l = l.replace('W.Class', 'W.cls').replace('W.Mode', 'W.mode')
    l = re.sub(r'for \(int32 ', 'for (let ', l)
    l = re.sub(r'^(\s*)(?:const )?(?:bool|float|int32|FLinearColor) (\w+) =', r'\1const \2 =', l)
    l = re.sub(r'^(\s*)(?:const )?FVector (\w+)\((.*)\);', r'\1const \2 = V(\3);', l)
    l = l.replace('GunRoot', 'this.gun')
    l = re.sub(r'NewScene\((\w+), ', r'this.\1 = this.scene_(', l)
    l = re.sub(r'(?<![\w.])(MagRoot|PumpRoot|SpinPart)\b', r'this.\1', l)
    l = re.sub(r'(?<![\w.])(MuzzleAt|EjectAt|SupportRest|SightZ|BarrelLen)\b(?= =)', r'\1', l)
    l = re.sub(r'(?<![\w.])(Box|Tube|Part)\(', r'this.\1(', l)
    return l
out = '\n'.join(tr(l) for l in lines)
open('/home/claude/dmh-web/tools/vm_build.js','w').write(out)
print(out[:200])
