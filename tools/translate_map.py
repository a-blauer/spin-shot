import re, sys
src = open('/home/claude/DeadMansHand/Source/DeadMansHand/DMHMapBuilder.cpp').read().split('\n')
funcs = ['BuildGroundAndBounds','BuildDoors','BuildMotel','BuildMainStreet','BuildChapel','BuildRailYard','BuildPlaza','BuildCasino','BuildMesa']
out = []
def body(name):
    for i,l in enumerate(src):
        if l.startswith('void ADMHMapBuilder::%s(' % name):
            j = i+1; depth = 0; lines=[]
            while True:
                lines.append(src[j]); depth += src[j].count('{') - src[j].count('}')
                if depth == 0 and src[j].strip() == '}': break
                j += 1
            return lines
TYPES = r'(?:FVector2D|FVector|float|int32|bool|uint32|FRotator|FLinearColor|double)'
def tr(l):
    l = re.sub(r'(\d+\.\d*)f\b', r'\1', l)
    l = re.sub(r'(\d+)\.f\b', r'\1.0', l)
    l = re.sub(r'\b(\d+)f\b', r'\1', l)
    l = l.replace('FVector2D(', 'V2(').replace('FVector(', 'V(').replace('FRotator(', 'R(').replace('FLinearColor(', 'LC(').replace('FColor(', 'FC(').replace('FBox(', 'BOX(')
    l = re.sub(r'FString::Printf\(TEXT\("%d"\), ([^)]*)\)', r'String(\1)', l)
    l = re.sub(r'TEXT\(("(?:[^"\\]|\\.)*")\)', r'\1', l)
    l = l.replace('Pal::', 'Pal.').replace('FMath::', 'FMath.').replace('GM->', 'GM.').replace('FVector::UpVector','V(0,0,1)').replace('FRotator::ZeroRotator','R(0,0,0)')
    l = re.sub(r'EDMHStation::(\w+)', r"'\1'", l)
    l = re.sub(r'\(int32\)', 'Math.trunc', l)
    l = re.sub(r'\(float\)', '', l)
    l = re.sub(r'for \((?:const )?' + TYPES + r'&? (\w+) : (\w+)\)', r'for (const \1 of \2)', l)
    l = re.sub(r'for \(int32 ', 'for (let ', l)
    l = re.sub(r'^(\s*)(?:const )?TArray<\w+> (\w+);', r'\1let \2 = [];', l)
    l = re.sub(r'^(\s*)(?:const )?' + TYPES + r' (\w+)\[\d*\] = \{', r'\1let \2 = [', l)
    l = re.sub(r'^(\s*)(?:const )?(FVector2D|FVector|FRotator) (\w+)\((.*)\);', lambda m: '%slet %s = %s(%s);' % (m.group(1), m.group(3), {'FVector2D':'V2','FVector':'V','FRotator':'R'}[m.group(2)], m.group(4)), l)
    l = re.sub(r'^(\s*)(?:const )?(?:auto|' + TYPES + r') (\w+) =', r'\1let \2 =', l)
    l = l.replace('.Add(', '.push(').replace('.Num()', '.length')
    return l
for f in funcs:
    b = body(f)
    out.append('export function %s(M, GM) {' % f)
    out.append('  const { Box, BoxRot, Glow, Cyl, Ball, ConeShape, Blocker, Ramp, Floor, Wall, Lamp, Sign, Building, StreetLamp, Barrel, Crate, Cactus, PalmTree, DeadTree, Car, Wagon, Headstone, Boxcar, Mesa, JumpPad, Billboard, Station, WallBuy, Door, SpawnAt, AddInstance, Foliage, SurfaceDecal } = M;')
    for l in b[1:]:
        out.append(tr(l))
    out.append('')
s = '\n'.join(out)
s = s.replace('};\n', '];\n')  # array literal closers (checked manually)
open('/home/claude/dmh-web/src/mapzones.js','w').write("import { V, V2, R, LC, FC, BOX, Pal, FMath } from './mapkit.js';\n\n" + s)
print(len(out))
