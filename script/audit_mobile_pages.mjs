import fs from 'node:fs';
import path from 'node:path';
import {chromium} from '@playwright/test';

const report=JSON.parse(fs.readFileSync(process.env.AUDIT_INPUT||'evidence/site-content-audit.json','utf8'));
const routes=process.env.AUDIT_PATHS?process.env.AUDIT_PATHS.split(','):report.pages.filter(p=>p.indexable).map(p=>p.path);
const base=process.env.K365_BASE_URL||'http://127.0.0.1:3671';
const width=Number(process.env.AUDIT_WIDTH||390);
const prefix=process.env.AUDIT_PREFIX||'mobile-site-audit';
const browser=await chromium.launch({headless:true});
const rows=[];let cursor=0;
await Promise.all(Array.from({length:4},async()=>{
 const context=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 await context.addInitScript(()=>{localStorage.setItem('k365.consent',JSON.stringify({version:2,expiresAt:Date.now()+86400000,preferences:false}));});
 const page=await context.newPage();
 await page.route('**/vreme/**',route=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"Local audit: weather endpoint unavailable"}'}));
 while(cursor<routes.length){
  const route=routes[cursor++];const errors=[];const listener=e=>errors.push(e.message);page.on('pageerror',listener);
  try{
   const response=await page.goto(base+route,{waitUntil:'domcontentloaded',timeout:30000});
   await page.locator('main h1').waitFor({state:'visible',timeout:10000});
   await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
   const layout=await page.evaluate(()=>{
    const root=document.documentElement;const h1=document.querySelector('main h1');
    const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'};
    const overflowing=[...document.querySelectorAll('main *')].filter(visible).filter(e=>{
     const r=e.getBoundingClientRect();if(r.left>=-1&&r.right<=root.clientWidth+1)return false;
     for(let p=e.parentElement;p&&p!==document.body;p=p.parentElement){const s=getComputedStyle(p);if(/auto|scroll|hidden|clip/.test(s.overflowX))return false;}
     return true;
    }).slice(0,12).map(e=>({tag:e.tagName,class:e.className?.baseVal??e.className,text:e.textContent.trim().slice(0,70),left:Math.round(e.getBoundingClientRect().left),right:Math.round(e.getBoundingClientRect().right)}));
    const images=[...document.querySelectorAll('main img')].filter(e=>visible(e)&&e.loading!=='lazy'&&e.complete&&e.naturalWidth===0).map(e=>e.getAttribute('src'));
    return {viewport:root.clientWidth,scrollWidth:root.scrollWidth,bodyWidth:document.body.scrollWidth,heading:h1?.textContent.trim(),headingSize:parseFloat(getComputedStyle(h1).fontSize),overflowing,brokenImages:images};
   });
   const row={path:route,status:response?.status(),width,...layout,errors};rows.push(row);
   if(row.status!==200||row.scrollWidth>width+1||row.brokenImages.length||errors.length){
    fs.mkdirSync('test-results/site-audit',{recursive:true});
    await page.screenshot({path:`test-results/site-audit/${prefix}-${route.replaceAll('/','_')||'home'}.png`,fullPage:false});
   }
  }catch(e){rows.push({path:route,width,error:e.message});}
  page.off('pageerror',listener);
  if(rows.length%40===0)console.log(JSON.stringify({checked:rows.length,total:routes.length}));
 }
 await context.close();
}));
await browser.close();
const failures=rows.filter(r=>r.error||r.status!==200||r.scrollWidth>width+1||r.brokenImages.length||r.errors.length);
const output={checkedAt:new Date().toISOString(),origin:base,width,tested:rows.length,failed:failures.length,failures,rows:rows.sort((a,b)=>a.path.localeCompare(b.path))};
fs.writeFileSync(`evidence/${prefix}.json`,JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({tested:rows.length,failed:failures.length,report:`evidence/${prefix}.json`}));
process.exitCode=failures.length?1:0;
