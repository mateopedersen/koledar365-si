import {test,expect} from '@playwright/test';
import {readdir,readFile} from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve('site');
const printableRoots=['','koledar','lunin-koledar','delovni-dnevi','prazniki','pomembni-dnevi','letni-casi','solske-pocitnice','tedenski-koledar','koledar-za-tiskanje'];
const monthNames=['januar','februar','marec','april','maj','junij','julij','avgust','september','oktober','november','december'];

async function htmlFiles(dir){
  let entries;
  try{entries=await readdir(dir,{withFileTypes:true})}catch{return []}
  const files=[];
  for(const entry of entries){
    const file=path.join(dir,entry.name);
    if(entry.isDirectory())files.push(...await htmlFiles(file));
    else if(entry.isFile()&&entry.name==='index.html')files.push(file);
  }
  return files;
}

async function printablePages(){
  const files=(await Promise.all(printableRoots.map(part=>htmlFiles(path.join(root,part))))).flat();
  const routes=[];
  for(const file of new Set(files)){
    const html=await readFile(file,'utf8');
    if(!html.includes('data-print'))continue;
    const relative=path.relative(root,path.dirname(file)).split(path.sep).join('/');
    routes.push(relative?`/${relative}/`:'/');
  }
  return [...new Set(routes)].sort();
}

function pdfPageCount(pdf){
  const source=pdf.toString('latin1');
  return [...source.matchAll(/\/Type\s*\/Page(?!s)\b/g)].length;
}

test('all printable routes load the shared print stylesheet and omit interactive chrome',async({page},info)=>{
  test.setTimeout(300000);
  const routes=await printablePages();
  expect(routes.length).toBeGreaterThan(70);
  await info.attach('print-route-coverage',{body:Buffer.from(JSON.stringify(routes,null,2)),contentType:'application/json'});
  const problems=[];
  for(const route of routes){
    const response=await page.goto(route,{waitUntil:'load'});
    if(!response||!response.ok()){problems.push(`${route}: HTTP ${response?.status()??'no response'}`);continue}
    const hasPrintRules=await page.evaluate(()=>{
      const rules=[...document.styleSheets].flatMap(sheet=>{try{return [...sheet.cssRules].map(rule=>rule.cssText)}catch{return []}}).join('\n');
      return rules.includes('@page')&&rules.includes('.sp-calendar-section')&&rules.includes('.category-bar');
    });
    if(!hasPrintRules)problems.push(`${route}: shared print stylesheet missing from built page assets`);
    await page.emulateMedia({media:'print'});
    for(const selector of ['.category-bar','.filters','.year-links','.search','button:not(.sp-day)','.button']){
      const visible=await page.locator(selector).evaluateAll(nodes=>nodes.some(node=>getComputedStyle(node).display!=='none'));
      if(visible)problems.push(`${route}: ${selector} remains visible in print`);
    }
    const calendarTitle=page.locator('.calendar-title h2');
    if(await calendarTitle.count()&&!await calendarTitle.isVisible())problems.push(`${route}: calendar period heading is hidden in print`);
    const calendarContext=page.locator('.calendar-context .calendar, .calendar-context .year-grid').first();
    if(await calendarContext.count()&&!await calendarContext.isVisible())problems.push(`${route}: responsive rules hide the print calendar`);
    if(route.startsWith('/solske-pocitnice/')){
      const section=page.locator('.sp-calendar-section');
      if(await section.count()){
        const breakInside=await section.evaluate(node=>getComputedStyle(node).breakInside);
        if(!['avoid','avoid-page'].includes(breakInside))problems.push(`${route}: school calendar heading can separate from its calendar`);
      }
    }
  }
  expect(problems,problems.slice(0,30).join('\n')).toEqual([]);
});

test('each published monthly calendar prints on one A4 page',async({page},info)=>{
  test.skip(info.project.name!=='chromium','PDF generation is supported by the Chromium project.');
  test.setTimeout(300000);
  const failures=[];
  for(let year=2027;year<=2030;year++)for(const month of monthNames){
    const file=path.join(root,'koledar',String(year),month,'index.html');
    try{await readFile(file)}catch{failures.push(`/koledar/${year}/${month}/: generated page is missing`);continue}
    const response=await page.goto(`/koledar/${year}/${month}/`,{waitUntil:'load'});
    if(!response?.ok()){failures.push(`/koledar/${year}/${month}/: HTTP ${response?.status()??'no response'}`);continue}
    await page.emulateMedia({media:'print'});
    if(!await page.locator('.calendar-title h2').isVisible())failures.push(`/koledar/${year}/${month}/: calendar heading is hidden`);
    const pdf=await page.pdf({format:'A4',printBackground:true,preferCSSPageSize:true});
    const pages=pdfPageCount(pdf);
    if(pages!==1)failures.push(`/koledar/${year}/${month}/: expected 1 PDF page, received ${pages}`);
  }
  expect(failures,failures.join('\n')).toEqual([]);
});

test('school print keeps its calendar section together and removes its interactive month picker',async({page},info)=>{
  await page.addInitScript(()=>{window.print=()=>{};});
  await page.goto('/solske-pocitnice/2026-2027/',{waitUntil:'load'});
  await expect(page).toHaveURL(/\/solske-pocitnice\/(?:\?|$)/);
  await expect(page.locator('[data-calendar-day]')).not.toHaveCount(0);
  await page.locator('[data-school-calendar-print]').click();
  await expect(page.locator('body')).toHaveClass(/school-calendar-printing/);
  await page.emulateMedia({media:'print'});
  const section=page.locator('.sp-calendar-section');
  await expect(page.locator('[data-calendar-day]').first()).toBeVisible();
  await expect(section).toBeVisible();
  await expect(page.locator('.sp-holiday-grid')).toBeHidden();
  await expect(page.locator('.sp-universities')).toBeHidden();
  await expect(page.locator('.sp-month-aside [data-month-events]')).toBeVisible();
  const breakInside=await section.evaluate(node=>getComputedStyle(node).breakInside);
  expect(['avoid','avoid-page']).toContain(breakInside);
  await expect(page.locator('.sp-month-heading > div')).toHaveCSS('display','none');
  if(info.project.name==='chromium'){
    const pdf=await page.pdf({format:'A4',printBackground:true,preferCSSPageSize:true});
    expect(pdfPageCount(pdf)).toBeGreaterThan(0);
  }
});
