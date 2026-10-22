import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),site=path.join(root,'site'),manifest=JSON.parse(fs.readFileSync(path.join(site,'release-manifest.json')));
const issues=[];function scan(directory){return fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?scan(path.join(directory,entry.name)):[path.join(directory,entry.name)])}
const files=scan(site);if(files.length>20000)issues.push('Cloudflare Free file limit exceeded');
const webImages=JSON.parse(fs.readFileSync(path.join(root,'data/web_image_variants.json')));
for(const [source,image] of Object.entries(webImages)){
 const original=path.join(site,source);
 if(!fs.existsSync(original)||crypto.createHash('sha256').update(fs.readFileSync(original)).digest('hex')!==image.source_sha256)issues.push(source+': licensed source photo changed');
 for(const variant of image.variants)for(const [key,sizeKey] of [['src','bytes'],['avif','avif_bytes']]){
  if(!variant[key])continue;
  const file=path.join(site,variant[key]);if(!fs.existsSync(file)){issues.push(variant[key]+': responsive photo missing');continue}
  const bytes=fs.readFileSync(file),digest=crypto.createHash('sha256').update(bytes).digest('hex').slice(0,16);
  if(bytes.length!==variant[sizeKey]||!path.basename(file).includes('-'+digest+'.'))issues.push(variant[key]+': responsive photo hash or size mismatch');
  if(key==='avif'){const offset=bytes.indexOf('ispe');if(offset<0||bytes.readUInt32BE(offset+8)!==variant.width||bytes.readUInt32BE(offset+12)!==variant.height)issues.push(variant[key]+': unexpected image dimensions')}
 }
}
for(const file of files){const relative=path.relative(site,file).replaceAll(path.sep,'/'),size=fs.statSync(file).size;if(size>25*1024*1024)issues.push(relative+': file exceeds 25 MiB');if(/(?:private-admin|\.sqlite3|\.env|master\.key|credentials|\.dump)$/.test(relative))issues.push(relative+': private artifact');const expected=manifest.files[relative];if(relative==='release-manifest.json')continue;if(!expected)issues.push(relative+': unlisted output');else if(expected.size!==size||expected.sha256!==crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'))issues.push(relative+': hash mismatch')}
for(const [file,hash] of Object.entries(manifest.sources||{})){const absolute=path.join(root,file);if(!fs.existsSync(absolute)||crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex')!==hash)issues.push(file+': source changed after release build')}
const catalog=JSON.parse(fs.readFileSync(path.join(site,'free/catalog.json')));for(let year=2027;year<=2030;year++){for(let month=1;month<=12;month++){const rows=catalog.filter(row=>row.options.type==='monthly'&&row.options.year===year&&row.options.month===month);if(rows.length!==15)issues.push(`${year}-${month}: expected 15 monthly pairs`)}if(catalog.filter(row=>row.options.type==='annual'&&row.options.year===year).length!==15)issues.push(year+': expected 15 annual pairs')}
if(manifest.pairs!==2820||manifest.verified_pairs!==2820||catalog.length!==2820||new Set(catalog.map(row=>row.fingerprint)).size!==2820)issues.push('Release requires 2820 distinct pairs with both verification gates complete');
const designIds=['min','ele','nat','pla','geo'].flatMap(family=>['01','02','03'].map(number=>family+'-'+number));
function requireDesigns(rows,label){if(rows.length!==15||designIds.some(id=>rows.filter(row=>row.options.design===id).length!==1))issues.push(label+': expected each of the 15 designs exactly once')}
for(let year=2027;year<=2030;year++){
 for(const type of ['weekly','blank','shift','daily','family','school','birthday','holidays'])requireDesigns(catalog.filter(row=>row.options.type===type&&row.options.year===year),type+' '+year);
 requireDesigns(catalog.filter(row=>row.options.type==='lunar'&&row.options.lunar_scope==='year'&&row.options.year===year),'annual Moon '+year);
 requireDesigns(catalog.filter(row=>row.options.type==='workdays'&&row.options.workday_scope==='year'&&row.options.year===year),'annual workdays '+year);
 for(let month=1;month<=12;month++)for(const type of ['monthly','lunar','workdays'])requireDesigns(catalog.filter(row=>row.options.type===type&&row.options.year===year&&row.options.month===month&&(type!=='lunar'||row.options.lunar_scope!=='year')&&(type!=='workdays'||row.options.workday_scope==='month')),`${type} ${year}-${month}`);
}
for(const relative of Object.keys(manifest.files))if(!fs.existsSync(path.join(site,relative)))issues.push(relative+': manifest output missing');
for(const row of catalog)for(const filename of Object.values(row.files)){if(!fs.existsSync(path.join(site,filename)))issues.push(filename+': missing catalog asset')}
for(const relative of ['index.html','404.html','free/client.js','free/ruby-worker.js','free/runtime.json','zasebnost/index.html','upravljanje/index.html','_routes.json'])if(!fs.existsSync(path.join(site,relative)))issues.push(relative+': missing release file');
const notFoundPath=path.join(site,'404.html');
if(fs.existsSync(notFoundPath)){
 const notFound=fs.readFileSync(notFoundPath,'utf8');
 for(const marker of ['data-not-found','not-found-title','not-found-query','lost-art-description','/koledar/2027/','/lunin-koledar/','/prazniki/','/orodja/'])if(!notFound.includes(marker))issues.push('404 page is missing recovery content: '+marker);
 const stylesheet=notFound.match(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/);
 const stylesheetPath=stylesheet&&path.join(site,new URL(stylesheet[1],'https://koledar365.si').pathname.slice(1));
 if(!stylesheetPath||!fs.existsSync(stylesheetPath)||!fs.readFileSync(stylesheetPath,'utf8').includes('.lost-destinations'))issues.push('404 page is missing its responsive recovery-page stylesheet');
}
// A new publication must bypass any previously cached stable browser adapter.
const clientBytes=fs.readFileSync(path.join(root,'cloudflare/free/client.js')),clientName='client-'+crypto.createHash('sha256').update(clientBytes).digest('hex').slice(0,16)+'.js',clientFile=path.join(site,'free',clientName);
if(!fs.existsSync(clientFile)||!fs.readFileSync(clientFile).equals(clientBytes))issues.push('Fingerprint browser adapter is missing or differs from source');
for(const file of files.filter(file=>file.endsWith('.html'))){const html=fs.readFileSync(file,'utf8');if(html.includes('src="/free/client.js"')||[...html.matchAll(/src="\/free\/(client-[a-f0-9]+\.js)"/g)].some(match=>match[1]!==clientName))issues.push(path.relative(site,file)+': stale browser adapter URL')}
if(!fs.readFileSync(path.join(site,'index.html'),'utf8').includes('/free/'+clientName))issues.push('Home page is missing the fingerprint browser adapter');
const retiredNamePath=/^\/(?:koledar-z-imenom|imena)(?:\/|$)/;
const retiredGodoviPath=/^\/godovi(?:\/|$)/;
for(const relative of Object.keys(manifest.files))if(/^(?:koledar-z-imenom|imena|free\/names|godovi)(?:\/|$)|^sitemap-names\.xml$/.test(relative))issues.push(relative+': retired name output is still published');
for(const relative of ['sitemap.xml','sitemap-pages.xml']){
 const xml=fs.readFileSync(path.join(site,relative),'utf8');
 if(xml.includes('sitemap-names.xml')||/\/(?:koledar-z-imenom|imena|godovi)(?:\/|<)/.test(xml))issues.push(relative+': retired names are still in a sitemap');
}
const searchIndex=JSON.parse(fs.readFileSync(path.join(site,'free/search.json'),'utf8'));
if(searchIndex.some(row=>retiredNamePath.test(row.path||'')||retiredGodoviPath.test(row.path||'')))issues.push('Search still publishes retired name records');
for(const file of files.filter(file=>file.endsWith('.html'))){if(/href=["']\/(?:koledar-z-imenom|imena|godovi)(?:\/|["'])/.test(fs.readFileSync(file,'utf8')))issues.push(path.relative(site,file)+': link to a retired name page')}
if(files.some(file=>/\/free\/client-[a-f0-9]+\.js$/.test(file)&&path.basename(file)!==clientName))issues.push('Obsolete browser adapters are still published');
const invocationRoutes=JSON.parse(fs.readFileSync(path.join(site,'_routes.json'),'utf8')).include;
for(const route of ['/koledar-z-imenom','/koledar-z-imenom/*','/imena','/imena/*','/godovi','/godovi/*','/free/names','/free/names/*','/free/search.json','/sitemap-names.xml','/sitemap.xml','/sitemap-pages.xml','/robots.txt'])if(!invocationRoutes.includes(route))issues.push(route+': missing edge retirement or sitemap route');
const countdownPagePath=path.join(site,'odstevanje/index.html');
if(!fs.existsSync(countdownPagePath))issues.push('Countdown page is missing');
else{
 const html=fs.readFileSync(countdownPagePath,'utf8'),configMatch=html.match(/<script type="application\/json" id="k365-static-config">([\s\S]*?)<\/script>/);
 if(!html.includes('data-countdown-root'))issues.push('Countdown page is missing its interactive root');
 if(!configMatch)issues.push('Countdown page is missing its static asset config');
 else{
  const config=JSON.parse(configMatch[1]),countdownFile=config.countdown&&path.join(site,new URL(config.countdown,'https://koledar365.si').pathname.slice(1));
  if(!countdownFile||!fs.existsSync(countdownFile))issues.push('Countdown page asset is missing from the static publication');
  else if(!fs.readFileSync(countdownFile,'utf8').includes('[data-countdown-root]'))issues.push('Countdown asset does not initialize the countdown page');
 }
 const cssHref=html.match(/<link rel="stylesheet" href="([^"]+)"/),cssFile=cssHref&&path.join(site,new URL(cssHref[1],'https://koledar365.si').pathname.slice(1));
 if(!cssFile||!fs.existsSync(cssFile)||!fs.readFileSync(cssFile,'utf8').includes('.countdown-hero'))issues.push('Countdown styles are missing from the static publication');
}
console.log(JSON.stringify({passed:!issues.length,files:files.length,pairs:catalog.length,issues},null,2));if(issues.length)process.exit(1);
await import('./lunar/verify_static.mjs');
await import('./verify_calendar_collection_static.mjs');
