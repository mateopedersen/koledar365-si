import {createCalendarWorkbook,isoWeek} from './xlsx.mjs';

const pad=value=>String(value).padStart(2,'0');
const iso=date=>date.toISOString().slice(0,10);
const dateFor=value=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return null;const date=new Date(value+'T00:00:00Z');return Number.isFinite(date.valueOf())&&iso(date)===value?date:null};
const addDays=(date,days)=>new Date(date.valueOf()+days*86400000);
const mondayFor=date=>addDays(date,1-(date.getUTCDay()||7));
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cap=value=>value[0].toLocaleUpperCase('sl')+value.slice(1);
const format=date=>new Intl.DateTimeFormat('sl-SI',{timeZone:'UTC',day:'numeric',month:'numeric',year:'numeric'}).format(date);
const ljubljanaToday=()=>{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Ljubljana',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const get=type=>parts.find(part=>part.type===type).value;return `${get('year')}-${get('month')}-${get('day')}`};
export const weeksInYear=year=>isoWeek(new Date(Date.UTC(year,11,28))).week;
export function dateInISOWeek(year,week){
  if(!Number.isInteger(year)||!Number.isInteger(week)||week<1||week>weeksInYear(year))return null;
  return addDays(mondayFor(new Date(Date.UTC(year,0,4))),(week-1)*7);
}
export function selectedPeriod({data,kind,initial,search='',path='',today}){
  const query=new URLSearchParams(search),pathYear=kind==='weekly'?Number(path.match(/^\/tedenski-koledar\/(\d{4})\//)?.[1]):0;
  const current=dateFor(today);
  if(current&&!pathYear&&iso(current)>=data.min_date&&iso(current)<=data.max_date){
    const currentYear=current.getUTCFullYear();
    initial={year:currentYear,month:query.has('year')&&Number(query.get('year'))!==currentYear?1:current.getUTCMonth()+1,date:iso(current)};
  }
  let year=Number(query.get('year')||pathYear||initial.year),month=Number(query.get('month')||initial.month);
  if(!(kind==='weekly'?(data.iso_years||[...data.years,2031]):data.years).includes(year))year=Number(initial.year);
  if(!Number.isInteger(month)||month<1||month>12)month=Number(initial.month)||1;
  let date=dateFor(query.get('date'));
  if(date&&(iso(date)<data.min_date||iso(date)>data.max_date))date=null;
  if(kind==='weekly'){
    if(query.has('week'))date=dateInISOWeek(year,Number(query.get('week')))||date;
    if(!date)date=pathYear||query.has('year')?dateInISOWeek(year,1):dateFor(initial.date);
    // ISO week 1 of 2026 starts in December 2025. Keep its visible seven days,
    // while the printable anchor stays inside the supported calendar years.
    if(iso(date)<data.min_date)date=dateFor(data.min_date);
    if(iso(date)>data.max_date)date=dateFor(data.max_date);
    return {date,year:isoWeek(date).year,month:date.getUTCMonth()+1};
  }
  return {date:new Date(Date.UTC(year,month-1,1)),year,month};
}
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}};
function download(blob,filename){const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),10000)}
function initializeHub(root){
  if(root.dataset.calendarReady)return;root.dataset.calendarReady='true';
  const $=selector=>root.querySelector(selector),$$=selector=>[...root.querySelectorAll(selector)],data=JSON.parse($('[data-calendar-data]').textContent),kind=root.dataset.calendarExperience;
  const weekly=kind==='weekly',holidays=new Map(data.holidays.map(event=>[event.date,event.title]));
  data.today=ljubljanaToday();
  let state=selectedPeriod({data,kind,initial:{year:root.dataset.initialYear,month:root.dataset.initialMonth,date:root.dataset.initialDate},search:location.search,path:location.pathname,today:data.today});
  let notes={},storageOK=true;
  const key=()=>`k365.calendar.${kind}.${weekly?iso(mondayFor(state.date)):`${state.year}-${pad(state.month)}`}`;
  const message=(text,error=false)=>{const node=$('[data-calendar-status]');node.textContent=text;node.dataset.error=String(error)};
  const persist=()=>{storageOK=save(key(),notes);$('[data-calendar-save-copy]').textContent=storageOK?'Vaši zapiski ostanejo v tem brskalniku in se vključijo v izvoz.':'Shramba ni na voljo. Zapiske ohranite s prenosom, preden zaprete stran.'};
  const options=()=>({type:kind,year:state.date.getUTCFullYear(),month:state.month,date:iso(state.date),design:$('[data-calendar-layout]:checked').value,paper:$('[data-calendar-paper]').value,orientation:$('[data-calendar-orientation]').value,notes:notes.period||'',entries:weekly?Object.entries(notes).filter(([date,text])=>date!=='period'&&text.trim()).map(([date,title])=>({date,title})):[]});
  function updateURL(){const query=new URLSearchParams();query.set('year',state.year);if(weekly){query.set('week',isoWeek(state.date).week);query.set('date',iso(state.date))}else query.set('month',state.month);history.replaceState(null,'',location.pathname+'?'+query+location.hash)}
  function render({url=false}={}){
    notes=read(key(),{});if(!notes||typeof notes!=='object'||Array.isArray(notes))notes={};
    notes=Object.fromEntries(Object.entries(notes).filter(([key,value])=>typeof value==='string'&&(key==='period'||dateFor(key))).map(([key,value])=>[key,value.slice(0,key==='period'?2000:200)]));
    $$('[data-calendar-year]').forEach(link=>{const year=Number(link.dataset.calendarYear);if(year===state.year)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current');if(!weekly)link.href='/mesecni-koledar/?'+new URLSearchParams({year,month:state.month})});
    const first=mondayFor(state.date),end=addDays(first,6),week=isoWeek(state.date);
    $('[data-calendar-kicker]').textContent=weekly?`TEDEN ${week.week} / ${week.year}`:'MESEČNI KOLEDAR';
    $('[data-calendar-heading]').textContent=weekly?`${format(first)}–${format(end)}`:`${cap(data.months[state.month-1])} ${state.year}`;
    $('[data-period-notes]').value=typeof notes.period==='string'?notes.period:'';
    if(weekly){
      $('[data-week-date]').value=iso(state.date);$('[data-week-year]').value=week.year;$('[data-week-number]').value=week.week;$('[data-week-number]').max=week.year>data.years.at(-1)?1:weeksInYear(week.year);
      $('[data-calendar-grid]').innerHTML='<div class="calendar-sheet__week">'+Array.from({length:7},(_,index)=>{const date=addDays(first,index),value=iso(date),holiday=holidays.get(value)||'';return `<section class="calendar-sheet__day${holiday?' is-holiday':''}${index>4?' is-weekend':''}${value===data.today?' is-today':''}"><h4>${escape(cap(data.days[index]))}<time datetime="${value}">${date.getUTCDate()}. ${date.getUTCMonth()+1}.</time></h4>${holiday?`<p class="calendar-sheet__holiday">${escape(holiday)}</p>`:''}<label><span class="sr-only">Načrti za ${escape(format(date))}</span><textarea maxlength="200" data-day-notes="${value}" placeholder="Vaši načrti …">${escape(typeof notes[value]==='string'?notes[value]:'')}</textarea></label></section>`}).join('')+'</div>';
      $('[data-calendar-back]').disabled=iso(addDays(first,-1))<data.min_date;$('[data-calendar-next]').disabled=iso(addDays(first,7))>data.max_date;
    }else{
      $$('[data-calendar-month]').forEach(link=>{const month=Number(link.dataset.calendarMonth);link.href=monthPath(state.year,month,data);if(month===state.month)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current');link.querySelector('[data-month-days]').textContent=`${new Date(Date.UTC(state.year,month,0)).getUTCDate()} dni`});
      const last=new Date(Date.UTC(state.year,state.month,0));let rows='';
      for(let start=new Date(first);start<=last;start=addDays(start,7)){
        rows+='<tr><th scope="row">'+isoWeek(start).week+'</th>';
        for(let index=0;index<7;index++){const date=addDays(start,index),value=iso(date),current=date.getUTCMonth()+1===state.month,holiday=current?holidays.get(value)||'':'';rows+=`<td class="${!current?'is-outside ':''}${holiday?'is-holiday ':''}${index>4?'is-weekend ':''}${value===data.today?'is-today':''}"><span>${date.getUTCDate()}</span>${holiday?`<small title="${escape(holiday)}">${escape(holiday)}</small>`:''}</td>`}rows+='</tr>';
      }
      const monthHolidays=data.holidays.filter(event=>event.date.startsWith(`${state.year}-${pad(state.month)}-`));
      $('[data-calendar-grid]').innerHTML=`<table class="calendar-sheet__month" aria-label="${escape(cap(data.months[state.month-1]))} ${state.year}"><thead><tr><th scope="col"><abbr title="Teden ISO">T</abbr></th>${data.days.map(day=>`<th scope="col"><abbr title="${escape(day)}">${escape(day.slice(0,3))}</abbr></th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>${monthHolidays.length?`<ul class="calendar-sheet__holidays" aria-label="Dela prosti dnevi v mesecu">${monthHolidays.map(event=>`<li><time datetime="${event.date}">${Number(event.date.slice(-2))}. ${state.month}.</time><span>${escape(event.title)}</span></li>`).join('')}</ul>`:''}`;
      $('[data-calendar-back]').disabled=state.year===data.years[0]&&state.month===1;$('[data-calendar-next]').disabled=state.year===data.years.at(-1)&&state.month===12;
      $('[data-calendar-detail]').href=monthPath(state.year,state.month,data);
    }
    $('[data-calendar-all-designs]').href='/koledar-za-tiskanje/?'+new URLSearchParams({type:kind,year:state.date.getUTCFullYear(),month:state.month,date:iso(state.date)});
    root.dataset.selectedYear=state.year;root.dataset.selectedMonth=state.month;root.dataset.selectedDate=iso(state.date);
    // A weekly year page's existing full gallery uses the same selected period.
    document.querySelectorAll('[data-export-options]').forEach(section=>{if(section.closest('[data-calendar-experience]'))return;const value=JSON.parse(section.dataset.exportOptions);if(value.type==='weekly'){Object.assign(value,{year:state.date.getUTCFullYear(),month:state.month,date:iso(state.date)});section.dataset.exportOptions=JSON.stringify(value)}});
    if(typeof window.refreshDesignPreviews==='function')window.refreshDesignPreviews();
    if(url)updateURL();
  }
  function choose(date){
    if(!date||iso(date)<data.min_date||iso(date)>data.max_date){message('Izberite datum med 1. 1. 2026 in 31. 12. 2030.',true);return}
    const year=weekly?isoWeek(date).year:date.getUTCFullYear();
    const routeYear=location.pathname.match(/^\/tedenski-koledar\/(\d{4})\//)?.[1];
    if(weekly&&routeYear&&Number(routeYear)!==year){location.assign((year===2026||year>data.years.at(-1)?'/tedenski-koledar/':`/tedenski-koledar/${year}/`)+'?'+new URLSearchParams({year,date:iso(date),week:isoWeek(date).week}));return}
    state={date,year,month:date.getUTCMonth()+1};render({url:true});message('');
  }
  $$('[data-calendar-year]').forEach(link=>link.addEventListener('click',event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();const year=Number(link.dataset.calendarYear);let date=weekly?dateInISOWeek(year,year>data.years.at(-1)?1:Math.min(isoWeek(state.date).week,weeksInYear(year))):new Date(Date.UTC(year,state.month-1,1));if(iso(date)<data.min_date)date=dateFor(data.min_date);choose(date)}));
  $$('[data-calendar-month]').forEach(link=>link.addEventListener('click',event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();choose(new Date(Date.UTC(state.year,Number(link.dataset.calendarMonth)-1,1)))}));
  for(const [selector,direction] of [['[data-calendar-back]',-1],['[data-calendar-next]',1]])$(selector).addEventListener('click',()=>{let date=weekly?addDays(mondayFor(state.date),direction*7):new Date(Date.UTC(state.year,state.month-1+direction,1));if(weekly&&iso(date)<data.min_date&&iso(addDays(date,6))>=data.min_date)date=dateFor(data.min_date);choose(date)});
  $('[data-calendar-today]').addEventListener('click',()=>{const today=ljubljanaToday();choose(dateFor(weekly?today:today.slice(0,7)+'-01'))});
  if(weekly){
    $('[data-week-date]').addEventListener('change',event=>choose(dateFor(event.target.value)));
    $('[data-week-year]').addEventListener('change',()=>{const year=Number($('[data-week-year]').value);$('[data-week-number]').max=year>data.years.at(-1)?1:weeksInYear(year)});
    $('[data-week-selection]').addEventListener('submit',event=>{event.preventDefault();let date=dateInISOWeek(Number($('[data-week-year]').value),Number($('[data-week-number]').value));if(!date){message('V izbranem letu ni tega tedna ISO.',true);return}if(iso(date)<data.min_date)date=dateFor(data.min_date);choose(date)});
  }
  root.addEventListener('input',event=>{if(event.target.matches('[data-period-notes]')){notes.period=event.target.value;persist()}if(event.target.matches('[data-day-notes]')){notes[event.target.dataset.dayNotes]=event.target.value;persist()}});
  $('[data-calendar-xlsx]')?.addEventListener('click',()=>{try{const result=createCalendarWorkbook({year:state.year,month:state.month,data,notes:notes.period||''});download(result.blob,result.filename);message('Preglednica je pripravljena: '+result.filename)}catch(error){message(error.message,true)}});
  $('[data-calendar-pdf]').addEventListener('click',async event=>{
    const button=event.currentTarget;button.disabled=true;message('Pripravljamo vaš koledar PDF …');
    try{
      const response=await fetch('/izvozi/',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':document.querySelector('meta[name="csrf-token"]')?.content||''},body:JSON.stringify({options:options(),format:'pdf'})}),job=await response.json();
      if(!response.ok)throw Error(job.error||'Koledarja ni bilo mogoče pripraviti.');
      for(let attempt=0;attempt<180;attempt++){
        const check=await fetch(job.url);if(!check.ok)throw Error('Prenosa trenutno ni mogoče preveriti. Poskusite znova.');const result=await check.json();
        if(result.status==='complete'){
          const link=document.createElement('a');link.href=result.files.pdf;link.download=result.filenames?.pdf||'';link.textContent='PDF je pripravljen. Prenesi datoteko →';$('[data-calendar-status]').replaceChildren(link);link.click();return;
        }
        if(['failed','expired'].includes(result.status))throw Error(result.error||'Izvoz ni uspel. Poskusite znova.');
        await new Promise(resolve=>setTimeout(resolve,1000));
      }
      throw Error('Priprava traja dlje kot običajno. Poskusite znova ali izberite drugo predlogo.');
    }catch(error){message(error.message,true)}finally{button.disabled=false}
  });
  render();
}
function monthPath(year,month,data){return year===2026?'/?'+new URLSearchParams({year,month,date:`${year}-${pad(month)}-01`}):`/koledar/${year}/${data.months[month-1]}/`}
function initializeSpreadsheet(root){
  if(root.dataset.calendarReady)return;root.dataset.calendarReady='true';
  root.querySelector('[data-calendar-xlsx]').addEventListener('click',()=>{const output=root.querySelector('[data-calendar-status]');try{const result=createCalendarWorkbook({year:Number(root.dataset.year),month:root.dataset.month?Number(root.dataset.month):null,data:JSON.parse(root.querySelector('[data-calendar-data]').textContent)});download(result.blob,result.filename);output.textContent='Prenos pripravljen.'}catch(error){output.textContent=error.message}});
}
if(typeof document!=='undefined'){
  const initialize=()=>{document.querySelectorAll('[data-calendar-experience]').forEach(initializeHub);document.querySelectorAll('[data-calendar-spreadsheet]').forEach(initializeSpreadsheet)};
  initialize();document.addEventListener('k365:calendar-content-ready',initialize);
}
