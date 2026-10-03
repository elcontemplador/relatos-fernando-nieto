'use strict';
document.documentElement.classList.add('js');
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const cache=(type)=>({get(k){try{return window[type].getItem('fernando-relatos:'+k)}catch{return null}},set(k,v){try{window[type].setItem('fernando-relatos:'+k,v)}catch{}}});
const storage=cache('localStorage'),sessionStore=cache('sessionStorage');
function readJSON(store,key){try{return JSON.parse(store.get(key))}catch{return null}}
const reader=document.body.dataset.page==='reader',prefix=reader?'../':'';
let font=storage.get('font')||'large',theme=storage.get('theme')||'paper';
if(!['normal','large','extra'].includes(font))font='large';
if(!['paper','contrast','night'].includes(theme))theme='paper';
let suspended=0,bookmarkTimer,readyToSave=false;
function applySettings(){
 document.body.dataset.font=font;document.documentElement.dataset.font=font;document.body.dataset.theme=theme;
 $$('button[data-font]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.font===font)));
 $$('button[data-theme]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.theme===theme)));
}
applySettings();
const story=$('#story-text'),storyId=document.body.dataset.story;
const paragraphs=story?$$('p,h2',story):[];
function captureAnchor(elements=paragraphs){
 const element=elements.find(e=>e.getBoundingClientRect().bottom>24);
 if(!element)return {y:scrollY};
 const rect=element.getBoundingClientRect();
 if(element===elements[0]&&rect.top>24)return {y:scrollY};
 // A gap belongs to the next paragraph, not the end of the story.
 if(rect.top>24)return {element,ratio:0,offset:rect.top};
 return {element,ratio:Math.max(0,Math.min(1,(24-rect.top)/rect.height)),offset:24};
}
function restoreAnchor(anchor){
 if(!anchor)return;
 const top=anchor.element?scrollY+anchor.element.getBoundingClientRect().top+anchor.ratio*anchor.element.getBoundingClientRect().height-(anchor.offset??24):anchor.y;
 scrollTo({top:Math.max(0,top||0),behavior:'instant'});
}
function paintProgress(){
 if(!story)return;
 const usable=innerHeight-($('.reader-tools')?.getBoundingClientRect().height||0);
 const fraction=Math.max(0,Math.min(1,(scrollY-story.offsetTop)/Math.max(1,story.offsetHeight-usable)));
 $('.reading-progress span').style.width=(fraction*100)+'%';return fraction;
}
function saveReading(){
 if(!story||suspended||!readyToSave)return;
 const fraction=paintProgress();
 const anchor=captureAnchor();
 // Header, dialogs and toolbars are not reading positions.
 if(!anchor.element&&story.getBoundingClientRect().top>24)return;
 const index=anchor.element?paragraphs.indexOf(anchor.element):paragraphs.length-1;
 const ratio=anchor.element?anchor.ratio:1;
 storage.set('anchor:'+storyId,JSON.stringify({index,ratio,offset:anchor.offset??24}));
 storage.set('position:'+storyId,String(fraction));
}
function freeze(){suspended++;clearTimeout(bookmarkTimer)}
function thaw(){requestAnimationFrame(()=>requestAnimationFrame(()=>{suspended=Math.max(0,suspended-1);paintProgress()}))}
const settings=$('#reading-settings');let settingsTrigger,settingsAnchor;
$$('[data-settings]').forEach(b=>b.addEventListener('click',()=>{
 if(settings.open){settings.close();return}
 saveReading();freeze();settingsTrigger=b;
 settingsAnchor=captureAnchor(reader?[...paragraphs,...$$('.story-figure,.story-end,.site-footer')]:$$('.hero,.section-heading,.story-card,.quote-band,.workshop,.site-footer'));
 settings.showModal();document.body.style.overflow='hidden';
 $$('[data-settings]').forEach(x=>x.setAttribute('aria-expanded','true'));
 $('[data-close-settings]').focus({preventScroll:true});
}));
$('[data-close-settings]')?.addEventListener('click',()=>settings.close());
settings?.addEventListener('close',()=>{
 document.body.style.overflow='';$$('[data-settings]').forEach(x=>x.setAttribute('aria-expanded','false'));
 settingsTrigger?.focus({preventScroll:true});restoreAnchor(settingsAnchor);thaw();
});
$$('button[data-font]').forEach(b=>b.addEventListener('click',()=>{font=b.dataset.font;storage.set('font',font);applySettings();restoreAnchor(settingsAnchor)}));
$$('button[data-theme]').forEach(b=>b.addEventListener('click',()=>{theme=b.dataset.theme;storage.set('theme',theme);applySettings()}));
let catalogPromise;
function catalog(){return catalogPromise??=fetch(prefix+'assets/catalog.json').then(r=>{if(!r.ok)throw Error('catalog');return r.json()}).catch(e=>{catalogPromise=null;throw e})}
$$('[data-random]').forEach(b=>b.addEventListener('click',async()=>{
 if(b.dataset.fallback){location.href=prefix+'index.html#coleccion';return}
 b.disabled=true;try{const data=(await catalog()).filter(s=>s.id!==storyId);location.href=prefix+data[Math.floor(Math.random()*data.length)].href}
 catch{b.textContent='Ver la colección';b.disabled=false;b.dataset.fallback='true'}
}));
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
if(!reader&&$('#coleccion')){
 const cards=$$('.story-card'),search=$('#search'),params=new URLSearchParams(location.search);
 const saved=readJSON(sessionStore,'catalog')||{},returning=params.has('volver');
 let category=(returning?saved.category:params.get('categoria'))||'Todos';
 if(!$$('[data-filter]').some(b=>b.dataset.filter===category))category='Todos';
 let view=(returning?saved.view:params.get('vista'))||storage.get('catalog-view')||(matchMedia('(max-width:640px)').matches?'compact':'cards');
 if(!['compact','cards'].includes(view))view='compact';
 search.value=(returning?saved.query:params.get('q'))||'';
 function state(){return {category,query:search.value,view,y:scrollY}}
 function saveCatalog(extra={}){sessionStore.set('catalog',JSON.stringify({...state(),...extra}))}
 function reflectURL(){const u=new URL(location.href);u.searchParams.delete('volver');for(const [k,v] of [['categoria',category==='Todos'?'':category],['q',search.value],['vista',view]]){if(v)u.searchParams.set(k,v);else u.searchParams.delete(k)}history.replaceState(null,'',u)}
 function filter(save=true){
  document.body.dataset.catalogView=view;
  $$('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
  $$('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===category)));
  const q=normalize(search.value.trim());let visible=0;
  cards.forEach(card=>{card.hidden=!((category==='Todos'||card.dataset.category===category)&&normalize(card.dataset.search).includes(q));if(!card.hidden)visible++});
  $('#result-count').textContent=visible===24?'24 textos para descubrir':`${visible} ${visible===1?'texto encontrado':'textos encontrados'}`;
  $('#no-results').hidden=visible>0;if(save){saveCatalog();reflectURL()}
 }
 filter(false);
 $$('[data-filter]').forEach(b=>b.addEventListener('click',()=>{category=b.dataset.filter;filter()}));
 search.addEventListener('input',()=>filter());
 $$('[data-view]').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.view;storage.set('catalog-view',view);filter()}));
 $('#reset-search').addEventListener('click',()=>{category='Todos';search.value='';filter();search.focus({preventScroll:true})});
 cards.forEach(card=>$('a',card).addEventListener('click',()=>saveCatalog({card:card.id,offset:card.getBoundingClientRect().top})));
 if(returning){reflectURL();requestAnimationFrame(()=>requestAnimationFrame(()=>{const card=saved.card?document.getElementById(saved.card):null;scrollTo({top:card&&!card.hidden?scrollY+card.getBoundingClientRect().top-(Number(saved.offset)||0):Number(saved.y)||$('#coleccion').offsetTop,behavior:'instant'})}))}
 const last=readJSON(storage,'last');
 if(last&&/^[a-z0-9-]+$/.test(last.id)&&typeof last.title==='string'){const a=$('#continue-reading');a.href='relatos/'+last.id+'.html#seguir';a.textContent='Seguir leyendo: '+last.title;a.hidden=false}
}
if(reader){
 storage.set('last',JSON.stringify({id:storyId,title:document.body.dataset.title}));
 $$('a[href="../index.html#coleccion"]').forEach(a=>a.href='../index.html?volver=1#coleccion');
 const bar=$('.reader-tools');
 const measureBar=()=>document.body.style.setProperty('--reader-bar-height',bar.getBoundingClientRect().height+'px');
 if('ResizeObserver' in window)new ResizeObserver(measureBar).observe(bar);else addEventListener('resize',measureBar);measureBar();
 addEventListener('scroll',()=>{paintProgress();if(suspended||!readyToSave)return;clearTimeout(bookmarkTimer);bookmarkTimer=setTimeout(saveReading,150)},{passive:true});
 addEventListener('pagehide',()=>{clearTimeout(bookmarkTimer);saveReading()});
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  if(location.hash==='#seguir'){
   const anchor=readJSON(storage,'anchor:'+storyId);
   if(anchor&&Number.isInteger(anchor.index)&&paragraphs[anchor.index]&&Number.isFinite(anchor.ratio))restoreAnchor({element:paragraphs[anchor.index],ratio:Math.max(0,Math.min(1,anchor.ratio)),offset:Number.isFinite(anchor.offset)?Math.max(24,Math.min(innerHeight/3,anchor.offset)):24});
   else{const ratio=Number(storage.get('position:'+storyId));if(Number.isFinite(ratio)&&ratio>0)scrollTo({top:story.offsetTop+ratio*Math.max(1,story.offsetHeight-innerHeight),behavior:'instant'})}
  }
  readyToSave=true;paintProgress();saveReading();
 }));
 const status=$('#reader-status');
 $('#share-story').addEventListener('click',async()=>{
  const data={title:document.body.dataset.title+' · Fernando Nieto Nieto',url:location.href.split('#')[0]};
  try{if(navigator.share)await navigator.share(data);else if(navigator.clipboard&&isSecureContext){await navigator.clipboard.writeText(data.url);status.textContent='Enlace copiado. Ya puedes pegarlo en un mensaje.'}else status.textContent='Puedes copiar el enlace desde la barra de direcciones.'}
  catch(e){if(e.name!=='AbortError')status.textContent='Puedes compartir copiando el enlace de esta página.'}
 });
 const listen=$('#listen'),stop=$('#stop-listening'),synth=window.speechSynthesis;
 let speaking=false,paused=false,voiceSession=0,currentUtterance;
 if(synth&&window.SpeechSynthesisUtterance){
  listen.hidden=false;
  function chunks(){
   const output=[];
   for(const p of paragraphs.map(x=>x.textContent.trim()).filter(Boolean)){
    const sentences=p.match(/[^.!?…]+[.!?…]*\s*/g)||[p];let chunk='';
    for(const sentence of sentences){
     if(chunk.length+sentence.length>200&&chunk){output.push(chunk);chunk=''}
     if(sentence.length>220){if(chunk){output.push(chunk);chunk=''}let short='';for(const word of sentence.split(/\s+/)){if(short.length+word.length>190){output.push(short);short=''}short+=word+' '}if(short)output.push(short)}else chunk+=sentence;
    }
    if(chunk)output.push(chunk);
   }
   return output;
  }
  function resetVoice(){speaking=false;paused=false;listen.textContent='Escuchar';stop.hidden=true;currentUtterance=null;document.body.dataset.speaking='false'}
  function speakPart(parts,index,token){
   if(token!==voiceSession)return;
   if(index>=parts.length){resetVoice();status.textContent='La lectura ha terminado.';return}
   const utterance=new SpeechSynthesisUtterance(parts[index]);currentUtterance=utterance;utterance.lang='es-ES';utterance.rate=.88;
   const voice=synth.getVoices().find(v=>v.lang==='es-ES')||synth.getVoices().find(v=>v.lang.startsWith('es'));if(voice)utterance.voice=voice;
   utterance.onend=()=>{if(token===voiceSession)speakPart(parts,index+1,token)};
   utterance.onerror=e=>{if(token!==voiceSession||['interrupted','canceled'].includes(e.error))return;resetVoice();status.textContent='La voz no está disponible en este navegador. Puedes continuar leyendo.'};
   synth.speak(utterance);
  }
  listen.addEventListener('click',()=>{
   if(!speaking){synth.cancel();voiceSession++;speaking=true;paused=false;stop.hidden=false;document.body.dataset.speaking='true';listen.textContent='Pausar';status.textContent='Lectura con la voz de tu dispositivo. Puedes pausarla o detenerla en la barra inferior.';speakPart(chunks(),0,voiceSession)}
   else if(paused){synth.resume();paused=false;listen.textContent='Pausar'}
   else{synth.pause();paused=true;listen.textContent='Continuar'}
  });
  stop.addEventListener('click',()=>{voiceSession++;synth.cancel();resetVoice();status.textContent='Lectura detenida.'});
  addEventListener('pagehide',()=>{voiceSession++;synth.cancel();resetVoice()});
 }
}
const dialog=$('#image-dialog');
if(dialog){
 let zoom=1,imageAnchor,imageTrigger;const img=$('#large-image'),scroller=$('.image-scroll');
 function scaleImage(){const fit=Math.min(scroller.clientWidth-32,img.naturalWidth||700);img.style.width=Math.max(100,fit*zoom)+'px';img.style.height='auto';$('#zoom-out').disabled=zoom<=1;$('#zoom-in').disabled=zoom>=4}
 $$('.zoom-image').forEach(a=>a.addEventListener('click',e=>{
  if(!dialog.showModal)return;e.preventDefault();saveReading();freeze();imageAnchor={y:scrollY};imageTrigger=a;zoom=1;
  img.onload=scaleImage;img.src=a.dataset.image;img.alt=$('img',a).alt;dialog.showModal();document.body.style.overflow='hidden';scaleImage();$('#close-image').focus({preventScroll:true});
  $('#image-help').textContent='Usa + para ampliar y desplaza la imagen con el dedo. La nitidez depende de la imagen original.';
 }));
 $('#zoom-in').addEventListener('click',()=>{zoom=Math.min(4,zoom+.5);scaleImage()});
 $('#zoom-out').addEventListener('click',()=>{zoom=Math.max(1,zoom-.5);scaleImage()});
 $('#close-image').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{document.body.style.overflow='';imageTrigger?.focus({preventScroll:true});restoreAnchor(imageAnchor);thaw()});
 addEventListener('resize',()=>{if(dialog.open)scaleImage()});
}
