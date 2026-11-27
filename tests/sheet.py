import sys
from PIL import Image
names=sys.argv[2:]; cols=int(sys.argv[1])
ims=[Image.open(f'out/{n}.png') for n in names]
w,h=ims[0].size; rows=(len(ims)+cols-1)//cols
S=Image.new('RGB',(w*cols,h*rows))
for k,im in enumerate(ims): S.paste(im,((k%cols)*w,(k//cols)*h))
S.save('out/sheet.png')
