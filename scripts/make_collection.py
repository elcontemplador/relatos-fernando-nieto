import json,re,unicodedata,math
from pathlib import Path
root=Path(__file__).resolve().parents[1]
pages=json.loads((root/'source/pages.json').read_text(encoding='utf8'))
entries=[
('Prólogo',2,'Prólogo'),('Contrastes entre el pasado y el presente',4,'Poesía y juegos'),('¿Una labor de construcción etérea?',6,'Poesía y juegos'),('Éramos tan felices',7,'Historias'),('Copa gigante',8,'Poesía y juegos'),('La peonza inmóvil',9,'Memoria y raíces'),('El protocolo de la incertidumbre',11,'Historias'),('El castillo de la Mota, guardián de leyendas',13,'Historias'),('La noche tenía colmillos',15,'Historias'),('CARTA A LA MÉDICA DÑA. REMEDIOS SANITAS',17,'Cartas'),('CARTA 2 (A LA DIRECTORA DEL PERIÓDICO)',18,'Cartas'),('El último golpe en el yunque',19,'Memoria y raíces'),('Un Lunes de Aguas perfecto',22,'Memoria y raíces'),('La historia de mi pueblo',23,'Memoria y raíces'),('Sufrimiento y emoción',26,'Memoria y raíces'),('Mi reencuentro con la libertad',28,'Memoria y raíces'),('Las mulas, motor de Castilla',31,'Memoria y raíces'),('Haikus',33,'Poesía y juegos'),('LUZ MATINAL (lipograma sin “e”)',36,'Poesía y juegos'),('Tautogramas con la letra p',36,'Poesía y juegos'),('Retorno de un emigrante',38,'Historias'),('En la noche oscura',40,'Historias'),('Preguntas y Respuestas',42,'Poesía y juegos'),('La Biblioteca que Respiraba',44,'Historias'),('Del gris a la luz',46,'Historias')]
def slug(t):
 return re.sub(r'[^a-z0-9]+','-',unicodedata.normalize('NFKD',t).encode('ascii','ignore').decode().lower()).strip('-')
all_items=[]
for i,(title,start,cat) in enumerate(entries):
 end=entries[i+1][1]-1 if i+1<len(entries) else 47
 if title.startswith('LUZ'):end=36
 content=[];imgs=[];raw=[]
 for pn in range(start,max(start,end)+1):
  p=pages[pn]; lines=p['lines']; selected=[]
  for l in lines:
   t=l['text']
   if pn==start and t==title:continue
   if title.startswith('LUZ') and l['box'][1]>=380:continue
   if title.startswith('Tautogramas') and pn==36 and l['box'][1]<410:continue
   selected.append(l)
  if not title.startswith('LUZ'):imgs.extend(p['images'])
  groups=[];current=[];last=None
  for l in selected:
   t=l['text']
   if not t:
    if current:groups.append(current);current=[]
    last=None;continue
   raw.append(t)
   split=last and (l['box'][1]-last['box'][1]>22 or (l['box'][0]>82 and last['box'][2]<470))
   # Preserve each question, verse and independent sentence in constrained writing.
   if title.startswith('LUZ') and last and last['text'].endswith('.'):
    split=True
   if title in ['Preguntas y Respuestas','Tautogramas con la letra p'] and (t.startswith('¿') or title.startswith('Tautogramas')):split=True
   if split and current:groups.append(current);current=[]
   current.append(t);last=l
  if current:groups.append(current)
  for group in groups:
   poetic=title in ['Haikus','Contrastes entre el pasado y el presente']
   txt='\n'.join(group) if poetic else ' '.join(group)
   typ='verse' if poetic else 'p'
   if txt in ['La Casona de los Valdeolivas','“La decisión del hierro”','“El adiós”']:typ='h2'
   if title=='Preguntas y Respuestas' and txt.startswith('¿') and '\n' not in txt and txt.endswith('?'):typ='h2'
   content.append({'type':typ,'text':txt,'pdfPage':pn+1})
 if title=='Preguntas y Respuestas':
  rebuilt=[]
  for p in content:
   question,answer=p['text'].split('?',1)
   rebuilt.extend([{'type':'h2','text':question+'?','pdfPage':p['pdfPage']},{'type':'p','text':answer.strip(),'pdfPage':p['pdfPage']}])
  content=rebuilt
 if title=='Tautogramas con la letra p':
  content[-1]['type']='caption'
 # Title varies case in source only normalize presentation heading outside transcription.
 raw_text=' '.join(raw)
 words=len(raw_text.split())
 all_items.append({'id':slug(title),'title':title,'category':cat,'author':'Juan José Nieto Lobato' if i==0 else 'Fernando Nieto Nieto','number':i,'printedStart':start,'printedEnd':max(start,end),'pdfStart':start+1,'paragraphs':content,'images':imgs,'words':words,'minutes':max(1,math.ceil(words/170))})
(root/'source/collection.json').write_text(json.dumps(all_items,ensure_ascii=False,indent=2),encoding='utf8')
print('Entries',len(all_items),'words',sum(x['words'] for x in all_items),'images',sum(len(x['images']) for x in all_items))
for x in all_items:print(x['number'],x['title'],x['words'],len(x['paragraphs']),len(x['images']))
