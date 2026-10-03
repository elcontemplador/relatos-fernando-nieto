'use strict';
document.documentElement.classList.add('js');
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const storage={get(k){try{return localStorage.getItem('fernando-relatos:'+k)}catch{return null}},set(k,v){try{localStorage.setItem('fernando-relatos:'+k,v)}catch{}}};
const reader=document.body.dataset.page==='reader', prefix=reader?'../':'';
let font=storage.get('font')||'large',theme=storage.get('theme')||'paper';
if(!['normal','large','extra'].includes(font))font='large';
if(!['paper','contrast','night'].includes(theme))theme='paper';
function applySettings(){document.body.dataset.font=font;document.body.dataset.theme=theme;$$('[data-font]').filter(x=>x.tagName==='BUTTON').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.font===font)));$$('button[data-theme]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.theme===theme)))}
applySettings();
const settings=$('#reading-settings');let settingsTrigger;
function closeSettings(){if(!settings)return;settings.hidden=true;$$('[data-settings]').forEach(x=>x.setAttribute('aria-expanded','false'));settingsTrigger?.focus()}
$$('[data-settings]').forEach(b=>b.addEventListener('click',()=>{const opening=settings.hidden;settings.hidden=!opening;$$('[data-settings]').forEach(x=>x.setAttribute('aria-expanded',String(opening)));if(opening){settingsTrigger=b;settings.scrollIntoView({behavior:'auto',block:'start'});$('[data-close-settings]').focus()}}));
$('[data-close-settings]')?.addEventListener('click',closeSettings);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&settings&&!settings.hidden)closeSettings()});
$$('button[data-font]').forEach(b=>b.addEventListener('click',()=>{font=b.dataset.font;storage.set('font',font);applySettings()}));
$$('button[data-theme]').forEach(b=>b.addEventListener('click',()=>{theme=b.dataset.theme;storage.set('theme',theme);applySettings()}));
let catalogPromise;
function catalog(){return catalogPromise??=fetch(prefix+'assets/catalog.json').then(r=>{if(!r.ok)throw Error('catalog');return r.json()}).catch(e=>{catalogPromise=null;throw e})}
$$('[data-random]').forEach(b=>b.addEventListener('click',async()=>{b.disabled=true;try{const data=(await catalog()).filter(s=>s.id!==document.body.dataset.story);const s=data[Math.floor(Math.random()*data.length)];location.href=prefix+s.href}catch{b.textContent='Ver la colección';b.disabled=false;b.onclick=()=>location.href=prefix+'index.html#coleccion'}}));
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
if(!reader){
 const cards=$$('.story-card');let category='Todos';const search=$('#search');
 function filter(){const q=normalize(search?.value.trim()||'');let visible=0;for(const card of cards){const ok=(category==='Todos'||card.dataset.category===category)&&normalize(card.dataset.search).includes(q);card.hidden=!ok;if(ok)visible++}$('#result-count').textContent=visible===24?'24 textos para descubrir':`${visible} ${visible===1?'texto encontrado':'textos encontrados'}`;$('#no-results').hidden=visible>0}
 $$('[data-filter]').forEach(b=>b.addEventListener('click',()=>{category=b.dataset.filter;$$('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));filter()}));search?.addEventListener('input',filter);
 $('#reset-search')?.addEventListener('click',()=>{category='Todos';search.value='';$$('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.filter==='Todos')));filter();search.focus()});
 try{const last=JSON.parse(storage.get('last'));if(last&&/^[a-z0-9-]+$/.test(last.id)&&typeof last.title==='string'){const a=$('#continue-reading');a.href='relatos/'+last.id+'.html#seguir';a.textContent='Seguir leyendo: '+last.title;a.hidden=false}}catch{}
}
if(reader){
 const story=$('#story-text'),id=document.body.dataset.story;
 storage.set('last',JSON.stringify({id,title:document.body.dataset.title}));
 let saveTimer;const progress=$('.reading-progress span');
 const updateProgress=()=>{const top=story.offsetTop,end=story.offsetTop+story.offsetHeight-innerHeight;const fraction=Math.max(0,Math.min(1,(scrollY-top)/Math.max(1,end-top)));progress.style.width=(fraction*100)+'%';clearTimeout(saveTimer);saveTimer=setTimeout(()=>storage.set('position:'+id,String(fraction)),180)};
 addEventListener('scroll',updateProgress,{passive:true});addEventListener('resize',updateProgress);
 if(location.hash==='#seguir'){const ratio=Number(storage.get('position:'+id));if(Number.isFinite(ratio)&&ratio>0){requestAnimationFrame(()=>requestAnimationFrame(()=>{const end=story.offsetTop+story.offsetHeight-innerHeight;scrollTo({top:story.offsetTop+ratio*Math.max(1,end-story.offsetTop),behavior:'instant'})}))}}
 const status=$('#reader-status');
 $('#share-story').addEventListener('click',async()=>{const data={title:document.body.dataset.title+' · Fernando Nieto Nieto',url:location.href.split('#')[0]};try{if(navigator.share){await navigator.share(data)}else if(navigator.clipboard&&isSecureContext){await navigator.clipboard.writeText(data.url);status.textContent='Enlace copiado. Ya puedes pegarlo en un mensaje.'}else{status.textContent='Puedes copiar el enlace desde la barra de direcciones.'}}catch(e){if(e.name!=='AbortError')status.textContent='Puedes compartir copiando el enlace de esta página.'}});
 // Native speech is an optional aid; no audio is played automatically.
 const listen=$('#listen'),stop=$('#stop-listening');let speaking=false,paused=false,session=0,currentUtterance;const synth=window.speechSynthesis;
 if(synth&&window.SpeechSynthesisUtterance){listen.hidden=false;
 const chunks=()=>{const paragraphs=$$('p,h2',story).map(x=>x.textContent.trim()).filter(Boolean);const output=[];for(const p of paragraphs){const sentences=p.match(/[^.!?…]+[.!?…]*\s*/g)||[p];let chunk='';for(const sentence of sentences){if(chunk.length+sentence.length>200&&chunk){output.push(chunk);chunk=''}if(sentence.length>220){if(chunk){output.push(chunk);chunk=''}const words=sentence.split(/\s+/);let short='';for(const word of words){if(short.length+word.length>190){output.push(short);short=''}short+=word+' '}if(short)output.push(short)}else chunk+=sentence}if(chunk)output.push(chunk)}return output};
 function resetVoice(){speaking=false;paused=false;listen.textContent='Escuchar el texto';stop.hidden=true;currentUtterance=null}
 function speakPart(parts,index,token){if(token!==session)return;if(index>=parts.length){resetVoice();status.textContent='La lectura ha terminado.';return}const utterance=new SpeechSynthesisUtterance(parts[index]);currentUtterance=utterance;utterance.lang='es-ES';utterance.rate=.88;const voice=synth.getVoices().find(v=>v.lang==='es-ES')||synth.getVoices().find(v=>v.lang.startsWith('es'));if(voice)utterance.voice=voice;utterance.onend=()=>{if(token===session)speakPart(parts,index+1,token)};utterance.onerror=e=>{if(token!==session||['interrupted','canceled'].includes(e.error))return;resetVoice();status.textContent='No se ha podido iniciar la voz en este navegador. Puedes continuar leyendo.'};synth.speak(utterance)}
 listen.addEventListener('click',()=>{if(!speaking){synth.cancel();session++;speaking=true;paused=false;stop.hidden=false;listen.textContent='Pausar voz';status.textContent='Lectura con la voz disponible en tu dispositivo.';speakPart(chunks(),0,session)}else if(paused){synth.resume();paused=false;listen.textContent='Pausar voz'}else{synth.pause();paused=true;listen.textContent='Continuar voz'}});
 stop.addEventListener('click',()=>{session++;synth.cancel();resetVoice();status.textContent='Lectura detenida.'});addEventListener('pagehide',()=>{session++;synth.cancel();resetVoice()});
 }
}
const dialog=$('#image-dialog');
if(dialog){let zoom=1;const img=$('#large-image'),scroller=$('.image-scroll');
 function scaleImage(){const fit=Math.min(scroller.clientWidth-40,img.naturalWidth||700);img.style.width=Math.max(160,fit*zoom)+'px';img.style.height='auto';$('#zoom-out').disabled=zoom<=1;$('#zoom-in').disabled=zoom>=4}
 $$('.zoom-image').forEach(a=>a.addEventListener('click',e=>{if(!dialog.showModal)return;e.preventDefault();zoom=1;img.src=a.dataset.image;img.alt=$('img',a).alt;img.onload=scaleImage;dialog.showModal();document.body.style.overflow='hidden';scaleImage();$('#close-image').focus()}));
 $('#zoom-in').addEventListener('click',()=>{zoom=Math.min(4,zoom+.5);scaleImage()});$('#zoom-out').addEventListener('click',()=>{zoom=Math.max(1,zoom-.5);scaleImage()});$('#close-image').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{document.body.style.overflow=''});addEventListener('resize',()=>{if(dialog.open)scaleImage()});
}
