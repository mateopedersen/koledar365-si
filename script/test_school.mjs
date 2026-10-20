import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {schoolBreaks,countSchoolDays,buildICS,ljubljanaToday,validDate,daysInclusive} from '../public/school/experience.mjs';
const data=JSON.parse(readFileSync(new URL('../public/school/data.json',import.meta.url)));
test('winter dates follow school location, while official primary and secondary ranges stay distinct',()=>{
 assert.equal(schoolBreaks(data,'primary','west').find(r=>r.season==='winter').start,'2027-02-22');
 assert.equal(schoolBreaks(data,'primary','east').find(r=>r.season==='winter').start,'2027-02-15');
 assert.deepEqual(schoolBreaks(data,'secondary','east').find(r=>r.id==='newyear').start,'2026-12-28');
 assert.equal(schoolBreaks(data,'primary','east').find(r=>r.id==='newyear').start,'2026-12-25');
 assert.equal(schoolBreaks(data,'secondary','west').find(r=>r.id==='may').end,'2027-04-30');
 assert.equal(schoolBreaks(data,'primary','west').find(r=>r.id==='summer').start,'2027-06-28');
});
test('planner counts overlapping weekends, holidays and breaks once',()=>{
 for(const level of ['primary','secondary'])assert.deepEqual(countSchoolDays(data,level,'west','2027-04-24','2027-05-02'),{free:9,teaching:0,total:9});
 assert.deepEqual(countSchoolDays(data,'primary','east','2027-02-15','2027-02-19'),{free:5,teaching:0,total:5});
 assert.deepEqual(countSchoolDays(data,'primary','west','2027-02-15','2027-02-19'),{free:0,teaching:5,total:5});
 assert.deepEqual(countSchoolDays(data,'secondary','east','2026-12-25','2027-01-03'),{free:10,teaching:0,total:10});
 assert.deepEqual(countSchoolDays(data,'primary','west','2027-06-25','2027-06-28'),{free:4,teaching:0,total:4});
 assert.throws(()=>countSchoolDays(data,'primary','west','2027-02-31','2027-03-04'));
 assert.throws(()=>countSchoolDays(data,'primary','west','2028-01-01','2028-01-02'));
 assert.throws(()=>countSchoolDays(data,'primary','west','2027-05-03','2027-05-02'));
});
test('the verified registry scope is complete, does not duplicate former private UNM, and flags associations',()=>{
 assert.equal(data.universities.length,9);assert.equal(new Set(data.universities.map(u=>u.id)).size,9);
 assert.equal(data.universities.filter(u=>u.kind==='university').length,7);
 assert.deepEqual(data.universities.filter(u=>u.kind==='association').map(u=>u.id).sort(),['emuni','eu']);
 assert.deepEqual(data.universities.filter(u=>u.status==='unverified').map(u=>u.id).sort(),['ameu','eu']);
 for(const uni of data.universities){assert.match(uni.registryUrl,/https:\/\/portal.nakvis.si\/javne-evidence\/visokosolski-zavodi\//);if(uni.status==='unverified')assert.deepEqual(uni.periods,[]);}
 const unm=data.universities.find(u=>u.id==='unm');assert.deepEqual(unm.periods,[]);
 const fis=unm.calendars.find(c=>c.id==='fis'),fei=unm.calendars.find(c=>c.id==='fei');
 assert.equal(fis.periods.find(p=>p[0]==='Zimsko izpitno obdobje')[1],'2027-01-25');
 assert.equal(fei.periods.find(p=>p[0]==='Zimsko izpitno obdobje')[1],'2027-01-18');
});
test('every published period has real ordered dates inside the stated academic year and a primary source',()=>{
 for(const uni of data.universities){assert.match(uni.url,/^https:\/\//);for(const cal of [{periods:uni.periods},...(uni.calendars||[])])for(const [name,start,end,kind]of cal.periods){assert.ok(validDate(start)&&validDate(end),name);assert.ok(start<=end,name);assert.ok(start>='2026-10-01'&&end<='2027-09-30',name);assert.ok(['semester','exam','break'].includes(kind));}}
 assert.equal(validDate('2027-02-29'),false);assert.equal(validDate('2028-02-29'),true);
});
test('ICS preserves inclusive all-day ranges across year boundaries and folds UTF-8 safely',()=>{
 const contents=buildICS([{id:'newyear',name:'Počitnice, prazniki; šola',start:'2026-12-25',end:'2027-01-02',url:data.sources.primary,description:'č'.repeat(100)+'\nDruga vrstica'}],'2026/27-primary-west',new Date('2026-10-20T00:00:00Z'));
 assert.match(contents,/DTSTART;VALUE=DATE:20261225/);assert.match(contents,/DTEND;VALUE=DATE:20270103/);assert.match(contents,/SUMMARY:Počitnice\\, prazniki\\; šola/);assert.match(contents,/DTSTAMP:20261020T000000Z/);
 for(const line of contents.split('\r\n'))assert.ok(Buffer.byteLength(line,'utf8')<=75);
 assert.equal(daysInclusive('2026-12-25','2027-01-02'),9);
});
test('countdown day follows Ljubljana at midnight and the daylight-saving boundary',()=>{
 assert.equal(ljubljanaToday(new Date('2026-10-20T22:30:00Z')),'2026-10-21');
 assert.equal(ljubljanaToday(new Date('2026-10-25T23:30:00Z')),'2026-10-26');
});

test('event identities stay stable between individual and combined imports',()=>{
 const event={id:'nu-0',uid:'academic-2026-2027-nu-0',name:'NU · Zimski semester',start:'2026-10-01',end:'2027-01-14',url:'https://www.nova-uni.si/'};
 const single=buildICS([event],'single'),all=buildICS([event],'all');
 assert.equal(single.match(/UID:(.+)/)[1],all.match(/UID:(.+)/)[1]);
});
