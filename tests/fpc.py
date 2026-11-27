import sys
from PIL import Image
t=sys.argv[1]
im=Image.open(f'/tmp/fp_{t}.png'); W,H=im.size; rows=H//360
out=Image.new('RGB',(2*440,rows*250))
for r in range(rows):
    for k in range(2):
        out.paste(im.crop((k*640+200,r*360+110,k*640+640,r*360+360)),(k*440,r*250))
out.save(f'/tmp/fpc_{t}.png')
