import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {makeEdition,validateEdition} from '../lib/horoscope/edition.mjs';
import {localDate} from '../public/horoscope/math-v1.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),day=localDate();
let edition=validateEdition(makeEdition(day),day);
const dailyFile=path.join(root,'public/horoscope/daily.json');
if(fs.existsSync(dailyFile)){
  const previous=JSON.parse(fs.readFileSync(dailyFile,'utf8'));
  if(JSON.stringify({...previous,generated_at:null})===JSON.stringify({...edition,generated_at:null}))edition=previous;
}
const atomic=(file,data)=>{const text=JSON.stringify(data,null,2)+'\n';if(fs.existsSync(file)&&fs.readFileSync(file,'utf8')===text)return;fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',text);fs.renameSync(file+'.tmp',file);};
atomic(path.join(root,'public/horoscope/daily.json'),edition);
const editorial=path.join(root,'data/editorial/horoscopes.json');
const oldest=new Date(day+'T12:00:00Z');oldest.setUTCDate(oldest.getUTCDate()-90);
const rows=JSON.parse(fs.readFileSync(editorial,'utf8')).filter(row=>row.local_date!==day&&row.local_date>=oldest.toISOString().slice(0,10));
for(const [sign,row] of Object.entries(edition.signs))rows.push({sign,local_date:day,body:[row.overview,row.love,row.work,row.wellbeing].join('\n\n'),status:'published',editor:'Koledar365 · izvirna samodejna razvedrilna izdaja',published_at:edition.generated_at,created_at:edition.generated_at,updated_at:edition.generated_at});
atomic(editorial,rows.sort((a,b)=>a.local_date.localeCompare(b.local_date)||a.sign.localeCompare(b.sign)));
console.log(JSON.stringify({date:day,signs:Object.keys(edition.signs).length,reference_utc:edition.reference_utc,method:edition.edition_version}));
