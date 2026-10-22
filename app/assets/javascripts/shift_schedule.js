'use strict';
(()=>{
 const form=document.querySelector('.shift-workbench #shift-form');
 if(!form)return;
 const fromInput=form.elements.from,toInput=form.elements.to,cycleInput=document.getElementById('shift-cycle');
 const calendar=document.getElementById('shift-calendar'),monthTitle=document.getElementById('shift-month-title');
 const status=document.getElementById('shift-preview-status'),submit=form.querySelector('[type="submit"]');
 const monthNames=new Intl.DateTimeFormat('sl-SI',{month:'long',year:'numeric',timeZone:'UTC'});
 const dayNames=['pon','tor','sre','čet','pet','sob','ned'];
 let visibleMonth=null;
 const utcDate=value=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return null;const [y,m,d]=value.split('-').map(Number),date=new Date(Date.UTC(y,m-1,d));return date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d?date:null};
 const iso=date=>`${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}-${String(date.getUTCDate()).padStart(2,'0')}`;
 const offset=(a,b)=>Math.round((b-a)/86400000);
 const classify=code=>{const value=code.trim().toLocaleLowerCase('sl-SI');if(['prosto','off','free','počitek'].includes(value)||value.includes('prosto')||value.includes('počitek'))return'off';if(value==='n'||value.includes('noč'))return'night';if(value==='d'||value.includes('dnev'))return'day';return'custom'};
 const setText=(id,value)=>{const node=document.getElementById(id);if(node)node.textContent=String(value)};
 const makeCell=(className,role,label,text)=>{const node=document.createElement('div');node.className=className;node.setAttribute('role',role);if(label)node.setAttribute('aria-label',label);if(text)node.textContent=text;return node};
 const updatePresetState=()=>document.querySelectorAll('[data-shift-cycle]').forEach(button=>{const active=button.dataset.shiftCycle===cycleInput.value.trim();button.classList.toggle('is-selected',active);button.setAttribute('aria-pressed',String(active))});
 function render(){
  const start=utcDate(fromInput.value),end=utcDate(toInput.value),codes=cycleInput.value.split(',').map(value=>value.trim()).filter(Boolean);
  const span=start&&end?offset(start,end)+1:0;
  const valid=!!start&&!!end&&span>0&&span<=100&&codes.length>=1&&codes.length<=30&&codes.every(code=>code.length<=20);
  submit.disabled=!valid;
  if(!valid){
   const message=!start||!end?'Vnesite veljaven začetni in končni datum.':span<=0?'Končni datum mora biti na začetku cikla ali pozneje.':span>100?'Obdobje je lahko dolgo največ 100 dni.':codes.length===0?'Dodajte vsaj eno oznako izmene.':codes.length>30?'Cikel lahko vsebuje največ 30 oznak.':'Oznaka izmene je lahko dolga največ 20 znakov.';
   status.textContent=message;calendar.replaceChildren();monthTitle.textContent='Preverite vnos';['shift-stat-days','shift-stat-work','shift-stat-night','shift-stat-free'].forEach(id=>setText(id,'—'));updatePresetState();return;
  }
  if(!visibleMonth||fromInput.dataset.lastValue!==fromInput.value){visibleMonth=new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth(),1));fromInput.dataset.lastValue=fromInput.value}
  const counts={off:0,night:0,work:0};
  for(let index=0;index<span;index++){const kind=classify(codes[index%codes.length]);if(kind==='off')counts.off++;else counts.work++;if(kind==='night')counts.night++}
  setText('shift-stat-days',span);setText('shift-stat-work',counts.work);setText('shift-stat-night',counts.night);setText('shift-stat-free',counts.off);
  monthTitle.textContent=monthNames.format(visibleMonth);
  calendar.replaceChildren();
  for(const day of dayNames)calendar.append(makeCell('shift-calendar__weekday','columnheader',day,day));
  const year=visibleMonth.getUTCFullYear(),month=visibleMonth.getUTCMonth(),first=new Date(Date.UTC(year,month,1)),daysInMonth=new Date(Date.UTC(year,month+1,0)).getUTCDate(),leading=(first.getUTCDay()+6)%7;
  for(let i=0;i<leading;i++)calendar.append(makeCell('shift-calendar__day shift-calendar__day--empty','cell','',''));
  for(let day=1;day<=daysInMonth;day++){
   const date=new Date(Date.UTC(year,month,day)),dateIso=iso(date),within=date>=start&&date<=end;
   const cell=makeCell('shift-calendar__day','cell',`${day}. ${monthNames.format(date)}${within?'':' · zunaj obdobja'}`,'');
   const number=document.createElement('strong');number.textContent=String(day);cell.append(number);
   if(within){const code=codes[offset(start,date)%codes.length],kind=classify(code);cell.classList.add(`shift-calendar__day--${kind}`);const label=document.createElement('span');label.textContent=code;label.title=code;cell.append(label);cell.dataset.date=dateIso;cell.setAttribute('aria-label',`${day} ${code} – ${monthNames.format(date)}`)}
   else cell.classList.add('shift-calendar__day--outside');
   calendar.append(cell);
  }
  const trailing=(7-(calendar.children.length%7))%7;
  for(let i=0;i<trailing;i++)calendar.append(makeCell('shift-calendar__day shift-calendar__day--empty','cell','',''));
  const cells=[...calendar.children];
  for(let index=0;index<cells.length;index+=7){const row=document.createElement('div');row.className='shift-calendar__row';row.setAttribute('role','row');cells.slice(index,index+7).forEach(cell=>row.append(cell));calendar.append(row)}
  status.textContent=`${span} dni · ${counts.work} izmen · ${counts.night} nočnih · ${counts.off} prostih dni. Predogled zajema izbrani mesec.`;
  updatePresetState();
 }
 document.querySelectorAll('[data-shift-cycle]').forEach(button=>button.addEventListener('click',()=>{cycleInput.value=button.dataset.shiftCycle;render()}));
 cycleInput.addEventListener('input',render);
 fromInput.addEventListener('change',render);toInput.addEventListener('change',render);
 document.getElementById('shift-month-prev').addEventListener('click',()=>{if(!visibleMonth){const start=utcDate(fromInput.value);if(!start)return;visibleMonth=new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth(),1))}visibleMonth=new Date(Date.UTC(visibleMonth.getUTCFullYear(),visibleMonth.getUTCMonth()-1,1));render()});
 document.getElementById('shift-month-next').addEventListener('click',()=>{if(!visibleMonth){const start=utcDate(fromInput.value);if(!start)return;visibleMonth=new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth(),1))}visibleMonth=new Date(Date.UTC(visibleMonth.getUTCFullYear(),visibleMonth.getUTCMonth()+1,1));render()});
 render();
})();
