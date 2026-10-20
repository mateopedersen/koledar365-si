'use strict';
const $=(s,root=document)=>root.querySelector(s), $$=(s,root=document)=>[...root.querySelectorAll(s)];
const csrf=()=>$('meta[name="csrf-token"]')?.content;
const store={get(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}},set(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}}};
function say(node,message,error=false){if(node){node.textContent=message;node.classList.toggle('error',error)}}
async function api(url,data){const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf(),'Accept':'application/json'},body:JSON.stringify(data)});const body=await response.json();if(!response.ok)throw new Error(body.error||'Zahteva ni uspela. Poskusite znova.');return body}
function downloadBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function formObject(form){const out={};for(const [key,value] of new FormData(form)){if(key.endsWith('[]'))(out[key.slice(0,-2)]??=[]).push(value);else out[key]=value}return out}
$$('[data-print]').forEach(b=>b.addEventListener('click',()=>window.print()));
// Only remembered city selection is optional; personal plans remain user-requested storage.
const consentVersion=2,consentTTL=180*24*60*60*1000;
function currentConsent(){const value=store.get('k365.consent',null);return value?.version===consentVersion&&Number.isFinite(value.expiresAt)&&value.expiresAt>Date.now()?value:null}
function rememberCityAllowed(){return currentConsent()?.preferences===true}
try{localStorage.removeItem('k365.theme');if(!rememberCityAllowed())localStorage.removeItem('k365.city')}catch{}
const cookieBar=$('#cookies');
if(cookieBar){
 const preferences=$('#cookie-preferences');
 let cookieOpener=null;
 const closeCookies=()=>{cookieBar.hidden=true;$('#cookie-settings').open=false;$('[data-consent-settings]').setAttribute('aria-expanded','false');if(cookieOpener?.isConnected)cookieOpener.focus()};
 const openCookies=(event)=>{preferences.checked=rememberCityAllowed();cookieBar.hidden=false;if(event){cookieOpener=event.currentTarget;$('[data-consent-settings]').focus()}};
 new ResizeObserver(()=>document.documentElement.style.setProperty('--cookie-space',cookieBar.hidden?'0px':cookieBar.getBoundingClientRect().height+'px')).observe(cookieBar);
 if(!currentConsent())openCookies();
 $$('[data-cookie-open]').forEach(b=>b.addEventListener('click',openCookies));
 $('[data-cookie-close]').addEventListener('click',closeCookies);
 cookieBar.addEventListener('keydown',e=>{if(e.key==='Escape')closeCookies()});
 $$('[data-consent]').forEach(b=>b.addEventListener('click',()=>{
   const choice=b.dataset.consent,allowed=choice==='all'||choice==='custom'&&preferences.checked;
   const value={version:consentVersion,choice,preferences:allowed,analytics:false,advertising:false,at:new Date().toISOString(),expiresAt:Date.now()+consentTTL};
   if(!allowed){try{localStorage.removeItem('k365.city')}catch{}}
   const saved=store.set('k365.consent',value);
   preferences.checked=allowed&&saved;
   document.dispatchEvent(new CustomEvent('k365:consent',{detail:{preferences:allowed&&saved}}));
   if(saved)closeCookies();else say($('#cookie-status'),'Brskalnik ne omogoča shranjevanja izbire. Koledar lahko uporabljate brez pomnjenja mesta; obvestilo zaprite z gumbom ×.',true);
 }));
 $('[data-consent-settings]').addEventListener('click',()=>{const details=$('#cookie-settings');details.open=!details.open;$('[data-consent-settings]').setAttribute('aria-expanded',String(details.open));if(details.open)preferences.focus()});
 $('#cookie-settings').addEventListener('toggle',()=>{$('[data-consent-settings]').setAttribute('aria-expanded',String($('#cookie-settings').open))});
}
$$('.api-form').forEach(form=>form.addEventListener('submit',async e=>{e.preventDefault();const result=$('.result',form),button=$('button',form);button.disabled=true;say(result,'Računamo …');try{const body=await api(form.action,formObject(form));say(result,body.result);if(body.countdown)document.dispatchEvent(new CustomEvent('k365:countdown',{detail:body.countdown}));if(body.entries){plannerEntries=body.entries;savePlannerEntries();renderPlannerEntries()}}catch(error){say(result,error.message,true)}finally{button.disabled=false}}));
let personal=store.get('k365.personal.v1',{events:[],notes:{}});const planner=$('#personal-planner');
function savePersonal(){if(!store.set('k365.personal.v1',personal))say($('#personal-status'),'Shramba ni na voljo. Shranite varnostno kopijo.',true)}
function renderPersonal(){if(!planner)return;const selected=planner.dataset.selectedDate,root=$('#personal-events');root.replaceChildren();const rows=personal.events.filter(e=>e.date===selected||(e.repeat==='yearly'&&e.date.slice(5)===selected.slice(5)));if(!rows.length){const p=document.createElement('p');p.className='empty';p.textContent='Za ta dan še ni osebnih zapisov.';root.append(p)}for(const event of rows){const row=document.createElement('div');row.className='personal-item'+(event.done?' done':'');row.dataset.category=event.category||'personal';const text=document.createElement('div');text.textContent=[event.time,event.title].filter(Boolean).join(' · ');row.append(text);if(event.kind==='task'){const complete=document.createElement('button');complete.textContent=event.done?'Označi kot nedokončano':'Označi kot dokončano';complete.addEventListener('click',()=>{event.done=!event.done;savePersonal();renderPersonal()});row.append(complete)}const edit=document.createElement('button');edit.textContent='Uredi';edit.addEventListener('click',()=>{const form=$('#personal-form');for(const key of ['uid','title','date','time','kind','repeat','category'])form.elements[key].value=event[key]||'';$('#event-editor').open=true;form.elements.title.focus()});row.append(edit);const del=document.createElement('button');del.textContent='Izbriši';del.addEventListener('click',()=>{personal.events=personal.events.filter(e=>e.uid!==event.uid);savePersonal();renderPersonal()});row.append(del);root.append(row)}requestAnimationFrame(()=>{renderQuickTasks();filterCalendar()});$('#day-notes').value=personal.notes[selected]||'';$$('.personal-dot').forEach(x=>x.remove());for(const event of personal.events){const cell=$(`td[data-date="${event.date}"] .date-events`);if(cell){const dot=document.createElement('span');dot.className='event-label personal-dot';dot.textContent=[event.time,event.title].filter(Boolean).join(' ');dot.dataset.category=event.category||'personal';cell.append(dot)}}}
if(planner){renderPersonal();$('#personal-form').addEventListener('submit',e=>{e.preventDefault();const form=e.currentTarget,entry=formObject(form);entry.uid=entry.uid||crypto.randomUUID();const found=personal.events.find(x=>x.uid===entry.uid);if(found)Object.assign(found,entry);else personal.events.push(entry);savePersonal();form.reset();form.elements.uid.value='';form.elements.date.value=planner.dataset.selectedDate;$('#event-editor').open=false;renderPersonal()});$('#cancel-event').addEventListener('click',()=>{$('#personal-form').reset();$('#personal-form').elements.uid.value='';$('#event-editor').open=false});$('#save-notes').addEventListener('click',()=>{personal.notes[planner.dataset.selectedDate]=$('#day-notes').value;savePersonal();say($('#notes-status'),'Zapiski so shranjeni na tej napravi.')});$('#backup-data').addEventListener('click',()=>downloadBlob(new Blob([JSON.stringify(personal,null,2)],{type:'application/json'}),'koledar365-osebna-kopija.json'));$('#restore-data').addEventListener('change',async e=>{try{const file=e.target.files[0];if(!file||file.size>1000000)throw new Error('Izberite veljavno datoteko do 1 MB.');const data=JSON.parse(await file.text());if(!Array.isArray(data.events)||data.events.length>500||!data.notes||typeof data.notes!=='object'||data.events.some(x=>typeof x.title!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(x.date)))throw new Error('Kopija ni veljavna.');personal=data;savePersonal();renderPersonal();say($('#personal-status'),'Varnostna kopija je obnovljena.')}catch(error){say($('#personal-status'),error.message,true)}});$('#export-ics').addEventListener('click',async()=>{try{const response=await fetch('/ics/izvoz/',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf()},body:JSON.stringify({events:personal.events})});if(!response.ok)throw new Error('Izvoz ni uspel. Preverite datume.');downloadBlob(await response.blob(),'koledar365-moj-koledar.ics')}catch(error){say($('#personal-status'),error.message,true)}});$('#ics-file').addEventListener('change',async e=>{try{const file=e.target.files[0];if(!file||file.size>1000000)throw new Error('Največja velikost datoteke je 1 MB.');const data=await api('/ics/uvoz/',{ics:await file.text()});let added=0;for(const event of data.events){const existing=personal.events.find(x=>x.uid===event.uid);if(existing)Object.assign(existing,event);else{personal.events.push(event);added++}}savePersonal();renderPersonal();say($('#personal-status'),`Uvoz je končan. Novi dogodki: ${added}.`)}catch(error){say($('#personal-status'),error.message,true)}});$('#show-holidays')?.addEventListener('change',e=>document.body.classList.toggle('hide-holidays',!e.target.checked));$('#show-personal')?.addEventListener('change',e=>$$('.personal-dot').forEach(n=>n.hidden=!e.target.checked))}
let plannerEntries=store.get('k365.entries.'+location.pathname,[]);const plannerOptions=$('#planner-options');
function savePlannerEntries(){store.set('k365.entries.'+location.pathname,plannerEntries)}
function refreshDesignPreviews(){
 for(const section of $$('[data-export-options]')){
  const base=JSON.parse(section.dataset.exportOptions),values={...base,...(plannerOptions?formObject(plannerOptions):{})};
  const settings={type:values.type,month:values.month,paper:$('.export-paper',section).value,orientation:$('.export-orientation',section).value,undated:values.undated||'1',date:values.date||`${values.year}-01-01`,blank_layout:values.blank_layout||'monthly',ruling:values.ruling||'lined'};
  for(const img of $$('[data-preview-design]',section)){
   if(window.K365Free){window.K365Free.preview(img,{...values,...settings,design:img.dataset.previewDesign});continue}
   img.dataset.publicPreview ||= img.getAttribute('src');const url=new URL(img.dataset.publicPreview,location.origin);url.pathname=url.pathname.replace(/\/predogled\/\d{4}\//,'/predogled/'+values.year+'/');
   url.search=new URLSearchParams(settings).toString();if(img.src!==url.href)img.src=url.href;
  }
 }
}
$$('.export-paper,.export-orientation').forEach(el=>el.addEventListener('change',refreshDesignPreviews));
plannerOptions?.addEventListener('change',refreshDesignPreviews);refreshDesignPreviews();
$$('[data-export]').forEach(button=>button.addEventListener('click',async()=>{const section=button.closest('[data-export-options]'),card=button.closest('.design-card'),status=$('.export-status',card);const base=JSON.parse(section.dataset.exportOptions);const options={...base,...(plannerOptions?formObject(plannerOptions):{}),design:button.dataset.export,paper:$('.export-paper',section).value,orientation:$('.export-orientation',section).value};if(plannerOptions)options.entries=plannerEntries;button.disabled=true;say(status,'Datoteko pripravljamo …');try{const response=await api('/izvozi/',{options,format:button.dataset.format});const poll=async()=>{const r=await fetch(response.url);if(!r.ok)throw new Error('Datoteke ni mogoče preveriti.');const job=await r.json();if(job.status==='complete'){status.replaceChildren();const a=document.createElement('a');a.href=job.files[button.dataset.format];a.download=job.filenames?.[button.dataset.format]||'';a.textContent='Datoteka je pripravljena. Prenesi →';status.append(a);button.disabled=false;return}if(['failed','expired'].includes(job.status))throw new Error(job.error||'Izdelava ni uspela. Poskusite znova.');say(status,'Izdelava poteka v ozadju. To stran lahko pustite odprto.');setTimeout(()=>poll().catch(error=>{say(status,error.message,true);button.disabled=false}),2000)};await poll()}catch(error){say(status,error.message,true);button.disabled=false}}));
// The live city card boots independently in city_card.js.
let activeCategory='all';function filterCalendar(){const query=($('#event-search')?.value||'').toLocaleLowerCase('sl');const holidays=$('#show-holidays')?.checked!==false,personalVisible=$('#show-personal')?.checked!==false;for(const node of $$('.date-events .event-label')){const category=node.dataset.category||'holidays';const categoryEnabled=$(`[data-category-toggle="${category}"]`)?.checked!==false;node.hidden=!(activeCategory==='all'||category===activeCategory)||!categoryEnabled||(category==='holidays'?!holidays:!personalVisible)||!node.textContent.toLocaleLowerCase('sl').includes(query)}}
$$('[data-category]').filter(x=>x.matches('button')).forEach(button=>button.addEventListener('click',()=>{activeCategory=button.dataset.category;$$('.category-chip').forEach(x=>{x.classList.toggle('active',x===button);x.setAttribute('aria-pressed',String(x===button))});filterCalendar()}));$$('[data-category-toggle],#show-holidays,#show-personal,#event-search').forEach(input=>input.addEventListener('input',filterCalendar));
$$('[data-add-event]').forEach(button=>button.addEventListener('click',()=>{if($('#event-editor')){$('#event-editor').open=true;$('#personal-form').elements.title.focus()}}));

function renderQuickTasks(){const root=$('#quick-tasks');if(!root||!planner)return;root.replaceChildren();const tasks=personal.events.filter(e=>e.kind==='task'&&e.date===planner.dataset.selectedDate);if(!tasks.length){const empty=document.createElement('p');empty.className='muted';empty.textContent='Kaj želite danes opraviti?';root.append(empty)}for(const task of tasks){const label=document.createElement('label');label.className='check'+(task.done?' task-done':'');const input=document.createElement('input');input.type='checkbox';input.checked=!!task.done;input.addEventListener('change',()=>{task.done=input.checked;savePersonal();renderPersonal()});label.append(input,document.createTextNode(task.title));root.append(label)}}
$('#quick-task-form')?.addEventListener('submit',e=>{e.preventDefault();const input=$('#quick-task-title');personal.events.push({uid:crypto.randomUUID(),date:planner.dataset.selectedDate,title:input.value.trim(),time:'',repeat:'',kind:'task',category:'personal',done:false});savePersonal();input.value='';renderPersonal()});renderQuickTasks();

// The complete gallery and direct downloads also work without JavaScript.
$$('[data-calendar-gallery]').forEach(gallery=>{
 const toolbar=gallery.querySelector('[data-gallery-filters]');if(!toolbar)return;toolbar.hidden=false;
 const buttons=[...gallery.querySelectorAll('[data-gallery-filter]')],cards=[...gallery.querySelectorAll('[data-calendar-design]')];
 buttons.forEach(button=>button.addEventListener('click',()=>{
  const filter=button.dataset.galleryFilter;buttons.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
  cards.forEach(card=>{card.hidden=filter!=='all'&&card.dataset.colorMode!==filter});
  gallery.querySelector('[data-gallery-count]').textContent=cards.filter(card=>!card.hidden).length+' / '+cards.length+' predlog';
 }));
});

// Expanding context keeps every design available and preserves all form values.
$$('[data-download-workspace]').forEach(workspace=>{
 const button=workspace.querySelector('[data-context-expand]');if(!button)return;
 const content=workspace.querySelector('#gallery-context-content'),mobile=window.matchMedia('(max-width:650px)');
 const syncContext=()=>{content.hidden=mobile.matches&&!workspace.classList.contains('context-expanded')};
 syncContext();mobile.addEventListener('change',syncContext);
 button.hidden=false;
 button.addEventListener('click',()=>{
  const expanded=workspace.classList.toggle('context-expanded');
  button.setAttribute('aria-expanded',String(expanded));syncContext();
  button.replaceChildren(document.createTextNode(expanded?'Nazaj k galeriji':button.dataset.expandLabel));
  const arrow=document.createElement('span');arrow.setAttribute('aria-hidden','true');arrow.textContent=expanded?'↙':'↗';button.append(arrow);
  if(!expanded)workspace.scrollIntoView({block:'start',behavior:'auto'});
 });
});
