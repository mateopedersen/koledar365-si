'use strict';

(()=>{
 const root=document.querySelector('[data-countdown-root]');
 if(!root)return;

 const eventsNode=root.querySelector('[data-countdown-events]');
 let events=[];
 try{events=JSON.parse(eventsNode?.textContent||'[]')}catch{events=[]}
 const STORAGE_KEY='k365.countdowns.v1';
 const REGION_KEY='k365.countdowns.region';
 const allowedZones=new Set(['Europe/Ljubljana','Europe/Vienna','Europe/London','America/New_York','UTC']);
 const $=(selector,parent=root)=>parent.querySelector(selector);
 const $$=(selector,parent=root)=>[...parent.querySelectorAll(selector)];
 const esc=value=>String(value??'').replace(/[\\;,]/g,char=>`\\${char}`).replace(/\r?\n/g,'\\n');
 const dateParts=value=>{const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(value||'');if(!match)return null;const result={year:+match[1],month:+match[2],day:+match[3]};const check=new Date(Date.UTC(result.year,result.month-1,result.day));return check.getUTCFullYear()===result.year&&check.getUTCMonth()===result.month-1&&check.getUTCDate()===result.day?result:null};
 const validTime=value=>/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value||'');
 const addIsoDays=(value,amount)=>{const date=dateAsUtc(value);if(!date)return value;date.setUTCDate(date.getUTCDate()+amount);return date.toISOString().slice(0,10)};
 const dateFormatter=new Intl.DateTimeFormat('sl-SI',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
 const shortMonthFormatter=new Intl.DateTimeFormat('sl-SI',{month:'short',timeZone:'UTC'});
 const numberFormatter=new Intl.NumberFormat('sl-SI');
 const dateAsUtc=value=>{const p=dateParts(value);return p?new Date(Date.UTC(p.year,p.month-1,p.day)):null};
 const formatDate=value=>{const date=dateAsUtc(value);return date?dateFormatter.format(date):value};
 const formatRange=event=>event.end_date&&event.end_date!==event.date?`${formatDate(event.date)} – ${formatDate(event.end_date)}`:formatDate(event.date);
 const cleanEntry=entry=>{
  if(!entry||typeof entry!=='object'||!dateParts(entry.date)||!validTime(entry.time)||!allowedZones.has(entry.zone)||typeof entry.title!=='string')return null;
  const title=entry.title.trim().slice(0,64);if(!title)return null;
  return {id:String(entry.id||`custom-${Date.now()}-${Math.random().toString(36).slice(2,8)}`).slice(0,120),title,date:entry.date,time:entry.time,zone:entry.zone,category:['holiday','school','custom'].includes(entry.category)?entry.category:'custom',detail:String(entry.detail||'').slice(0,230),end_date:dateParts(entry.end_date)?entry.end_date:null,all_day:entry.all_day===true,provisional:entry.provisional===true,region:['east','west'].includes(entry.region)?entry.region:'all',school_level:['primary','secondary'].includes(entry.school_level)?entry.school_level:'all'};
 };
 const zonedInstant=(date,time,zone)=>{
  const p=dateParts(date);if(!p||!validTime(time)||!allowedZones.has(zone))return null;
  const [hour,minute]=time.split(':').map(Number),desired=Date.UTC(p.year,p.month-1,p.day,hour,minute,0);
  let guess=desired;
  const formatter=new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
  for(let pass=0;pass<5;pass++){
   const parts=Object.fromEntries(formatter.formatToParts(new Date(guess)).filter(item=>item.type!=='literal').map(item=>[item.type,Number(item.value)]));
   const represented=Date.UTC(parts.year,parts.month-1,parts.day,parts.hour,parts.minute,parts.second);
   const difference=desired-represented;
   if(difference===0)break;
   guess+=difference;
  }
  const final=Object.fromEntries(formatter.formatToParts(new Date(guess)).filter(item=>item.type!=='literal').map(item=>[item.type,Number(item.value)]));
  if(final.year!==p.year||final.month!==p.month||final.day!==p.day||final.hour!==hour||final.minute!==minute)return null;
  return new Date(guess);
 };
 const asEntry=event=>cleanEntry({id:event.id,title:event.title,date:event.date,time:event.time||'00:00',zone:'Europe/Ljubljana',category:event.category==='holiday'?'holiday':event.category==='school'?'school':'custom',detail:event.detail||'',end_date:event.end_date,all_day:true,provisional:event.provisional,region:event.region,school_level:event.school_level});
 const safeStorage={get(){try{const raw=localStorage.getItem(STORAGE_KEY);const list=raw?JSON.parse(raw):[];return Array.isArray(list)?list.map(cleanEntry).filter(Boolean).slice(0,50):[]}catch{return[]}},set(list){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(list.slice(0,50)));return true}catch{return false}}};
 let saved=safeStorage.get();
 let activeFilter='all';
 let visibleCount=12;
 let schoolRegion='west',schoolLevel='primary';
 try{const prior=localStorage.getItem(REGION_KEY);if(prior==='east'||prior==='west')schoolRegion=prior}catch{}
 try{const prior=localStorage.getItem(`${REGION_KEY}.level`);if(prior==='primary'||prior==='secondary')schoolLevel=prior}catch{}
 const regionControl=$('[data-school-region]');
 if(regionControl){regionControl.value=schoolRegion;regionControl.addEventListener('change',()=>{schoolRegion=regionControl.value==='east'?'east':'west';try{localStorage.setItem(REGION_KEY,schoolRegion)}catch{};renderEvents()})}
 const levelControl=$('[data-school-level]');
 if(levelControl){levelControl.value=schoolLevel;levelControl.addEventListener('change',()=>{schoolLevel=levelControl.value==='secondary'?'secondary':'primary';try{localStorage.setItem(`${REGION_KEY}.level`,schoolLevel)}catch{};renderEvents()})}

 const iconNode=kind=>{
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.8');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');svg.setAttribute('aria-hidden','true');
  const shapes=kind==='school'?[['path',{d:'M3 9.5 12 4l9 5.5-9 5.5-9-5.5Z'}],['path',{d:'M6.5 12v5.2c3.2 2.2 7.8 2.2 11 0V12'}],['path',{d:'M21 10v6'}]]:kind==='custom'?[['rect',{x:'4',y:'5',width:'16',height:'16',rx:'2'}],['path',{d:'M8 3v4m8-4v4M4 10h16'}],['path',{d:'m9 15 2 2 4-4'}]]:[['path',{d:'M12 3.5 14.6 9l6 .8-4.3 4.2 1 6-5.3-2.8-5.3 2.8 1-6-4.3-4.2 6-.8L12 3.5Z'}]];
  shapes.forEach(([tag,attrs])=>{const node=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([key,value])=>node.setAttribute(key,value));svg.append(node)});return svg;
 };
 const savedHas=id=>saved.some(item=>item.id===id);
 const storedEvent=event=>asEntry(event);
 const isFuture=event=>{const target=zonedInstant(event.date,event.time||'00:00',event.zone||'Europe/Ljubljana');return target&&target.getTime()>Date.now()};
 const upcomingEvents=()=>events.filter(event=>isFuture({date:event.date,time:'00:00',zone:'Europe/Ljubljana'})).sort((a,b)=>a.date.localeCompare(b.date)||a.title.localeCompare(b.title,'sl'));
 const availableEvents=()=>upcomingEvents().filter(event=>{
  if(event.source==='school'&&event.region&&event.region!=='all'&&event.region!==schoolRegion)return false;
  if(event.source==='school'&&event.school_level&&event.school_level!=='all'&&event.school_level!==schoolLevel)return false;
  return true;
 });
 const query=new URLSearchParams(location.search);
 const shareDate=query.get('date'),shareTime=query.get('time')||'00:00',shareZone=query.get('zone')||'Europe/Ljubljana',shareTitle=query.get('title');
 let featured=null;
 if(dateParts(shareDate)&&validTime(shareTime)&&allowedZones.has(shareZone)&&shareTitle?.trim()&&zonedInstant(shareDate,shareTime,shareZone)){
  featured=cleanEntry({id:`shared-${shareDate}-${shareTime}`,title:shareTitle,date:shareDate,time:shareTime,zone:shareZone,category:'custom',detail:'Deljeni odštevalnik',all_day:false});
 }
 if(!featured)featured=availableEvents()[0]?storedEvent(availableEvents()[0]):cleanEntry({id:'welcome',title:'Vaš naslednji pomemben dan',date:new Date(Date.now()+86400000).toISOString().slice(0,10),time:'00:00',zone:'Europe/Ljubljana',category:'custom'});
 let tickTimer=null;
 const distanceLabel=entry=>{const target=zonedInstant(entry.date,entry.time,entry.zone);if(!target)return'Preverite izbrani čas';const seconds=Math.floor((target.getTime()-Date.now())/1000);if(seconds<=0)return'Dogodek je nastopil';const days=Math.floor(seconds/86400);if(days===0)return'Danes';if(days===1)return'Jutri';return`Čez ${numberFormatter.format(days)} dni`};
 const countdownValues=entry=>{const target=zonedInstant(entry.date,entry.time,entry.zone);if(!target)return null;const remaining=Math.max(0,Math.floor((target.getTime()-Date.now())/1000));return {remaining,days:Math.floor(remaining/86400),hours:Math.floor(remaining/3600)%24,minutes:Math.floor(remaining/60)%60,seconds:remaining%60,started:target.getTime()<=Date.now()}};
 const pad=(n)=>String(n).padStart(2,'0');
 const setText=(selector,value,parent=root)=>{const node=$(selector,parent);if(node)node.textContent=value};
 const featureSave=$('[data-feature-save]');
 const renderFeature=()=>{
  if(!featured)return;
  setText('[data-feature-title]',featured.title);
  setText('[data-feature-date]',formatRange(featured));
  setText('[data-feature-status]',featured.provisional?'Predviden datum · uradni šolski koledar še ni objavljen.':`Časovni pas: ${featured.zone==='Europe/Ljubljana'?'Slovenija · Ljubljana':featured.zone}.`);
  setText('[data-feature-kicker]',featured.category==='school'?'NASLEDNJI ŠOLSKI TERMIN':featured.category==='holiday'?'NASLEDNJI SLOVENSKI PRAZNIK':'VAŠ IZBRANI ODŠTEVALNIK');
  featureSave.textContent=savedHas(featured.id)?'✓ Shranjeno v mojem seznamu':'+ Dodaj v moj seznam';
  featureSave.classList.toggle('is-added',savedHas(featured.id));
  featureSave.disabled=savedHas(featured.id);
  const data=countdownValues(featured);
  if(!data){['days','hours','minutes','seconds'].forEach(unit=>setText(`[data-feature-${unit}]`,'—'));return}
  setText('[data-feature-days]',numberFormatter.format(data.days));setText('[data-feature-hours]',pad(data.hours));setText('[data-feature-minutes]',pad(data.minutes));setText('[data-feature-seconds]',pad(data.seconds));
  if(data.started)setText('[data-feature-status]','Ta dan se je že začel. Izberite naslednji datum, ki ga želite spremljati.');
 };
 featureSave.addEventListener('click',()=>addSaved(featured));

 const renderSaved=()=>{
  const list=$('[data-saved-list]');list.replaceChildren();
  const empty=$('[data-saved-empty]');empty.hidden=saved.length>0;
  const exportButton=$('[data-export-ics]');exportButton.disabled=saved.length===0;
  const count=$('[data-saved-count]');count.textContent=saved.length===1?'1 shranjen datum':`${saved.length} shranjenih datumov`;
  saved.forEach((entry,index)=>{
   const card=document.createElement('article');card.className=`countdown-saved-card countdown-saved-card--${entry.category}`;card.dataset.savedId=entry.id;
   const head=document.createElement('div');head.className='countdown-saved-card__head';const icon=document.createElement('span');icon.className='countdown-saved-card__icon';icon.append(iconNode(entry.category));
   const copy=document.createElement('div');copy.className='countdown-saved-card__copy';const title=document.createElement('strong');title.textContent=entry.title;const date=document.createElement('span');date.textContent=formatRange(entry);copy.append(title,date);head.append(icon,copy);
   const time=document.createElement('div');time.className='countdown-saved-card__time';time.setAttribute('aria-label','Čas do dogodka');[['days','dni'],['hours','ur'],['minutes','min'],['seconds','sek']].forEach(([key,label])=>{const unit=document.createElement('div'),value=document.createElement('strong'),caption=document.createElement('span');value.dataset.savedUnit=key;caption.textContent=label;unit.append(value,caption);time.append(unit)});
   const actions=document.createElement('div');actions.className='countdown-saved-card__actions';const share=document.createElement('button');share.type='button';share.textContent='Deli povezavo';share.addEventListener('click',()=>shareEntry(entry,share));const remove=document.createElement('button');remove.type='button';remove.className='is-remove';remove.textContent='Odstrani';remove.setAttribute('aria-label',`Odstrani ${entry.title} iz mojih odštevalnikov`);remove.addEventListener('click',()=>{saved.splice(index,1);safeStorage.set(saved);renderSaved();renderEvents();renderFeature()});actions.append(share,remove);
   card.append(head,time,actions);list.append(card);
  });
  updateTimers();
 };
 const renderEvents=()=>{
  const list=$('[data-event-list]');list.replaceChildren();
  const search=($('[data-event-search]').value||'').trim().toLocaleLowerCase('sl');
  const sourceEvents=activeFilter==='favorite'?upcomingEvents():availableEvents();
  const filtered=sourceEvents.filter(event=>{
   const isSchool=event.category==='school';
   if(activeFilter==='holiday'&&event.category!=='holiday')return false;
   if(activeFilter==='school'&&!isSchool)return false;
   if(activeFilter==='favorite'&&!savedHas(event.id))return false;
   if(search&&!`${event.title} ${event.detail||''}`.toLocaleLowerCase('sl').includes(search))return false;
   return true;
  });
  const shown=filtered.slice(0,visibleCount);
  shown.forEach(event=>{
   const card=document.createElement('article');card.className=`countdown-event-card countdown-event-card--${event.category}`;
   const date=document.createElement('div');date.className='countdown-event-card__date';const month=document.createElement('small');month.textContent=shortMonthFormatter.format(dateAsUtc(event.date)).replace('.','');const day=document.createElement('strong');day.textContent=String(dateParts(event.date).day);date.append(month,day);
   const body=document.createElement('div');body.className='countdown-event-card__body';const title=document.createElement('h3');title.textContent=event.title;const detail=document.createElement('p');detail.textContent=event.detail||formatRange(event);body.append(title,detail);
   const tags=document.createElement('div');tags.className='countdown-event-card__tags';
   const addTag=(text,kind='')=>{const tag=document.createElement('span');tag.textContent=text;if(kind)tag.className=kind;tags.append(tag)};
   if(event.category==='holiday')addTag(event.work_free?'Dela prost dan':'Ni dela prost dan',event.work_free?'is-red':'');
   else addTag(event.provisional?'Predviden termin':'Šolski koledar',event.provisional?'is-gold':'is-green');
   if(event.category==='school')addTag(event.school_level==='secondary'?'Srednja šola':event.school_level==='primary'?'Osnovna šola':'Vse stopnje','is-green');
   if(event.category==='school'&&event.region&&event.region!=='all')addTag(event.region==='east'?'Vzhodna skupina':'Zahodna skupina','is-green');
   if(event.category==='school'&&event.region==='all')addTag('Vse regije','is-green');
   body.append(tags);
   const actions=document.createElement('div');actions.className='countdown-event-card__actions';const distance=document.createElement('span');distance.className='countdown-event-card__distance';distance.dataset.countdownDistance='';distance.dataset.date=event.date;distance.textContent=distanceLabel({date:event.date,time:'00:00',zone:'Europe/Ljubljana'});const add=document.createElement('button');add.type='button';add.textContent=savedHas(event.id)?'✓ Dodano':'+ Odštevaj';add.classList.toggle('is-added',savedHas(event.id));add.disabled=savedHas(event.id);add.addEventListener('click',()=>addSaved(storedEvent(event)));actions.append(distance,add);
   const selectEvent=()=>{featured=storedEvent(event);renderFeature()};card.append(date,body,actions);card.addEventListener('click',eventClick=>{if(eventClick.target.closest('button'))return;selectEvent()});card.addEventListener('keydown',eventKey=>{if(eventKey.key==='Enter'||eventKey.key===' '){eventKey.preventDefault();selectEvent()}});card.tabIndex=0;card.setAttribute('role','group');card.setAttribute('aria-label',`${event.title}. Izberi ta datum za predogled odštevanja.`);list.append(card);
  });
  setText('[data-event-count]',filtered.length?`${numberFormatter.format(filtered.length)} prihajajočih datumov`:'');
  $('[data-no-events]').hidden=filtered.length>0;
  const load=$('[data-load-more]');load.hidden=filtered.length<=visibleCount;load.textContent=visibleCount>=filtered.length?'':'Pokaži še dogodke ↓';
 };
 const updateTimers=()=>{
  const featureData=countdownValues(featured);if(featureData){setText('[data-feature-days]',numberFormatter.format(featureData.days));setText('[data-feature-hours]',pad(featureData.hours));setText('[data-feature-minutes]',pad(featureData.minutes));setText('[data-feature-seconds]',pad(featureData.seconds));if(featureData.started)setText('[data-feature-status]','Ta dan se je že začel. Izberite naslednji datum, ki ga želite spremljati.')}
  $$('[data-saved-id]').forEach(card=>{const entry=saved.find(value=>value.id===card.dataset.savedId);if(!entry)return;const data=countdownValues(entry);if(!data)return;card.querySelector('[data-saved-unit="days"]').textContent=numberFormatter.format(data.days);card.querySelector('[data-saved-unit="hours"]').textContent=pad(data.hours);card.querySelector('[data-saved-unit="minutes"]').textContent=pad(data.minutes);card.querySelector('[data-saved-unit="seconds"]').textContent=pad(data.seconds)});
  if(!tickTimer)tickTimer=setInterval(()=>{updateTimers();$$('[data-countdown-distance]').forEach(node=>node.textContent=distanceLabel({date:node.dataset.date,time:'00:00',zone:'Europe/Ljubljana'}))},1000);
 };
 function addSaved(entry){
  const value=cleanEntry(entry);if(!value)return;
  if(savedHas(value.id)){featured=value;renderFeature();return}
  if(saved.length>=50){const status=$('[data-custom-status]');status.textContent='Shranite največ 50 datumov. Odstranite enega in poskusite znova.';status.classList.add('is-error');return}
  saved.unshift(value);const persisted=safeStorage.set(saved);featured=value;renderSaved();renderEvents();renderFeature();
  const status=$('[data-custom-status]');if(status)status.textContent=persisted?'Odštevanje je dodano na vaš osebni seznam.':'Odštevanje je prikazano, vendar brskalnik ne dovoli shranjevanja.';
 }
 async function shareEntry(entry,button){
  const url=new URL(location.href);url.search='';url.searchParams.set('date',entry.date);url.searchParams.set('time',entry.time);url.searchParams.set('zone',entry.zone);url.searchParams.set('title',entry.title);
  try{if(navigator.share){await navigator.share({title:`Odštevanje: ${entry.title}`,text:`Spremljaj čas do dogodka ${entry.title}.`,url:url.href});return}await navigator.clipboard.writeText(url.href);button.textContent='Povezava kopirana ✓';setTimeout(()=>button.textContent='Deli povezavo',1800)}catch(error){if(error?.name==='AbortError')return;try{await navigator.clipboard.writeText(url.href);button.textContent='Povezava kopirana ✓';setTimeout(()=>button.textContent='Deli povezavo',1800)}catch{button.textContent='Odpri v skupni rabi';button.title=url.href}}
 }
 const exportIcs=()=>{
  if(!saved.length)return;
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Koledar365//Odštevanje//SL','CALSCALE:GREGORIAN','METHOD:PUBLISH'];
  saved.forEach(entry=>{
   const p=dateParts(entry.date);if(!p)return;
   lines.push('BEGIN:VEVENT',`UID:${encodeURIComponent(entry.id)}@koledar365.si`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}`);
   if(entry.all_day){
    lines.push(`DTSTART;VALUE=DATE:${entry.date.replace(/-/g,'')}`);
    const end=entry.end_date||entry.date,endParts=dateParts(end),next=new Date(Date.UTC(endParts.year,endParts.month-1,endParts.day+1));
    lines.push(`DTEND;VALUE=DATE:${next.toISOString().slice(0,10).replace(/-/g,'')}`);
   }else{
    const start=zonedInstant(entry.date,entry.time,entry.zone);if(!start)return;
    const end=new Date(start.getTime()+3600000);
    const utc=date=>date.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
    lines.push(`DTSTART:${utc(start)}`,`DTEND:${utc(end)}`);
   }
   lines.push(`SUMMARY:${esc(entry.title)}`,`DESCRIPTION:${esc(entry.detail||`Odštevanje na koledar365.si · ${entry.zone}`)}`,'END:VEVENT');
  });
  lines.push('END:VCALENDAR','');const blob=new Blob([lines.join('\r\n')],{type:'text/calendar;charset=utf-8'}),url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download='koledar365-odstevanje.ics';document.body.append(anchor);anchor.click();anchor.remove();URL.revokeObjectURL(url);
 };

 $$('[data-event-filter]').forEach(button=>button.addEventListener('click',()=>{activeFilter=button.dataset.eventFilter;visibleCount=12;$$('[data-event-filter]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));$('[data-region-control]').hidden=activeFilter==='holiday'||activeFilter==='favorite';renderEvents()}));
 $('[data-event-search]').addEventListener('input',()=>{visibleCount=12;renderEvents()});
 $('[data-load-more]').addEventListener('click',()=>{visibleCount+=12;renderEvents()});
 $('[data-export-ics]').addEventListener('click',exportIcs);
 $('[data-custom-form]').addEventListener('submit',event=>{
  event.preventDefault();const form=event.currentTarget,title=form.elements.title.value.trim(),date=form.elements.date.value,time=form.elements.time.value,zone=form.elements.zone.value,status=$('[data-custom-status]');
  status.textContent='';status.classList.remove('is-error');
  if(!title||!dateParts(date)||!validTime(time)||!allowedZones.has(zone)){status.textContent='Preverite ime, datum, uro in časovni pas.';status.classList.add('is-error');return}
  if(!zonedInstant(date,time,zone)){status.textContent='Izbrana ura v tem časovnem pasu ne obstaja zaradi premika ure.';status.classList.add('is-error');return}
  addSaved({id:`custom-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,title,date,time,zone,category:'custom',detail:'Osebni datum',all_day:false});form.reset();form.elements.date.value=addIsoDays(root.dataset.today||date,1);form.elements.time.value='00:00';form.elements.zone.value='Europe/Ljubljana';
 });
 $$('[data-quick]').forEach(button=>button.addEventListener('click',()=>{
  const kind=button.dataset.quick;
  if(kind==='custom'){document.querySelector('#moj-datum').scrollIntoView({behavior:'smooth'});$('[data-custom-title]').focus({preventScroll:true});return}
  const upcoming=availableEvents();
  if(kind==='holiday')featured=storedEvent(upcoming.find(item=>item.category==='holiday'&&item.work_free)||upcoming.find(item=>item.category==='holiday')||upcoming[0]);
  if(kind==='school'){activeFilter='school';$$('[data-event-filter]').forEach(item=>item.setAttribute('aria-pressed',String(item.dataset.eventFilter==='school')));$('[data-region-control]').hidden=false;renderEvents();const next=availableEvents().find(item=>item.category==='school');if(next)featured=storedEvent(next)}
  if(kind==='christmas')featured=storedEvent(upcoming.find(item=>item.title.toLocaleLowerCase('sl').includes('božič'))||upcoming.find(item=>item.title.toLocaleLowerCase('sl').includes('novolet'))||upcoming[0]);
  if(featured)renderFeature();document.querySelector('#izberi-dogodek').scrollIntoView({behavior:'smooth',block:'start'});
 }));
 renderSaved();renderEvents();renderFeature();updateTimers();
})();
