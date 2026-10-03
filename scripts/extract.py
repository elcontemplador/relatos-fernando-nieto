from pathlib import Path
import pymupdf,json,re,hashlib,shutil
from PIL import Image,ImageDraw
root=Path(r'D:\codex\projects\Playground\relatos-fernando-nieto')
pdf=Path(r'C:\Users\Fernando\Downloads\Fernando Nieto Nieto Coleccion de textos taller de escritura creativa de Las Conchas vonline.pdf')
p=pymupdf.open(pdf)
shutil.copy2(pdf,root/'source'/'coleccion-original.pdf')
shutil.copy2(pdf,root/'docs'/'coleccion-original.pdf')
page_data=[]; thumbs=[]
for n,page in enumerate(p):
 lines=[]
 for b in page.get_text('dict')['blocks']:
  if b['type']==0:
   for l in b['lines']:
    if l['bbox'][1]<55 or l['bbox'][1]>780: continue
    text=''.join(s['text'] for s in l['spans']).strip()
    lines.append({'text':text,'box':list(l['bbox']),'size':max(s['size'] for s in l['spans'])})
 lines.sort(key=lambda l:(l['box'][1],l['box'][0]))
 imgs=[]
 for k,im in enumerate(page.get_images(full=True)):
  raw=p.extract_image(im[0]); name=f'pagina-{n+1:02d}-{k+1}.webp'; dest=root/'docs'/'assets'/name
  from io import BytesIO
  pil=Image.open(BytesIO(raw['image'])).convert('RGB'); pil.save(dest,'WEBP',quality=90)
  imgs.append({'src':'assets/'+name,'width':pil.width,'height':pil.height})
  thumb=pil.copy();thumb.thumbnail((165,145)); tile=Image.new('RGB',(190,180),'#fff');tile.paste(thumb,((190-thumb.width)//2,5));ImageDraw.Draw(tile).text((10,155),f'PDF {n+1} / {name}',fill='#000'); thumbs.append(tile)
 page_data.append({'page':n+1,'lines':lines,'images':imgs})
(root/'source'/'pages.json').write_text(json.dumps(page_data,ensure_ascii=False,indent=2),encoding='utf-8')
(root/'source'/'texto-extraido.txt').write_text('\n\n'.join(f'=== PÁGINA PDF {i+1} ===\n'+x.get_text() for i,x in enumerate(p)),encoding='utf-8')
sheet=Image.new('RGB',(190*5,180*((len(thumbs)+4)//5)),'#dedede')
for i,t in enumerate(thumbs):sheet.paste(t,((i%5)*190,(i//5)*180))
sheet.save(root/'qa'/'ilustraciones.jpg')
p[0].get_pixmap(matrix=pymupdf.Matrix(1,1)).save(str(root/'qa'/'portada-original.png'))
print('Pages',len(p),'images',len(thumbs),'PDF bytes',pdf.stat().st_size,'SHA256',hashlib.sha256(pdf.read_bytes()).hexdigest())
