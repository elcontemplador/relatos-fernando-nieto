'use strict';
/* Recorded narration is downloaded only when the reader presses play. */
window.setupNarration=function({storage,paragraphs,storyId,status}){
 const audio=document.querySelector('#story-audio'),voice=document.querySelector('#narration-voice'),speed=document.querySelector('#narration-speed');
 const listen=document.querySelector('#listen'),stop=document.querySelector('#stop-listening'),error=document.querySelector('#audio-error');
 const synth=window.speechSynthesis;
 let session=0,speaking=false,paused=false,currentUtterance=null,loadFailed=false,loadingTimer;
 const options=document.querySelector('.audio-options');
 if(synth&&window.SpeechSynthesisUtterance){const option=document.createElement('option');option.value='device';option.textContent='Voz del dispositivo';voice.append(option)}
 const savedVoice=storage.get('narration-voice');if([...voice.options].some(o=>o.value===savedVoice))voice.value=savedVoice;
 const savedSpeed=storage.get('narration-speed');if(['0.85','1','1.15'].includes(savedSpeed))speed.value=savedSpeed;
 function update(){
  const active=voice.value==='device'?speaking:!audio.paused;
  const isPaused=voice.value==='device'?paused:audio.paused;
  const started=voice.value==='device'?speaking:audio.currentTime>0;
  listen.textContent=loadFailed?'Reintentar':active&&!isPaused?'Pausar':started&&!audio.ended?'Continuar':'Escuchar';
  stop.hidden=!(active||started);document.body.dataset.speaking=String(active&&!isPaused);
 }
 function reset(){clearTimeout(loadingTimer);loadingTimer=null;loadFailed=false;session++;synth?.cancel();speaking=false;paused=false;currentUtterance=null;audio.pause();if(audio.readyState)audio.currentTime=0;update()}
 function ensureSource(){
  if(voice.value==='device'||audio.getAttribute('src'))return;
  audio.src='../audio/'+storyId+'-'+voice.value+'.mp3';audio.playbackRate=Number(speed.value);
 }
 function source(){
  audio.hidden=voice.value==='device';
  if(audio.hasAttribute('src')){audio.removeAttribute('src');audio.load()}
  if(options.open)ensureSource();
  error.hidden=true;error.textContent='';update();
 }
 options.addEventListener('toggle',()=>{if(options.open)ensureSource()});
 function failed(){clearTimeout(loadingTimer);loadingTimer=null;loadFailed=true;audio.pause();error.textContent='No se ha podido cargar el audio. Pulsa Reintentar'+(synth?' o elige Voz del dispositivo.':'.');error.hidden=false;options.open=true;status.textContent=error.textContent;update();listen.textContent='Reintentar'}
 function deviceParts(){
  // Keep chunks short for mobile speech engines while retaining every word.
  const out=[];
  for(const text of paragraphs.map(p=>p.textContent.trim()).filter(Boolean)){
   const sentences=text.match(/[^.!?…]+[.!?…]*\s*/g)||[text];
   for(const sentence of sentences){let chunk='';for(const word of sentence.split(/\s+/).filter(Boolean)){if(chunk.length+word.length>190&&chunk){out.push(chunk);chunk=''}chunk+=(chunk?' ':'')+word}if(chunk)out.push(chunk)}
  }return out;
 }
 function speakPart(parts,index,token){
  if(token!==session)return;
  if(index===parts.length){speaking=false;paused=false;currentUtterance=null;status.textContent='La lectura ha terminado.';update();return}
  const u=new SpeechSynthesisUtterance(parts[index]);currentUtterance=u;u.lang='es-ES';u.rate=.9*Number(speed.value);
  const voices=synth.getVoices();const chosen=voices.find(v=>v.lang==='es-ES'&&/natural|neural|enhanced|premium/i.test(v.name))||voices.find(v=>v.lang==='es-ES')||voices.find(v=>v.lang.startsWith('es'));if(chosen)u.voice=chosen;
  u.onend=()=>speakPart(parts,index+1,token);
  u.onerror=e=>{if(token!==session||['interrupted','canceled'].includes(e.error))return;speaking=false;paused=false;status.textContent='La voz del dispositivo no está disponible. Prueba Álvaro o Elvira.';update()};synth.speak(u);
 }
 listen.hidden=false;source();
 listen.addEventListener('click',()=>{
  if(voice.value==='device'){
   if(!speaking){synth.cancel();session++;speaking=true;paused=false;status.textContent='Lectura con la voz de tu dispositivo.';speakPart(deviceParts(),0,session)}
   else if(paused){synth.resume();paused=false}else{synth.pause();paused=true}update();return;
  }
  if(!audio.paused){audio.pause();return}
  ensureSource();if(audio.error)audio.load();if(audio.ended)audio.currentTime=0;
  loadFailed=false;error.hidden=true;const token=session;
  audio.play().catch(e=>{if(token!==session||e.name==='AbortError')return;failed()});
 });
 stop.addEventListener('click',()=>{reset();status.textContent='Lectura detenida.'});
 voice.addEventListener('change',()=>{reset();storage.set('narration-voice',voice.value);source();status.textContent='Voz cambiada. Pulsa Escuchar para empezar.'});
 speed.addEventListener('change',()=>{storage.set('narration-speed',speed.value);audio.playbackRate=Number(speed.value);status.textContent=voice.value==='device'?'La velocidad se aplicará en la siguiente frase.':'Velocidad cambiada.'});
 for(const event of ['play','pause','ended','timeupdate','loadedmetadata'])audio.addEventListener(event,update);
 function waiting(){if(!loadingTimer&&!audio.paused){loadingTimer=setTimeout(()=>{loadingTimer=null;if(!audio.paused&&audio.readyState<3)failed()},15000)}}
 audio.addEventListener('play',waiting);audio.addEventListener('waiting',waiting);
 audio.addEventListener('pause',()=>{clearTimeout(loadingTimer);loadingTimer=null});
 audio.addEventListener('playing',()=>{clearTimeout(loadingTimer);loadingTimer=null;loadFailed=false;error.hidden=true;status.textContent='Lectura con '+(voice.value==='alvaro'?'Álvaro':'Elvira')+'. Puedes pausarla en la barra inferior.'});
 audio.addEventListener('ended',()=>{status.textContent='La lectura ha terminado.'});
 audio.addEventListener('error',()=>{if(voice.value!=='device')failed()});
 audio.addEventListener('ratechange',()=>{if(['0.85','1','1.15'].includes(String(audio.playbackRate))){speed.value=String(audio.playbackRate);storage.set('narration-speed',speed.value)}});
 addEventListener('pagehide',()=>{clearTimeout(loadingTimer);loadingTimer=null;session++;audio.pause();synth?.cancel();speaking=false;paused=false;update()});
};
