// Real-browser release matrix. Nothing is marked passed before it runs.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {chromium, webkit, firefox} from '@playwright/test';
const require=createRequire(import.meta.url);
const root=path.resolve(import.meta.dirname,'..');
const base=process.env.K365_BASE_URL||'http://127.0.0.1:19783';
const output=path.resolve(process.env.QA_OUT||'evidence/qa/browser');
const mode=process.env.QA_MODE||'layout';
const engine=process.env.QA_BROWSER||'chromium';
const widths=[320,360,390,430,768,1024,1280,1440];
const templates=JSON.parse(fs.readFileSync(path.join(root,'data/qa-templates.json')));
const filter=process.env.QA_PATHS?.split(',');
const samples=templates.filter(([,p])=>!filter||filter.includes(p));
const templateFor=p=>templates.find(([,route])=>route===p)?.[0]||p.split('/')[1]||'home';
const inventory=JSON.parse(fs.readFileSync(path.join(root,'site/release-urls.json'))).pages;
const cases=new Map();
const add=(p,w,snapshot=false)=>cases.set(`${p}:${w}`,{path:p,width:w,template:templateFor(p),snapshot});
if(mode==='layout'&&!filter&&process.env.QA_SAMPLE_ONLY!=='1'&&engine==='chromium') for(const row of inventory)for(const w of [390,1440])add(row.path,w);
for(const [,p] of samples)for(const w of mode==='a11y'||engine!=='chromium'?[390,1440]:widths)add(p,w,[390,1440].includes(w));
fs.mkdirSync(path.join(output,'screenshots'),{recursive:true});
const browser=await ({chromium,webkit,firefox}[engine]).launch({headless:true});
const rows=[];let cursor=0;const tasks=[...cases.values()];
const commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
await Promise.all(Array.from({length:Number(process.env.QA_WORKERS||3)},async()=>{
 const context=await browser.newContext({viewport:{width:390,height:900},deviceScaleFactor:1,locale:'sl-SI',timezoneId:'Europe/Ljubljana'});
 await context.addInitScript(()=>localStorage.setItem('k365.consent',JSON.stringify({version:2,expiresAt:Date.now()+86400000,preferences:false})));
 const page=await context.newPage();
 if(mode==='a11y')await page.route('**/__qa/axe.js',r=>r.fulfill({status:200,contentType:'application/javascript',body:fs.readFileSync(require.resolve('axe-core/axe.min.js'),'utf8')}));
 // A local static server has no weather Function. No UI or calendar data is mocked.
 if(base.startsWith('http://127.0.0.1'))await page.route('**/vreme/**',r=>r.fulfill({status:503,contentType:'application/json',body:'{"error":"Local weather service unavailable"}'}));
 while(cursor<tasks.length){
  const item=tasks[cursor++];const errors=[];const listener=e=>errors.push(e.message);page.on('pageerror',listener);
  const row={...item,browser:engine,issues:[],pageErrors:errors};
  try{
   await page.setViewportSize({width:item.width,height:900});
   const response=await page.goto(base+item.path,{waitUntil:'load',timeout:45000});
   row.status=response?.status();
   if(row.status!==(item.path==='/404.html'&&!base.includes('127.0.0.1')?404:200))row.issues.push('Unexpected HTTP status');
   await page.locator('main h1').first().waitFor({state:'visible',timeout:15000});
   await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
   if(item.snapshot&&mode==='layout'){
    // Exercise native lazy loading by scrolling; a full-page screenshot alone
    // does not request images below the viewport.
    await page.evaluate(async()=>{
     for(let y=0;y<document.documentElement.scrollHeight;y+=innerHeight*.8){
      scrollTo(0,y);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
     }
     await Promise.all([...document.images].map(im=>im.decode().catch(()=>{})));
     scrollTo(0,0);await new Promise(r=>requestAnimationFrame(r));
    });
   }
   row.layout=await page.evaluate(()=>{
    const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'};
    const h=document.querySelector('main h1'),r=h.getBoundingClientRect();
    const overflow=[...document.querySelectorAll('main *')].filter(visible).filter(e=>{
     const r=e.getBoundingClientRect();if(r.left>=-1&&r.right<=innerWidth+1)return false;
     for(let p=e.parentElement;p&&p!==document.body;p=p.parentElement)if(/auto|scroll|hidden|clip/.test(getComputedStyle(p).overflowX))return false;
     return true;
    }).slice(0,12).map(e=>({tag:e.tagName,id:e.id,class:String(e.className),text:e.textContent.trim().slice(0,70)}));
    const loadedImages=[...document.querySelectorAll('main img')].filter(e=>visible(e)&&e.complete);
    return {scrollWidth:document.documentElement.scrollWidth,width:innerWidth,h1:h.textContent.trim(),h1Bounds:{left:r.left,right:r.right},h1Clipped:h.scrollWidth>h.clientWidth+2,font:getComputedStyle(document.body).fontFamily,avenirAvailable:document.fonts.check('16px "Avenir Local"'),overflow,brokenImages:loadedImages.filter(e=>!e.naturalWidth).map(e=>e.src),canonical:[...document.querySelectorAll('link[rel=canonical]')].map(e=>e.href),links:[...new Set([...document.querySelectorAll('a[href]')].map(e=>e.getAttribute('href')))]};
   });
   if(row.layout.scrollWidth>item.width+1)row.issues.push('Horizontal page overflow');
   if(row.layout.h1Clipped||row.layout.h1Bounds.left<0||row.layout.h1Bounds.right>item.width+1)row.issues.push('Heading clipped');
   if(row.layout.brokenImages.length)row.issues.push('Broken visible images');
   if(mode==='a11y'){
    // Serve the testing library through a request interception at the same
    // origin. The site's actual CSP remains enforced and unchanged.
    await page.addScriptTag({url:base+'/__qa/axe.js'});
    const result=await page.evaluate(async()=>await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}}));
    row.violations=result.violations.map(v=>({id:v.id,impact:v.impact,help:v.help,helpUrl:v.helpUrl,nodes:v.nodes.map(n=>({target:n.target,html:n.html,summary:n.failureSummary}))}));
    row.incomplete=result.incomplete.map(v=>({id:v.id,nodes:v.nodes.length}));
    if(row.violations.length)row.issues.push('WCAG automatic violations');
   }
   if(errors.length)row.issues.push('Uncaught JavaScript error');
   if((item.snapshot||row.issues.length)&&mode==='layout'){
    const filename=`${item.template}-${engine}-${item.width}.png`;
    // Full-page snapshots are retained for human review, plus the initial screen.
    await page.screenshot({path:path.join(output,'screenshots',filename),fullPage:true,animations:'disabled'});
    row.screenshot='screenshots/'+filename;
   }
  }catch(error){row.issues.push(error.message);}
  row.passed=!row.issues.length;rows.push(row);page.off('pageerror',listener);
  if(rows.length%40===0){fs.writeFileSync(path.join(output,`progress-${mode}-${engine}.json`),JSON.stringify({completed:rows.length,total:tasks.length,failed:rows.filter(r=>!r.passed).length}));console.log(`${mode}/${engine}: ${rows.length}/${tasks.length}`);}
 }
 await context.close();
}));
await browser.close();
rows.sort((a,b)=>a.path.localeCompare(b.path)||a.width-b.width);
const report={checkedAt:new Date().toISOString(),sourceCommit:commit,base,browser:engine,mode,tested:rows.length,templateSamples:samples.length,widths:[...new Set(rows.map(r=>r.width))],failed:rows.filter(r=>!r.passed).length,rows};
fs.writeFileSync(path.join(output,`${mode}-${engine}.json`),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({tested:report.tested,failed:report.failed,output}));
process.exitCode=report.failed?1:0;
