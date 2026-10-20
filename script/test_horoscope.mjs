import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as sky from '../public/horoscope/sky-v1.mjs';
import {localDate,wallTimeCandidates,ascendantLongitude} from '../public/horoscope/math-v1.mjs';
import {makeEdition,validateEdition} from '../lib/horoscope/edition.mjs';
import {onRequestGet} from '../functions/horoskop/dnevno.json.js';
import {datedSchema,renderDailyHTML} from '../lib/horoscope/render.mjs';
const fixture=JSON.parse(fs.readFileSync(new URL('../evidence/horoscope-ascendant-reference.json',import.meta.url)));
let maxError=0,assertions=0;
for(const sample of fixture.samples){
  const instant=new Date(sample.instant),r=sky.Rotation_EQD_ECT(instant).rot,eps=Math.atan2(Math.abs(r[1][2]),r[1][1])*180/Math.PI;
  const actual=ascendantLongitude(sky.SiderealTime(instant),eps,sample.latitude,sample.longitude);
  const error=Math.abs(((actual-sample.reference+540)%360)-180);maxError=Math.max(maxError,error);assert.ok(error<.001,sample.location+' '+sample.instant);assertions++;
}
assert.equal(wallTimeCandidates('2026-03-29','02:30','Europe/Ljubljana').length,0);
assert.deepEqual(wallTimeCandidates('2026-10-25','02:30','Europe/Ljubljana').map(d=>d.toISOString()),['2026-10-25T00:30:00.000Z','2026-10-25T01:30:00.000Z']);
assert.equal(wallTimeCandidates('2026-11-01','01:30','America/New_York').length,2);
assert.equal(wallTimeCandidates('2026-04-05','01:45','Australia/Lord_Howe').length,2);
assert.equal(wallTimeCandidates('2011-12-30','12:00','Pacific/Apia').length,0);
assert.throws(()=>wallTimeCandidates('2026-02-30','12:00','Europe/Ljubljana'));
assert.throws(()=>ascendantLongitude(1,23.4,90,14));
assert.equal(localDate(new Date('2026-10-20T21:59:59Z')),'2026-10-20');
assert.equal(localDate(new Date('2026-10-20T22:00:00Z')),'2026-10-21');assertions+=9;
const first=validateEdition(makeEdition('2026-10-20'),'2026-10-20'),second=validateEdition(makeEdition('2026-10-21'),'2026-10-21');
for(const sign of Object.keys(first.signs)){assert.notEqual(first.signs[sign].overview,second.signs[sign].overview,sign+' daily original text must change');assertions++;}
assert.equal(first.sky.moon.phase,'Rastoča Luna');assertions++;
const oldSchema='<script type="application/ld+json">'+JSON.stringify({'@graph':[{'@type':'Article','@id':'https://koledar365.si/horoskop/dvojcka/#dnevni-zapis',headline:'Old content',datePublished:'2000-01-01'},{'@type':'WebSite',name:'Koledar365'}]})+'</script>';
const renewed=JSON.parse(datedSchema(oldSchema,second,'dvojcka').match(/>(.*)</)[1]);
assert.equal(renewed['@graph'][0].headline,second.signs.dvojcka.title);
assert.equal(renewed['@graph'][0].datePublished,second.generated_at);
assert.equal(renewed['@graph'][0].description,'Razvedrilna slovenska izdaja za 2026-10-21.');
assert.equal(renewed['@graph'][1].name,'Koledar365');
assert.equal(datedSchema('<script type="application/ld+json">broken</script>',second,''),'<script type="application/ld+json">broken</script>');
assert.equal((await renderDailyHTML({request:new Request('https://koledar365.si/horoskop/missing/'),next:()=>new Response('not found',{status:404})})).status,404);
// Without the edge HTMLRewriter runtime, preserve the fallback's genuine date.
const fallback=await renderDailyHTML({request:new Request('https://koledar365.si/horoskop/dvojcka/'),env:{ASSETS:{fetch:()=>new Response('<div data-horoscope-app data-edition-day="2000-01-01">Original dated fallback</div>',{headers:{'content-type':'text/html'}})}}});
assert.match(await fallback.text(),/data-edition-day="2000-01-01"/);assertions+=7;
const RealDate=globalThis.Date;
async function at(instant,callback){
  const fixed=RealDate.parse(instant);
  globalThis.Date=class extends RealDate {constructor(...args){super(...(args.length?args:[fixed]));}static now(){return fixed;}};
  try{return await callback();}finally{globalThis.Date=RealDate;}
}
let before,after;
await at('2026-10-20T21:59:59Z',async()=>{const response=await onRequestGet({request:new Request('https://koledar365.si/horoskop/dnevno.json')});assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');before=await response.json();assert.equal(before.local_date,'2026-10-20');assertions+=3;});
await at('2026-10-20T22:00:00Z',async()=>{const response=await onRequestGet({request:new Request('https://koledar365.si/horoskop/dnevno.json')});after=await response.json();assert.equal(after.local_date,'2026-10-21');assert.equal(Object.keys(after.signs).length,12);assert.notEqual(after.signs.dvojcka.overview,before.signs.dvojcka.overview);const future=await onRequestGet({request:new Request('https://koledar365.si/horoskop/dnevno.json?date=2026-10-22')});assert.equal(future.status,400);const old=await onRequestGet({request:new Request('https://koledar365.si/horoskop/dnevno.json?date=2026-10-20')});assert.equal((await old.json()).local_date,'2026-10-20');assertions+=5;});
const seasons=JSON.parse(fs.readFileSync(new URL('../public/horoscope/seasons-v1.json',import.meta.url))).years;
for(const [year,signs] of Object.entries(seasons))for(const [slug,row] of Object.entries(signs)){const span=(Date.parse(row.ends_at)-Date.parse(row.starts_at))/86400000;assert.ok(span>29&&span<32,`${year} ${slug}`);assertions++;}
let previousEdition,annualComparisons=0;
for(let offset=0;offset<366;offset++){const day=new Date(Date.UTC(2026,0,1+offset)).toISOString().slice(0,10),edition=makeEdition(day);if(previousEdition)for(const slug of Object.keys(edition.signs)){assert.notEqual(edition.signs[slug].overview,previousEdition.signs[slug].overview,day+' '+slug+' overview');assert.notEqual(edition.signs[slug].thought,previousEdition.signs[slug].thought,day+' '+slug+' daily thought');assertions+=2;annualComparisons++;}previousEdition=edition;}
const started=performance.now();for(let i=0;i<50;i++)makeEdition('2026-10-20');const meanMs=(performance.now()-started)/50;
const report={passed:true,assertions,independent_reference:fixture.reference,ascendant_samples:fixture.samples.length,max_ascendant_error_degrees:maxError,dst_cases:5,midnight_rollover:true,daily_signs_changed:12,solar_seasons:60,annual_day_comparisons:annualComparisons,mean_edition_compute_ms:meanMs};
fs.writeFileSync(new URL('../evidence/horoscope-logic-qa.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
