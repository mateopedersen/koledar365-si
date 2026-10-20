// Independent of generate_lunar_data.py: parses raw USNO inputs and converts
// dates with JavaScript Intl/ICU, then checks every output date and event.
// This checks date/time mapping and internal consistency, not ephemeris accuracy.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const base=path.resolve(here,'../../data/lunar');
const read=name=>JSON.parse(fs.readFileSync(path.join(base,name),'utf8'));
const days=read('lunar-daily-2027-2030.json').days;
const events=read('lunar-events-2027-2030.json').events;
const formatter=new Intl.DateTimeFormat('en-CA',{
  timeZone:'Europe/Ljubljana',year:'numeric',month:'2-digit',day:'2-digit',
  hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23',timeZoneName:'longOffset'
});
function local(iso){
  const p=Object.fromEntries(formatter.formatToParts(new Date(iso)).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
  const offset=p.timeZoneName==='GMT'?0:(p.timeZoneName[3]==='-'?-1:1)*(Number(p.timeZoneName.slice(4,6))*60+Number(p.timeZoneName.slice(7,9)));
  return {date:`${p.year}-${p.month}-${p.day}`,time:`${p.hour}:${p.minute}`,offset};
}
const phases={'New Moon':'new_moon','First Quarter':'first_quarter','Full Moon':'full_moon','Last Quarter':'last_quarter'};
const raw=[];
for(let y=2026;y<=2031;y++){
  for(const r of read(`raw/usno-phases-${y}.json`).phasedata){
    const utc=`${r.year}-${String(r.month).padStart(2,'0')}-${String(r.day).padStart(2,'0')}T${r.time}:00Z`;
    const converted=local(utc);
    if(converted.date>='2027-01-01'&&converted.date<='2030-12-31')raw.push({phase:phases[r.phase],utc,...converted});
  }
}
const errors=[];
let shifted=0;
for(const r of raw){
  const e=events.find(e=>e.utc===r.utc&&e.phaseKey===r.phase);
  if(!e)errors.push({missing:r});
  else if(e.localDate!==r.date||e.localTime!==r.time||e.utcOffsetMinutes!==r.offset)errors.push({mismatch:r,output:e});
  if(r.date!==r.utc.slice(0,10))shifted++;
}
const uniqueDays=new Set(days.map(d=>d.date));
let angleDifference=0,last=null;
for(const d of days){
  const converted=local(d.utc);
  if(converted.date!==d.date||converted.time!=='12:00'||converted.offset!==d.utcOffsetMinutes)errors.push({dailyTime:d.date,converted});
  const t=new Date(d.date+'T12:00:00Z');
  if((t.getUTCDay()||7)!==d.weekdayMonday)errors.push({weekday:d.date});
  if(last&&t-last!==86400000)errors.push({gap:d.date});
  last=t;
  const f=(1+Math.cos(d.illuminationPhaseAngleDeg*Math.PI/180))/2;
  angleDifference=Math.max(angleDifference,Math.abs(f-d.illuminationFraction));
  if(d.waxing!==(d.moonSunLongitudeDeg<180))errors.push({waxing:d.date});
  const expected=events.filter(e=>e.localDate===d.date).map(e=>e.id).sort();
  if(JSON.stringify(expected)!==JSON.stringify([...d.eventIds].sort()))errors.push({events:d.date});
}
if(days.length!==1461||uniqueDays.size!==1461)errors.push({dayCount:days.length,uniqueDayCount:uniqueDays.size});
if(raw.length!==198||events.length!==198)errors.push({expectedEvents:raw.length,outputEvents:events.length});
if(angleDifference>1e-7)errors.push({illuminationIdentityDifference:angleDifference});
const report={
  method:'Independent parser of raw USNO annual JSON; JavaScript Intl/ICU Europe/Ljubljana conversion; no generator import',
  node:process.version,icu:process.versions.icu,
  checkedDayCount:days.length,uniqueDayCount:uniqueDays.size,
  checkedEventCount:raw.length,outputEventCount:events.length,
  eventsWithUTtoLocalDateShift:shifted,maxFractionIdentityDifference:angleDifference,
  calendarWeekdayAndNoonChecks:days.length,errors,
  boundaryExample:raw.find(e=>e.utc==='2027-02-20T23:23:00Z'),
  march2027Events:raw.filter(e=>e.date.startsWith('2027-03')),
  leapDays:days.filter(d=>d.date.endsWith('02-29')).map(d=>d.date)
};
fs.writeFileSync(path.join(here,'../../evidence/lunar/date-audit.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({checkedDays:days.length,checkedEvents:raw.length,errors:errors.length},null,2));
if(errors.length)process.exitCode=1;
