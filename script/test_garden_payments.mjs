import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {isDate,sloveniaToday,calendarICS,nextDate,foldLine} from '../public/garden/calendar-tools.mjs';
import {normalizePlan,matchesPlant} from '../public/garden/experience.mjs';
import {filterPayments,nextPayment,paymentEvents} from '../public/payments/experience.mjs';
const garden=JSON.parse(fs.readFileSync(new URL('../public/garden/data.json',import.meta.url)));
const payments=JSON.parse(fs.readFileSync(new URL('../public/payments/data.json',import.meta.url)));

test('civil dates reject rollover and use Ljubljana at midnight across DST',()=>{
  assert.equal(isDate('2027-02-29'),false);assert.equal(isDate('2028-02-29'),true);
  assert.equal(isDate('2026-13-01'),false);assert.equal(nextDate('2026-12-31'),'2027-01-01');
  assert.equal(sloveniaToday(new Date('2026-10-24T22:30:00Z')),'2026-10-25');
  assert.equal(sloveniaToday(new Date('2026-10-25T23:30:00Z')),'2026-10-26');
});
test('ICS is escaped, CRLF delimited, UTF-8 folded and uses exclusive next-day end',()=>{
  const ics=calendarICS([{id:'test',date:'2026-12-31',title:'Vrt, česen; žetev',description:'Prva\\druga\n'+('ČŠŽ,;'.repeat(40))}],'Moj vrt');
  assert.match(ics,/DTEND;VALUE=DATE:20270101/);assert.match(ics,/SUMMARY:Vrt\\, česen\\; žetev/);
  assert.match(ics,/DESCRIPTION:Prva\\\\druga\\n/);assert.equal(/(?<!\r)\n/.test(ics),false);
  for(const line of ics.split('\r\n'))assert.ok(Buffer.byteLength(line)<=75);
  assert.equal(foldLine('Š'.repeat(60)).replace(/\r\n /g,''),'Š'.repeat(60));
});
test('garden filter intersects crop, month, task and growing method without invented offsets',()=>{
  const tomato=garden.plants.find(p=>p.id==='paradiznik');
  assert.equal(matchesPlant(tomato,{month:3,task:'setev',place:'sadike'}),true);
  assert.equal(matchesPlant(tomato,{month:3,task:'sajenje',place:'prosto'}),false);
  const garlic=garden.plants.find(p=>p.name.toLowerCase().includes('česen'));
  assert.equal(matchesPlant(garlic,{query:'cesen'}),true);
});
test('garden backup validation rejects impossible dates, unknown crops, duplicate IDs and excessive tasks',()=>{
  const row={id:'one',plant:'paradiznik',task:'Setev',date:'2027-03-10',note:'<script>example</script>',done:true};
  assert.deepEqual(normalizePlan({version:1,tasks:[row]},garden.plants),[row]);
  for(const tasks of [[{...row,date:'2027-02-29'}],[{...row,plant:'unknown'}],[row,row],Array(201).fill(row)])assert.throws(()=>normalizePlan({version:1,tasks},garden.plants));
});
test('every gardening window references a recorded Slovene source and explicit months',()=>{
  assert.equal(garden.plants.length,16);
  for(const plant of garden.plants)for(const task of plant.tasks){assert.ok(garden.sources[task.source]);assert.ok(task.months.length);assert.ok(task.months.every(m=>Number.isInteger(m)&&m>=1&&m<=12));assert.ok(task.window.trim().length>0);}
});
test('published pensions preserve December 29 rather than estimating the last weekday',()=>{
  const rows=payments.events.filter(e=>e.source_id==='zpiz');assert.equal(rows.length,12);
  assert.equal(rows.at(-1).date,'2026-12-29');
  assert.equal(nextPayment(rows,'all','2026-10-21').date,'2026-10-30');
  assert.equal(nextPayment(rows,'all','2026-12-30'),null);
});
test('social payments preserve the actual January 2027 carry-over and original December plan',()=>{
  const rows=payments.events.filter(e=>e.source_id==='csd');assert.equal(rows.length,151);
  const carry=filterPayments(rows,{month:'2027-01',upcoming:false});assert.equal(carry.length,1);
  assert.equal(carry[0].date,'2027-01-05');assert.equal(carry[0].plan_month,'2026-12');
  assert.equal(nextPayment(rows,'all','2027-01-06'),null);
});
test('published payment files exactly match their source category and date values',()=>{
  const ids=new Set();for(const event of payments.events){assert.equal(isDate(event.date),true);assert.equal(ids.has(event.id),false);ids.add(event.id);assert.ok(payments.categories[event.category]);assert.ok(payments.sources[event.source_id]);}
  for(const [key,category] of Object.entries(payments.categories)){
    const events=payments.events.filter(e=>e.category===key);
    const ics=fs.readFileSync(new URL(`../public/payments/${key}-2026.ics`,import.meta.url),'utf8');
    assert.equal((ics.match(/BEGIN:VEVENT/g)||[]).length,events.length);
    for(const event of events)assert.ok(ics.includes('DTSTART;VALUE=DATE:'+event.date.replaceAll('-','')));
    assert.ok(paymentEvents(events,payments.categories,payments.sources).every(e=>e.description.includes(payments.sources[category.source_id].url)));
  }
});
