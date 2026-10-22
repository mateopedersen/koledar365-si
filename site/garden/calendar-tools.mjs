// Dates remain civil dates; host computer timezone never changes a calendar day.
export function sloveniaToday(now=new Date()) {
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Ljubljana',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(part=>[part.type,part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
export function isDate(value) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return false;
  const date=new Date(value+'T12:00:00Z');
  return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
}
export function dateLabel(value,options={day:'numeric',month:'long',year:'numeric'}) {
  if(!isDate(value))return '';
  return new Intl.DateTimeFormat('sl-SI',{...options,timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));
}
export function nextDate(value) {
  if(!isDate(value))throw new Error('Neveljaven datum.');
  const date=new Date(value+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+1);return date.toISOString().slice(0,10);
}
export function icsText(value) {return String(value??'').replace(/\\/g,'\\\\').replace(/\r?\n|\r/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');}
export function foldLine(line) {
  const encoder=new TextEncoder();let result='',part='',bytes=0;
  for(const character of line){const size=encoder.encode(character).length;if(bytes+size>75){result+=part+'\r\n';part=' ';bytes=1;}part+=character;bytes+=size;}
  return result+part;
}
export function calendarICS(events,name,{stamp='20261021T000000Z',namespace='koledar365.si'}={}) {
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Koledar365//Slovenski koledar//SL','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:'+icsText(name)];
  for(const event of events){if(!isDate(event.date))throw new Error('Neveljaven datum dogodka.');
    const id=String(event.id).replace(/[^a-zA-Z0-9_-]/g,'-');
    lines.push('BEGIN:VEVENT',`UID:${id}@${namespace}`,`DTSTAMP:${stamp}`,'DTSTART;VALUE=DATE:'+event.date.replace(/-/g,''),'DTEND;VALUE=DATE:'+nextDate(event.date).replace(/-/g,''),'SUMMARY:'+icsText(event.title),'DESCRIPTION:'+icsText(event.description||''),'TRANSP:TRANSPARENT','END:VEVENT');
  }
  lines.push('END:VCALENDAR');return lines.map(foldLine).join('\r\n')+'\r\n';
}
export function download(content,name,type='text/plain;charset=utf-8') {
  const blob=content instanceof Blob?content:new Blob([content],{type}),url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
