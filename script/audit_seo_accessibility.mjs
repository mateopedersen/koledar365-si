import {chromium} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
const output=process.env.SEO_REPORT_DIR||'reports/seo-2026-10-22/current',origin=process.env.K365_BASE_URL||'http://127.0.0.1:3661';
const paths=['/','/koledar/','/koledar/2028/','/koledar/2028/februar/','/lunin-koledar/','/lunin-koledar/2029/','/lunin-koledar/2029/avgust/','/pomembni-dnevi/2027/','/delovni-dnevi/2028/','/delovni-dnevi/2028/februar/','/prazniki/2028/','/podaljsani-vikendi/2028/','/datumski-kalkulator/','/stevilka-tedna/','/dan-v-letu/','/druzinski-planer/','/razpored-izmen/','/solski-urnik/','/solske-pocitnice/','/solski-koledar/','/soncni-vzhod-in-zahod/ljubljana/','/lunine-mene/','/soncni-mrk/','/setveni-koledar/','/izplacila-pokojnin/','/horoskop/','/ustvari-koledar/','/kontakt/','/o-nas/','/uredniska-politika/','/viri-in-metodologija/','/piskotki/'];
const browser=await chromium.launch();const rows=[];
try {for(const [mode,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
 const context=await browser.newContext({viewport,locale:'sl-SI',timezoneId:'Europe/Ljubljana'});const page=await context.newPage();
 for(const path of paths){await page.goto(origin+path,{waitUntil:'domcontentloaded'});await page.waitForTimeout(900);
 const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22a','wcag22aa']).analyze();
 rows.push({path,mode,violations:result.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,helpUrl:v.helpUrl,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary,html:n.html}))})),incomplete:result.incomplete.map(v=>({id:v.id,nodes:v.nodes.length})),passes:result.passes.length});console.log(mode,path,rows.at(-1).violations.map(v=>v.id).join(','));
 await fs.writeFile(`${output}/accessibility.json`,JSON.stringify({checked_at:new Date().toISOString(),engine:'axe-core WCAG A/AA automated rules; manual checks remain separate',origin,results:rows},null,2));}
 await context.close();
}}finally{await browser.close();}
console.log(JSON.stringify({checked:rows.length,violations:rows.reduce((sum,r)=>sum+r.violations.length,0)}));
