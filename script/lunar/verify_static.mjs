import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../..'),site=path.join(root,'site');
const data=JSON.parse(fs.readFileSync(path.join(root,'data/lunar/assets.json'))),issues=[];
if(data.assets.length!==208||new Set(data.assets.map(a=>a.assetId)).size!==208)issues.push('Expected 208 lunar pairs');
for(const a of data.assets){
 for(const type of ['pdf','webp','preview']){const p=path.join(site,a[type].path);if(!fs.existsSync(p)){issues.push('Missing '+p);continue}const b=fs.readFileSync(p);if(b.length!==a[type].bytes||crypto.createHash('sha256').update(b).digest('hex')!==a[type].sha256)issues.push('Invalid '+p)}
 const html=fs.readFileSync(path.join(site,a.canonicalPageProposed,'index.html'),'utf8');
 if(!html.includes('/'+a.pdf.path)||!html.includes('/'+a.webp.path))issues.push('Download link missing '+a.assetId);
}
const checkedStyles=new Set();
for(const p of JSON.parse(fs.readFileSync(path.join(root,'data/lunar/sayfa-plani.json'))).pages){
 const html=fs.readFileSync(path.join(site,p.proposedPath,'index.html'),'utf8');if(!html.includes('/lunar/calendar.mjs')||!html.includes('data-lunar'))issues.push('Lunar behavior missing '+p.proposedPath)
 const stylesheet=html.match(/<link rel="stylesheet" href="([^"]+\.css)">/);
 if(!stylesheet)issues.push('Lunar page stylesheet missing '+p.proposedPath);
 else if(!checkedStyles.has(stylesheet[1])){
  checkedStyles.add(stylesheet[1]);const cssPath=path.join(site,stylesheet[1].replace(/^\//,''));
  if(!fs.existsSync(cssPath))issues.push('Lunar stylesheet asset missing '+stylesheet[1]);
  else {const css=fs.readFileSync(cssPath,'utf8');if(!css.includes('.lunar-years a[aria-current=page]')||!css.includes('.lunar-day[aria-pressed=true]')||!css.includes('#075c9e')||!css.includes('#d82035'))issues.push('Lunar tricolour styles missing '+stylesheet[1])}
 }
 if(p.proposedPath!=='/lunin-koledar/'&&(!html.includes('lunar-download-hint')||!html.includes('href="#prenosi"')))issues.push('PDF/WebP download guidance missing '+p.proposedPath)
}
const result={passed:issues.length===0,lunarPairs:data.assets.length,corePages:53,issues};console.log(JSON.stringify(result));if(issues.length)throw Error('Lunar publication verification failed');
