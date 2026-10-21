(function(root){
 'use strict';
 const colors=['blue','red','sky','rose'];
 const kinds=['event','task','chore'];
 const reminderValues=[0,5,15,30,60];
 const validISO=value=>{
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const parts=value.split('-').map(Number);
  const date=new Date(Date.UTC(parts[0],parts[1]-1,parts[2]));
  return date.getUTCFullYear()===parts[0]&&date.getUTCMonth()===parts[1]-1&&date.getUTCDate()===parts[2];
 };
 const parseISO=value=>{
  if(!validISO(value))return null;
  const parts=value.split('-').map(Number);
  return new Date(Date.UTC(parts[0],parts[1]-1,parts[2],12));
 };
 const toISO=date=>date.getUTCFullYear()+'-'+String(date.getUTCMonth()+1).padStart(2,'0')+'-'+String(date.getUTCDate()).padStart(2,'0');
 const addDays=(iso,days)=>{
  const date=parseISO(iso);
  if(!date||!Number.isInteger(days))return null;
  date.setUTCDate(date.getUTCDate()+days);
  return toISO(date);
 };
 const todayISO=()=>{
  const now=new Date();
  return now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
 };
 const mondayISO=iso=>{
  const date=parseISO(iso);
  if(!date)return null;
  const weekday=(date.getUTCDay()+6)%7;
  date.setUTCDate(date.getUTCDate()-weekday);
  return toISO(date);
 };
 const weekDays=startISO=>Array.from({length:7},(_,index)=>addDays(startISO,index));
 const safeText=(value,max)=>typeof value==='string'?value.trim().slice(0,max):'';
 const idIsValid=id=>typeof id==='string'&&/^[A-Za-z0-9._-]{1,80}$/.test(id);
 const validTime=value=>typeof value==='string'&&/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
 function validateState(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||input.version!==1)throw new Error('Varnostna kopija ni podprte oblike.');
  const members=input.members,events=input.events,meals=input.meals,groceries=input.groceries;
  if(!Array.isArray(members)||members.length>8||!Array.isArray(events)||events.length>300||!Array.isArray(meals)||meals.length>120||!Array.isArray(groceries)||groceries.length>300)throw new Error('Varnostna kopija vsebuje preveč podatkov.');
  const memberIds=new Set(),memberNames=new Set();
  const cleanMembers=members.map(member=>{
   if(!member||!idIsValid(member.id))throw new Error('Varnostna kopija vsebuje neveljavnega člana.');
   const name=safeText(member.name,40),color=colors.includes(member.color)?member.color:'blue';
   const foldedName=name.toLocaleLowerCase('sl');
   if(!name||memberIds.has(member.id)||memberNames.has(foldedName))throw new Error('Preverite imena članov družine v kopiji.');
   memberIds.add(member.id);memberNames.add(foldedName);
   return {id:member.id,name,color};
  });
  const eventIds=new Set();
  const cleanEvents=events.map(event=>{
   if(!event||!idIsValid(event.id)||eventIds.has(event.id)||!validISO(event.date)||!kinds.includes(event.kind))throw new Error('Varnostna kopija vsebuje neveljaven načrt.');
   eventIds.add(event.id);
   const title=safeText(event.title,120),time=event.time||'',endTime=event.endTime||'',repeat=event.repeat==='weekly'?'weekly':'none';
   if(!title||(time&&!validTime(time))||(endTime&&!validTime(endTime))||(endTime&&(!time||endTime<=time)))throw new Error('Preverite naslov, datum in ure v kopiji.');
   if(event.memberId&&!memberIds.has(event.memberId))throw new Error('Načrt je povezan z manjkajočim članom družine.');
   const doneDates=Array.isArray(event.doneDates)?event.doneDates.filter(date=>validISO(date)).slice(0,366):[];
   const reminder=reminderValues.includes(Number(event.reminder))?Number(event.reminder):0;
   return {id:event.id,title,date:event.date,time,endTime,kind:event.kind,memberId:event.memberId||'',repeat,reminder,doneDates};
  });
  const mealIds=new Set(),mealDates=new Set();
  const cleanMeals=meals.map(meal=>{
   if(!meal||!idIsValid(meal.id)||!validISO(meal.date))throw new Error('Varnostna kopija vsebuje neveljaven obrok.');
   const title=safeText(meal.title,100);
   if(!title||mealIds.has(meal.id)||mealDates.has(meal.date))throw new Error('Na vsak dan lahko shranite en glavni obrok. Preverite jedilnik v kopiji.');
   mealIds.add(meal.id);mealDates.add(meal.date);
   const ingredients=Array.isArray(meal.ingredients)?meal.ingredients.map(item=>safeText(item,80)).filter(Boolean).slice(0,30):[];
   return {id:meal.id,date:meal.date,title,ingredients};
  });
  const groceryIds=new Set();
  const cleanGroceries=groceries.map(item=>{
   if(!item||!idIsValid(item.id)||groceryIds.has(item.id))throw new Error('Varnostna kopija vsebuje neveljaven izdelek.');
   groceryIds.add(item.id);
   const name=safeText(item.name,100);
   if(!name)throw new Error('Varnostna kopija vsebuje prazen izdelek.');
   return {id:item.id,name,quantity:safeText(item.quantity,30),category:safeText(item.category,40)||'Ostalo',bought:!!item.bought};
  });
  return {version:1,members:cleanMembers,events:cleanEvents,meals:cleanMeals,groceries:cleanGroceries};
 }
 function expandWeek(events,startISO){
  const days=weekDays(startISO);
  if(!days.every(Boolean))return [];
  const results=[];
  for(const event of events){
   if(!validISO(event.date))continue;
   const eventWeekday=parseISO(event.date).getUTCDay();
   for(const date of days){
    if(event.repeat==='weekly'&&date>=event.date&&parseISO(date).getUTCDay()===eventWeekday)results.push({event,date});
    else if(event.repeat!=='weekly'&&date===event.date)results.push({event,date});
   }
  }
  const time=value=>value||'99:99';
  return results.sort((left,right)=>left.date.localeCompare(right.date)||time(left.event.time).localeCompare(time(right.event.time))||left.event.title.localeCompare(right.event.title,'sl'));
 }
 function escapeIcs(value){
  return String(value||'').replace(/\\/g,'\\\\').replace(/\r\n|\n|\r/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
 }
 function foldIcs(line){
  const result=[];
  let current='',bytes=0,limit=75;
  for(const char of line){
   const size=new TextEncoder().encode(char).length;
   if(bytes+size>limit&&current){result.push(current);current=' ';bytes=1;limit=75}
   current+=char;bytes+=size;
  }
  if(current)result.push(current);
  return result.join('\r\n');
 }
 function compactDate(iso){return iso.replace(/-/g,'')}
 function compactTime(time){return time.replace(':','')+'00'}
 function utcStamp(date){return date.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}
 function toICS(input,now){
  const state=validateState(input);
  const stamp=utcStamp(now||new Date());
  const members=new Map(state.members.map(member=>[member.id,member.name]));
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Koledar365//Family Planner//SL','CALSCALE:GREGORIAN','METHOD:PUBLISH',
   'BEGIN:VTIMEZONE','TZID:Europe/Ljubljana','X-LIC-LOCATION:Europe/Ljubljana',
   'BEGIN:DAYLIGHT','TZOFFSETFROM:+0100','TZOFFSETTO:+0200','TZNAME:CEST','DTSTART:19700329T020000','RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU','END:DAYLIGHT',
   'BEGIN:STANDARD','TZOFFSETFROM:+0200','TZOFFSETTO:+0100','TZNAME:CET','DTSTART:19701025T030000','RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU','END:STANDARD','END:VTIMEZONE'];
  const weekdayCodes=['SU','MO','TU','WE','TH','FR','SA'];
  for(const event of state.events){
   const member=members.get(event.memberId)||'';
   const category=event.kind==='chore'?'Domače opravilo':event.kind==='task'?'Opravilo':'Dogodek';
   const description=[category,member?'Član: '+member:'','Ponovitev: '+(event.repeat==='weekly'?'vsak teden':'brez')].filter(Boolean).join(' · ');
   lines.push('BEGIN:VEVENT','UID:'+event.id+'@koledar365.si','DTSTAMP:'+stamp,'SUMMARY:'+escapeIcs(event.title),'DESCRIPTION:'+escapeIcs(description));
   if(event.time){
    lines.push('DTSTART;TZID=Europe/Ljubljana:'+compactDate(event.date)+'T'+compactTime(event.time));
    const end=event.endTime||(()=>{
     const parts=event.time.split(':').map(Number),start=parts[0]*60+parts[1]+60;
     return String(Math.floor(start/60)%24).padStart(2,'0')+':'+String(start%60).padStart(2,'0');
    })();
    let endDate=event.date;
    if(!event.endTime&&end<event.time)endDate=addDays(event.date,1);
    lines.push('DTEND;TZID=Europe/Ljubljana:'+compactDate(endDate)+'T'+compactTime(end));
   }else{
    lines.push('DTSTART;VALUE=DATE:'+compactDate(event.date),'DTEND;VALUE=DATE:'+compactDate(addDays(event.date,1)));
   }
   if(event.repeat==='weekly')lines.push('RRULE:FREQ=WEEKLY;BYDAY='+weekdayCodes[parseISO(event.date).getUTCDay()]);
   if(event.reminder>0){
    lines.push('BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+escapeIcs(event.title),'TRIGGER:-PT'+event.reminder+'M','END:VALARM');
   }
   lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldIcs).join('\r\n')+'\r\n';
 }
 root.K365FamilyPlannerCore={colors,kinds,validISO,validTime,parseISO,toISO,addDays,todayISO,mondayISO,weekDays,validateState,expandWeek,escapeIcs,foldIcs,toICS};
})(typeof window!=='undefined'?window:globalThis);
