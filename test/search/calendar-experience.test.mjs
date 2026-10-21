import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createCalendarWorkbook,excelDate,isoWeek} from '../../public/calendar-tools/xlsx.mjs';
import {selectedPeriod,dateInISOWeek,weeksInYear} from '../../public/calendar-tools/experience.mjs';

const source=JSON.parse(fs.readFileSync(new URL('../../data/source/slovenia-localisation.json',import.meta.url),'utf8'));
const data={years:[2026,2027,2028,2029,2030],months:['januar','februar','marec','april','maj','junij','julij','avgust','september','oktober','november','december'],days:['ponedeljek','torek','sreda','četrtek','petek','sobota','nedelja'],holidays:source.years['2028'].events.filter(event=>event.work_free).map(event=>({date:event.date,title:event.name_sl})),min_date:'2026-01-01',max_date:'2030-12-31',source:'https://pisrs.si/pregledPredpisa?id=ZAKO865'};
const initial={year:2026,month:10,date:'2026-10-21'};

test('monthly selection retains 2026 and leap February exactly',()=>{
  let selected=selectedPeriod({data,kind:'monthly',initial,search:'?year=2026&month=1'});
  assert.equal(selected.date.toISOString().slice(0,10),'2026-01-01');
  selected=selectedPeriod({data,kind:'monthly',initial,search:'?year=2028&month=2'});
  assert.equal(selected.year,2028);assert.equal(selected.month,2);
});
test('ISO weeks cross calendar years and reject nonexistent week 53',()=>{
  assert.deepEqual(isoWeek(new Date('2027-01-01T00:00Z')),{year:2026,week:53});
  assert.equal(dateInISOWeek(2026,1).toISOString().slice(0,10),'2025-12-29');
  assert.equal(weeksInYear(2026),53);assert.equal(weeksInYear(2027),52);
  assert.equal(dateInISOWeek(2027,53),null);
  const first=selectedPeriod({data,kind:'weekly',initial,search:'?year=2026&week=1'});
  assert.equal(first.date.toISOString().slice(0,10),'2026-01-01');
  assert.deepEqual(isoWeek(first.date),{year:2026,week:1});
  const last=selectedPeriod({data,kind:'weekly',initial,search:'?date=2030-12-31'});
  assert.deepEqual(isoWeek(last.date),{year:2031,week:1});
});
test('static hubs use the current Ljubljana date while explicit periods and year routes stay selected',()=>{
  const current=selectedPeriod({data,kind:'monthly',initial,today:'2027-11-09'});
  assert.equal(current.date.toISOString().slice(0,10),'2027-11-01');
  const week=selectedPeriod({data,kind:'weekly',initial,today:'2027-11-09'});
  assert.equal(week.date.toISOString().slice(0,10),'2027-11-09');
  const explicit=selectedPeriod({data,kind:'monthly',initial,today:'2027-11-09',search:'?year=2026&month=10'});
  assert.equal(explicit.date.toISOString().slice(0,10),'2026-10-01');
  const yearPage=selectedPeriod({data,kind:'weekly',initial,today:'2027-11-09',path:'/tedenski-koledar/2028/'});
  assert.deepEqual(isoWeek(yearPage.date),{year:2028,week:1});
});
test('real XLSX contains numeric leap dates editable notes and formulas',async()=>{
  const result=createCalendarWorkbook({year:2028,month:2,data,notes:'=SUM(1,2) & Črt'});
  const bytes=Buffer.from(await result.blob.arrayBuffer());
  assert.equal(bytes.readUInt32LE(0),0x04034b50);
  const files=new Map();let offset=0;
  while(bytes.readUInt32LE(offset)===0x04034b50){const size=bytes.readUInt32LE(offset+18),nameSize=bytes.readUInt16LE(offset+26),extraSize=bytes.readUInt16LE(offset+28);const name=bytes.subarray(offset+30,offset+30+nameSize).toString();const start=offset+30+nameSize+extraSize;files.set(name,bytes.subarray(start,start+size).toString());offset=start+size}
  assert.ok(files.has('[Content_Types].xml'));assert.match(files.get('xl/workbook.xml'),/name="Februar"/);
  const month=files.get('xl/worksheets/sheet1.xml'),dates=files.get('xl/worksheets/sheet2.xml');
  assert.match(month,/>=SUM\(1,2\) &amp; Črt<\/t>/);
  assert.ok(month.includes(`<v>${excelDate(new Date('2028-02-29T00:00Z'))}</v>`));
  assert.equal((dates.match(/<f>IF\(/g)||[]).length,29);
  assert.match(dates,/<f>SUM\(F5:F33\)<\/f><v>20<\/v>/);
  assert.match(result.filename,/2028-02\.xlsx$/);
  assert.throws(()=>createCalendarWorkbook({year:2025,data}),/veljavno/);
});
