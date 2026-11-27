import json,sys
from PIL import Image, ImageDraw
d=json.load(open('/home/claude/dmh-web/src/content.json')); N=len(d['weapons']); tag=sys.argv[1]; t=sys.argv[2]
cols=9; rows=(N-1+cols-1)//cols
o=Image.new('RGB',(cols*240,rows*150)); dr=ImageDraw.Draw(o)
for w in range(1,N):
    try: im=Image.open(f'out/gc{t}_{w}.png').crop((420,200,960,540)).resize((240,150))
    except Exception: continue
    i=w-1; o.paste(im,((i%cols)*240,(i//cols)*150)); dr.text(((i%cols)*240+3,(i//cols)*150+2),f"{w} {d['weapons'][w]['name']}",fill='white')
o.save(f'/tmp/gc_{tag}_t{t}.jpg',quality=82)
