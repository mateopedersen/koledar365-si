import {test,expect} from '@playwright/test';

test.beforeEach(async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('k365.consent',JSON.stringify({version:2,expiresAt:Date.now()+86400000,preferences:false})));
});

test('mobile records keep full-width dates and names across table families and filtered results',async({page})=>{
  test.setTimeout(90000);
  const routes=['/pomembni-dnevi/','/pomembni-dnevi/februar/','/delovni-dnevi/2027/februar/','/polna-luna/','/lunin-mrk/','/izplacila-pokojnin/','/piskotki/','/prestopno-leto/'];
  for(const width of [320,390]){
    await page.setViewportSize({width,height:900});
    for(const path of routes){
      await page.goto(path,{waitUntil:'domcontentloaded'});
      await expect(page.locator('html')).toHaveAttribute('data-free-ready','true');
      const table=page.locator('.mobile-record-table').first();await expect(table).toBeAttached();
      if(!await table.isVisible()){
        await page.waitForLoadState('networkidle');
        if(await page.locator('[data-context-expand]').isVisible())await page.locator('[data-context-expand]').click();
      }
      await expect(table).toBeVisible();
      expect(await table.getByRole('columnheader').count(),path).toBeGreaterThan(0);
      const row=table.locator('tbody tr').filter({visible:true}).first();
      const layout=await row.evaluate(row=>({
        viewport:document.documentElement.clientWidth,document:document.documentElement.scrollWidth,
        widths:[...row.cells].slice(0,2).map(c=>c.getBoundingClientRect().width),
        overflow:[...row.cells].some(c=>c.scrollWidth>c.clientWidth+1),
        fonts:[...row.cells].map(c=>parseFloat(getComputedStyle(c).fontSize)),
      }));
      expect(layout.document,path).toBeLessThanOrEqual(width+1);
      expect(Math.min(...layout.widths),path).toBeGreaterThan(180);
      expect(layout.overflow,path).toBe(false);
      expect(Math.min(...layout.fonts),path).toBeGreaterThanOrEqual(14);
    }
  }
  await page.goto('/pomembni-dnevi/');
  await page.locator('.important-controls select[name=month]').selectOption('2');
  await page.locator('.important-controls form button').click();
  const filtered=page.locator('#important-free-results table');
  await expect(filtered.getByRole('columnheader',{name:'Pomembni dan'})).toHaveCount(1);
  await expect(filtered.getByRole('cell',{name:/Prešernov/}).first()).toBeVisible();
  expect(await filtered.locator('tbody tr').first().locator('td').first().evaluate(e=>e.getBoundingClientRect().width)).toBeGreaterThan(180);
});

test('calendar markers stay inside their days and full event names follow filters',async({page})=>{
  await page.setViewportSize({width:320,height:900});
  await page.addInitScript(()=>localStorage.setItem('k365.personal.v1',JSON.stringify({events:[{uid:'layout-event',date:'2026-10-31',title:'Srečanje z ekipo in pregled načrta',category:'personal',kind:'event',time:'10:00'}],notes:{}})));
  await page.goto('/?year=2026&month=10&date=2026-10-31');
  const agenda=page.getByRole('region',{name:'Dogodki v prikazu'});
  await expect(agenda.getByRole('link',{name:/Srečanje z ekipo in pregled načrta/})).toBeVisible();
  await expect(agenda.getByRole('link',{name:/dan reformacije/})).toBeVisible();
  const layout=await page.locator('td[data-date="2026-10-31"]').evaluate(cell=>{
    const r=cell.getBoundingClientRect();
    const markers=[...cell.querySelectorAll('.event-label')].filter(e=>!e.hidden).map(e=>e.getBoundingClientRect());
    return {inside:markers.every(b=>b.left>=r.left&&b.right<=r.right+1),overlap:markers.some((a,i)=>markers.slice(i+1).some(b=>Math.min(a.right,b.right)>Math.max(a.left,b.left)&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top)))};
  });
  expect(layout).toEqual({inside:true,overlap:false});
  await page.setViewportSize({width:1280,height:900});
  await page.locator('#show-holidays').uncheck();
  await expect(page.locator('.calendar-agenda a')).toHaveCount(1);
  await page.locator('#show-holidays').check();
  await expect(page.locator('.calendar-agenda a').filter({hasText:'dan reformacije'})).toHaveCount(1);
  await page.setViewportSize({width:320,height:900});
  await page.locator('#event-search').fill('reformacije');
  await expect(agenda.getByRole('link')).toHaveCount(1);
  await expect(agenda.getByRole('link')).toContainText('dan reformacije');
  await page.locator('#event-search').fill('');
  await page.getByRole('button',{name:'Osebno',exact:true}).click();
  await expect(agenda.getByRole('link')).toHaveCount(1);
  await expect(agenda.getByRole('link')).toContainText('Srečanje z ekipo');
  const legend=page.getByLabel('Legenda koledarja');
  await expect(legend).toContainText('Dela prost dan');
  const separated=await legend.evaluate(e=>[...e.querySelectorAll('.calendar-legend-item')].every(item=>{
    const dot=item.querySelector('.dot').getBoundingClientRect(),range=document.createRange();
    range.selectNodeContents(item.lastChild);return range.getBoundingClientRect().left>=dot.right+6;
  }));
  expect(separated).toBe(true);
});

test('desktop event text and printed tables retain their full layout',async({page})=>{
  await page.setViewportSize({width:1280,height:900});
  await page.goto('/?year=2026&month=10');
  const event=page.locator('td[data-date="2026-10-31"] .event-label').first();
  await expect(event).toContainText('dan reformacije');
  expect(await event.evaluate(e=>parseFloat(getComputedStyle(e).paddingLeft))).toBeGreaterThanOrEqual(10);
  await expect(page.locator('.calendar-agenda')).toBeHidden();
  await page.goto('/pomembni-dnevi/');
  await page.setViewportSize({width:320,height:900});
  await expect(page.locator('.mobile-record-table').first()).toBeVisible();
  await page.emulateMedia({media:'print'});
  expect(await page.locator('.mobile-record-table').first().evaluate(e=>getComputedStyle(e).display)).toBe('table');
  expect(await page.locator('.mobile-record-table thead').first().evaluate(e=>e.getBoundingClientRect().height)).toBeGreaterThan(10);
});

test('without JavaScript the full table remains horizontally readable',async({browser,baseURL})=>{
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:900}});
  const page=await context.newPage();await page.goto(baseURL+'/pomembni-dnevi/');
  const table=page.locator('.data-table').first();
  const layout=await table.evaluate(e=>({width:e.getBoundingClientRect().width,wrap:e.parentElement.clientWidth,scroll:e.parentElement.scrollWidth,document:document.documentElement.scrollWidth}));
  expect(layout.width).toBeGreaterThanOrEqual(600);
  expect(layout.scroll).toBeGreaterThan(layout.wrap);
  expect(layout.document).toBeLessThanOrEqual(321);
  await context.close();
});

test('eclipse status labels stay inside their cells with enlarged text',async({page})=>{
  await page.setViewportSize({width:320,height:900});
  await page.goto('/lunin-mrk/');
  await expect(page.locator('html')).toHaveAttribute('data-free-ready','true');
  await expect(page.locator('.mobile-record-table').first()).toBeVisible();
  await page.addStyleTag({content:'.astro-status{font-family:DejaVu,sans-serif!important;font-size:20px!important}'});
  await page.evaluate(()=>document.fonts.load('20px DejaVu'));
  const cells=await page.locator('.mobile-record-table tbody tr').first().evaluate(row=>[...row.cells].map(cell=>({text:cell.textContent.trim(),width:cell.clientWidth,scroll:cell.scrollWidth})));
  expect(cells.filter(cell=>cell.scroll>cell.width+1)).toEqual([]);
});
