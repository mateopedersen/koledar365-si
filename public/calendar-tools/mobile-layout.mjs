// Shared enhancement also covers tables and calendars replaced by the static-site adapter.
const records='table.data-table,table.astro-table,table.payment-table,table.leap-table';
const calendars='table.calendar';
const calendarState=new WeakMap();
const dateFormat=new Intl.DateTimeFormat('sl-SI',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});

function prepareRecords(table){
  const headers=[...(table.tHead?.rows[0]?.cells||[])].map(cell=>cell.textContent.replace(/\s+/g,' ').trim());
  if(!headers.length||!table.tBodies.length)return;
  table.setAttribute('role','table');
  table.tHead.setAttribute('role','rowgroup');
  for(const row of table.tHead.rows){
    row.setAttribute('role','row');
    for(const cell of row.cells){cell.scope='col';cell.setAttribute('role','columnheader');}
  }
  for(const body of table.tBodies){
    body.setAttribute('role','rowgroup');
    for(const row of body.rows){
      row.setAttribute('role','row');let column=0;
      for(const cell of row.cells){
        cell.setAttribute('role',cell.tagName==='TH'?'rowheader':'cell');
        cell.dataset.label=headers[column]||'';
        if(cell.colSpan>1)cell.dataset.mobileSpan='';
        column+=cell.colSpan;
      }
    }
  }
  table.classList.add('mobile-record-table');
}

function prepareCalendar(table){
  if(table.closest('.mini')||!table.querySelector('.date-events'))return;
  let agenda=table.nextElementSibling;
  if(!agenda?.classList.contains('calendar-agenda')){
    agenda=document.createElement('section');agenda.className='calendar-agenda';
    agenda.setAttribute('aria-label','Dogodki v prikazu');table.after(agenda);
  }
  const rows=[];
  for(const cell of table.querySelectorAll('td[data-date]')){
    for(const event of cell.querySelectorAll('.date-events .event-label')){
      const personal=event.classList.contains('personal-dot');
      if(event.hidden||(!personal&&document.body.classList.contains('hide-holidays')))continue;
      const label=event.textContent.trim();if(!label)continue;
      rows.push({date:cell.dataset.date,label,category:event.dataset.category||(personal?'personal':'holidays'),free:event.classList.contains('free'),href:event.getAttribute('href')||cell.querySelector('.date-link')?.getAttribute('href')||'#personal-planner'});
    }
  }
  const signature=JSON.stringify(rows);
  if(calendarState.get(table)!==signature){
    calendarState.set(table,signature);
    const heading=document.createElement('h3');heading.textContent='Dogodki v prikazu';
    const list=document.createElement('ul');
    for(const row of rows){
      const item=document.createElement('li'),link=document.createElement('a'),date=document.createElement('time'),title=document.createElement('strong');
      link.href=row.href;link.dataset.category=row.category;link.classList.toggle('is-free',row.free);
      date.dateTime=row.date;date.textContent=dateFormat.format(new Date(row.date+'T12:00:00Z'));
      title.textContent=row.label;link.append(date,document.createTextNode(' '),title);item.append(link);list.append(item);
    }
    agenda.replaceChildren(heading,list);agenda.hidden=!rows.length;
  }
  table.classList.add('calendar-has-agenda');
}

function prepareScrollTable(table){
  const wrap=table.closest('.table-wrap');if(!wrap)return;
  wrap.setAttribute('tabindex','0');wrap.setAttribute('role','region');
  wrap.setAttribute('aria-label','Koledarski pregled; za vse stolpce pomaknite levo ali desno');
  if(!wrap.previousElementSibling?.classList.contains('table-scroll-hint')){
    const hint=document.createElement('p');hint.className='table-scroll-hint';
    hint.textContent='Za vse stolpce pomaknite preglednico levo ali desno.';wrap.before(hint);
  }
}

function start(){
  const pending=new Set();let scheduled=false;
  const queue=table=>{
    if(!table)return;pending.add(table);if(scheduled)return;scheduled=true;
    queueMicrotask(()=>{
      scheduled=false;
      for(const item of pending){
        if(!item.isConnected)continue;
        if(item.matches(records))prepareRecords(item);
        if(item.matches(calendars))prepareCalendar(item);
        if(item.matches('table.important-calendar'))prepareScrollTable(item);
      }
      pending.clear();
    });
  };
  const selector=records+','+calendars+',table.important-calendar';
  document.querySelectorAll(selector).forEach(queue);
  new MutationObserver(changes=>{
    for(const change of changes){
      if(change.type==='attributes'&&change.attributeName==='class'){
        if(change.target===document.body)document.querySelectorAll(calendars).forEach(queue);
        continue;
      }
      if(change.target.nodeType===1)queue(change.target.closest(selector));
      for(const node of change.addedNodes){
        if(node.nodeType!==1)continue;
        if(node.matches(selector))queue(node);
        node.querySelectorAll(selector).forEach(queue);
      }
    }
  }).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class']});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
