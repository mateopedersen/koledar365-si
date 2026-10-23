// Full-route geometry census. A fresh context prevents state leaking between URLs.
import fs from 'node:fs';
import path from 'node:path';
import {chromium,webkit,firefox} from '@playwright/test';
const base=process.env.K365_BASE_URL||'https://koledar365.si';
const out=process.env.QA_OUT||'evidence/qa/css';
const engine=process.env.QA_BROWSER||'chromium';
const samples=JSON.parse(fs.readFileSync('data/qa-templates.json'));
const widths=(process.env.QA_WIDTHS||'360,1440').split(',').map(Number);
let routes=JSON.parse(fs.readFileSync('site/release-urls.json')).pages.map(x=>x.path);
if(process.env.QA_SAMPLE_ONLY==='1')routes=samples.map(x=>x[1]);
if(process.env.QA_INTERNAL==='1')routes=JSON.parse(fs.readFileSync('evidence/indexability-audit.json')).pages.filter(x=>!x.indexable).map(x=>x.path);
if(process.env.QA_EXPANDED==='1')routes=JSON.parse(fs.readFileSync('site/release-urls.json')).expanded_urls.map(x=>typeof x==='string'?new URL(x,base).pathname+new URL(x,base).search:x.path);
if(process.env.QA_PATHS)routes=process.env.QA_PATHS.split(',');
fs.mkdirSync(out+'/screenshots',{recursive:true});
const browser=await({chromium,webkit,firefox}[engine]).launch({headless:true});
const results=[];let cursor=0;
const heights={320:568,360:800,375:812,390:844,414:896,430:932,768:1024,820:1180,1024:768,1280:800,1366:768,1440:900,1920:1080,2560:1440};
const jobs=routes.flatMap(route=>widths.map(width=>({route,width,height:heights[width]||900}))); 
await Promise.all(Array.from({length:Number(process.env.QA_WORKERS||2)},async()=>{
 while(cursor<jobs.length){
  const job=jobs[cursor++],row={...job,browser:engine,errors:[],consoleErrors:[],failedRequests:[],assets:[],issues:[]};
  const ctx=await browser.newContext({viewport:{width:job.width,height:job.height},locale:'sl-SI',timezoneId:'Europe/Ljubljana',deviceScaleFactor:Number(process.env.QA_DPR||1)});
  await ctx.addInitScript(()=>localStorage.setItem('k365.consent',JSON.stringify({version:2,expiresAt:Date.now()+86400000,preferences:false})));
  await ctx.addInitScript(()=>{
   window.__cssVitals={cls:0,lcp:0,longTasks:[]};
   for(const type of ['layout-shift','largest-contentful-paint','longtask'])try{new PerformanceObserver(list=>{for(const e of list.getEntries()){if(type==='layout-shift'&&!e.hadRecentInput)window.__cssVitals.cls+=e.value;if(type==='largest-contentful-paint')window.__cssVitals.lcp=e.startTime;if(type==='longtask')window.__cssVitals.longTasks.push(e.duration);}}).observe({type,buffered:true});}catch{}
  });
  const page=await ctx.newPage();
  page.on('pageerror',e=>row.errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')row.consoleErrors.push(m.text());});
  page.on('requestfailed',r=>row.failedRequests.push({url:r.url(),type:r.resourceType(),error:r.failure()?.errorText}));
  page.on('response',r=>{if(['stylesheet','script','font','image'].includes(r.request().resourceType()))row.assets.push({url:r.url(),status:r.status(),type:r.request().resourceType()});});
  try{
   const start=Date.now();const response=await page.goto(base+job.route,{waitUntil:'load',timeout:45000});row.status=response.status();if(row.status!==200&&!(job.route==='/404.html'&&row.status===404))row.issues.push('page-http-error');
   await page.locator('main h1').first().waitFor({timeout:15000});
   await page.evaluate(()=>document.fonts.ready);
   if(await page.locator('script[src*="/free/client-"]').count())await page.waitForFunction(()=>document.documentElement.dataset.freeReady==='true',null,{timeout:15000});
   await page.waitForTimeout(250);
   row.loadMs=Date.now()-start;
   row.geometry=await page.evaluate(()=>{
    const selector=e=>e.id?'#'+e.id:e.tagName.toLowerCase()+([...e.classList].length?'.'+[...e.classList].join('.'):''),box=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width,top:r.top,height:r.height};};
    const visible=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden'&&(!e.checkVisibility||e.checkVisibility({visibilityProperty:true}));};
    const controls=[...document.querySelectorAll('main input:not([type=hidden]),main select,main button,main .button')].filter(visible).map(e=>{
     const r=box(e),clips=[];let scrollRegion=null;for(let p=e.parentElement;p&&p!==document.body;p=p.parentElement){const s=getComputedStyle(p),b=box(p);if(/auto|scroll/.test(s.overflowX)&&p.scrollWidth>p.clientWidth+2)scrollRegion=selector(p);if(!scrollRegion&&/hidden|clip/.test(s.overflowX)&&(r.left<b.left-2||r.right>b.right+2))clips.push(selector(p));}
     return {selector:selector(e),text:(e.getAttribute('aria-label')||e.textContent||e.value||'').trim().slice(0,60),...r,clips,scrollRegion,fontSize:getComputedStyle(e).fontSize};
    });
    const anchors=['.topbar','.topbar>.brand','.subnav-track','main','.intro','.workspace','.calendar-panel','.site-footer__inner'].flatMap(s=>[...document.querySelectorAll(s)].map(e=>({selector:s,...box(e),paddingLeft:getComputedStyle(e).paddingLeft,paddingRight:getComputedStyle(e).paddingRight})));
    const outside=[...document.querySelectorAll('body *')].filter(visible).filter(e=>{const r=box(e);if(r.left>=-2&&r.right<=innerWidth+2)return false;if(e.closest('svg,.skip,.sr-only,.visually-hidden,[role=tooltip]'))return false;for(let p=e.parentElement;p;p=p.parentElement)if(/auto|scroll/.test(getComputedStyle(p).overflowX))return false;return true;}).slice(0,40).map(e=>({selector:selector(e),...box(e),overflow:getComputedStyle(e).overflowX}));
    return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,htmlOverflow:getComputedStyle(document.documentElement).overflowX,anchors,controls,outside,canonical:document.querySelector('[rel=canonical]')?.href,robots:document.querySelector('meta[name=robots]')?.content,h1:document.querySelector('main h1')?.textContent,labVitals:window.__cssVitals,navigation:performance.getEntriesByType('navigation').map(e=>({ttfb:e.responseStart,domContentLoaded:e.domContentLoadedEventEnd,load:e.loadEventEnd,transferSize:e.transferSize})),resourceBytes:[...performance.getEntriesByType('resource'),...performance.getEntriesByType('navigation')].reduce((s,r)=>s+r.transferSize,0),resources:performance.getEntriesByType('resource').length};
   });
   if(row.geometry.scrollWidth>job.width+2)row.issues.push('page-overflow');
   const clipped=row.geometry.controls.filter(x=>x.clips.length||(!x.scrollRegion&&(x.left< -2||x.right>job.width+2)));if(clipped.length)row.issues.push('control-clipping');
   if(row.errors.length)row.issues.push('runtime-error');
   if(row.assets.some(x=>x.status>=400))row.issues.push('asset-http-error');
   row.screenshot='screenshots/'+job.route.replace(/[^a-z0-9]+/gi,'_')+'-'+job.width+'-'+engine+'.png';
   await page.screenshot({path:path.join(out,row.screenshot),fullPage:true,animations:'disabled',timeout:30000});
  }catch(e){row.issues.push(e.message);}
  results.push(row);fs.appendFileSync(out+'/rows.ndjson',JSON.stringify(row)+'\n');await ctx.close();
  fs.writeFileSync(out+'/progress.json',JSON.stringify({completed:results.length,total:jobs.length,flagged:results.filter(r=>r.issues.length).length}));
  if(results.length%20===0)console.log(JSON.stringify({completed:results.length,total:jobs.length,flagged:results.filter(r=>r.issues.length).length}));
 }
}));
await browser.close();
fs.writeFileSync(out+'/results.json',JSON.stringify({base,engine,widths,checkedAt:new Date().toISOString(),routes:routes.length,results},null,2));
console.log(JSON.stringify({completed:results.length,flagged:results.filter(r=>r.issues.length).length}));
process.exitCode=results.some(r=>r.issues.length)?1:0;
