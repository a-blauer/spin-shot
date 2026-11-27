import sys
from PIL import Image
names=open('rv.names').read().split()
for i in range(0,len(names),4):
    ims=[Image.open(f'out/{n}.png') for n in names[i:i+4]]; w,h=ims[0].size; S=Image.new('RGB',(w*2,h*2))
    for j,im in enumerate(ims): S.paste(im,((j%2)*w,(j//2)*h))
    S.save(f'out/grid{i//4}.png')
