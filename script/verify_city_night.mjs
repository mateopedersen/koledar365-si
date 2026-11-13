import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {cityPhotoState} from '../public/photo-time/state-8f37e36480e7f760.mjs';
import {createCityPhotoController} from '../public/photo-time/controller-d64a383276d8d3d3.mjs';
const repo=new URL('..',import.meta.url).pathname.replace(/\/$/,'');
const data=JSON.parse(await fs.readFile(repo+'/data/cities_sl.json'));
const cities=data.cities.map(c=>({...c,latitude:c.coordinates[0].lat,longitude:c.coordinates[0].lon,timeZone:'Europe/Ljubljana'}));
let boundaries=0;
const days=['2026-11-13','2027-03-28','2027-10-31','2027-06-21','2027-12-21'];
for(const city of cities){
 for(const date of days){
  const noon=await cityPhotoState(city,new Date(date+'T12:00:00Z'));
  assert.equal(noon.period,'day',city.id+' midday');
  for(const [at,before,after] of [[noon.rise,'night','day'],[noon.set,'day','night']]){
   assert.ok(at instanceof Date,city.id+' transition exists');
   assert.equal((await cityPhotoState(city,new Date(+at-1))).period,before,city.id+' before');
   assert.equal((await cityPhotoState(city,at)).period,after,city.id+' exact');
   assert.equal((await cityPhotoState(city,new Date(+at+1))).period,after,city.id+' after');boundaries+=3;
  }
  assert.equal((await cityPhotoState(city,new Date(date+'T23:00:00Z'))).period,'night',city.id+' midnight');
 }
}
const coverage=[];
for(const city of cities){const photo=city.night_photo;const item={id:city.id,name:city.name,night:!!photo};if(photo){const bytes=await fs.readFile(repo+'/public'+photo.local_path);item.asset=photo.local_path;item.sha256=crypto.createHash('sha256').update(bytes).digest('hex');item.bytes=bytes.length;item.license=photo.license;item.source=photo.source;assert.equal(item.sha256,photo.sha256,city.id+' checksum');}coverage.push(item)}
const shown=[],pending={};let instant=new Date('2026-11-13T21:00:00Z');
const day=Object.fromEntries(cities.map(c=>[c.id,{image:c.photo.local_path}])),night=Object.fromEntries(cities.filter(c=>c.night_photo).map(c=>[c.id,{image:c.night_photo.local_path}]));
let loads=0;const controller=createCityPhotoController({cities,day,night,stateFor:cityPhotoState,now:()=>instant,setTimer:()=>0,clearTimer:()=>{},load:photo=>{loads++;return new Promise(resolve=>{pending[photo.image]=()=>resolve({image:photo.image})})},display:v=>shown.push({id:v.city.id,period:v.period,image:v.photo.image})});
const a=controller.select('ljubljana');await new Promise(r=>setTimeout(r,0));const b=controller.select('kamnik');await new Promise(r=>setTimeout(r,0));pending[night.kamnik.image]();await b;pending[night.ljubljana.image]();await a;assert.equal(shown.at(-1).id,'kamnik');assert.equal(shown.length,1,'late prior city cannot overwrite');assert.equal(shown[0].period,'night');const beforeLoads=loads;await controller.select('kamnik');assert.equal(loads,beforeLoads,'decoded selected frame reused');
const archive=controller.select('ajdovscina');await new Promise(r=>setTimeout(r,0));pending[day.ajdovscina.image]();await archive;assert.equal(shown.at(-1).period,'archive','missing genuine night remains explicit archive');controller.dispose();
const paints=[],releases={};let signalA,signalB;
const startedA=new Promise(resolve=>{signalA=resolve}),startedB=new Promise(resolve=>{signalB=resolve});
const delayed=createCityPhotoController({cities,day,night,stateFor:cityPhotoState,now:()=>instant,setTimer:()=>0,clearTimer:()=>{},load:async photo=>({image:photo.image}),display:async({city,isCurrent})=>{await new Promise(resolve=>{releases[city.id]=resolve;(city.id==='ljubljana'?signalA:signalB)()});if(!isCurrent())return false;paints.push(city.id);return true;}});
const slow=delayed.select('ljubljana');await startedA;const fast=delayed.select('kamnik');await startedB;releases.kamnik();assert.equal(await fast,true);releases.ljubljana();assert.equal(await slow,false);assert.deepEqual(paints,['kamnik'],'an outdated final-DOM render cannot commit');delayed.dispose();
const out={date:'2026-11-13',total:cities.length,nightAvailable:coverage.filter(c=>c.night).length,nightMissing:coverage.filter(c=>!c.night).length,solarCases:days.length*cities.length,boundaryAssertions:boundaries,controllerAssertions:8,coverage};
if(process.env.CITY_NIGHT_EVIDENCE)await fs.writeFile(process.env.CITY_NIGHT_EVIDENCE,JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({total:out.total,nightAvailable:out.nightAvailable,nightMissing:out.nightMissing,solarCases:out.solarCases,boundaryAssertions:out.boundaryAssertions,controllerAssertions:out.controllerAssertions}));
