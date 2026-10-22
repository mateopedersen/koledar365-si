import {test,expect} from '@playwright/test';

test('the holiday directory keeps its complete heading and year choices inside narrow screens',async({page})=>{
  await page.goto('/prazniki/');
  const heading=page.locator('[data-holiday-directory] h1');
  await expect(heading).toContainText('Prazniki in');
  await expect(heading).toContainText('dela prosti dnevi.');
  for(const width of [320,360,390,768,1440]){
    await page.setViewportSize({width,height:900});
    await expect(heading).toHaveCSS('white-space','normal');
    const layout=await heading.evaluate(node=>({right:node.getBoundingClientRect().right,client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
    expect(layout.right).toBeLessThanOrEqual(layout.client);
    expect(layout.scroll).toBeLessThanOrEqual(layout.client);
    for(const link of await page.locator('[data-holiday-directory] .holiday-years a').all()){
      await expect(link).toBeVisible();
      expect(await link.evaluate(node=>node.getBoundingClientRect().right)).toBeLessThanOrEqual(layout.client);
    }
  }
});
