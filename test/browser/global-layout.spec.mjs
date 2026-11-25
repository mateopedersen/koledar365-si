import {test,expect} from '@playwright/test';

for(const width of [320,360,768,1024,1440,1920,2560])test(`shared content axis and complete period controls at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});
 await page.goto('/');
 await page.evaluate(()=>document.fonts.ready);
 await expect(page.locator('html')).toHaveAttribute('data-free-ready','true');
 const geometry=await page.evaluate(()=>{
  const main=document.querySelector('main'),r=main.getBoundingClientRect(),s=getComputedStyle(main);
  const left=r.left+parseFloat(s.paddingLeft),right=r.right-parseFloat(s.paddingRight);
  const box=e=>{const b=e.getBoundingClientRect();return {left:b.left,right:b.right,width:b.width};};
  return {left,right,width:innerWidth,scroll:document.documentElement.scrollWidth,brand:box(document.querySelector('.topbar>.brand')),nav:box(document.querySelector('.subnav-track')),footer:box(document.querySelector('.site-footer__inner')),controls:[...document.querySelectorAll('.period-form select,.period-form button')].map(el=>({...box(el),top:el.getBoundingClientRect().top}))};
 });
 for(const edge of [geometry.brand.left,geometry.nav.left,geometry.footer.left])expect(Math.abs(edge-geometry.left)).toBeLessThanOrEqual(1.1);
 for(const edge of [geometry.nav.right,geometry.footer.right])expect(Math.abs(edge-geometry.right)).toBeLessThanOrEqual(1.1);
 expect(Math.abs(geometry.left-(width-geometry.right))).toBeLessThanOrEqual(1.1);
 expect(geometry.scroll).toBeLessThanOrEqual(width+1);
 const calendar=await page.locator('.calendar-panel').boundingBox();
 const city=await page.locator('#city-card').boundingBox();
 if(width<=850){
  expect(calendar.y+calendar.height).toBeLessThanOrEqual(city.y);
  expect(calendar.y).toBeLessThan(650);
 }else{
  expect(city.x+city.width).toBeLessThanOrEqual(calendar.x);
  expect(city.y).toBeLessThan(calendar.y);
 }
 if(width<=1100){
  const cta=await page.locator('.calendar-studio-cta').boundingBox();
  if(width<=720)expect(Math.abs(cta.x+cta.width/2-width/2)).toBeLessThanOrEqual(1.1);
  else{
   const title=await page.locator('.intro h1').boundingBox();
   expect(title.x+title.width).toBeLessThanOrEqual(cta.x);
   expect(title.y).toBeLessThan(cta.y+cta.height);
   expect(cta.y).toBeLessThan(title.y+title.height);
  }
 }
 for(const control of geometry.controls){expect(control.left).toBeGreaterThanOrEqual(geometry.left);expect(control.right).toBeLessThanOrEqual(geometry.right);expect(control.width).toBeGreaterThan(40);}
 if(width<=480){
  for(const control of geometry.controls)expect(Math.abs(control.top-geometry.controls[0].top)).toBeLessThanOrEqual(1);
 }
 await page.locator('.period-form select[name=year]').selectOption('2030');
 await page.locator('.period-form select[name=month]').selectOption('11');
 await page.locator('.period-form button').click();
 await expect(page).toHaveURL(/year=2030/);
 await expect(page.locator('html')).toHaveAttribute('data-free-ready','true');
 await expect(page.locator('.period-form select[name=month]')).toHaveValue('11');
});

test('period controls remain reachable at 200 percent zoom',async({page})=>{
 await page.setViewportSize({width:640,height:1000});await page.goto('/');
 await expect(page.locator('html')).toHaveAttribute('data-free-ready','true');
 await page.evaluate(()=>document.body.style.zoom='2');
 for(const control of await page.locator('.period-form select,.period-form button').all()){
  await control.scrollIntoViewIfNeeded();const b=await control.boundingBox();expect(b.x).toBeGreaterThanOrEqual(0);expect(b.x+b.width).toBeLessThanOrEqual(641);
 }
});

test('date statistics keep visible, centered icons and aligned values at each width', async ({ page }) => {
 await page.goto('/?year=2028&month=2&date=2028-02-29', { waitUntil: 'domcontentloaded' });
 await expect(page.locator('html')).toHaveAttribute('data-free-ready', 'true');
 const stats = page.locator('.stats');
 await expect(stats.locator('dd')).toHaveText(['9', '60', '29']);
 for (const width of [320, 390, 520, 547, 768, 1024, 1440]) {
  await page.setViewportSize({ width, height: 900 });
  const layout = await stats.evaluate(async element => {
   await document.fonts.ready;
   const rect = el => el.getBoundingClientRect().toJSON();
   return [...element.children].map(cell => ({
    cell: rect(cell), icon: rect(cell.querySelector('svg')),
    label: rect(cell.querySelector('dt')), value: rect(cell.querySelector('dd')),
   }));
  });
  for (const { cell, icon, label, value } of layout) {
   const groupLeft = Math.min(icon.left, label.left, value.left);
   const groupRight = Math.max(icon.right, label.right, value.right);
   const stacked = icon.bottom <= value.top;
   expect(icon.width, width + 'px').toBeGreaterThanOrEqual(stacked ? 44 : 52);
   expect(icon.width, width + 'px').toBe(icon.height);
   expect(Math.abs((groupLeft + groupRight) / 2 - (cell.left + cell.right) / 2), width + 'px').toBeLessThanOrEqual(1);
   expect(value.bottom, width + 'px').toBeLessThanOrEqual(label.top);
   expect(Math.abs(value.top - layout[0].value.top), width + 'px').toBeLessThanOrEqual(1);
   expect(Math.abs(label.top - layout[0].label.top), width + 'px').toBeLessThanOrEqual(1);
   const offset = stacked ? (icon.left + icon.right - value.left - value.right) / 2 : value.left - label.left;
   expect(Math.abs(offset), width + 'px').toBeLessThanOrEqual(1);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth), width + 'px').toBeLessThanOrEqual(width + 1);
 }
});

for(const width of [850,851,900,1024,1100,1101])test(`city controls stay inside their card at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto('/');
 await expect(page.locator('html')).toHaveAttribute('data-free-ready','true');
 const card=await page.locator('#city-card').boundingBox();
 for(const selector of ['#city-select','#weather-refresh']){
  const control=await page.locator(selector).boundingBox();
  expect(control.x).toBeGreaterThanOrEqual(card.x);
  expect(control.x+control.width).toBeLessThanOrEqual(card.x+card.width);
 }
});

for(const width of [360,760,768,820,1024])test(`horoscope birth fields fit their card at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});
 await page.goto('/horoskop/oven/');
 await page.evaluate(()=>document.fonts.ready);
 const card=await page.locator('.z-calculator-aside .z-calculator').boundingBox();
 for(const selector of ['#z-birth-date','#z-birth-time']){
  const input=page.locator(selector);await input.scrollIntoViewIfNeeded();
  const control=await input.boundingBox();
  expect(control.x).toBeGreaterThanOrEqual(card.x);
  expect(control.x+control.width).toBeLessThanOrEqual(card.x+card.width);
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+1);
});


test('phone shortcuts and calendar filters align, and note controls stay within their panel', async ({page}) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-free-ready','true');
  for (const width of [320,390,480]) {
    await page.setViewportSize({width,height:844});
    const layout = await page.evaluate(() => {
      const boxes = selector => [...document.querySelectorAll(selector)].map(node => node.getBoundingClientRect().toJSON());
      return {
        shortcuts: boxes('.nav-shortcut,.nav-explorer > summary'),
        years: boxes('.nav-years a'),
        filters: boxes('.calendar-category-select select,#event-search'),
        notes: ['.calendar-notes-panel h2','#day-notes','#save-notes'].map(selector => boxes(selector)[0]),
        gridTop: boxes('.calendar-panel .month-block .calendar')[0].top,
        profile: boxes('#personal-planner,#city-card'),
      };
    });
    for (const [index, shortcut] of layout.shortcuts.entries()) {
      expect(shortcut.top).toBeCloseTo(layout.shortcuts[0].top,1);
      expect(shortcut.height).toBeCloseTo(layout.shortcuts[0].height,1);
      expect(shortcut.left).toBeCloseTo(layout.years[index].left,1);
      expect(shortcut.right).toBeCloseTo(layout.years[index].right,1);
    }
    expect(layout.filters[0].top).toBeCloseTo(layout.filters[1].top,1);
    expect(layout.filters[0].right).toBeLessThan(layout.filters[1].left);
    const [heading, field, save] = layout.notes;
    expect(heading.bottom).toBeLessThanOrEqual(field.top);
    expect(field.bottom).toBeLessThanOrEqual(save.top);
    expect(save.left).toBeCloseTo(field.left,1);
    expect(save.right).toBeLessThanOrEqual(field.right + 1);
    expect(layout.gridTop).toBeLessThan(790);
    expect(layout.profile[0].bottom).toBeLessThan(layout.profile[1].top);
  }
  await page.setViewportSize({width:320,height:735});
  await page.locator('[data-add-event]').click();
  await expect(page.locator('#personal-form [name=title]')).toBeFocused();
});

test('day and week views use compact date rows and link to personal planning once', async ({page}) => {
  await page.setViewportSize({width:320,height:844});
  for (const [view,count] of [['day',1],['week',7]]) {
    await page.goto(`/?year=2027&month=10&date=2027-10-04&view=${view}`);
    await expect(page.locator('html')).toHaveAttribute('data-free-ready','true');
    const calendar = page.locator('.week-view');
    const rows = calendar.locator('> section');
    await expect(rows).toHaveCount(count);
    await expect(page.locator('.calendar-personal-hint a')).toHaveAttribute('href','#personal-title');
    await expect(page.locator('#event-search')).toHaveCount(0);
    const box = await calendar.boundingBox();
    for (const row of await rows.all()) {
      const rect = await row.boundingBox();
      expect(rect.width).toBeCloseTo(box.width,1);
      expect(rect.height).toBeGreaterThanOrEqual(44);
      expect(rect.height).toBeLessThan(120);
    }
  }
});
