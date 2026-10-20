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
// A new publication must bypass any previously cached stable browser adapter.
const clientBytes=fs.readFileSync(path.join(root,'cloudflare/free/client.js')),clientName='client-'+crypto.createHash('sha256').update(clientBytes).digest('hex').slice(0,16)+'.js',clientFile=path.join(site,'free',clientName);
if(!fs.existsSync(clientFile)||!fs.readFileSync(clientFile).equals(clientBytes))issues.push('Fingerprint browser adapter is missing or differs from source');
for(const file of files.filter(file=>file.endsWith('.html'))){const html=fs.readFileSync(file,'utf8');if(html.includes('src="/free/client.js"')||[...html.matchAll(/src="\/free\/(client-[a-f0-9]+\.js)"/g)].some(match=>match[1]!==clientName))issues.push(path.relative(site,file)+': stale browser adapter URL')}
if(!fs.readFileSync(path.join(site,'index.html'),'utf8').includes('/free/'+clientName))issues.push('Home page is missing the fingerprint browser adapter');
console.log(JSON.stringify({passed:!issues.length,files:files.length,pairs:catalog.length,issues},null,2));if(issues.length)process.exit(1);
await import('./lunar/verify_static.mjs');
