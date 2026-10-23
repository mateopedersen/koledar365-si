/* Independent first-paint clock and city forecast. No calendar/Wasm boot dependency. */
(()=>{'use strict';
const card=document.getElementById('city-card');if(!card||card.dataset.liveInitialized)return;card.dataset.liveInitialized='true';
const $=id=>card.querySelector('#'+id),select=$('city-select'),fetchWeather=window.fetch.bind(window);
const zone='Europe/Ljubljana',timeFormat=new Intl.DateTimeFormat('sl-SI',{timeZone:zone,hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}),dayFormat=new Intl.DateTimeFormat('sl-SI',{timeZone:zone,weekday:'long',day:'numeric',month:'long',year:'numeric'}),zoneFormat=new Intl.DateTimeFormat('en-GB',{timeZone:zone,timeZoneName:'short'}),shortTime=new Intl.DateTimeFormat('sl-SI',{timeZone:zone,hour:'2-digit',minute:'2-digit'}),number=new Intl.NumberFormat('sl-SI',{maximumFractionDigits:0});
let clockTimer,weatherTimer,request,revision=0,lastFetch=0,displayed=null,manualCityPreference=false,manualCityChange=false,cityInitializationComplete=false;const memory=new Map(),photos=new Map();
function clock(){
 clearTimeout(clockTimer);const now=new Date(),parts=timeFormat.formatToParts(now),part=name=>parts.find(p=>p.type===name).value,hour=part('hour'),minute=part('minute'),second=part('second');
 $('ljubljana-clock').textContent=hour+':'+minute;$('ljubljana-clock').dateTime=now.toISOString();$('city-clock-seconds').textContent=second;
 const label=dayFormat.format(now);$('city-today').textContent=label.charAt(0).toUpperCase()+label.slice(1);$('city-zone').textContent=zoneFormat.formatToParts(now).find(p=>p.type==='timeZoneName').value;
 card.style.setProperty('--clock-hour',((Number(hour)%12)*30+Number(minute)/2)+'deg');card.style.setProperty('--clock-minute',(Number(minute)*6+Number(second)/10)+'deg');card.style.setProperty('--clock-second',(Number(second)*6)+'deg');
 clockTimer=setTimeout(clock,1000-Date.now()%1000+5);
}
const canRemember=()=>{try{const c=JSON.parse(localStorage.getItem('k365.consent'));return c?.version===2&&c.preferences===true&&c.expiresAt>Date.now()}catch{return false}};
const remember=()=>{if(manualCityPreference&&canRemember())try{localStorage.setItem('k365.city',JSON.stringify(select.value))}catch{}};
function chosen(id=select.value){const option=[...select.options].find(option=>option.value===id);return{id:option.value,name:option.textContent.trim(),photo:option.dataset.photo,srcset:option.dataset.photoSrcset,avif:option.dataset.photoAvif,credit:option.dataset.credit}}
function forecastNow(body,id){
 const now=Date.now(),updated=Date.parse(body?.updated_at);if(body?.city!==id||!Number.isFinite(updated)||updated>now+300000||now-updated>=43200000||!Array.isArray(body.hours))return null;
 const rows=[body.current,...body.hours].filter(row=>Number.isFinite(Date.parse(row?.at))&&Number.isFinite(row?.temperature)&&typeof row.symbol==='string').sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
 const past=rows.filter(row=>Date.parse(row.at)<=now),current=past.length?past[past.length-1]:rows[0];
 return current&&Math.abs(now-Date.parse(current.at))<7200000?{...body,current}:null;
}
const usable=(body,id)=>Boolean(forecastNow(body,id));
function preparePhoto(city){
 const current=$('city-photo');if(current.getAttribute('src')===city.photo)return current.decode().catch(()=>{});
 if(!photos.has(city.photo)){
  const picture=document.createElement('picture'),source=document.createElement('source'),image=new Image();picture.hidden=true;
  source.type='image/avif';source.srcset=city.avif||'';source.sizes=current.sizes;picture.append(source,image);
  image.sizes=current.sizes;image.srcset=city.srcset||'';image.src=city.photo;image.alt='';card.append(picture);
  photos.set(city.photo,new Promise(resolve=>{const timeout=setTimeout(()=>{photos.delete(city.photo);picture.remove();resolve()},2000);image.decode().catch(()=>{photos.delete(city.photo)}).finally(()=>{clearTimeout(timeout);picture.remove();resolve()})}));
 }
 return photos.get(city.photo);
}

function cached(id){let record=memory.get(id);if(!record)try{record=JSON.parse(sessionStorage.getItem('k365.weather.v1:'+id))}catch{}return record&&Date.now()-record.savedAt<1800000&&usable(record.body,id)?record.body:null}
function keep(body){const record={savedAt:Date.now(),body};memory.set(body.city,record);try{sessionStorage.setItem('k365.weather.v1:'+body.city,JSON.stringify(record))}catch{}}
function scene(symbol){
 const clear=/clearsky/.test(symbol),part=/fair|partlycloudy/.test(symbol),night=/_night/.test(symbol),rain=/rain|sleet/.test(symbol),snow=/snow|sleet/.test(symbol),storm=/thunder/.test(symbol),fog=/fog/.test(symbol);
 const condition=storm?'storm':snow?'snow':rain?'rain':fog?'fog':clear?'clear':part?'partly':'cloud';card.dataset.weatherCondition=condition;card.dataset.weatherNight=String(night);
 let svg='<svg class="weather-scene" viewBox="0 0 100 100" aria-hidden="true"><defs><radialGradient id="wx-halo"><stop stop-color="#ffd674" stop-opacity=".6"/><stop offset="1" stop-color="#ffe7a8" stop-opacity="0"/></radialGradient><linearGradient id="wx-cloud" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff"/><stop offset="1" stop-color="#c7d9ed"/></linearGradient><linearGradient id="wx-sun" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffdf65"/><stop offset="1" stop-color="#f8a51c"/></linearGradient></defs>';
 if(clear||part){
  if(night)svg+='<g class="wx-moon"><path d="M60 17a25 25 0 1 0 23 36A26 26 0 0 1 60 17Z" fill="#d5e4fa" stroke="#a8c4e5"/><path class="wx-star" d="m30 17 2 5 5 2-5 2-2 5-2-5-5-2 5-2Zm44 8 1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5Z" fill="#91afd2"/></g>';
  else svg+='<g class="wx-sun '+(part?'wx-sun-partly':'')+'"><circle class="wx-halo" cx="50" cy="47" r="46" fill="url(#wx-halo)"/><g class="wx-rays" stroke="#f5ac26" stroke-width="3" stroke-linecap="round"><path d="M50 12v8m0 54v8M15 47h8m54 0h8M25 22l6 6m38 38 6 6M25 72l6-6m38-38 6-6"/></g><circle class="wx-sun-core" cx="50" cy="47" r="19" fill="url(#wx-sun)"/><path d="M39 42a13 13 0 0 1 12-9" fill="none" stroke="#fff6ce" stroke-width="2" stroke-linecap="round"/></g>';
 }
 if(!clear)svg+='<g class="wx-cloud-back"><path d="M29 58a15 15 0 0 1 12-22 20 20 0 0 1 36 10 13 13 0 0 1 2 26H34Z" fill="#adc8e4" opacity=".65"/></g><g class="wx-cloud-front"><path d="M22 72a14 14 0 0 1 0-28 20 20 0 0 1 38-3 16 16 0 0 1 13 31Z" fill="url(#wx-cloud)" stroke="#b4cbdf" stroke-width="1"/><path d="M29 46a14 14 0 0 1 23-2" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"/></g>';
 if(rain)svg+='<g class="wx-rain" stroke="#4d9de3" stroke-width="3" stroke-linecap="round"><path d="m31 77-4 9"/><path d="m48 77-4 9"/><path d="m65 77-4 9"/></g>';
 if(snow)svg+='<g class="wx-snow" fill="#7eafd6"><circle cx="28" cy="81" r="2.5"/><circle cx="47" cy="86" r="2.5"/><circle cx="65" cy="80" r="2.5"/></g>';
 if(storm)svg+='<path class="wx-bolt" d="m50 61-12 19h11l-5 16 22-25H54l7-10Z" fill="#ffbd3b" stroke="#ee9b18" stroke-linejoin="round"/>';
 if(fog)svg+='<g class="wx-fog" fill="none" stroke="#a5bbcf" stroke-width="3" stroke-linecap="round"><path d="M18 77h58"/><path d="M26 85h55"/><path d="M19 92h46"/></g>';
 return svg+'</svg>';
}
function text(id,value){$(id).textContent=value}
function render(body,saved=false){
 body=forecastNow(body,select.value);if(!body)return;displayed=body;const city=chosen(body.city),current=body.current,stale=saved||body.stale;
 // Commit the photograph, its caption, and this city's forecast in one paint.
 text('weather-label','Vreme · '+city.name);text('city-caption',city.name+', Slovenija');$('city-credit').href=city.credit;const photo=$('city-photo');if(photo.getAttribute('src')!==city.photo){$('city-photo-avif').srcset=city.avif||'';photo.srcset=city.srcset||'';photo.src=city.photo;}photo.alt=city.name+' – pogled na mesto';remember();
 card.dataset.weatherCity=city.id;card.dataset.weatherSymbol=current.symbol;card.dataset.weatherState=stale?'saved':'ready';$('weather-icon').innerHTML=scene(current.symbol);text('weather-description',current.description+(/_night$/.test(current.symbol)?' · noč':''));text('weather-temperature',number.format(current.temperature)+'°');
 text('weather-updated',(stale?'Shranjena napoved':'Napoved')+' za '+shortTime.format(new Date(current.at)));text('weather-published','Vir posodobljen ob '+shortTime.format(new Date(body.updated_at))+' · MET Norway');
 const more=$('weather-more');more.replaceChildren();const facts=document.createElement('div');facts.className='weather-facts';for(const [label,value] of [['Veter',number.format(current.wind)+' m/s'],['Vlažnost',number.format(current.humidity)+' %']]){const cell=document.createElement('div'),name=document.createElement('span'),strong=document.createElement('strong');name.textContent=label;strong.textContent=value;cell.append(name,strong);facts.append(cell)}more.append(facts);
 const hours=document.createElement('div');hours.className='weather-hours';hours.setAttribute('aria-label','Urna napoved');for(const h of body.hours.filter(h=>Date.parse(h.at)>=Date.now()).slice(0,12)){const cell=document.createElement('div'),label=document.createElement('time'),temp=document.createElement('strong');label.dateTime=h.at;label.textContent=shortTime.format(new Date(h.at));temp.textContent=number.format(h.temperature)+'°';cell.title=h.description;cell.append(label,temp);hours.append(cell)}more.append(hours);
 const note=document.createElement('p');note.className='muted';note.textContent='Modelna napoved: MET Norway · CC BY 4.0. Simbol Lune označuje nočno vreme, ne Lunine mene. Fotografija prikazuje mesto, ne trenutnega vremena.';more.append(note);
}
function schedule(body){const now=Date.now(),remaining=Date.parse(body.expires_at)-now,delay=body.stale?15000:Math.max(60000,Math.min(300000,remaining||60000));weatherTimer=setTimeout(()=>{if(!document.hidden)refresh()},Math.min(delay,3600000-now%3600000+20))}
async function refresh(force=false){
 clearTimeout(weatherTimer);request?.abort();const controller=new AbortController();request=controller;const id=select.value,token=++revision,city=chosen(id),photoReady=preparePhoto(city),previous=displayed?.city===id&&usable(displayed,id)?displayed:cached(id);
 card.dataset.pendingCity=id;$('city-weather').setAttribute('aria-busy','true');card.classList.add('is-refreshing');$('weather-refresh').disabled=true;$('weather-refresh').setAttribute('aria-label','Osveževanje vremenske napovedi');text('weather-refresh-label','Osvežujem');const timeout=setTimeout(()=>controller.abort(),8000);
 try{
  if(previous){await photoReady;if(token!==revision||select.value!==id)return;render(previous,!memory.has(id)||Date.parse(previous.expires_at)<=Date.now());if(!force&&!previous.stale&&Date.parse(previous.expires_at)>Date.now()){schedule(previous);return}}
  // Keep the last complete, correctly labelled card until the new city is ready.
  // A cold network request must never blank the temperature or replace it with a spinner.
  const response=await fetchWeather('/vreme/'+id+'/',{signal:controller.signal,cache:force?'reload':'default'}),body=await response.json();if(token!==revision||select.value!==id)return;
  if(!response.ok||!usable(body,id))throw Error('Sveža napoved trenutno ni na voljo.');
  // Weather timestamps describe the forecast, and must never change the live clock.
  await photoReady;if(token!==revision||select.value!==id)return;keep(body);render(body);lastFetch=Date.now();schedule(body);
 }catch(error){
  if(token!==revision||select.value!==id)return;
  if(previous){render(previous,true);text('weather-updated','Shranjena napoved · poskusite osvežiti')}
  else if(displayed&&usable(displayed,displayed.city)){select.value=displayed.city;text('weather-updated','Napoved za '+city.name+' ni dosegljiva. Poskusite znova.')}
  else{card.dataset.weatherState='unavailable';text('weather-label','Vreme · '+city.name);text('weather-description','Napoved ni dosegljiva');text('weather-temperature','—');$('weather-icon').innerHTML='<svg class="weather-unavailable" viewBox="0 0 100 100"><circle cx="50" cy="50" r="25" fill="#f1f5fa" stroke="#b7c9dc" stroke-width="2"/><path d="M50 33v19m0 10v2" stroke="#7895b3" stroke-width="3" stroke-linecap="round"/></svg>';text('weather-updated','Vir se ne odziva · poskusite znova')}
  weatherTimer=setTimeout(()=>{if(!document.hidden)refresh()},60000);
 }finally{clearTimeout(timeout);if(token===revision){delete card.dataset.pendingCity;$('city-weather').removeAttribute('aria-busy');card.classList.remove('is-refreshing');$('weather-refresh').disabled=false;$('weather-refresh').setAttribute('aria-label','Osveži vremensko napoved');text('weather-refresh-label','Osveži');request=null}}
}
function changeCity(){refresh()}
function locationStatus(message){const status=$('city-location-status');if(status)status.textContent=message}
function validCity(id){return typeof id==='string'&&[...select.options].some(option=>option.value===id)}
async function initializeCity(){
 let saved=null;try{if(canRemember())saved=JSON.parse(localStorage.getItem('k365.city'))}catch{}
 if(validCity(saved)){
  select.value=saved;manualCityPreference=true;locationStatus('Uporabljate svoje shranjeno mesto.');cityInitializationComplete=true;changeCity();return;
 }
 locationStatus('Približno lokacijo mesta določamo prek omrežja …');
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),1500);let result=null;
 try{const response=await fetch('/city-detect/',{signal:controller.signal,cache:'no-store',headers:{Accept:'application/json'}});if(response.ok)result=await response.json()}catch{}finally{clearTimeout(timeout)}
 if(manualCityChange)return;
 if(result&&validCity(result.city)){
  select.value=result.city;
  locationStatus(result.match==='nearby'?'Približna IP-lokacija: izbrano je najbližje mesto.':'Približna lokacija je določena iz IP-ja. Mesto lahko spremenite.');
 }else locationStatus('Lokacije ni mogoče oceniti; izberite svoje mesto.');
 cityInitializationComplete=true;changeCity();
}
select.addEventListener('change',()=>{manualCityChange=true;manualCityPreference=true;cityInitializationComplete=true;locationStatus('Mesto ste izbrali ročno.');remember();changeCity()});$('weather-refresh').addEventListener('click',()=>refresh(true));document.addEventListener('k365:consent',remember);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){clock();if(cityInitializationComplete&&Date.now()-lastFetch>60000)refresh()}});window.addEventListener('pageshow',()=>{clock();if(cityInitializationComplete&&Date.now()-lastFetch>60000&&!request)refresh()});window.addEventListener('online',()=>{if(cityInitializationComplete)refresh(true)});
clock();initializeCity();
})();
