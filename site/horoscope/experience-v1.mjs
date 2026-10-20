import {localDate,wallTimeCandidates,ascendantLongitude,signIndex} from './math-v1.mjs';
const root=document.querySelector('[data-horoscope-app]');
if(root){
  const $=selector=>root.querySelector(selector),$$=selector=>[...root.querySelectorAll(selector)];
  const profiles=JSON.parse($('#zodiac-profiles').textContent),sign=root.dataset.sign;
  const dateLabel=day=>new Intl.DateTimeFormat('sl-SI',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Ljubljana'}).format(new Date(day+'T12:00:00Z'));
  const yesterday=()=>{const day=new Date(localDate()+'T12:00:00Z');day.setUTCDate(day.getUTCDate()-1);return day.toISOString().slice(0,10);};
  let mode='today',requestId=0,lastChecked=0;
  function applyEdition(edition){
    const day=edition.local_date,stamp=$('[data-edition-date]');stamp.dateTime=day;stamp.textContent=dateLabel(day);
    $('[data-edition-status]').textContent=day===localDate()?'Današnja izdaja':day===yesterday()?'Včerajšnja izdaja':'Dnevna izdaja';
    $('[data-moon-sign]').textContent='Luna v '+edition.sky.moon.locative;
    $('[data-moon-phase]').textContent=edition.sky.moon.phase+' · '+edition.sky.moon.illumination+' % osvetljenosti';
    if(sign){for(const field of $$('[data-reading-field]'))field.textContent=edition.signs[sign][field.dataset.readingField]||'';}
    for(const card of $$('[data-sign-card]'))card.querySelector('[data-card-copy]').textContent=edition.signs[card.dataset.signCard].title;
    root.dataset.editionDay=day;$('[data-refresh-note]').hidden=true;
    for(const button of $$('[data-reading-day]'))button.setAttribute('aria-pressed',String(button.dataset.readingDay===mode));
  }
  function validate(edition,day){
    if(edition.local_date!==day||edition.time_zone!=='Europe/Ljubljana'||!edition.sky?.moon||Object.keys(edition.signs||{}).length!==12)throw Error('Datum ali vsebina izdaje ni veljavna.');
    for(const profile of profiles){const row=edition.signs[profile.slug];if(!row||['title','overview','love','work','wellbeing','thought'].some(key=>typeof row[key]!=='string'||!row[key].trim()))throw Error('Izdaja ni popolna.');}
    return edition;
  }
  async function refresh(nextMode=mode){
    const id=++requestId,day=nextMode==='yesterday'?yesterday():localDate();lastChecked=Date.now();
    try{
      let edition;
      for(const url of ['/horoskop/dnevno.json?date='+day,'/horoscope/daily.json']){
        const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
        try{const response=await fetch(url,{cache:'no-store',signal:controller.signal});if(!response.ok)throw Error('Izdaja ni dosegljiva.');edition=validate(await response.json(),day);break;}catch{}finally{clearTimeout(timeout);}
      }
      if(!edition)throw Error();if(id!==requestId)return;
      mode=nextMode;applyEdition(edition);
    }catch{
      if(id!==requestId)return;
      const note=$('[data-refresh-note]');
      if(nextMode!==mode){note.textContent='Izbrane izdaje trenutno ni mogoče pridobiti. Prikazan je zapis z datumom '+($('[data-edition-date]').textContent)+'.';note.hidden=false;}
      else if(root.dataset.editionDay!==day){$('[data-edition-status]').textContent='Zadnja pripravljena izdaja';note.textContent='Današnja izdaja trenutno ni dosegljiva. Prikazan je zapis z dejanskim datumom '+$('[data-edition-date]').textContent+'. Osvežitev bomo ponovno preverili.';note.hidden=false;}
    }
  }
  for(const button of $$('[data-reading-day]'))button.addEventListener('click',()=>refresh(button.dataset.readingDay));
  for(const button of $$('[data-sign-filter]'))button.addEventListener('click',()=>{
    const filter=button.dataset.signFilter;for(const item of $$('[data-sign-filter]'))item.setAttribute('aria-pressed',String(item===button));
    for(const card of $$('[data-sign-card]'))card.hidden=filter!=='all'&&card.dataset.element!==filter;
  });
  const checkDay=()=>{if(document.hidden)return;const expected=mode==='yesterday'?yesterday():localDate();if(root.dataset.editionDay!==expected||Date.now()-lastChecked>900000)refresh();};
  setTimeout(()=>refresh(),50);setInterval(checkDay,60000);document.addEventListener('visibilitychange',checkDay);

  const form=$('[data-birth-form]'),result=$('[data-birth-result]'),place=$('[data-birth-place]');
  const cities=[
    ['Ljubljana, Slovenija',46.0569,14.5058,'Europe/Ljubljana'],['Maribor, Slovenija',46.5547,15.6459,'Europe/Ljubljana'],['Celje, Slovenija',46.2397,15.2677,'Europe/Ljubljana'],['Kranj, Slovenija',46.2389,14.3556,'Europe/Ljubljana'],['Koper, Slovenija',45.5481,13.7302,'Europe/Ljubljana'],['Novo mesto, Slovenija',45.803,15.168,'Europe/Ljubljana'],['Nova Gorica, Slovenija',45.956,13.648,'Europe/Ljubljana'],['Murska Sobota, Slovenija',46.6625,16.1664,'Europe/Ljubljana'],['Ptuj, Slovenija',46.42,15.87,'Europe/Ljubljana'],['Velenje, Slovenija',46.36,15.11,'Europe/Ljubljana'],['Jesenice, Slovenija',46.436,14.054,'Europe/Ljubljana'],['Bled, Slovenija',46.369,14.114,'Europe/Ljubljana'],['Izola, Slovenija',45.536,13.66,'Europe/Ljubljana'],['Postojna, Slovenija',45.775,14.214,'Europe/Ljubljana'],['Slovenj Gradec, Slovenija',46.511,15.08,'Europe/Ljubljana'],
    ['Dunaj, Avstrija',48.2082,16.3738,'Europe/Vienna'],['Zagreb, Hrvaška',45.815,15.9819,'Europe/Zagreb'],['Beograd, Srbija',44.7866,20.4489,'Europe/Belgrade'],['Sarajevo, Bosna in Hercegovina',43.8563,18.4131,'Europe/Sarajevo'],['Skopje, Severna Makedonija',41.9981,21.4254,'Europe/Skopje'],['Rim, Italija',41.9028,12.4964,'Europe/Rome'],['Berlin, Nemčija',52.52,13.405,'Europe/Berlin'],['Pariz, Francija',48.8566,2.3522,'Europe/Paris'],['London, Združeno kraljestvo',51.5074,-.1278,'Europe/London'],['Istanbul, Turčija',41.0082,28.9784,'Europe/Istanbul'],['New York, ZDA',40.7128,-74.006,'America/New_York'],['Los Angeles, ZDA',34.0522,-118.2437,'America/Los_Angeles'],['Buenos Aires, Argentina',-34.6037,-58.3816,'America/Argentina/Buenos_Aires'],['Cape Town, Južna Afrika',-33.9249,18.4241,'Africa/Johannesburg'],['New Delhi, Indija',28.6139,77.209,'Asia/Kolkata'],['Tokio, Japonska',35.6762,139.6503,'Asia/Tokyo'],['Sydney, Avstralija',-33.8688,151.2093,'Australia/Sydney'],['Honolulu, ZDA',21.3099,-157.8581,'Pacific/Honolulu']
  ];
  place.replaceChildren(...cities.map(([label,lat,lon,zone])=>{const option=document.createElement('option');option.value=[lat,lon,zone].join('|');option.textContent=label;return option;}));
  place.addEventListener('change',()=>{const [lat,lon,zone]=place.value.split('|');$('[data-birth-lat]').value=lat;$('[data-birth-lon]').value=lon;$('[data-birth-zone]').value=zone;});
  form.addEventListener('input',event=>{if(event.target.matches('[data-birth-fold]'))return;result.hidden=true;$('[data-birth-fold-label]').hidden=true;$('[data-birth-fold]').value='';});
  const element=(tag,text,className)=>{const node=document.createElement(tag);if(text)node.textContent=text;if(className)node.className=className;return node;};
  let skyModule;
  form.addEventListener('submit',async event=>{
    event.preventDefault();const submit=$('[data-birth-submit]');result.hidden=false;result.classList.remove('is-error');result.replaceChildren(element('p','Pripravljamo izračun …'));submit.disabled=true;
    try{
      const day=$('[data-birth-date]').value,clock=$('[data-birth-time]').value;
      if(day<'1900-01-01'||day>localDate())throw Error('Izberite veljaven datum rojstva od leta 1900 do danes.');
      const manual=$('[data-manual-place]').open;
      const [latText,lonText,timeZone]=manual?[$('[data-birth-lat]').value,$('[data-birth-lon]').value,$('[data-birth-zone]').value.trim()]:place.value.split('|');
      if(!latText.trim()||!lonText.trim()||!timeZone)throw Error('Vnesite koordinate in časovni pas rojstnega kraja.');
      const lat=Number(latText),lon=Number(lonText);
      const instants=wallTimeCandidates(day,clock,timeZone);
      if(!instants.length)throw Error('Ta krajevna ura zaradi premika na poletni čas ni obstajala. Preverite zapisano uro rojstva in časovni pas.');
      let instant=instants[0];
      if(instants.length>1){$('[data-birth-fold-label]').hidden=false;const fold=$('[data-birth-fold]').value;if(fold==='')throw Error('Ob tej uri se je ura premaknila nazaj. Zgoraj izberite prvi ali drugi pojav krajevne ure.');instant=instants[Number(fold)];}
      if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>=90||Math.abs(lon)>180)throw Error('Preverite zemljepisni koordinati rojstnega kraja.');
      skyModule ||= import('./sky-v1.mjs').catch(error=>{skyModule=null;throw error;});
      let sky;try{sky=await skyModule;}catch{throw Error('Izračunske knjižnice ni mogoče naložiti. Preverite povezavo in poskusite znova.');}
      const rotation=sky.Rotation_EQD_ECT(instant).rot,obliquity=Math.atan2(Math.abs(rotation[1][2]),rotation[1][1])*180/Math.PI;
      const angle=ascendantLongitude(sky.SiderealTime(instant),obliquity,lat,lon),index=signIndex(angle),rising=profiles[index],sun=profiles[signIndex(sky.SunPosition(instant).elon)];
      const title=element('h3','Vaše vzhajajoče znamenje: '+rising.name),list=element('dl');
      for(const [label,value] of [['Vzhajajoče znamenje',rising.name],['Položaj v znamenju',(angle%30).toLocaleString('sl-SI',{minimumFractionDigits:2,maximumFractionDigits:2})+'°'],['Sončno znamenje',sun.name]]){const row=element('div');row.append(element('dt',label),element('dd',value));list.append(row);}
      const link=element('a','Preberite horoskop: '+rising.name+' →');link.href='/horoskop/'+rising.slug+'/';
      const note=element('p','Tropski zodiak · časovni pas '+timeZone+' · trenutek '+instant.toISOString().replace('T',' ').replace('.000Z',' UTC')+'. Geometrijski izračun; astrološka razlaga je simbolna.','z-calculation-note');
      result.replaceChildren(element('span','VAŠ OSEBNI ZVEZDNI KOMPAS','z-kicker'),title,list,element('p',rising.rising),link,note);
      if(Math.min(angle%30,30-angle%30)<.5)result.append(element('p','Rezultat je blizu meje znamenj. Že nekaj minut razlike v uri rojstva lahko spremeni znamenje.','z-calculation-note'));
      if(Math.abs(lat)>66)result.append(element('p','V polarnih območjih se vzhajajoča znamenja menjavajo neenakomerno; preverite posebno natančnost časa in kraja.','z-calculation-note'));
    }catch(error){result.classList.add('is-error');result.replaceChildren(element('p',error.message));}finally{submit.disabled=false;}
  });
  $('[data-birth-date]').max=localDate();$('[data-birth-fields]').disabled=false;
}
