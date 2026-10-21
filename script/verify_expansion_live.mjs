// Run after Cloudflare deployment from a checkout of the exact published commit.
// Public read-only requests only. A successful build alone is not a live check.
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const args=process.argv.slice(2),index=args.indexOf('--origin'),origin=(index>=0?args[index+1]:'https://koledar365.si').replace(/\/$/,'');
const base=new URL(origin);if(base.protocol!=='https:'&&!['127.0.0.1','localhost'].includes(base.hostname))throw Error('Use HTTPS for a public deployment.');
const inventory=JSON.parse(fs.readFileSync(path.join(root,'site/release-urls.json')));
const expected=JSON.parse(fs.readFileSync(path.join(root,'site/release-manifest.json')));
const report={checked_at:new Date().toISOString(),origin,expected_source_commit:inventory.source_commit,passed:false,issues:[],results:[]};
const request=async(relative,method='GET')=>fetch(origin+relative,{method,redirect:'follow',signal:AbortSignal.timeout(25000),headers:{'User-Agent':'Koledar365-Release-Verification/1.0'}});
try{
  const releaseResponse=await request('/release-manifest.json');
  if(!releaseResponse.ok)report.issues.push('Live release-manifest.json returned '+releaseResponse.status);
  else{
    const actual=await releaseResponse.json();
    for(const [file,hash] of Object.entries(expected.sources))if(actual.sources?.[file]!==hash)report.issues.push('Live source fingerprint differs: '+file);
  }
}catch(error){report.issues.push('Live publication fingerprint could not be read: '+error.message);}
const expanded=new Set(inventory.expanded_urls),queue=[...inventory.pages];
const decode=value=>String(value).replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
async function worker(){while(queue.length){const row=queue.shift(),result={url:origin+row.path,status:null,checks:[]};try{
    const response=await request(row.path);result.status=response.status;const html=await response.text();
    if(response.status!==200)result.checks.push('HTTP '+response.status);
    const canonical=html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/i)?.[1];
    if(canonical!==row.url)result.checks.push('Canonical differs');
    const title=decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'');
    if(title!==row.title)result.checks.push('Title differs from prepared publication');
    if((html.match(/<h1(?:\s|>)/gi)||[]).length!==1)result.checks.push('Expected exactly one H1');
    if(/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html))result.checks.push('Unexpected noindex');
    if(expanded.has(row.url)){
      const modules=[...html.matchAll(/<script\b[^>]*src=["']([^"']+)/gi)].map(m=>m[1]);
      if(!modules.some(src=>src.startsWith('/free/client-')))result.checks.push('Missing static browser adapter');
      if(!html.includes('application/ld+json'))result.checks.push('Missing structured data');
    }
  }catch(error){result.checks.push(error.message);}
  result.passed=result.status===200&&result.checks.length===0;report.results.push(result);
  if(report.results.length%50===0)console.log(JSON.stringify({checked:report.results.length,total:inventory.count}));
}}
await Promise.all(Array.from({length:4},worker));
for(const relative of ['/imena/','/koledar-z-imenom/']){try{const response=await request(relative,'HEAD');if(![404,410].includes(response.status))report.issues.push('Retired URL must remain absent: '+relative+' ('+response.status+')');}catch(error){report.issues.push(relative+': '+error.message);}}
const sampleAssets=['/garden/setveni-koledar-sadike-1200.webp','/images/payments/pokojnine-2026.webp','/images/astronomy/soncni-mrk-slovenija-1200.webp','/payments/pokojnine-2026.ics','/astronomy/full_moon-2026.ics','/education/data.json','/calendar-tools/xlsx.mjs'];
for(const asset of sampleAssets){try{const response=await request(asset);if(!response.ok)report.issues.push(asset+': HTTP '+response.status);else if(asset.endsWith('.ics')){const body=await response.text();if(!body.includes('BEGIN:VCALENDAR')||!body.includes('BEGIN:VEVENT'))report.issues.push(asset+': invalid calendar payload');}}catch(error){report.issues.push(asset+': '+error.message);}}
report.results.sort((a,b)=>a.url.localeCompare(b.url));report.passed=report.issues.length===0&&report.results.length===inventory.count&&report.results.every(row=>row.passed);
fs.mkdirSync(path.join(root,'evidence'),{recursive:true});
fs.writeFileSync(path.join(root,'evidence/advanced-calendar-live-verification.json'),JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(path.join(root,'evidence/all-live-page-links.txt'),report.results.map(row=>`${row.passed?'OK':'FAIL'} ${row.status??'ERROR'} ${row.url}`).join('\n')+'\n');
console.log(JSON.stringify({passed:report.passed,checked:report.results.length,failed:report.results.filter(row=>!row.passed),issues:report.issues},null,2));
if(!report.passed)process.exitCode=1;
