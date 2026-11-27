import sys
from PIL import Image
names=open('rev.names').read().split(); box=tuple(int(x) for x in sys.argv[2].split(','))
ims=[Image.open(f'out/{n}.png').crop(box) for n in names]
per=int(sys.argv[1]); k=0
for i in range(0,len(ims),per):
    part=ims[i:i+per]; w,h=part[0].size; S=Image.new('RGB',(w,h*len(part)))
    for j,im in enumerate(part): S.paste(im,(0,j*h))
    S.save(f'out/revsheet{k}.png'); k+=1
print(k)
