import {test,expect} from '@playwright/test';

test('opening a gallery keeps honest layout samples and renders a personal preview only on request',async({page})=>{
  test.setTimeout(120000);
  const engines=[],errors=[];
  page.on('request',request=>{
    if(/\/free\/(?:ruby-worker\.js|engine\/|vendor\/pdf)/.test(new URL(request.url()).pathname))engines.push(request.url());
  });
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/koledar-za-tiskanje/');
  const consent=page.locator('[data-consent="necessary"]');if(await consent.isVisible())await consent.click();
  await expect(page.locator('html')).toHaveAttribute('data-free-ready','true');
  const card=page.locator('.design-card').first(),image=card.locator('img[data-preview-design]');
  await image.scrollIntoViewIfNeeded();
  await page.waitForLoadState('networkidle');
  await expect(image).toHaveAttribute('src',/\/free\/samples\/[^/]+\.png(?:\?|$)/);
  await expect(image).toHaveAttribute('alt',/Vzorec postavitve/);
  expect(engines,'layout samples must not start Ruby/PDF workers').toEqual([]);
  for(const width of [320,390,768,1280]){
    await page.setViewportSize({width,height:900});
    await page.evaluate(()=>new Promise(requestAnimationFrame));
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
  expect(engines,'resizing a gallery must not start PDF rendering').toEqual([]);
  await card.locator('[data-personal-preview]').click();
  await expect(card.locator('.export-status')).toContainText('Vaš osebni predogled',{timeout:90000});
  await expect(image).toHaveAttribute('src',/^blob:/);
  await expect.poll(()=>image.evaluate(node=>node.complete&&node.naturalWidth>=600&&node.naturalHeight>=600)).toBe(true);
  expect(engines.some(url=>url.includes('/free/engine/'))).toBe(true);
  expect(errors).toEqual([]);
});
