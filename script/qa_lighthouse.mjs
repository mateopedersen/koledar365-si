import fs from 'node:fs';import zlib from 'node:zlib';
import lighthouse from 'lighthouse';
import desktop from 'lighthouse/core/config/desktop-config.js';
import {launch} from 'chrome-launcher';
import {chromium} from '@playwright/test';
const out=process.env.LH_OUT||'evidence/qa/lighthouse';fs.mkdirSync(out,{recursive:true});
const base=process.env.K365_BASE_URL||'https://koledar365.si';
const samples=JSON.parse(fs.readFileSync('data/qa-templates.json')).filter(([id])=>id!=='404'&&(!process.env.QA_TEMPLATES||process.env.QA_TEMPLATES.split(',').includes(id)));
const rows=fs.existsSync(out+'/results.json')?JSON.parse(fs.readFileSync(out+'/results.json')):[];
for(const [template,path] of samples)for(const device of ['mobile','desktop'])for(let run=1;run<=Number(process.env.LH_RUNS||3);run++){
 const id=`${template}-${device}-${run}`;if(rows.some(r=>r.id===id&&!r.error))continue;
 const chrome=await launch({chromePath:chromium.executablePath(),chromeFlags:['--headless','--no-sandbox']});
 try{
 const {lhr}=await lighthouse(base+path,{port:chrome.port,output:'json',logLevel:'error',onlyCategories:['performance','accessibility','best-practices','seo']},device==='desktop'?desktop:undefined);
 fs.writeFileSync(out+'/'+id+'.json.gz',zlib.gzipSync(JSON.stringify(lhr)));
 const metrics=Object.fromEntries(['largest-contentful-paint','cumulative-layout-shift','total-blocking-time','first-contentful-paint','speed-index'].map(k=>[k,lhr.audits[k]?.numericValue]));
 const row={id,path,template,device,run,fetchTime:lhr.fetchTime,origin:base,lighthouseVersion:lhr.lighthouseVersion,scores:Object.fromEntries(Object.entries(lhr.categories).map(([k,v])=>[k,v.score])),metrics,error:lhr.runtimeError||null};rows.push(row);console.log(JSON.stringify(row));
 }catch(e){rows.push({id,path,template,device,run,error:e.message});console.log(id,e.message);}finally{await chrome.kill();}
 fs.writeFileSync(out+'/results.json',JSON.stringify(rows,null,2));
}
