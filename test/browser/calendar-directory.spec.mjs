import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('k365.consent',JSON.stringify({version:2,expiresAt:Date.now()+86400000,preferences:false})));
});
test('year and month selection keeps correct destinations and survives reload',async({page})=>{
  await page.setViewportSize({width:1280,height:1000});await page.goto('/koledar/');
  const root=page.locator('[data-calendar-directory]');
  await expect(root.locator('[data-directory-filters]')).toBeVisible();
  await expect(root.locator('.cd-period-table tbody a:visible')).toHaveCount(52);
  await page.getByRole('button',{name:'2028',exact:true}).click();
  await expect(root.locator('.cd-period-table tbody a:visible')).toHaveCount(13);
  await page.getByRole('combobox',{name:'Prikaži mesec',exact:true}).selectOption('2');
  await expect(root.locator('.cd-period-table tbody a:visible')).toHaveCount(1);
  await expect(root.locator('.cd-period-table tbody a:visible')).toHaveAttribute('href','/koledar/2028/februar/');
  await expect(page).toHaveURL(/leto=2028.*mesec=2/);
  await page.reload();
  await expect(page.getByRole('button',{name:'2028',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('combobox',{name:'Prikaži mesec',exact:true})).toHaveValue('2');
  await expect(root.locator('[data-directory-status]')).toContainText('Februar 2028');
  await page.getByRole('button',{name:'Ponastavi',exact:true}).click();
  await expect(root.locator('.cd-period-table tbody a:visible')).toHaveCount(52);
  await expect(root.getByRole('columnheader',{name:/2028/})).toContainText('366 dni');
});
test('phone view opens one readable year and allows an accessible comparison of all years',async({page})=>{
  for(const width of [320,390]){
    await page.setViewportSize({width,height:900});await page.goto('/koledar/');
    await expect(page.locator('[data-calendar-directory]')).toHaveAttribute('data-single-year','true');
    await expect(page.locator('.cd-period-table tbody a:visible')).toHaveCount(13);
    await page.getByRole('button',{name:'2030',exact:true}).click();
    await expect(page.locator('.cd-period-table tbody a:visible').last()).toHaveAttribute('href','/koledar/2030/december/');
    const size=await page.locator('.cd-period-table').evaluate(e=>({table:e.getBoundingClientRect().width,wrap:e.parentElement.clientWidth,root:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth}));
    expect(size.table).toBeLessThanOrEqual(size.wrap+1);expect(size.root).toBeLessThanOrEqual(width+1);
    await page.getByRole('button',{name:'Vsa leta',exact:true}).click();
    const region=page.getByRole('region',{name:'Koledarji po letih in mesecih'});await region.focus();
    await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');
    await expect.poll(()=>region.evaluate(e=>e.scrollLeft)).toBeGreaterThan(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+1);
    await expect(page.getByRole('button',{name:'Vsa leta',exact:true})).toHaveAttribute('aria-pressed','true');
  }
});
test('archive and purpose directory remain reachable with keyboard controls',async({page})=>{
  await page.goto('/koledar/');
  const archive=page.locator('.cd-archive');await archive.locator('summary').focus();await page.keyboard.press('Enter');
  await expect(archive).toHaveAttribute('open','');await expect(archive.locator('a[href="/koledar/2026/"]')).toBeVisible();
  await expect(archive.locator('a[href="/koledar/2026/oktober/"]')).toBeVisible();
  await expect(page.locator('.cd-tool-table tbody a')).toHaveCount(7);
  for(const link of await page.locator('.calendar-directory a').all()){
    expect(await link.getAttribute('href')).toMatch(/^\/(?:koledar|mesecni-koledar|tedenski-koledar|lunin-koledar|solski-koledar|prazen-koledar|delovni-dnevi|ustvari-koledar)/);
  }
});
test('without JavaScript every year and month is available without page overflow',async({browser,baseURL})=>{
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:900}});const page=await context.newPage();await page.goto(baseURL+'/koledar/');
  await expect(page.locator('.cd-period-table tbody a')).toHaveCount(52);await expect(page.locator('[data-directory-filters]')).toBeHidden();
  const result=await page.locator('.cd-table-wrap').evaluate(e=>({scroll:e.scrollWidth,width:e.clientWidth,root:document.documentElement.scrollWidth}));
  expect(result.scroll).toBeGreaterThan(result.width);expect(result.root).toBeLessThanOrEqual(321);await context.close();
});
