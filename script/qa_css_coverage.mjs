import fs from 'node:fs';import crypto from 'node:crypto';import zlib from 'node:zlib';import {chromium} from '@playwright/test';
const out=process.env.QA_OUT||'evidence/qa/css-coverage',base=process.env.K365_BASE_URL||'https://koledar365.si';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch();const rows=[];
for(const [template,route] of JSON.parse(fs.readFileSync('data/qa-templates.json'))){
 const context=await browser.newContext({viewport:{width:360,height:800},locale:'sl-SI'});const page=await context.newPage();
 try{
  await page.coverage.startCSSCoverage({resetOnNavigation:false});await page.goto(base+route,{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(250);
  await page.evaluate(()=>document.querySelectorAll('details').forEach(e=>e.open=true));
  const field=page.locator('main input:not([type=hidden]),main select').first();if(await field.count())await field.focus().catch(()=>{});
  const cookie=page.locator('[data-cookie-open]').first();if(await cookie.count())await cookie.click({force:true}).catch(()=>{});
  await page.setViewportSize({width:1440,height:900});await page.waitForTimeout(100);
  await page.emulateMedia({media:'print'});await page.waitForTimeout(100);await page.emulateMedia({media:'screen'});
  const entries=await page.coverage.stopCSSCoverage();const sheets=[];
  for(const e of entries){const hash=crypto.createHash('sha256').update(e.text).digest('hex');fs.writeFileSync(out+'/'+hash+'.css.gz',zlib.gzipSync(e.text));sheets.push({hash,url:e.url,bytes:Buffer.byteLength(e.text),usedCodeUnits:e.ranges.reduce((n,r)=>n+r.end-r.start,0),ranges:e.ranges});}
  rows.push({template,route,sheets,states:['360px','details-open','input-focus','cookie-settings','1440px','print']});
 }catch(e){rows.push({template,route,error:e.message});}finally{await context.close();}
 fs.writeFileSync(out+'/coverage.json',JSON.stringify({base,rows},null,2));console.log(template);
}
await browser.close();
