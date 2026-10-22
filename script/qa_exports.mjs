// Real controls/downloads; Chromium's PDF engine captures print media after
// the actual button handler. No operating-system printer is driven in CI.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
const base=process.env.K365_BASE_URL||'http://127.0.0.1:19783',out=process.env.QA_OUT||'evidence/qa/exports';
fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch();const rows=[];
const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'sl-SI',acceptDownloads:true});
await context.addInitScript(()=>{localStorage.setItem('k365.consent',JSON.stringify({version:2,expiresAt:Date.now()+86400000,preferences:false}));window.__printCalls=0;window.print=()=>{window.__printCalls++;window.dispatchEvent(new Event('beforeprint'))}});
let page=await context.newPage();page.setDefaultTimeout(60000);
const months=['januar','februar','marec','april','maj','junij','julij','avgust','september','oktober','november','december'];
async function run(row,fn){try{await page.close();page=await context.newPage();page.setDefaultTimeout(60000);await fn(row);row.passed=true}catch(e){row.passed=false;row.error=e.message;row.status=await page.locator('[data-calendar-status]').allTextContents();await page.screenshot({path:path.join(out,`failure-${rows.length}.png`),fullPage:true}).catch(()=>{})}rows.push(row);fs.writeFileSync(path.join(out,'exports.json'),JSON.stringify({base,checkedAt:new Date().toISOString(),tested:rows.length,failed:rows.filter(r=>!r.passed).length,rows},null,2));console.log(row.kind,row.path,row.paper||'',row.orientation||'',row.passed,row.error||'')}
async function download(button,row,extension){
 let trigger=button;
 // Personal exports deliberately expose a second, explicit download link.
 if(row.kind==='personal-pdf'){
  await button.click();trigger=button.locator('xpath=ancestor::article').locator('.export-status a[download]');await trigger.waitFor({state:'visible',timeout:120000});
 }
 const pending=page.waitForEvent('download',{timeout:120000});await trigger.click();const d=await pending;assert(await d.failure()===null);assert(d.suggestedFilename().endsWith('.'+extension));row.file=d.suggestedFilename();const dest=path.join(out,row.prefix?row.prefix+'-'+row.file:row.file);await d.saveAs(dest);row.file=path.basename(dest);assert(fs.statSync(dest).size>100);row.bytes=fs.statSync(dest).size;
}
if(process.env.QA_EXPORT_MODE!=='print'){
 for(let year=2027;year<=2030;year++)for(let month=0;month<=12;month++){
  const route=`/koledar/${year}/${month?months[month-1]+'/':''}`;
  if(process.env.QA_EXPORT_PATHS&&!process.env.QA_EXPORT_PATHS.split(',').includes(route))continue;
  await run({kind:'xlsx',path:route,year,month},async row=>{await page.goto(base+route,{waitUntil:'load'});await page.locator('[data-calendar-spreadsheet][data-calendar-ready=true]').waitFor();await download(page.locator('[data-calendar-xlsx]'),row,'xlsx')});
 }
 const planners=['prazen-koledar','dnevni-planer','rojstnodnevni-koledar','druzinski-planer','razpored-izmen','solski-urnik','tedenski-koledar/2028'];
 for(const route of planners)for(const [paper,orientation] of [['A4','portrait'],['A4','landscape'],['A3','portrait']]){
  await run({kind:'personal-pdf',path:'/'+route+'/',paper,orientation,prefix:route.replaceAll('/','-')+'-'+paper+'-'+orientation},async row=>{
   await page.goto(base+row.path,{waitUntil:'load'});await page.locator('.export-paper').selectOption(paper);await page.locator('.export-orientation').selectOption(orientation);await download(page.locator('[data-format=pdf]').first(),row,'pdf');
  });
 }
}
if(process.env.QA_EXPORT_MODE!=='downloads'){
 const routes=[['annual','/koledar/2028/','[data-print]'],['monthly','/koledar/2028/februar/','[data-print]'],['lunar-year','/lunin-koledar/2028/','.lunar-print'],['lunar-month','/lunin-koledar/2028/februar/','.lunar-print'],['family','/druzinski-planer/','[data-family-print]'],['school','/solske-pocitnice/','[data-school-calendar-print]'],['student','/solski-urnik/','[data-print-schedule]'],['payments','/izplacila-pokojnin/','[data-payment-print]']];
 for(const [name,route,selector] of routes)for(const [paper,orientation,width] of [['A4','portrait',1440],['A4','landscape',1440],['A3','portrait',1440],['A4','portrait',390]]){
  await run({kind:'print',name,path:route,paper,orientation,width},async row=>{
   await page.emulateMedia({media:'screen'});await page.setViewportSize({width,height:1000});await page.goto(base+route,{waitUntil:'load'});
   if(name==='student'){
    await page.locator('[data-student-timetable][data-hydrated=true]').waitFor();
    if(await page.locator('[data-load-sample]').isVisible())await page.locator('[data-load-sample]').click();
    await page.locator('[data-print-week]').fill('2028-02-09');
   }
   if(!await page.locator(selector).first().isVisible()&&await page.locator('[data-context-expand]').count())await page.locator('[data-context-expand]').first().click();
   await page.locator(selector).first().click();assert(await page.evaluate(()=>window.__printCalls>0),'Button did not invoke print');await page.emulateMedia({media:'print'});
   row.file=`print-${name}-${paper}-${orientation}-${width}.pdf`;await page.pdf({path:path.join(out,row.file),format:paper,landscape:orientation==='landscape',printBackground:true,preferCSSPageSize:false});
   row.chrome=await page.locator('.topbar,.subnav,footer').evaluateAll(els=>els.filter(el=>getComputedStyle(el).display!=='none').map(el=>el.className||el.tagName));assert(!row.chrome.length,'Navigation/footer remain in print');
  });
 }
 for(const [paper,orientation] of [['a4','portrait'],['a4','landscape'],['a3','portrait']]){
  await run({kind:'studio-print',path:'/ustvari-koledar/',paper:paper.toUpperCase(),orientation,width:390},async row=>{
   await page.emulateMedia({media:'screen'});await page.setViewportSize({width:390,height:900});await page.goto(base+row.path,{waitUntil:'load'});await page.locator('[data-tab=layout]').click();await page.locator('[data-setting=paper]').selectOption(paper);await page.locator('[data-setting=orientation]').selectOption(orientation);await page.locator('#studio-download').click();const pending=page.waitForEvent('popup');await page.locator('[data-export=print]').click();const popup=await pending;await popup.waitForFunction(()=>window.__printCalls>0,{timeout:120000});row.file=`print-studio-${paper}-${orientation}.pdf`;await popup.pdf({path:path.join(out,row.file),printBackground:true,preferCSSPageSize:true});await popup.close();
  });
 }
}
await browser.close();const failed=rows.filter(r=>!r.passed).length;console.log(JSON.stringify({tested:rows.length,failed}));process.exitCode=failed?1:0;
