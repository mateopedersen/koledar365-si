import {test,expect} from '@playwright/test';
import {chooseNecessaryCookies as dismiss} from './cookie-helpers.mjs';
const downloadedText=async download=>{const stream=await download.createReadStream();let value='';for await(const chunk of stream)value+=chunk.toString('utf8');return value;};

test('garden filter and private plan support real edit, persistence, backup and ICS',async({page})=>{
  await page.addInitScript(()=>{if(crypto.randomUUID)Object.defineProperty(crypto,'randomUUID',{value:undefined,configurable:true});});
  await page.goto('/setveni-koledar/');await dismiss(page);await expect(page.locator('[data-garden]')).toHaveAttribute('data-ready','true');
  await page.locator('[data-garden-search]').fill('cesen');await expect(page.locator('[data-garden-row]:visible')).toHaveCount(1);
  await page.locator('[data-garden-reset]').click();await expect(page.locator('[data-garden-row]:visible')).toHaveCount(16);
  await page.locator('#garden-plan-date').fill('2027-03-10');await page.locator('#garden-plan-note').fill('Greda 2; česen, solata');await page.locator('[data-garden-save]').click();
  await expect(page.locator('.garden-plan-item')).toHaveCount(1);await expect(page.locator('[data-garden-status]')).toContainText('Načrt je shranjen');await page.reload();await expect(page.locator('.garden-plan-item')).toHaveCount(1);
  await page.locator('.garden-plan-item').getByRole('button',{name:'Uredi',exact:true}).click();await page.locator('#garden-plan-date').fill('2027-03-11');await page.locator('[data-garden-save]').click();
  await expect(page.locator('.garden-plan-item time')).toHaveAttribute('datetime','2027-03-11');
  const [ics]=await Promise.all([page.waitForEvent('download'),page.locator('[data-garden-ics]').click()]);const calendar=await downloadedText(ics);
  expect(calendar).toContain('DTSTART;VALUE=DATE:20270311');expect(calendar).toContain('DTEND;VALUE=DATE:20270312');expect(calendar).toContain('Greda 2\\; česen\\, solata');
  const [json]=await Promise.all([page.waitForEvent('download'),page.locator('[data-garden-backup]').click()]);const backup=await downloadedText(json);expect(JSON.parse(backup).tasks).toHaveLength(1);
  await page.locator('.garden-plan-item').getByRole('button',{name:'Odstrani',exact:true}).click();await expect(page.locator('.garden-plan-item')).toHaveCount(0);
  await page.locator('[data-garden-import]').setInputFiles({name:'vrt.json',mimeType:'application/json',buffer:Buffer.from(backup)});await expect(page.locator('.garden-plan-item')).toHaveCount(1);
});

test('plant details and the add button stay readable while the garden months scroll',async({page})=>{
  await page.setViewportSize({width:320,height:780});
  await page.goto('/setveni-koledar/');
  await dismiss(page);
  await page.locator('#garden-search').fill('paradiznik');
  const row=page.locator('[data-garden-row]:visible');
  const scrolling=page.locator('.garden-timeline-wrap');
  const add=row.locator('[data-garden-pick]');
  await expect(row).toHaveCount(1);
  await row.locator('[data-garden-details]').click();
  const detail=page.locator('.garden-detail-row:visible .garden-plant-detail');

  for(const amount of [0,1000]){
    await scrolling.evaluate((element,left)=>{element.scrollLeft=left;},amount);
    const [frame,button,copy]=await Promise.all([scrolling.boundingBox(),add.boundingBox(),detail.boundingBox()]);
    for(const item of [button,copy]){
      expect(item.x).toBeGreaterThanOrEqual(frame.x-1);
      expect(item.x+item.width).toBeLessThanOrEqual(frame.x+frame.width+1);
    }
    expect(button.width).toBeGreaterThanOrEqual(44);
  }

  const plant=await row.getAttribute('data-garden-row');
  await add.click();
  await expect(page.locator('[data-garden-plan-form] [name=plant]')).toHaveValue(plant);
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

test('the payment date and all month cells remain readable together on phones and tablets', async ({page}) => {
  await page.clock.setFixedTime(new Date('2026-10-21T12:00:00Z'));
  for (const route of ['/izplacila-pokojnin/', '/izplacila-socialnih-transferjev/']) {
    await page.goto(route);
    await dismiss(page);
    const month = page.locator('.payment-next-month');
    for (const width of [320, 390, 530, 600, 760, 768, 1024]) {
      await page.setViewportSize({width, height: 900});
      const cellsFit = await month.evaluate(grid => {
        const card = grid.closest('.payment-next').getBoundingClientRect();
        const month = grid.getBoundingClientRect();
        const date = grid.closest('.payment-next').querySelector('.payment-next-date').getBoundingClientRect();
        const overlapsDate = month.left < date.right && month.right > date.left &&
          month.top < date.bottom && month.bottom > date.top;
        return !overlapsDate && month.right <= card.right && [...grid.children].every(cell => {
          const rect = cell.getBoundingClientRect();
          return rect.left >= month.left && rect.right <= month.right + 1 && rect.width >= 16;
        });
      });
      expect(cellsFit, route + ' at ' + width).toBe(true);
    }
  }
});

test('payment coverage ends honestly and preserves the single January carry-over',async({page})=>{
  await page.clock.setFixedTime(new Date('2027-01-06T12:00:00Z'));await page.goto('/izplacila-pokojnin/');await dismiss(page);
  await expect(page.locator('[data-payment-next-date]')).toContainText('Ni potrjenega');await expect(page.locator('[data-payment-next-date]')).not.toHaveAttribute('datetime',/\d/);
  await page.goto('/izplacila-socialnih-transferjev/?mesec=2027-01&prihodnji=0');
  await expect(page.locator('[data-payment-row]:visible')).toHaveCount(1);await expect(page.locator('[data-payment-row]:visible')).toContainText('2027');await expect(page.locator('[data-payment-row]:visible')).toContainText(/december 2026/i);
});

test('2027 pension limits and transfer publication status stay distinct from confirmed downloads', async ({page}) => {
  await page.goto('/izplacila-pokojnin/');
  await dismiss(page);
  await expect(page.locator('[data-payment-2027-month]')).toHaveCount(12);
  await expect(page.locator('[data-payment-2027-month="2027-01"] time')).toHaveAttribute('datetime', '2027-01-29');
  await expect(page.locator('[data-payment-2027-month="2027-12"]')).toContainText('Najpozneje');
  await expect(page.locator('[data-payment-download]')).toHaveAttribute('href', '/payments/pokojnine-2026.ics');
  await expect(page.locator('#kako-do-izplacila').getByRole('link', {name: 'Uradna zahteva in dokazila'})).toBeVisible();

  await page.goto('/izplacila-socialnih-transferjev/');
  await expect(page.locator('[data-payment-2027-month]')).toHaveCount(12);
  await expect(page.locator('#koledar-2027 [datetime]')).toHaveCount(1);
  await expect(page.locator('[data-payment-2027-month="2027-01"] time')).toHaveAttribute('datetime', '2027-01-05');
  await expect(page.locator('[data-payment-2027-month="2027-02"]')).toContainText('Čaka na objavo');
  await expect(page.locator('#kako-do-izplacila').getByRole('link', {name: 'Uradna vloga za varstveni dodatek'})).toBeVisible();
});

test('annual net and income tax use year-specific thresholds and reconcile withheld tax once', async ({page}) => {
  await page.goto('/kalkulator-dohodnine/');
  await dismiss(page);
  const form = page.locator('[data-sl-calculator="annual_tax"] form');
  const results = page.locator('[data-sl-result]');
  const compute = () => form.getByRole('button', {name: 'Izračunaj'}).click();

  await compute();
  await expect(results).toContainText('19291,55');
  await expect(results).toContainText('Predvideno vračilo');
  await expect(results).toContainText('149,49');

  await form.locator('[name="year"]').selectOption('2026');
  await compute();
  await expect(results).toContainText('19141,17');
  await expect(results).toContainText('Predvideno doplačilo');
  await expect(results).toContainText('0,89');

  await form.locator('[name="advance"]').fill('25000');
  await compute();
  await expect(results).toContainText('ne smejo presegati bruto plač');
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
