import assert from 'node:assert/strict';
import {onRequestGet} from '../functions/vreme/[id].js';
import cities from '../functions/cities.js';
const city=cities[0],now=Date.now(),updated=new Date(now).toISOString();let cacheValue,requests=[],mode=200;
globalThis.caches={default:{match:async()=>cacheValue?.clone(),put:async(key,response)=>{cacheValue=response.clone()}}};
const data={properties:{meta:{updated_at:updated},timeseries:[{time:updated,data:{instant:{details:{air_temperature:13,wind_speed:2,relative_humidity:60}},next_1_hours:{summary:{symbol_code:'clearsky_day'}}}}]}};
globalThis.fetch=async(url,options)=>{requests.push({url,options});return new Response(mode===304?null:JSON.stringify(data),{status:mode,headers:{Expires:new Date(now+3600000).toUTCString(),'Last-Modified':new Date(now-1000).toUTCString()}})};
async function get(id=city.id){const pending=[];const response=await onRequestGet({request:new Request('https://koledar365.si/vreme/'+id+'/'),params:{id},waitUntil:promise=>pending.push(promise)});await Promise.all(pending);return response}
let response=await get();assert.equal(response.status,200);let body=await response.json();assert.equal(body.city,city.id);assert.equal(body.current.temperature,13);assert.ok(Date.parse(body.expires_at)>now+3500000);assert.equal(requests.length,1);
response=await get();assert.equal(response.status,200);assert.equal(requests.length,1,'No fetch before upstream Expires');
let stored=await cacheValue.json();stored.expires_at=new Date(now-1).toISOString();cacheValue=Response.json(stored);mode=304;
response=await get();assert.equal(response.status,200);assert.equal(requests.length,2);assert.equal(requests[1].options.headers['If-Modified-Since'],stored.last_modified);
assert.match(requests[0].url,/lat=-?\d+\.\d{4}&lon=-?\d+\.\d{4}$/);
response=await get('invalid');assert.equal(response.status,404);assert.equal(requests.length,2);
stored=await cacheValue.json();stored.expires_at=new Date(now-1).toISOString();cacheValue=Response.json(stored);mode=503;
response=await get();assert.equal(response.status,503);assert.equal((await response.json()).error,'Sveža vremenska napoved trenutno ni na voljo. Poskusite pozneje.');
console.log(JSON.stringify({passed:true,checks:['upstream Expires','cached read','conditional Last-Modified and 304','four-decimal coordinates','city whitelist','honest unavailable forecast']},null,2));
