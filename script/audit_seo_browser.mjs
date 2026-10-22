import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
const directory=process.env.SEO_REPORT_DIR||'reports/seo-2026-10-22/current';
const origin=process.env.K365_BASE_URL||'http://127.0.0.1:3661';
const inventory=JSON.parse(await fs.readFile(`${directory}/full-audit.json`,'utf8'));
const paths=inventory.pages.filter(r=>r.indexable).map(r=>r.path);
const browser=await chromium.launch();const results=[];
try {for(const [mode,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
 const jobs=[...paths];
 await Promise.all(Array.from({length:3},async()=>{
  const context=await browser.newContext({viewport,locale:'sl-SI',timezoneId:'Europe/Ljubljana'});
  const page=await context.newPage();let errors=[];page.on('pageerror',e=>errors.push(e.message));
  while(jobs.length){const path=jobs.shift();errors=[];let row;
   try {const response=await page.goto(origin+path,{waitUntil:'domcontentloaded',timeout:25000});
    await page.waitForTimeout(1000);
    row=await page.evaluate(()=>({title:document.title,canonical:document.querySelector('link[rel=canonical]')?.href,language:document.documentElement.lang,h1:[...document.querySelectorAll('main h1')].map(n=>n.textContent.trim()),overflow:document.documentElement.scrollWidth>innerWidth+2,
      mainCharacters:document.querySelector('main')?.innerText.length,links:[...document.querySelectorAll('main a[href]')].map(n=>n.getAttribute('href')),brokenImages:[...document.querySelectorAll('main img[src]')].filter(n=>n.getBoundingClientRect().width>0&&n.loading!=='lazy'&&n.complete&&n.naturalWidth===0).map(n=>n.getAttribute('src')),unnamedControls:[...document.querySelectorAll('main input:not([type=hidden]),main select,main textarea,main button')].filter(n=>n.checkVisibility()&&!n.textContent.trim()&&!n.getAttribute('aria-label')&&!n.getAttribute('aria-labelledby')&&!n.getAttribute('title')&&!n.labels?.length&&n.type!=='submit').map(n=>n.id||n.outerHTML.slice(0,180))}));row.status=response.status();
   }catch(e){row={error:e.message};}
   results.push({path,mode,...row,pageErrors:[...errors]});
   if(results.length%50===0)console.log(`Rendered ${results.length}/${paths.length*2}`);
  }await context.close();
 }));
 await fs.writeFile(`${directory}/rendered-dom.json`,JSON.stringify({checked_at:new Date().toISOString(),origin,results},null,2));
}}finally{await browser.close();}
console.log(JSON.stringify({checked:results.length,failures:results.filter(r=>r.error||r.overflow||r.pageErrors.length||r.brokenImages?.length||r.unnamedControls?.length).map(({links,...r})=>r)},null,2));
