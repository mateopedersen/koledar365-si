import assert from 'node:assert/strict';
import fs from 'node:fs';
import profiles from '../data/horoscope/signs.json' with {type:'json'};
// Run against workerd/Pages dev with deliberately stale public HTML fixtures.
const origin=process.env.HOROSCOPE_ORIGIN;
if(!origin||!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))throw Error('Set HOROSCOPE_ORIGIN to the local stale-fixture Pages server.');
const api=await(await fetch(origin+'/horoskop/dnevno.json')).json(),rows=[];
for(const slug of ['',...profiles.map(p=>p.slug),'izracun-znamenja']){
  const route='/horoskop/'+(slug?slug+'/':''),r=await fetch(origin+route),html=await r.text();
  assert.equal(r.status,200,route);assert.equal(r.headers.get('x-horoscope-date'),api.local_date,route);assert.equal(r.headers.get('cache-control'),'no-store');
  assert.ok(html.includes('data-edition-day="'+api.local_date+'"'),route);assert.ok(!html.includes('STARI ZAPIS'),route+' full reading replaced');
  if(api.signs[slug]){
    for(const key of ['title','overview','love','work','wellbeing','thought'])assert.ok(html.includes(api.signs[slug][key]),route+' '+key);
    const schema=JSON.parse(html.match(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)[1]);
    const article=schema['@graph'].find(x=>x['@type']==='Article');assert.equal(article.headline,api.signs[slug].title);assert.equal(article.dateModified,api.generated_at);
  }
  rows.push({route,status:r.status,date:r.headers.get('x-horoscope-date'),render:r.headers.get('x-horoscope-rendering'),complete:true});
}
const head=await fetch(origin+'/horoskop/dvojcka/',{method:'HEAD'});assert.equal(head.status,200);assert.equal(head.headers.get('x-horoscope-date'),api.local_date);assert.equal(await head.text(),'');
const missing=await fetch(origin+'/horoskop/missing/');assert.equal(missing.status,404);
const report={passed:true,deliberately_stale_templates:'2000-01-01 with STARI ZAPIS instead of readings',today:api.local_date,pages:rows,head:true,unknown_route_404:true};
fs.writeFileSync(new URL('../evidence/horoscope-edge-qa.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
