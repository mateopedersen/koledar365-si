import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { filterEvents, normaliseState, nextEvent, buildICS, validDate, todayInLjubljana, monthCells, yearHTML } from '../public/education/experience.mjs';
import { defaultPlan, validatePlan, validateLesson, lessonOccurrences, findConflicts, localDateTimeToUTC, buildTimetableICS, migrateLegacy } from '../public/education/timetable.mjs';

const data = JSON.parse(readFileSync(new URL('../public/education/data.json', import.meta.url)));
const initial = { level:'primary', region:'west', grade:'all', stage:'all', examType:'general', session:'spring', institution:'ul', category:'all', subjects:[], upcoming:false };
const payload = (kind, config={}) => ({ ...data, kind, config:{heading:'Preverjen koledar',...config}, initial, range:kind==='study'?data.studyRange:data.schoolRange, events:data.events.filter(e=>e.kind===kind||(kind==='school'&&e.kind==='npz')) });
const schoolData = { events:data.events.filter(e=>e.kind==='school'&&['holiday','break'].includes(e.category)) };
const lesson = overrides => ({id:'mathematics', subject:'Matematika', day:1, startTime:'08:00', endTime:'08:45', room:'204', teacher:'Učiteljica Č.', repeat:'weekly', date:'', ...overrides});

test('every education event has real ordered dates and an identified Slovene primary source', () => {
  assert.equal(new Set(data.events.map(e=>e.id)).size,data.events.length);
  const sources = new Map(data.sources.map(s=>[s.id,s]));
  for(const e of data.events){assert.ok(validDate(e.start)&&validDate(e.end),e.id);assert.ok(e.start<=e.end,e.id);assert.ok(e.start>='2026-09-01'&&e.end<='2027-09-30',e.id);assert.equal(sources.get(e.source)?.language,'sl',e.id);assert.ok(data.categories[e.category]);}
  for(const source of data.sources)assert.match(source.url,/^https:\/\/(?:www\.)?(?:gov\.si|ric\.si|uni-lj\.si|moja\.um\.si|upr\.si|ung\.si|nova-uni\.si|fis\.unm\.si|fei\.uni-nm\.si)\//);
  assert.equal(validDate('2027-02-29'),false);
});
test('school level, grade, stage and location change actual events instead of only labels', () => {
  const p=payload('school');
  const west=filterEvents(p,{...initial,grade:'9'});const east=filterEvents(p,{...initial,grade:'9',region:'east'});
  assert.equal(west.find(e=>e.id==='school-primary-winter-west').start,'2027-02-22');
  assert.equal(east.find(e=>e.id==='school-primary-winter-east').start,'2027-02-15');
  assert.ok(!west.some(e=>e.id==='school-primary-winter-east'));
  assert.equal(west.find(e=>e.id==='school-primary-end9').start,'2027-06-15');
  assert.ok(!west.some(e=>e.id==='school-primary-end1-8'));
  assert.ok(west.filter(e=>e.kind==='npz').every(e=>e.grades.includes(9)));
  const secondary=filterEvents(p,{...initial,level:'secondary',stage:'final',grade:'9'});
  assert.ok(!secondary.some(e=>e.kind==='npz'||e.stage==='other'));
  assert.equal(secondary.find(e=>e.id==='school-secondary-newyear').start,'2026-12-28');
  assert.equal(secondary.find(e=>e.id==='school-secondary-final-end').start,'2027-05-21');
  assert.equal(secondary.find(e=>e.id==='school-secondary-autumn-exams').end,'2027-09-27');
});
test('general and vocational matura retain distinct results and registration deadlines', () => {
  const p=payload('matura');const general=filterEvents(p,initial);const vocational=filterEvents(p,{...initial,examType:'vocational'});
  assert.equal(general.find(e=>e.id==='matura-general-results').start,'2027-07-13');
  assert.equal(vocational.find(e=>e.id==='matura-vocational-results').start,'2027-07-08');
  assert.equal(filterEvents(p,{...initial,session:'autumn'}).find(e=>e.id==='matura-general-autumn-application').start,'2027-07-14');
  assert.equal(filterEvents(p,{...initial,examType:'vocational',session:'autumn'}).find(e=>e.id==='matura-vocational-autumn-application').start,'2027-07-09');
  assert.ok(general.some(e=>e.start==='2026-11-15'));
  assert.ok(vocational.every(e=>e.examType==='vocational'));
});
test('subject selections preserve common deadlines but exclude unrelated subject exams', () => {
  const p=payload('matura');const math=filterEvents(p,{...initial,subjects:['math']});
  assert.ok(math.some(e=>e.title.startsWith('Matematika')));
  assert.ok(math.some(e=>e.category==='application'));
  assert.ok(math.some(e=>e.category==='oral'&&e.start==='2027-06-09'&&e.end==='2027-06-23'));
  assert.ok(!math.some(e=>e.subjects?.includes('en')));
  const autumn=filterEvents(p,{...initial,subjects:['math'],session:'autumn'});
  assert.ok(!autumn.some(e=>e.schoolSchedule));
  const english=filterEvents(p,{...initial,subjects:['en'],session:'autumn'});
  assert.equal(english.filter(e=>e.schoolSchedule).length,5);
  assert.ok(english.filter(e=>e.schoolSchedule).every(e=>e.note.includes('šolskem razporedu')));
  assert.equal(normaliseState(payload('matura',{exam_type:'vocational'}),{examType:'general'}).examType,'vocational');
});
test('NPZ grade differences and faculty-specific university calendars cannot collapse', () => {
  const expected={3:'2027-05-06',6:'2027-05-03',9:'2027-04-20'};
  for(const grade of ['3','6','9']){const rows=filterEvents(payload('npz'),{...initial,grade});assert.equal(rows.find(e=>e.id===`npz-${grade}-results`).start,expected[grade]);assert.equal(rows.filter(e=>e.category==='written').length,grade==='3'?2:3);}
  const fis=filterEvents(payload('study'),{...initial,institution:'unm-fis'}),fei=filterEvents(payload('study'),{...initial,institution:'unm-fei'});
  assert.equal(fis.find(e=>e.title==='Zimsko izpitno obdobje').start,'2027-01-25');
  assert.equal(fei.find(e=>e.title==='Zimsko izpitno obdobje').start,'2027-01-18');
  assert.ok(fis.every(e=>e.institution==='unm-fis'));
});
test('upcoming date follows Ljubljana and expired dates never become next', () => {
  assert.equal(todayInLjubljana(new Date('2026-10-20T22:30:00Z')),'2026-10-21');
  assert.equal(todayInLjubljana(new Date('2026-10-25T23:30:00Z')),'2026-10-26');
  const rows=filterEvents(payload('school'),initial);
  assert.equal(nextEvent(rows,'2026-10-21').start,'2026-10-26');
  assert.ok(nextEvent(rows,'2026-10-31').start>='2026-10-31');
  assert.equal(nextEvent(rows,'2028-01-01'),null);
  assert.ok(filterEvents(payload('school'),{...initial,upcoming:true},'2027-08-30').every(e=>e.end>='2027-08-30'));
});
test('ICS keeps inclusive multi-day windows, stable identities and safe UTF-8 folding', () => {
  const p=payload('matura');const row=p.events.find(e=>e.id==='matura-general-oral');
  const first=buildICS([row],p,new Date('2026-10-21T00:00:00Z'));
  assert.match(first,/DTSTART;VALUE=DATE:20270609/);assert.match(first,/DTEND;VALUE=DATE:20270624/);assert.match(first,/UID:matura-general-oral@koledar365.si/);
  assert.match(first.replace(/\r\n /g,''),/To ni osebni termin/);
  const combined=buildICS([...p.events,row],p);assert.equal((combined.match(/UID:matura-general-oral@koledar365.si/g)||[]).length,1);
  for(const line of first.split('\r\n'))assert.ok(Buffer.byteLength(line)<=75);
  assert.ok(!first.replace(/\r\n/g,'').includes('\n'));
});
test('annual school view is exactly September–August and correct leap-date math', () => {
  const html=yearHTML(payload('school'),[],false);assert.equal((html.match(/class="ed-mini-month"/g)||[]).length,12);assert.match(html,/september 2026/);assert.match(html,/avgust 2027/);
  assert.equal(monthCells(2028,2).filter(Boolean).length,29);assert.equal(monthCells(2027,2).filter(Boolean).length,28);
});
test('weekly lessons skip the correct regional school break and keep one-off dates exact', () => {
  const base={...defaultPlan(),from:'2027-02-15',to:'2027-02-26',lessons:[lesson({})]};
  assert.deepEqual(lessonOccurrences({...base,region:'west'},schoolData).map(l=>l.date),['2027-02-15']);
  assert.deepEqual(lessonOccurrences({...base,region:'east'},schoolData).map(l=>l.date),['2027-02-22']);
  assert.deepEqual(lessonOccurrences({...base,skipBreaks:false},schoolData).map(l=>l.date),['2027-02-15','2027-02-22']);
  const once=lesson({repeat:'once',date:'2027-02-17',day:1});assert.equal(validateLesson(once).day,3);
  assert.equal(lessonOccurrences({...base,lessons:[once]},schoolData)[0].date,'2027-02-17');
});
test('timed ICS keeps 08:00 local across both DST boundaries and rejects ambiguous times', () => {
  assert.equal(localDateTimeToUTC('2026-10-23','08:00').toISOString(),'2026-10-23T06:00:00.000Z');
  assert.equal(localDateTimeToUTC('2026-10-26','08:00').toISOString(),'2026-10-26T07:00:00.000Z');
  assert.equal(localDateTimeToUTC('2027-03-26','08:00').toISOString(),'2027-03-26T07:00:00.000Z');
  assert.equal(localDateTimeToUTC('2027-03-29','08:00').toISOString(),'2027-03-29T06:00:00.000Z');
  assert.throws(()=>localDateTimeToUTC('2026-10-25','02:30'),/dvoumna/);assert.throws(()=>localDateTimeToUTC('2027-03-28','02:30'),/neobstoječa/);
  const plan={...defaultPlan(),from:'2026-10-19',to:'2026-10-26',skipBreaks:false,lessons:[lesson({})]};const ics=buildTimetableICS(plan,schoolData);
  assert.match(ics,/DTSTART:20261019T060000Z/);assert.match(ics,/DTSTART:20261026T070000Z/);assert.match(ics,/LOCATION:204/);assert.match(ics.replace(/\r\n /g,''),/Učitelj\/učiteljica: Učiteljica Č/);
});
test('overlap checking preserves adjacent classes and catches actual overlapping times', () => {
  const a={...lesson({}),date:'2026-10-21'};const b={...lesson({id:'two',startTime:'08:45',endTime:'09:30'}),date:a.date};
  assert.equal(findConflicts([a,b]).length,0);assert.equal(findConflicts([a,{...b,startTime:'08:44'}]).length,1);
});
test('backup validation prevents silent invented times, duplicate ids and unverified future holiday use', () => {
  assert.throws(()=>validatePlan({...defaultPlan(),from:'2027-09-01',to:'2028-06-24'}),/2026\/2027/);
  assert.throws(()=>validatePlan({...defaultPlan(),lessons:[lesson({}),lesson({})]}),/podvojene/);
  assert.throws(()=>validateLesson(lesson({startTime:'12:00',endTime:'11:00'})),/pozneje/);
  const legacy={version:1,entries:[{entry_id:'old',title:'Slovenščina',date:'2026-10-21',time:'09:00',end_time:'09:45',room:'A',person:'Učenka Ana'}]};
  const migrated=migrateLegacy(legacy);assert.equal(migrated.lessons[0].repeat,'once');assert.equal(migrated.lessons[0].date,'2026-10-21');assert.equal(migrated.skipBreaks,false);assert.equal(migrated.lessons[0].teacher,'');assert.equal(migrated.lessons[0].legacyPerson,'Učenka Ana');
  assert.throws(()=>migrateLegacy({version:1,entries:[{title:'No time',date:'2026-10-21'}]}),/začetni in končni čas/);
});
