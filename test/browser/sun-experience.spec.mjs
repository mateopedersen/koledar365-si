import {test,expect} from '@playwright/test';

test('sunrise pages cover all official Slovenian cities and respond to city, date and time',async({page})=>{
 await page.goto('/soncni-vzhod-in-zahod/?city=maribor&date=2027-07-15');
 await expect(page.locator('[data-sun-city] option')).toHaveCount(69);
 await expect(page.locator('[data-sun-city]')).toHaveValue('maribor');
 await expect(page.locator('[data-sun-date]')).toHaveValue('2027-07-15');
 await expect(page.locator('[data-sun-heading]')).toContainText('Maribor');
 await expect(page.locator('[data-sun-value="sunrise"]')).not.toHaveText('—');
 await expect(page.locator('[data-sun-value="sunset"]')).not.toHaveText('—');
 await expect(page.locator('[data-sun-path]')).toHaveAttribute('d',/^M/);
 await page.locator('[data-sun-city]').selectOption('koper');
 await expect(page).toHaveURL(/soncni-vzhod-in-zahod\/koper\/\?date=2027-07-15/);
 await expect(page.locator('[data-sun-heading]')).toContainText('Koper');
 await page.locator('[data-sun-time]').evaluate((slider)=>{slider.value='60';slider.dispatchEvent(new Event('input',{bubbles:true}))});
 await expect(page.locator('[data-sun-position]')).toContainText('pod obzorjem');
 const before=await page.locator('[data-sun-object]').getAttribute('transform');
 await page.locator('[data-sun-play]').click();
 await expect(page.locator('[data-sun-play]')).toHaveAttribute('aria-pressed','true');
 await page.waitForTimeout(450);
 await expect.poll(()=>page.locator('[data-sun-object]').getAttribute('transform')).not.toBe(before);
 await page.locator('[data-sun-play]').click();
 await expect(page.locator('[data-sun-play]')).toHaveAttribute('aria-pressed','false');
});

test('the city list is searchable without accents and the layout fits a phone',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/soncni-vzhod-in-zahod/');
 const filter=page.locator('[data-sun-city-filter]');
 await filter.fill('crnomelj');
 await expect(page.locator('.sun-city-link:visible')).toHaveCount(1);
 await expect(page.locator('.sun-city-link:visible')).toContainText('Črnomelj');
 await expect(page.locator('[data-sun-city-count]')).toHaveText('1 mesto');
 const widths=await page.evaluate(()=>({inner:innerWidth,body:document.body.scrollWidth,scene:document.querySelector('[data-sun-scene]').getBoundingClientRect().width}));
 expect(widths.body).toBeLessThanOrEqual(widths.inner);
 expect(widths.scene).toBeLessThan(widths.inner);
});

test('the nearest-city button uses the approved browser position locally',async({page,context})=>{
 await context.grantPermissions(['geolocation']);
 await context.setGeolocation({latitude:46.0511,longitude:14.5051});
 await page.goto('/soncni-vzhod-in-zahod/');
 await page.locator('[data-sun-locate]').click();
 await expect(page.locator('[data-sun-city]')).toHaveValue('ljubljana');
 await expect(page.locator('[data-sun-status]')).toContainText('Vaših koordinat ne pošiljamo');
});
