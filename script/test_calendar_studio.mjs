import assert from 'node:assert/strict';
import {initialState,normalize,monthGrid,validDate,isoWeek,holidays,eventsFor,renderCalendar,exportPages,parseEvents,eventsICS,createPDF} from '../public/studio/engine.mjs';

assert.equal(monthGrid(2027,1,1)[0].date,'2026-12-28');
assert.equal(monthGrid(2027,1,0)[0].date,'2026-12-27');
assert.equal(monthGrid(2028,2).filter(d=>d.current).length,29);
assert.equal(monthGrid(2100,2).filter(d=>d.current).length,28);
assert.equal(validDate('2027-02-29'),false);
assert.equal(validDate('2028-02-29'),true);
assert.equal(isoWeek('2021-01-01'),53);
assert.equal(isoWeek('2021-01-04'),1);
assert(holidays(2027).some(e=>e.date==='2027-03-28'&&e.title==='Velika noč'));
assert(holidays(2028).some(e=>e.date==='2028-04-17'&&e.title==='Velikonočni ponedeljek'));

const s=initialState(2027);
s.events=[{id:'birthday',date:'2024-02-29',title:'Rojstni dan',annual:true,color:'#cf2439'},{id:'meeting',date:'2027-01-01',title:'Novo poglavje',annual:false,color:'#0054b8'}];
assert.equal(eventsFor(s,null,false).length,1);
s.year=2028;assert.equal(eventsFor(s,2,false).length,1);
s.view='month';assert.equal(exportPages(s,'all').length,13);
s.includeAgenda=false;assert.equal(exportPages(s,'all').length,12);

const csv='date,title,annual,color\n2028-02-29,"Črt, Špela in Žan",da,#cf2439\n2027-02-29,Napačen datum,ne,#000000';
const imported=parseEvents(csv);assert.equal(imported.length,1);assert.equal(imported[0].title,'Črt, Špela in Žan');assert(imported[0].annual);
const ics='BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nDTSTART;VALUE=DATE:20270520\r\nSUMMARY:Naš dogodek\\, z nadaljevanjem\r\n in dolgo vrstico\r\nRRULE:FREQ=YEARLY\r\nEND:VEVENT\r\nEND:VCALENDAR';
const fromICS=parseEvents(ics,'ics');assert.equal(fromICS.length,1);assert.equal(fromICS[0].title,'Naš dogodek, z nadaljevanjemin dolgo vrstico');assert(fromICS[0].annual);
s.events=imported;assert.equal(parseEvents(eventsICS(s),'ics')[0].title,imported[0].title);

const malicious={...initialState(2027),year:9999,photo:'javascript:alert(1)',colors:{ink:'red" onload="bad'},title:'<script>alert("x")</script>',layers:[{type:'image',src:'https://remote.test/private.jpg'},{type:'text',text:'<script/>',x:500,y:-10,color:'bad'}]};
const safe=normalize(malicious);assert.equal(safe.year,2100);assert.equal(safe.photo,'');assert.equal(safe.layers.length,1);assert.equal(safe.layers[0].x,100);assert.equal(safe.layers[0].y,0);assert.equal(safe.colors.ink,'#172941');
const svg=renderCalendar(safe);assert(!svg.includes('<script>'));assert(svg.includes('&lt;script&gt;'));assert(!svg.includes('remote.test'));
assert.throws(()=>normalize({version:100}));
for(const orientation of ['landscape','portrait'])for(const view of ['month','year']){const st={...initialState(2028),view,orientation};const out=renderCalendar(st);assert(!/NaN|undefined|Infinity/.test(out));assert.equal((out.match(/<svg /g)||[]).length,1);assert(out.includes('KOLEDAR365'));}
const photoMonth={...initialState(2028),view:'month',month:2,weekStart:0,photo:'data:image/jpeg;base64,/9j/2Q==',photoRatio:1.6,events:[{id:'special',date:'2028-02-29',title:'Anin rojstni dan',annual:false,color:'#0054b8'}]};
const photoSvg=renderCalendar(photoMonth);assert(photoSvg.includes('clipPath id="studio-art-photo-clip-2"'));assert(photoSvg.includes('clip-path="url(#studio-art-photo-clip-2)"'));assert(photoSvg.includes('Anin rojstni dan'));

const pdf=createPDF([{width:2,height:2,bytes:new Uint8Array([255,216,255,217])},{width:2,height:2,bytes:new Uint8Array([255,216,255,217])}],297,210);
const content=new TextDecoder().decode(pdf);assert(content.startsWith('%PDF-1.4'));assert(content.includes('/Count 2'));assert(content.includes('/MediaBox [0 0 841.8897637795276 595.2755905511812]'));
const start=Number(content.match(/startxref\n(\d+)/)[1]);assert.equal(new TextDecoder().decode(pdf.slice(start,start+4)),'xref');
const entries=content.slice(content.indexOf('xref\n')).split('\n').slice(3,12);for(let i=0;i<entries.length;i++){const offset=Number(entries[i].slice(0,10));assert(new TextDecoder().decode(pdf.slice(offset,offset+15)).startsWith(`${i+1} 0 obj`));}
console.log('Calendar Studio: week starts, leap years, holidays, recurrence, imports, safe SVG and multi-page PDF passed.');
