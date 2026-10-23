import {test,expect} from '@playwright/test';

test('numeric dates stay compact in server HTML and dynamic content without changing editable data',async({page})=>{
 const response=await page.goto('/');expect(response.status()).toBe(200);
 const html=await response.text();expect(html).not.toMatch(/<time[^>]*>\d{1,2}\.\s+\d{1,2}\.<\/time>/);
 if(await page.locator('[data-consent=necessary]').isVisible())await page.locator('[data-consent=necessary]').click();
 const date=page.locator('.holiday-feature__date time');await expect(date).toHaveCount(1);
 await expect(date).toHaveText(/^\d{1,2}\.\d{1,2}\.$/);
 expect(await date.evaluate(e=>getComputedStyle(e).whiteSpace)).toBe('nowrap');
 await page.evaluate(()=>{
  const fixture=document.createElement('section');fixture.id='numeric-date-fixture';
  fixture.innerHTML='<p>31. 10. 2026.</p><input value="31. 10. 2026"><textarea>31. 10. 2026</textarea><div contenteditable="true">31. 10. 2026</div><code>31. 10. 2026</code>';
  document.querySelector('main').append(fixture);
 });
 await expect(page.locator('#numeric-date-fixture p')).toHaveText('31.10.2026.');
 await expect(page.locator('#numeric-date-fixture input')).toHaveValue('31. 10. 2026');
 await expect(page.locator('#numeric-date-fixture textarea')).toHaveValue('31. 10. 2026');
 await expect(page.locator('#numeric-date-fixture [contenteditable]')).toHaveText('31. 10. 2026');
 await expect(page.locator('#numeric-date-fixture code')).toHaveText('31. 10. 2026');
 await page.locator('#numeric-date-fixture p').evaluate(e=>{e.firstChild.data='29. 2. 2028';});
 await expect(page.locator('#numeric-date-fixture p')).toHaveText('29.2.2028');
 await page.locator('#numeric-date-fixture').evaluate(e=>e.remove());
 for(const width of [320,390,1440]){
  await page.setViewportSize({width,height:900});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
  expect(await date.evaluate(e=>e.getClientRects().length)).toBe(1);
 }
});
