import fs from 'node:fs';
import crypto from 'node:crypto';
import {test,expect} from '@playwright/test';
const topics=JSON.parse(fs.readFileSync(new URL('../../data/topic_experiences_sl.json',import.meta.url),'utf8')).pages;

for(const [path,topic] of Object.entries(topics)) {
  test(`readable specialist design, source and preparation: ${path}`,async({page})=>{
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    const response=await page.goto(path);expect(response.status()).toBe(200);
    const consent=page.locator('[data-consent=necessary]');if(await consent.isVisible())await consent.click();
    await expect(page.locator('h1')).toHaveCount(1);
    const root=page.locator('.topic-experience');await expect(root).toHaveCount(1);
    await expect(root.locator('.topic-fact')).toHaveCount(3);
    const art=root.locator('.topic-art img');const hash=crypto.createHash('sha256').update(fs.readFileSync(new URL(`../../public/topics/${topic.art}.svg`,import.meta.url))).digest('hex').slice(0,16);await expect(art).toHaveAttribute('src',new RegExp(`^/topics/${topic.art}(?:\\.${hash})?\\.svg$`));
    await art.scrollIntoViewIfNeeded();await expect(art).toBeVisible();
    const svgResponse=await page.request.get(await art.getAttribute('src'));expect(svgResponse.status()).toBe(200);expect(svgResponse.headers()['content-type']).toContain('image/svg+xml');const svg=await svgResponse.text();expect(svg).toContain('width="520" height="360" viewBox="0 0 520 360"');
    const decoded=await art.evaluate(async img=>{await img.decode();return {width:img.naturalWidth,ratio:img.getBoundingClientRect().width/img.getBoundingClientRect().height};});expect(decoded.width).toBeGreaterThan(0);expect(decoded.ratio).toBeCloseTo(520/360,1);
    const guide=root.locator('.topic-guide');await guide.scrollIntoViewIfNeeded();
    await expect(guide.locator('tbody tr')).toHaveCount(3);
    await expect(guide.locator('a[href="'+topic.sourceUrl+'"]')).toHaveCount(1);
    const checklist=root.locator('[data-topic-checklist]');await expect(checklist).toHaveAttribute('data-ready','true');
    await checklist.locator('[data-topic-check="0"]').check();await expect(checklist.locator('output')).toHaveText('Opravljeno: 1 od 3');
    await page.reload();await expect(checklist.locator('[data-topic-check="0"]')).toBeChecked();
    await checklist.locator('[data-topic-reset]').click();await expect(checklist.locator('output')).toHaveText('Opravljeno: 0 od 3');
    const sizes=await page.evaluate(()=>{
      const selectors=['.topic-fact p','.topic-guide td','.topic-checklist label','.ed-event-copy h4','.ed-filters select','.ed-event-copy p','.garden-plant-name','.payment-table tbody td','.astro-reading p','.astro-safety p','.astro-method li'];
      return selectors.flatMap(s=>[...document.querySelectorAll(s)].filter(e=>e.getClientRects().length).map(e=>({selector:s,size:parseFloat(getComputedStyle(e).fontSize)})));
    });
    for(const item of sizes)expect(item.size,`${path}: ${item.selector}`).toBeGreaterThanOrEqual(17);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('quick education categories drive the existing event list and ICS export',async({page})=>{
 await page.goto('/matura/2027/splosna/');await expect(page.locator('[data-ed-ics]')).toBeEnabled();
 if(await page.locator('[data-consent=necessary]').isVisible())await page.locator('[data-consent=necessary]').click();
 const button=page.locator('[data-topic-category=results]');await button.click();
 await expect(page.locator('[name=category]')).toHaveValue('results');
 const events=page.locator('.ed-timeline .ed-event');expect(await events.count()).toBeGreaterThan(0);
 for(const event of await events.all())await expect(event).toHaveAttribute('data-category','results');
 const pending=page.waitForEvent('download');await page.locator('[data-ed-ics]').click();const download=await pending;
 const ics=fs.readFileSync(await download.path(),'utf8');expect(ics).toContain('BEGIN:VCALENDAR');expect(ics).toContain('Seznanitev');
 await page.locator('[data-topic-category=all]').click();expect(await events.count()).toBeGreaterThan(3);
});

test('preparation stays separate by page and works when local storage is unavailable',async({page})=>{
 await page.goto('/npz/3-razred/');if(await page.locator('[data-consent=necessary]').isVisible())await page.locator('[data-consent=necessary]').click();
 await page.locator('[data-topic-check="1"]').check();await page.goto('/npz/6-razred/');await expect(page.locator('[data-topic-progress]')).toHaveText('Opravljeno: 0 od 3');
 await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError');}});});
 await page.reload();await page.locator('[data-topic-check="2"]').check();await expect(page.locator('[data-topic-progress]')).toHaveText('Opravljeno: 1 od 3');await expect(page.locator('[data-topic-check-status]')).toContainText('ni mogoče shraniti');
});

test('larger screen type preserves the dedicated education and payment print views',async({page})=>{
 for(const path of ['/npz/6-razred/','/izplacila-pokojnin/']){
  await page.emulateMedia({media:'screen'});await page.goto(path);
  if(await page.locator('[data-consent=necessary]').isVisible())await page.locator('[data-consent=necessary]').click();
  await page.evaluate(()=>{window.print=()=>{window.__topicPrinted=true;};});
  const education=path.startsWith('/npz/');await page.locator(education?'[data-ed-print]':'[data-payment-print]').click();
  expect(await page.evaluate(()=>window.__topicPrinted)).toBe(true);await page.emulateMedia({media:'print'});
  await expect(page.locator('.topic-guide')).toBeHidden();await expect(page.locator('.topic-snapshot')).toBeHidden();await expect(page.locator('.topic-art')).toBeHidden();
  if(education){await expect(page.locator('[data-ed-print-sheet]')).toBeVisible();await expect(page.locator('[data-ed-print-sheet]')).toContainText('Matematika');}
  else {await expect(page.locator('.payment-table')).toBeVisible();expect(await page.locator('.payment-table td').first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBeLessThan(17);}
 }
});
