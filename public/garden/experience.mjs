import {sloveniaToday,isDate,dateLabel,calendarICS,download} from './calendar-tools.mjs';
export const PLAN_KEY='k365.garden.plan.v1';
const newPlanId=()=>globalThis.crypto?.randomUUID?.()||`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,12)}`;
export function normalizePlan(input,plants) {
  if(!input||input.version!==1||!Array.isArray(input.tasks)||input.tasks.length>200)throw new Error('Datoteka ni veljaven načrt Koledar365 (največ 200 opravil).');
  const allowed=new Set(plants.map(plant=>plant.id).concat('custom')),seen=new Set();
  return input.tasks.map((row,index)=>{
    if(!row||!allowed.has(row.plant)||!isDate(row.date)||row.date<'1900-01-01'||row.date>'2100-12-31')throw new Error('Načrt vsebuje neveljavno vrtnino ali datum.');
    const id=String(row.id||`import-${index}`).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,80);
    if(!id||seen.has(id))throw new Error('Načrt vsebuje podvojene identifikatorje.');seen.add(id);
    if(!['Setev','Presajanje / sajenje','Pobiranje','Drugo opravilo'].includes(row.task))throw new Error('Načrt vsebuje neznano opravilo.');
    return {id,plant:row.plant,task:row.task,date:row.date,note:String(row.note||'').slice(0,180),done:row.done===true};
  });
}
export function matchesPlant(plant,{query='',month=0,task='all',place='all'}={}) {
  const fold=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  return fold(plant.name).includes(fold(query.trim()))&&plant.tasks.some(item=>(!month||item.months.includes(month))&&(task==='all'||item.id===task)&&(place==='all'||item.place===place));
}

function init(root) {
  const data=JSON.parse(root.querySelector('[data-garden-data]').textContent),plants=new Map(data.plants.map(plant=>[plant.id,plant]));
  const select=selector=>root.querySelector(selector),form=select('[data-garden-plan-form]'),status=select('[data-garden-status]');
  let tasks=[],editing=null,storageAvailable=true;
  try{const stored=localStorage.getItem(PLAN_KEY);if(stored)tasks=normalizePlan(JSON.parse(stored),data.plants);}catch{storageAvailable=false;status.textContent='Shramba ni na voljo ali prejšnji načrt ni veljaven. Načrt lahko vseeno prenesete kot JSON.';}
  const say=message=>{status.textContent=message;};
  const save=()=>{try{localStorage.setItem(PLAN_KEY,JSON.stringify({version:1,tasks}));storageAvailable=true;}catch{storageAvailable=false;say('Brskalnik načrta ne more shraniti. Prenesite JSON, da ga ohranite.');}};
  function updateFilters(){
    const filters={query:select('[data-garden-search]').value,month:Number(select('[data-garden-month]').value),task:select('[data-garden-task]').value,place:select('[data-garden-place]').value};let count=0;
    data.plants.forEach(plant=>{const row=select(`[data-garden-row="${plant.id}"]`),detail=select(`[data-garden-detail="${plant.id}"]`),match=matchesPlant(plant,filters);row.hidden=!match;if(match)count++;else{detail.hidden=true;row.querySelector('[data-garden-details]').setAttribute('aria-expanded','false');}});
    select('[data-garden-count]').textContent=`Vrtnine v izbranem pregledu: ${count} od ${data.plants.length}`;
    select('[data-garden-empty]').hidden=count>0;
    root.querySelectorAll('.garden-timeline thead th').forEach((cell,i)=>cell.classList.toggle('is-current-month',i===filters.month&&filters.month>0));
  }
  ['search','month','task','place'].forEach(key=>select(`[data-garden-${key}]`).addEventListener(key==='search'?'input':'change',updateFilters));
  select('[data-garden-current]').addEventListener('click',()=>{select('[data-garden-month]').value=Number(sloveniaToday().slice(5,7));updateFilters();});
  select('[data-garden-reset]').addEventListener('click',()=>{select('[data-garden-search]').value='';select('[data-garden-month]').value='0';select('[data-garden-task]').value='all';select('[data-garden-place]').value='all';updateFilters();});
  const climateNotes={continental:'Osnovni okvir velja predvsem za kontinentalno Slovenijo. Pred delom preverite vremensko napoved, ogretost tal in navodila za svojo sorto.',coastal:'Primorska ima drugačne temperaturne in svetlobne razmere. Preglednica ostane primerjalni okvir za notranjost Slovenije; za lokalni načrt preverite nasvete KGZS Nova Gorica in izberite svoje datume.',higher:'V višjih legah preverite pozebo, temperaturo tal in dolžino sezone. Ne premikamo vseh vrtnin za enako število dni: osebni datum določite po razmerah na svojem vrtu.',greenhouse:'Ogrevan in neogrevan rastlinjak nista enaka. Preglednica ne napoveduje temperature v vašem prostoru; za vzgojo sadik preverite tudi svetlobo in prezračevanje.'};
  select('[data-garden-climate]').addEventListener('change',event=>{select('[data-garden-climate-note]').textContent=climateNotes[event.target.value];});
  root.querySelectorAll('[data-garden-details]').forEach(button=>button.addEventListener('click',()=>{const detail=select(`[data-garden-detail="${button.dataset.gardenDetails}"]`);detail.hidden=!detail.hidden;button.setAttribute('aria-expanded',String(!detail.hidden));}));
  root.querySelectorAll('[data-garden-pick]').forEach(button=>button.addEventListener('click',()=>{cancelEdit();form.elements.plant.value=button.dataset.gardenPick;select('#moj-vrt').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});form.elements.date.focus({preventScroll:true});say('Izberite svoj datum za vrtnino '+plants.get(button.dataset.gardenPick).name+'.');}));
  function cancelEdit(){editing=null;form.reset();select('[data-garden-save]').textContent='Dodaj v moj načrt';select('[data-garden-cancel]').hidden=true;}
  select('[data-garden-cancel]').addEventListener('click',cancelEdit);
  function renderPlan(){
    const container=select('[data-garden-plan-list]');container.replaceChildren();
    if(!tasks.length){const empty=document.createElement('div');empty.className='garden-plan-empty';const title=document.createElement('h3');title.textContent='Prostor za vašo novo sezono.';const p=document.createElement('p');p.textContent='Dodajte prvo vrtnino in datum. Tukaj se bo sestavil vaš osebni seznam opravil.';empty.append(title,p);container.append(empty);}
    tasks.sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id)).forEach(row=>{
      const item=document.createElement('article');item.className='garden-plan-item'+(row.done?' is-done':'');item.dataset.taskId=row.id;
      const checkLabel=document.createElement('label');checkLabel.className='garden-plan-check';const check=document.createElement('input');check.type='checkbox';check.checked=row.done;check.setAttribute('aria-label','Opravljeno: '+row.task+' – '+(plants.get(row.plant)?.name||'drugo opravilo'));check.addEventListener('change',()=>{row.done=check.checked;save();renderPlan();});checkLabel.append(check);
      const date=document.createElement('time');date.dateTime=row.date;date.textContent=dateLabel(row.date,{day:'numeric',month:'short',year:'numeric'});
      const body=document.createElement('div'),heading=document.createElement('h3'),note=document.createElement('p');heading.textContent=(plants.get(row.plant)?.name||'Vrtno opravilo')+' · '+row.task;note.textContent=row.note;body.append(heading);if(row.note)body.append(note);
      const actions=document.createElement('div');actions.className='garden-plan-item-actions';
      for(const [label,action] of [['Uredi',()=>{editing=row.id;form.elements.plant.value=row.plant;form.elements.task.value=row.task;form.elements.date.value=row.date;form.elements.note.value=row.note;select('[data-garden-save]').textContent='Shrani spremembo';select('[data-garden-cancel]').hidden=false;form.elements.date.focus();}],['Odstrani',()=>{tasks=tasks.filter(task=>task.id!==row.id);if(editing===row.id)cancelEdit();save();renderPlan();say('Opravilo je odstranjeno.');}]]){const button=document.createElement('button');button.type='button';button.textContent=label;button.addEventListener('click',action);actions.append(button);}
      item.append(checkLabel,date,body,actions);container.append(item);
    });
    select('[data-garden-plan-total]').textContent=`Opravila: ${tasks.length}`;
    select('[data-garden-ics]').disabled=!tasks.length;select('[data-garden-backup]').disabled=!tasks.length;
  }
  form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;if(!editing&&tasks.length>=200)return say('Načrt lahko vsebuje največ 200 opravil.');
    const entry={id:editing||('vrt-'+newPlanId()),plant:form.elements.plant.value,task:form.elements.task.value,date:form.elements.date.value,note:form.elements.note.value.trim(),done:editing?tasks.find(task=>task.id===editing)?.done===true:false};
    try{normalizePlan({version:1,tasks:[entry]},data.plants);}catch(error){return say(error.message);}
    if(editing)tasks=tasks.map(task=>task.id===editing?entry:task);else tasks.push(entry);save();renderPlan();cancelEdit();say(storageAvailable?'Načrt je shranjen v tem brskalniku.':'Prenesite JSON, da načrt ohranite.');
  });
  select('[data-garden-enable]').disabled=false;
  select('[data-garden-ics]').addEventListener('click',()=>{const events=tasks.map(row=>({id:row.id,date:row.date,title:(plants.get(row.plant)?.name||'Vrt')+' – '+row.task,description:'Osebni vrtni načrt Koledar365. Datum je izbral uporabnik; ni napoved ali strokovno priporočilo.\n'+row.note}));download(calendarICS(events,'Moj vrt · Koledar365'),'moj-setveni-nacrt.ics','text/calendar;charset=utf-8');say('Koledar ICS je pripravljen. Uvožena datoteka se pozneje ne posodablja samodejno.');});
  select('[data-garden-backup]').addEventListener('click',()=>download(JSON.stringify({version:1,tasks},null,2),'moj-vrt-koledar365.json','application/json'));
  select('[data-garden-import]').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>150000)throw new Error('Datoteka je prevelika (največ 150 kB).');const incoming=normalizePlan(JSON.parse(await file.text()),data.plants);const byId=new Map(tasks.map(row=>[row.id,row]));incoming.forEach(row=>byId.set(row.id,row));if(byId.size>200)throw new Error('Združeni načrt bi presegel 200 opravil.');tasks=[...byId.values()];save();renderPlan();say('Načrt je uvožen. Opravila z istim identifikatorjem so posodobljena.');}catch(error){say(error.message||'Datoteke ni bilo mogoče odpreti.');}event.target.value='';});
  select('[data-garden-print]').addEventListener('click',()=>window.print());
  renderPlan();updateFilters();root.dataset.ready='true';
}
if(typeof document!=='undefined')document.querySelectorAll('[data-garden]').forEach(init);
