'use strict';
(function(root){
  const DAY_NAMES=['','Ponedeljek','Torek','Sreda','Četrtek','Petek'];
  const KIND_NAMES={homework:'Domača naloga',test:'Preverjanje znanja',project:'Projekt'};
  const validDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
  const safeText=value=>String(value||'').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g,'').trim();
  function validateLesson(row){
    if(!row||!Number.isInteger(Number(row.day))||Number(row.day)<1||Number(row.day)>5)throw Error('Izberi šolski dan od ponedeljka do petka.');
    const subject=safeText(row.subject);if(!subject||subject.length>80)throw Error('Vnesi predmet (največ 80 znakov).');
    if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(row.start)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(row.end)||row.end<=row.start)throw Error('Konec ure mora biti pozneje od začetka.');
    if(safeText(row.room).length>40||safeText(row.teacher).length>80)throw Error('Preveri dolžino učilnice ali imena učitelja.');
    const id=safeText(row.id);if(id.length>80||(id&&!/^[A-Za-z0-9-]+$/.test(id)))throw Error('Identifikator predmeta je neveljaven.');
    return {id:id||crypto.randomUUID(),day:Number(row.day),subject,start:row.start,end:row.end,room:safeText(row.room),teacher:safeText(row.teacher),color:['blue','red','navy'].includes(row.color)?row.color:'blue'};
  }
  function validateTask(row){
    const title=safeText(row&&row.title);if(!title||title.length>120)throw Error('Vnesi obveznost (največ 120 znakov).');
    if(!validDate(row.due))throw Error('Izberi veljaven datum roka.');
    const subject=safeText(row.subject);if(subject.length>80)throw Error('Ime predmeta je predolgo.');
    const id=safeText(row.id);if(id.length>80||(id&&!/^[A-Za-z0-9-]+$/.test(id)))throw Error('Identifikator obveznosti je neveljaven.');
    return {id:id||crypto.randomUUID(),title,due:row.due,subject,kind:Object.hasOwn(KIND_NAMES,row.kind)?row.kind:'homework',priority:row.priority==='high'?'high':'normal',done:row.done===true};
  }
  function cleanState(value){
    if(!value||value.version!==1||!Array.isArray(value.lessons)||!Array.isArray(value.tasks)||value.lessons.length>100||value.tasks.length>200)throw Error('Datoteka ne vsebuje veljavne kopije šolskega načrta.');
    const lessons=value.lessons.map(validateLesson),tasks=value.tasks.map(validateTask);
    if(new Set(lessons.map(row=>row.id)).size!==lessons.length||new Set(tasks.map(row=>row.id)).size!==tasks.length)throw Error('Kopija vsebuje podvojene zapise.');
    for(let i=0;i<lessons.length;i++)for(let j=i+1;j<lessons.length;j++)if(lessons[i].day===lessons[j].day&&lessons[i].start<lessons[j].end&&lessons[i].end>lessons[j].start)throw Error('Kopija vsebuje prekrivajoči se uri.');
    return {version:1,sample:value.sample===true,lessons,tasks};
  }
  function escapeText(value){return safeText(value).replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');}
  function foldLine(line){
    const encoder=new TextEncoder(),chunks=[];let current='',bytes=0;
    for(const character of String(line)){const width=encoder.encode(character).length,limit=chunks.length?74:75;if(bytes+width>limit){chunks.push(current);current='';bytes=0}current+=character;bytes+=width}
    chunks.push(current);return chunks.join('\r\n ');
  }
  function utcForLjubljana(date,time){
    const [year,month,day]=date.split('-').map(Number),[hour,minute]=time.split(':').map(Number),wanted=Date.UTC(year,month-1,day,hour,minute,0);
    let candidate=wanted;
    const formatter=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Ljubljana',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
    for(let index=0;index<5;index++){
      const parts=Object.fromEntries(formatter.formatToParts(new Date(candidate)).filter(part=>part.type!=='literal').map(part=>[part.type,Number(part.value)]));
      const rendered=Date.UTC(parts.year,parts.month-1,parts.day,parts.hour,parts.minute,parts.second),difference=wanted-rendered;
      if(difference===0)return new Date(candidate).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
      candidate+=difference;
    }
    throw Error('Za izbrani datum in uro ni mogoče določiti krajevnega časa. Preveri prehod na poletni ali zimski čas.');
  }
  function buildIcs(state,from,until,stamp=new Date()){
    const data=cleanState(state);if(!validDate(from)||!validDate(until)||until<from)throw Error('Preveri začetni in končni datum izvoza.');
    const first=new Date(from+'T12:00:00Z'),last=new Date(until+'T12:00:00Z');if((last-first)/86400000>370)throw Error('Izberi obdobje, krajše od enega šolskega leta.');
    const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Koledar365//Moj solski urnik//SL','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:Koledar365 - moj šolski urnik'];let count=0;
    for(let cursor=new Date(first);cursor<=last;cursor.setUTCDate(cursor.getUTCDate()+1)){
      const day=cursor.getUTCDay();if(day<1||day>5)continue;const date=cursor.toISOString().slice(0,10);
      for(const lesson of data.lessons.filter(row=>row.day===day)){
        if(++count>2000)throw Error('Izbrano obdobje ustvari več kot 2.000 dogodkov. Skrajšaj obdobje ali izvozi manj predmetov.');
        const uid=`${lesson.id}-${date}@koledar365.si`,description=[lesson.room&&`Učilnica: ${lesson.room}`,lesson.teacher&&`Učitelj/-ica: ${lesson.teacher}`].filter(Boolean).join('\n');
        lines.push('BEGIN:VEVENT',`UID:${uid}`,`DTSTAMP:${stamp.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z')}`,`DTSTART:${utcForLjubljana(date,lesson.start)}`,`DTEND:${utcForLjubljana(date,lesson.end)}`,`SUMMARY:${escapeText(lesson.subject)}`,...(description?[`DESCRIPTION:${escapeText(description)}`]:[]),`CATEGORIES:Šolski urnik,${DAY_NAMES[day]}`,'END:VEVENT');
      }
    }
    for(const task of data.tasks.filter(row=>!row.done&&row.due>=from&&row.due<=until)){
      if(++count>2000)throw Error('Izbrano obdobje ustvari več kot 2.000 dogodkov. Skrajšaj obdobje ali izvozi manj predmetov.');
      const [year,month,day]=task.due.split('-').map(Number),next=new Date(Date.UTC(year,month-1,day+1)).toISOString().slice(0,10).replace(/-/g,'');
      lines.push('BEGIN:VEVENT',`UID:${task.id}@koledar365.si`,`DTSTAMP:${stamp.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z')}`,`DTSTART;VALUE=DATE:${task.due.replace(/-/g,'')}`,`DTEND;VALUE=DATE:${next}`,`SUMMARY:${escapeText(`${KIND_NAMES[task.kind]}: ${task.title}`)}`,...(task.subject?[`DESCRIPTION:${escapeText(`Predmet: ${task.subject}`)}`]:[]),'CATEGORIES:Šolske obveznosti','END:VEVENT');
    }
    lines.push('END:VCALENDAR');return lines.map(foldLine).join('\r\n')+'\r\n';
  }
  root.K365StudentCore={DAY_NAMES,KIND_NAMES,validDate,validateLesson,validateTask,cleanState,utcForLjubljana,buildIcs,foldLine};
})(window);
