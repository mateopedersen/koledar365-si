import {sloveniaToday,dateLabel,calendarICS,download} from '../garden/calendar-tools.mjs';
export function filterPayments(events,{category='all',month='all',upcoming=true,today=sloveniaToday()}={}) {
  return events.filter(event=>(category==='all'||event.category===category)&&(month==='all'||event.date.startsWith(month))&&(!upcoming||event.date>=today));
}
export function nextPayment(events,category='all',today=sloveniaToday()) {
  return events.filter(event=>(category==='all'||event.category===category)&&event.date>=today).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id))[0]||null;
}
export function paymentEvents(events,categories,sources){return events.map(event=>({id:event.id,date:event.date,title:categories[event.category].label,description:`Objavljeni datum izplačila; mesec izvornega plana: ${event.plan_month}. Vir: ${sources[event.source_id].title}\n${sources[event.source_id].url}\nUvoz ICS je kopija, ki se ne posodablja samodejno. Datum ne potrjuje osebne upravičenosti ali ure priliva.`}));}

function init(root){
  const data=JSON.parse(root.querySelector('[data-payment-data]').textContent),get=selector=>root.querySelector(selector),benefit=get('[data-payment-benefit]'),month=get('[data-payment-month]'),upcoming=get('[data-payment-upcoming]'),status=get('[data-payment-status]');
  const params=new URLSearchParams(location.search),allowedMonths=new Set(data.events.map(event=>event.date.slice(0,7)));
  if(benefit&&data.categories[params.get('prejemek')])benefit.value=params.get('prejemek');
  if(allowedMonths.has(params.get('mesec')))month.value=params.get('mesec');
  if(params.get('prihodnji')==='0')upcoming.checked=false;
  let visible=[];
  function updateNext(today,category){
    const next=nextPayment(data.events,category,today),date=get('[data-payment-next-date]'),countdown=get('[data-payment-next-countdown]'),mini=get('.payment-next-month');
    get('[data-payment-next-label]').textContent=next?data.categories[next.category].label:'Preverite nov uradni koledar';
    date.textContent=next?dateLabel(next.date):'Ni potrjenega prihodnjega termina';
    if(next)date.setAttribute('datetime',next.date);else date.removeAttribute('datetime');
    get('[data-payment-next-weekday]').textContent=next?dateLabel(next.date,{weekday:'long'}):'';
    if(next){const days=Math.round((Date.parse(next.date+'T12:00:00Z')-Date.parse(today+'T12:00:00Z'))/86400000);countdown.textContent=days===0?'Danes, po objavljenem terminskem planu.':`Do objavljenega termina: ${days} ${days===1?'dan':days===2?'dneva':days===3||days===4?'dni':'dni'}.`;get('.payment-year').textContent=next.date.slice(0,4);
      const [year,monthNumber,day]=next.date.split('-').map(Number),total=new Date(Date.UTC(year,monthNumber,0)).getUTCDate();mini.replaceChildren();
      for(let d=1;d<=total;d++){const cell=document.createElement('span');cell.textContent=d;if(d===1)cell.style.gridColumnStart=String((new Date(Date.UTC(year,monthNumber-1,1)).getUTCDay()+6)%7+1);cell.className=d===day?'is-payment-day':'';mini.append(cell);}mini.hidden=false;
    }else{countdown.textContent='Prihodnjih datumov ne ugibamo. Preverite nove objave pri ZPIZ oziroma CSD.';mini.hidden=true;}
  }
  function update(){const today=sloveniaToday(),category=benefit?.value||'all';visible=filterPayments(data.events,{category,month:month.value,upcoming:upcoming.checked,today});const ids=new Set(visible.map(event=>event.id));root.querySelectorAll('[data-payment-row]').forEach(row=>{row.hidden=!ids.has(row.dataset.paymentRow);row.classList.toggle('is-today',row.dataset.date===today);});get('[data-payment-count]').textContent=`Prikazani termini: ${visible.length} od ${data.events.length}`;get('[data-payment-empty]').hidden=visible.length>0;get('[data-payment-filtered-ics]').disabled=visible.length===0;updateNext(today,category);
    const link=get('[data-payment-download]'),slug=category==='all'?(data.kind==='pension'?'pokojnine':'socialni-transferji'):category;link.href=`/payments/${slug}-2026.ics`;
  }
  [benefit,month,upcoming].filter(Boolean).forEach(control=>control.addEventListener('change',update));
  get('[data-payment-reset]').addEventListener('click',()=>{if(benefit)benefit.value='all';month.value='all';upcoming.checked=false;update();});
  root.querySelectorAll('[data-payment-event]').forEach(button=>button.addEventListener('click',()=>{const event=data.events.find(item=>item.id===button.dataset.paymentEvent);download(calendarICS(paymentEvents([event],data.categories,data.sources),'Izplačilo · Koledar365'),`${event.id}.ics`,'text/calendar;charset=utf-8');status.textContent='Termin je pripravljen za uvoz v koledar.';}));
  get('[data-payment-filtered-ics]').addEventListener('click',()=>{download(calendarICS(paymentEvents(visible,data.categories,data.sources),'Izplačila · Koledar365'),'izbrana-izplacila-2026.ics','text/calendar;charset=utf-8');status.textContent=`Koledar vsebuje ${visible.length} prikazanih terminov. Uvoz ni samodejna naročnina.`;});
  get('[data-payment-print]').addEventListener('click',()=>window.print());
  get('[data-payment-share]').addEventListener('click',async()=>{const url=new URL(location.href);url.search='';if(benefit&&benefit.value!=='all')url.searchParams.set('prejemek',benefit.value);if(month.value!=='all')url.searchParams.set('mesec',month.value);if(!upcoming.checked)url.searchParams.set('prihodnji','0');url.hash='koledar-izplacil';try{await navigator.clipboard.writeText(url.href);status.textContent='Povezava do izbora je kopirana.';}catch{status.textContent='Povezava do izbora: '+url.href;}});
  update();root.dataset.ready='true';setInterval(update,60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();});
}
if(typeof document!=='undefined')document.querySelectorAll('[data-payment-calendar]').forEach(init);
