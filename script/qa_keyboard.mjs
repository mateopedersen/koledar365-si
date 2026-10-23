import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium,webkit} from '@playwright/test';
const base=process.env.K365_BASE_URL||'http://127.0.0.1:19783';
const out=process.env.QA_OUT||'evidence/qa/keyboard';fs.mkdirSync(out,{recursive:true});
const engine=process.env.QA_BROWSER||'chromium';
const browser=await ({chromium,webkit}[engine]).launch();
const templates=JSON.parse(fs.readFileSync('data/qa-templates.json'));
const rows=[];
for(const width of [390,1440]){
 const context=await browser.newContext({viewport:{width,height:900},locale:'sl-SI'});
 await context.addInitScript(()=>localStorage.setItem('k365.consent',JSON.stringify({version:2,expiresAt:Date.now()+86400000,preferences:false})));
 const page=await context.newPage();
 for(const [template,route] of templates){
  const row={template,path:route,width,browser:engine,issues:[],tabStops:[]};
  try{
   await page.goto(base+route,{waitUntil:'load'});
   await page.keyboard.press('Tab');
   if(await page.locator('.skip').count()){
    assert(await page.locator('.skip').evaluate(el=>el===document.activeElement),'First Tab must reach skip link');
    await page.keyboard.press('Enter');
    assert(await page.locator('main').evaluate(el=>el===document.activeElement),'Skip link must focus main');
    row.skipNavigation='passed';
   }else{
    // Standalone server-error documents have no repeated header to skip.
    assert(template==='support-error','Shared site pages require a skip link');
    assert.equal(await page.locator('body > header, .topbar, .subnav').count(),0);
    assert(await page.evaluate(()=>document.activeElement.closest('main')!==null),'First Tab must enter the standalone error content');
    const focus=await page.evaluate(()=>{const s=getComputedStyle(document.activeElement);return s.outlineStyle!=='none'&&parseFloat(s.outlineWidth)>0;});
    assert(focus,'Standalone error link must have visible focus');
    row.skipNavigation='not-needed: standalone main without repeated navigation';
   }
   for(let i=0;i<45;i++){
    await page.keyboard.press('Tab');
    const state=await page.evaluate(()=>{
     const el=document.activeElement,r=el.getBoundingClientRect(),style=getComputedStyle(el);
     const x=Math.max(0,Math.min(innerWidth-1,r.left+r.width/2)),y=Math.max(0,Math.min(innerHeight-1,r.top+r.height/2));
     const hit=document.elementFromPoint(x,y);
     return {tag:el.tagName,id:el.id,text:(el.getAttribute('aria-label')||el.textContent).trim().slice(0,100),main:!!el.closest('main'),visible:r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight,covered:!(hit===el||el.contains(hit)||hit?.contains(el)),indicator:style.outlineStyle!=='none'&&parseFloat(style.outlineWidth)>0||style.boxShadow!=='none',type:el.type};
    });
    if(state.tag==='BODY')break;
    row.tabStops.push(state);
    if(!state.visible)row.issues.push('Invisible keyboard target: '+state.id+' '+state.text);
    if(!state.indicator)row.issues.push('No visible focus indicator: '+state.id+' '+state.text);
    // A center-point hit is recorded for review; an inner scroll rail may clip
    // a target partially, so it is not treated as proof of full occlusion.
    if(!state.main&&i>0)break;
   }
   await page.keyboard.press('Shift+Tab');
   assert(await page.evaluate(()=>document.activeElement!==document.body),'Reverse Tab must restore a target');
  }catch(e){row.issues.push(e.message)}
  row.passed=!row.issues.length;rows.push(row);
 }
 await context.close();
}
const page=await browser.newPage({viewport:{width:390,height:900}});
await page.addInitScript(()=>localStorage.setItem('k365.consent',JSON.stringify({version:2,expiresAt:Date.now()+86400000,preferences:false})));
const functional=[];
async function scenario(name,fn){const row={name};try{await fn();row.passed=true}catch(e){row.passed=false;row.error=e.message}functional.push(row)}
await scenario('Menu Enter, Escape and focus return',async()=>{
 await page.goto(base+'/');const trigger=page.locator('[data-navigation-menu]>summary');await trigger.focus();await page.keyboard.press('Enter');assert(await page.locator('[data-navigation-menu]').getAttribute('open')!==null);await page.keyboard.press('Escape');assert(await trigger.evaluate(el=>el===document.activeElement));assert(await page.locator('[data-navigation-menu]').getAttribute('open')===null);
});
await scenario('Lunar arrow keys, Home, End and Space',async()=>{
 await page.goto(base+'/lunin-koledar/2028/februar/');const first=page.locator('#dan-2028-02-01');await first.focus();await page.keyboard.press('ArrowRight');assert(await page.locator('#dan-2028-02-02').evaluate(el=>el===document.activeElement));await page.keyboard.press('End');assert(await page.locator('#dan-2028-02-29').evaluate(el=>el===document.activeElement));await page.keyboard.press('Home');await page.keyboard.press('Space');assert(await first.getAttribute('aria-pressed')==='true');
});
await scenario('Studio arrows, modal Tab containment, Escape and focus return',async()=>{
 await page.goto(base+'/ustvari-koledar/');await page.locator('[data-tab=design]').focus();await page.keyboard.press('ArrowRight');assert(await page.locator('[data-tab=layout]').getAttribute('aria-selected')==='true');
 const trigger=page.locator('#studio-download');await trigger.focus();await page.keyboard.press('Enter');assert(await page.locator('#studio-export').evaluate(el=>el.open));
 for(let i=0;i<20;i++){await page.keyboard.press(i%2?'Tab':'Shift+Tab');assert(await page.evaluate(()=>document.activeElement.closest('#studio-export')!==null));}
 await page.keyboard.press('Escape');assert(!(await page.locator('#studio-export').evaluate(el=>el.open)));assert(await trigger.evaluate(el=>el===document.activeElement));
});
await scenario('Real PDF download with Enter',async()=>{
 await page.goto(base+'/koledar/2028/februar/');const link=page.locator('[data-calendar-download=pdf]').first();await link.focus();const pending=page.waitForEvent('download');await page.keyboard.press('Enter');const download=await pending;assert(await download.failure()===null);assert(download.suggestedFilename().endsWith('.pdf'));
});
await browser.close();
const report={checkedAt:new Date().toISOString(),base,browser:engine,tested:rows.length,failed:rows.filter(r=>!r.passed).length+functional.filter(r=>!r.passed).length,tabStops:rows.reduce((n,r)=>n+r.tabStops.length,0),rows,functional};
fs.writeFileSync(path.join(out,`keyboard-${engine}.json`),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({tested:report.tested,failed:report.failed,tabStops:report.tabStops,functional}));process.exitCode=report.failed?1:0;
