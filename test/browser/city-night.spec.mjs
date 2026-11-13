import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const cities=JSON.parse(fs.readFileSync(new URL('../../data/cities_sl.json',import.meta.url))).cities;
const NIGHT='2026-11-13T21:00:00Z';
async function decodedAcrossFrames(image){
 return image.evaluate(async img=>{
  const ready=()=>img.isConnected&&img.complete&&img.naturalWidth>0;
  if(!ready())return false;
  await Promise.resolve();if(!ready())return false;
  await new Promise(resolve=>requestAnimationFrame(resolve));
  return ready();
 });
}

async function prepare(page,url='/'){
 await page.clock.setFixedTime(new Date(NIGHT));
 await page.route('**/city-detect/',route=>route.fulfill({json:{city:'ljubljana',match:'city',approximate:true}}));
 await page.route('**/vreme/*/',route=>{
  const id=new URL(route.request().url()).pathname.split('/')[2];
  return route.fulfill({json:{city:id,city_name:id,current:{at:NIGHT,temperature:6,wind:2,humidity:70,symbol:'clearsky_night',description:'Jasno'},hours:[],updated_at:NIGHT,fetched_at:NIGHT,expires_at:'2026-11-13T22:00:00Z',stale:false}});
 });
 await page.addInitScript(()=>localStorage.setItem('k365.consent',JSON.stringify({version:2,preferences:false,expiresAt:Date.now()+86400000})));
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await expect(page.locator('#city-card')).toHaveAttribute('data-weather-state','ready');
}
test('every mapped city displays its decoded genuine night asset and linked attribution',async({page})=>{
 test.setTimeout(120000);await prepare(page);
 for(const city of cities.filter(c=>c.night_photo)){
  await page.locator('#city-select').selectOption(city.id);
  await expect(page.locator('#city-card figure')).toHaveAttribute('data-photo-city',city.id);
  await expect(page.locator('#city-card figure')).toHaveAttribute('data-photo-period','night');
  await expect(page.locator('#city-photo')).toHaveAttribute('src',city.night_photo.local_path);
  expect(await decodedAcrossFrames(page.locator('#city-photo')),city.id+' decoded image').toBe(true);
  await expect(page.locator('#city-credit')).toHaveAttribute('href','/fotografije-in-licence/#'+city.id+'-noc');
 }
});
test('a saved calendar view receives the same night catalogue and current photo adapter',async({page})=>{
 await prepare(page,'/free/views/home/2028-04-month.html');
 for(const city of ['kamnik','velenje']){
  await page.locator('#city-select').selectOption(city);
  await expect(page.locator('#city-card figure')).toHaveAttribute('data-photo-city',city);
  await expect(page.locator('#city-card figure')).toHaveAttribute('data-photo-period','night');
  expect(await decodedAcrossFrames(page.locator('#city-photo'))).toBe(true);
 }
});
test('returning to the tab changes back to day while an unmapped night is explicitly an archive',async({page})=>{
 await prepare(page);
 await page.locator('#city-select').selectOption('kamnik');
 await expect(page.locator('#city-card figure')).toHaveAttribute('data-photo-period','night');
 await page.clock.setFixedTime(new Date('2026-11-14T11:00:00Z'));
 await page.evaluate(()=>window.dispatchEvent(new Event('pageshow')));
 await expect(page.locator('#city-card figure')).toHaveAttribute('data-photo-period','day');
 await expect(page.locator('#city-photo')).toHaveAttribute('src',/\/images\/.*kamnik/);
 await page.clock.setFixedTime(new Date(NIGHT));
 await page.locator('#city-select').selectOption('ajdovscina');
 await expect(page.locator('#city-card figure')).toHaveAttribute('data-photo-period','archive');
 await expect(page.locator('#city-photo')).toHaveAttribute('alt',/arhivska fotografija/);
});
test('the previous decoded photo stays visible until the incoming final frame is decoded',async({page})=>{
 await prepare(page);
 await expect(page.locator('#city-card figure')).toHaveAttribute('data-photo-city','ljubljana');
 let requested,release;
 const started=new Promise(resolve=>{requested=resolve}),pending=new Promise(resolve=>{release=resolve});
 await page.route('**/images/city-night/kamnik-*',async route=>{requested();await pending;await route.continue();});
 await page.locator('#city-select').selectOption('kamnik');await started;
 await expect(page.locator('#city-card figure')).toHaveAttribute('data-photo-city','ljubljana');
 expect(await decodedAcrossFrames(page.locator('#city-photo'))).toBe(true);
 release();
 await expect(page.locator('#city-card figure')).toHaveAttribute('data-photo-city','kamnik');
 expect(await decodedAcrossFrames(page.locator('#city-photo'))).toBe(true);
});
