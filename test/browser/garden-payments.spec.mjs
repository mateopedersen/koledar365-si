import {test,expect} from '@playwright/test';
const dismiss=async page=>{const button=page.locator('[data-consent="necessary"]');if(await button.isVisible())await button.click();};
const downloadedText=async download=>{const stream=await download.createReadStream();let value='';for await(const chunk of stream)value+=chunk.toString('utf8');return value;};

test('garden filter and private plan support real edit, persistence, backup and ICS',async({page})=>{
  await page.goto('/setveni-koledar/');await dismiss(page);await expect(page.locator('[data-garden]')).toHaveAttribute('data-ready','true');
  await page.locator('[data-garden-search]').fill('cesen');await expect(page.locator('[data-garden-row]:visible')).toHaveCount(1);
  await page.locator('[data-garden-reset]').click();await expect(page.locator('[data-garden-row]:visible')).toHaveCount(16);
  await page.locator('#garden-plan-date').fill('2027-03-10');await page.locator('#garden-plan-note').fill('Greda 2; česen, solata');await page.locator('[data-garden-save]').click();
  await expect(page.locator('.garden-plan-item')).toHaveCount(1);await page.reload();await expect(page.locator('.garden-plan-item')).toHaveCount(1);
  await page.locator('.garden-plan-item').getByRole('button',{name:'Uredi',exact:true}).click();await page.locator('#garden-plan-date').fill('2027-03-11');await page.locator('[data-garden-save]').click();
  await expect(page.locator('.garden-plan-item time')).toHaveAttribute('datetime','2027-03-11');
  const [ics]=await Promise.all([page.waitForEvent('download'),page.locator('[data-garden-ics]').click()]);const calendar=await downloadedText(ics);
  expect(calendar).toContain('DTSTART;VALUE=DATE:20270311');expect(calendar).toContain('DTEND;VALUE=DATE:20270312');expect(calendar).toContain('Greda 2\\; česen\\, solata');
  const [json]=await Promise.all([page.waitForEvent('download'),page.locator('[data-garden-backup]').click()]);const backup=await downloadedText(json);expect(JSON.parse(backup).tasks).toHaveLength(1);
  await page.locator('.garden-plan-item').getByRole('button',{name:'Odstrani',exact:true}).click();await expect(page.locator('.garden-plan-item')).toHaveCount(0);
  await page.locator('[data-garden-import]').setInputFiles({name:'vrt.json',mimeType:'application/json',buffer:Buffer.from(backup)});await expect(page.locator('.garden-plan-item')).toHaveCount(1);
});

test('pensions use the December 29 official exception and export the filtered date',async({page})=>{
  await page.clock.setFixedTime(new Date('2026-10-21T12:00:00Z'));await page.goto('/izplacila-pokojnin/');await dismiss(page);
  await expect(page.locator('[data-payment-next-date]')).toHaveAttribute('datetime','2026-10-30');
  await expect(page.locator('.payment-next-month span').first()).toHaveCSS('grid-column-start','4');
  await page.locator('[data-payment-upcoming]').uncheck();await expect(page.locator('[data-payment-row]:visible')).toHaveCount(12);
  await page.locator('[data-payment-month]').selectOption('2026-12');await expect(page.locator('[data-payment-row]:visible')).toHaveCount(1);
  const [file]=await Promise.all([page.waitForEvent('download'),page.locator('[data-payment-filtered-ics]').click()]);const calendar=await downloadedText(file);
  expect(calendar.match(/BEGIN:VEVENT/g)).toHaveLength(1);expect(calendar).toContain('DTSTART;VALUE=DATE:20261229');
});

test('payment coverage ends honestly and preserves the single January carry-over',async({page})=>{
  await page.clock.setFixedTime(new Date('2027-01-06T12:00:00Z'));await page.goto('/izplacila-pokojnin/');await dismiss(page);
  await expect(page.locator('[data-payment-next-date]')).toContainText('Ni potrjenega');await expect(page.locator('[data-payment-next-date]')).not.toHaveAttribute('datetime',/\d/);
  await page.goto('/izplacila-socialnih-transferjev/?mesec=2027-01&prihodnji=0');
  await expect(page.locator('[data-payment-row]:visible')).toHaveCount(1);await expect(page.locator('[data-payment-row]:visible')).toContainText('2027');await expect(page.locator('[data-payment-row]:visible')).toContainText(/december 2026/i);
});

test('new source-led tools and methodology fit a 320px phone with one main heading',async({page})=>{
  await page.setViewportSize({width:320,height:844});const errors=[];page.on('pageerror',error=>errors.push(error.message));
  for(const route of ['/setveni-koledar/','/izplacila-pokojnin/','/izplacila-socialnih-transferjev/','/viri-in-metodologija/']){
    await page.goto(route);await dismiss(page);await expect(page.locator('main h1')).toHaveCount(1);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href','https://koledar365.si'+route);
  }
  expect(errors).toEqual([]);
});
