import {test,expect} from '@playwright/test';

const chooseNecessaryCookies = async page => {
 const choice=page.locator('[data-consent="necessary"]');
 if(await choice.isVisible()) await choice.click();
};

test('sunrise pages cover all official Slovenian cities and respond to city, date and time',async({page})=>{
 await page.goto('/soncni-vzhod-in-zahod/?city=maribor&date=2027-07-15');
 await chooseNecessaryCookies(page);
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
 await chooseNecessaryCookies(page);
 const filter=page.locator('[data-sun-city-filter]');
 await filter.fill('crnomelj');
 await expect(page.locator('.sun-city-link:visible')).toHaveCount(1);
 await expect(page.locator('.sun-city-link:visible')).toContainText('Črnomelj');
 await expect(page.locator('[data-sun-city-count]')).toHaveText('1 mesto');
 const widths=await page.evaluate(()=>({inner:innerWidth,body:document.body.scrollWidth,scene:document.querySelector('[data-sun-scene]').getBoundingClientRect().width}));
 expect(widths.body).toBeLessThanOrEqual(widths.inner);
 expect(widths.scene).toBeLessThan(widths.inner);
});

test('the mobile privacy choice stays a compact, usable bottom ribbon',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/soncni-vzhod-in-zahod/');
 const banner=page.locator('#cookies');
 await expect(banner).toBeVisible();
 const layout=await page.evaluate(()=>{
  const bar=document.querySelector('#cookies').getBoundingClientRect();
  const choices=[...document.querySelectorAll('#cookies .cookie-actions button')].map(button=>{
   const box=button.getBoundingClientRect();
   return{visible:box.width>0&&box.height>0,inside:box.top>=bar.top&&box.bottom<=bar.bottom+1};
  });
  return{height:bar.height,choices};
 });
 expect(layout.height).toBeLessThanOrEqual(190);
 expect(layout.choices).toHaveLength(3);
 expect(layout.choices.every(choice=>choice.visible&&choice.inside)).toBe(true);
 await chooseNecessaryCookies(page);
 await expect(banner).toBeHidden();
});

test('the sky, Sun visibility, and moving clouds follow the real solar altitude',async({page})=>{
 await page.goto('/soncni-vzhod-in-zahod/?city=ljubljana&date=2027-07-15');
 const scene=page.locator('[data-sun-scene]');
 const sun=page.locator('[data-sun-object]');
 const clouds=page.locator('[data-sun-cloud="upper"]');
 const skyStops=scene.locator('#sun-sky stop');
 const setMinute=async(minute)=>page.locator('[data-sun-time]').evaluate((slider,value)=>{slider.value=String(value);slider.dispatchEvent(new Event('input',{bubbles:true}))},minute);
 const noonTransform=await clouds.getAttribute('transform');
 await setMinute(60);
 await expect(scene).toHaveAttribute('data-sun-phase','night');
 await expect(sun).toHaveCSS('opacity','0');
 const nightColors=await skyStops.evaluateAll(stops=>stops.map(stop=>stop.getAttribute('stop-color')));
 const cloudAtNight=await clouds.getAttribute('transform');
 await setMinute(720);
 await expect(scene).toHaveAttribute('data-sun-phase','day');
 await expect(sun).toHaveCSS('opacity','1');
 await expect(page.locator('[data-sun-position]')).toContainText('azimut');
 const dayColors=await skyStops.evaluateAll(stops=>stops.map(stop=>stop.getAttribute('stop-color')));
 expect(dayColors).not.toEqual(nightColors);
 expect(cloudAtNight).not.toBe(noonTransform);
 await expect(page.locator('[data-sun-reflection]')).toHaveAttribute('d',/^M/);
});

test('the nearest-city button uses the approved browser position locally',async({page,context})=>{
 await context.grantPermissions(['geolocation']);
 await context.setGeolocation({latitude:46.0511,longitude:14.5051});
 await page.goto('/soncni-vzhod-in-zahod/');
 await chooseNecessaryCookies(page);
 await page.locator('[data-sun-locate]').click();
 await expect(page.locator('[data-sun-city]')).toHaveValue('ljubljana');
 await expect(page.locator('[data-sun-status]')).toContainText('Vaših koordinat ne pošiljamo');
});
