import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{await page.addInitScript(()=>localStorage.setItem('k365.consent',JSON.stringify({version:2,expiresAt:Date.now()+86400000,preferences:false})));});
test('lunar overview uses screen atlas and full quality is requested on enlargement',async({page})=>{
 const requested=[];page.on('request',r=>{if(r.url().includes('/lunar/atlas/'))requested.push(r.url());});
 await page.goto('/lunin-koledar/2029/avgust/');
 const detail=page.locator('[data-detail-image]');
 await expect(detail.locator('image')).toHaveAttribute('href','/lunar/atlas/2029-08-screen.webp');
 await expect(detail.locator('image')).toHaveAttribute('width','2304');
 expect(requested.some(u=>u.endsWith('-1.webp'))).toBe(false);
 await page.locator('.lunar-enlarge').click();
 await expect(page.locator('.lunar-dialog')).toBeVisible();
 await expect(page.locator('.lunar-dialog image')).toHaveAttribute('href','/lunar/atlas/2029-08-1.webp');
 await expect(page.locator('.lunar-dialog image')).toHaveAttribute('width','4608');
 await page.locator('.lunar-dialog [data-close]').click();
 await page.locator('#dan-2029-08-02').click();
 await expect(detail).toHaveAttribute('viewBox','384 0 384 384');
});
test('sun directory keeps all photographs and credits as lazy external images',async({page})=>{
 await page.goto('/soncni-vzhod-in-zahod/');
 await expect(page.locator('.sun-city-link__mark')).toHaveCount(69);
 expect(await page.locator('.sun-city-link__mark[loading=lazy][width="58"][height="46"]').count()).toBe(69);
 expect(await page.locator('.sun-city-grid svg image').count()).toBe(0);
 for(const img of [page.locator('.sun-city-link__mark').first(),page.locator('.sun-city-link__mark').last()]){
  await img.scrollIntoViewIfNeeded();await expect.poll(()=>img.evaluate(e=>e.complete&&e.naturalWidth>0)).toBe(true);
 }
 await expect(page.locator('.sun-city-link__credit')).toHaveCount(69);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(()=>innerWidth+1));
});
