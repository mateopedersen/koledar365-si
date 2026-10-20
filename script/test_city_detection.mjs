import assert from 'node:assert/strict';
import {onRequestGet} from '../functions/city-detect.js';

async function detect(cf={}) {
  const request=new Request('https://koledar365.si/city-detect/');
  Object.defineProperty(request,'cf',{value:cf});
  const response=await onRequestGet({request});
  return {response,body:await response.json()};
}

let result=await detect({country:'SI',city:'Maribor',latitude:'46.5575',longitude:'15.6456'});
assert.deepEqual(result.body,{city:'maribor',match:'city',approximate:true});
assert.equal(result.response.status,200);

result=await detect({country:'SI',city:'Marburg an der Drau'});
assert.equal(result.body.city,'maribor','Known historical/exonym city aliases map to the supported Slovenian city');

result=await detect({country:'SI',city:'Unknown settlement',latitude:'46.5575',longitude:'15.6456'});
assert.equal(result.body.city,'maribor','An unmapped locality may use the nearest supported Slovenian city');
assert.equal(result.body.match,'nearby');

for(const cf of [
  {country:'AT',city:'Maribor',latitude:'46.5575',longitude:'15.6456'},
  {country:'SI',city:'Unknown settlement',latitude:'0',longitude:'0'},
  {},
]){
  result=await detect(cf);
  assert.equal(result.body.city,null,'Only a reliable Slovenian location selects an automatic city');
  assert.equal(result.body.match,'unavailable');
}

result=await detect({country:'SI',city:'Maribor',ip:'203.0.113.42'});
assert.equal(result.response.headers.get('Cache-Control'),'private, no-store, max-age=0');
assert.equal(result.response.headers.get('CDN-Cache-Control'),'no-store');
assert.equal(Object.keys(result.body).includes('ip'),false,'The response never echoes an IP address');
console.log('PASS: exact and aliased Slovenian cities, nearby supported-city fallback, country gating, malformed metadata, and private no-store responses');
