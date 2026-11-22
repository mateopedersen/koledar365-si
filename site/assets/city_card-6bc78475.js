/* Independent first-paint clock and city forecast. No calendar/Wasm boot dependency. */
(()=>{'use strict';
const card=document.getElementById('city-card');if(!card||card.dataset.liveInitialized)return;card.dataset.liveInitialized='true';
const $=id=>card.querySelector('#'+id),select=$('city-select'),fetchWeather=window.fetch.bind(window);
const widget=$('city-weather'),details=widget.querySelector('.weather-details'),hero=widget.querySelector('.weather-hero');
const zone='Europe/Ljubljana',timeFormat=new Intl.DateTimeFormat('sl-SI',{timeZone:zone,hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}),dayFormat=new Intl.DateTimeFormat('sl-SI',{timeZone:zone,weekday:'long',day:'numeric',month:'long',year:'numeric'}),zoneFormat=new Intl.DateTimeFormat('en-GB',{timeZone:zone,timeZoneName:'short'}),shortTime=new Intl.DateTimeFormat('sl-SI',{timeZone:zone,hour:'2-digit',minute:'2-digit'}),number=new Intl.NumberFormat('sl-SI',{useGrouping:false,maximumFractionDigits:0});
let clockTimer,weatherTimer,request,revision=0,lastFetch=0,displayed=null,manualCityPreference=false,manualCityChange=false,cityInitializationComplete=false;const memory=new Map();
let cityPhotos;
function updateCityPhoto(id=select.value){cityPhotos??=import('/photo-time/slovenia-9ae27fc9896105e3.mjs').then(module=>module.createSiteCityPhotos(card,select));return cityPhotos.then(controller=>controller.select(id));}

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
function cached(id){let record=memory.get(id);if(!record)try{record=JSON.parse(sessionStorage.getItem('k365.weather.v1:'+id))}catch{}return record&&Date.now()-record.savedAt<1800000&&usable(record.body,id)?record.body:null}
function keep(body){const record={savedAt:Date.now(),body};memory.set(body.city,record);try{sessionStorage.setItem('k365.weather.v1:'+body.city,JSON.stringify(record))}catch{}}
function showWeatherScene(symbol){
 const unavailable=symbol===null;
 const clear=/^clearsky/.test(symbol),partly=/^(fair|partlycloudy)/.test(symbol),night=/_night$/.test(symbol);
 const mixed=/sleet/.test(symbol),rain=mixed||/rain/.test(symbol),snow=mixed||/snow/.test(symbol);
 const storm=/thunder/.test(symbol),fog=/fog/.test(symbol);
 const condition=unavailable?'unavailable':storm?'storm':mixed?'sleet':snow?'snow':rain?'rain':fog?'fog':clear?'clear':partly?'partly':'cloud';
 const layers={
  ground:!unavailable, sun:(clear||partly)&&!night, moon:(clear||partly)&&night,
  cloud:!clear&&!unavailable, rain, snow, storm, fog, unavailable,
 };
 const svg=$('city-weather-art').content.firstElementChild.cloneNode(true);
 for(const layer of svg.querySelectorAll('[data-weather-layer]')){
  if(!layers[layer.dataset.weatherLayer])layer.remove();
 }
 card.dataset.weatherCondition=condition;
 card.dataset.weatherNight=String(night);
 $('weather-icon').replaceChildren(svg);
}
if('IntersectionObserver' in window){
 new IntersectionObserver(([entry])=>hero.toggleAttribute('data-weather-in-view',entry.isIntersecting)).observe(hero);
}else hero.setAttribute('data-weather-in-view','');

function text(id,value){$(id).textContent=value}
const weatherAmount=new Intl.NumberFormat('sl-SI',{useGrouping:false,maximumFractionDigits:1});
function formatReading(value, unit, format=number){
 return Number.isFinite(value)?format.format(value)+unit:'—';
}
function render(body,saved=false){
 body=forecastNow(body,select.value);if(!body)return;displayed=body;const city=chosen(body.city),current=body.current,stale=saved||body.stale;
 text('weather-label','Vreme · '+city.name);remember();
 if(card.dataset.weatherSymbol!==current.symbol)showWeatherScene(current.symbol);
 card.dataset.weatherCity=city.id;card.dataset.weatherSymbol=current.symbol;card.dataset.weatherState=stale?'saved':'ready';
 text('weather-description',(current.description||'Razmere niso navedene')+(/_night$/.test(current.symbol)?' · noč':''));
 text('weather-temperature',number.format(current.temperature)+'°');
 text('weather-updated',(stale?'Shranjena napoved':'Napoved')+' za '+shortTime.format(new Date(current.at)));
 text('weather-published','Vir ob '+shortTime.format(new Date(body.updated_at))+' · MET Norway');
 renderWeatherDetails(body);
 details.hidden=false;
}
function renderWeatherDetails({current,hours}){
 const more=$('weather-more');
 const facts=document.createElement('dl');
 facts.className='weather-facts';
 const readings=[
  ['Veter',formatReading(current.wind,' m/s')],
  ['Vlažnost',formatReading(current.humidity,' %')],
  ['Padavine v 1 h',formatReading(current.precipitation,' mm',weatherAmount)],
 ];
 for(const [label,value] of readings){
  const cell=document.createElement('div'),name=document.createElement('dt'),amount=document.createElement('dd');
  name.textContent=label;amount.textContent=value;
  cell.append(name,amount);facts.append(cell);
 }
 more.replaceChildren(facts);
 const nextHours=hours.filter(hour=>Date.parse(hour.at)>=Date.now()&&Number.isFinite(hour.temperature)).slice(0,12);
 if(nextHours.length){
  const forecast=document.createElement('ul');
  forecast.className='weather-hours';
  forecast.setAttribute('aria-label','Temperature po urah');
  for(const hour of nextHours){
   const cell=document.createElement('li'),label=document.createElement('time'),temp=document.createElement('strong');
   label.dateTime=hour.at;label.textContent=shortTime.format(new Date(hour.at));
   temp.textContent=number.format(hour.temperature)+'°';
   if(hour.description)cell.title=hour.description;
   cell.append(label,temp);forecast.append(cell);
  }
  more.append(forecast);
 }
 const note=document.createElement('p');note.className='weather-attribution';
 note.textContent='Modelna napoved · MET Norway · CC BY 4.0';
 more.append(note);
}
function schedule(body){const now=Date.now(),remaining=Date.parse(body.expires_at)-now,delay=body.stale?15000:Math.max(60000,Math.min(300000,remaining||60000));weatherTimer=setTimeout(()=>{if(!document.hidden)refresh()},Math.min(delay,3600000-now%3600000+20))}
async function refresh(force=false){
 clearTimeout(weatherTimer);request?.abort();const controller=new AbortController();request=controller;const id=select.value,token=++revision,city=chosen(id),previous=displayed?.city===id&&usable(displayed,id)?displayed:cached(id);
 card.dataset.pendingCity=id;widget.setAttribute('aria-busy','true');card.classList.add('is-refreshing');$('weather-refresh').disabled=true;$('weather-refresh').setAttribute('aria-label','Osveževanje vremenske napovedi');text('weather-refresh-label','Osvežujem');const timeout=setTimeout(()=>controller.abort(),8000);
 try{
  if(previous){if(token!==revision||select.value!==id)return;render(previous,!memory.has(id)||Date.parse(previous.expires_at)<=Date.now());if(!force&&!previous.stale&&Date.parse(previous.expires_at)>Date.now()){schedule(previous);return}}
  // Keep the last complete, correctly labelled card until the new city is ready.
  // A cold network request must never blank the temperature or replace it with a spinner.
  const response=await fetchWeather('/vreme/'+id+'/',{signal:controller.signal,cache:force?'reload':'default'}),body=await response.json();if(token!==revision||select.value!==id)return;
  if(!response.ok||!usable(body,id))throw Error('Sveža napoved trenutno ni na voljo.');
  // Weather timestamps describe the forecast, and must never change the live clock.
  if(token!==revision||select.value!==id)return;keep(body);render(body);lastFetch=Date.now();schedule(body);
 }catch(error){
  if(token!==revision||select.value!==id)return;
  if(previous){render(previous,true);text('weather-updated','Shranjena napoved · poskusite osvežiti')}
  else if(displayed&&usable(displayed,displayed.city)){select.value=displayed.city;void updateCityPhoto();text('weather-updated','Napoved za '+city.name+' ni dosegljiva. Poskusite znova.')}
  else{
   card.dataset.weatherState='unavailable';delete card.dataset.weatherCity;delete card.dataset.weatherSymbol;
   showWeatherScene(null);
   text('weather-label','Vreme · '+city.name);
   text('weather-description','Napoved ni dosegljiva');
   text('weather-temperature','—');text('weather-updated','Vir se ne odziva · poskusite znova');
   text('weather-published','Modelna napoved · MET Norway');
   details.hidden=true;
  }
  weatherTimer=setTimeout(()=>{if(!document.hidden)refresh()},60000);
 }finally{clearTimeout(timeout);if(token===revision){delete card.dataset.pendingCity;widget.removeAttribute('aria-busy');card.classList.remove('is-refreshing');$('weather-refresh').disabled=false;$('weather-refresh').setAttribute('aria-label','Osveži vremensko napoved');text('weather-refresh-label','Osveži');request=null}}
}
function changeCity(){void updateCityPhoto();refresh()}
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
 }else locationStatus('Prikazujemo privzeto mesto. Po želji izberite drugo.');
 cityInitializationComplete=true;changeCity();
}
select.addEventListener('change',()=>{manualCityChange=true;manualCityPreference=true;cityInitializationComplete=true;locationStatus('Mesto ste izbrali ročno.');remember();changeCity()});$('weather-refresh').addEventListener('click',()=>refresh(true));document.addEventListener('k365:consent',remember);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){clock();if(cityInitializationComplete&&Date.now()-lastFetch>60000)refresh()}});window.addEventListener('pageshow',()=>{clock();if(cityInitializationComplete&&Date.now()-lastFetch>60000&&!request)refresh()});window.addEventListener('online',()=>{if(cityInitializationComplete)refresh(true)});
clock();initializeCity();
})();
