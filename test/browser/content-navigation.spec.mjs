import {test,expect} from '@playwright/test';

test('month links survive interactive important-day filtering and fit a narrow phone',async({page})=>{
 await page.setViewportSize({width:320,height:900});
 await page.goto('/pomembni-dnevi/',{waitUntil:'domcontentloaded'});
 const links=page.getByRole('navigation',{name:'Pomembni dnevi po mesecih'});
 await expect(links.getByRole('link')).toHaveCount(12);
 await page.locator('.important-controls select[name=month]').selectOption('2');
 await page.locator('.important-controls form button').click();
 await expect(page.locator('#important-free-results')).toBeVisible();
 await expect(links.getByRole('link',{name:'Februar',exact:true})).toBeVisible();
 await links.getByRole('link',{name:'Februar',exact:true}).click();
 await expect(page).toHaveURL(/\/pomembni-dnevi\/februar\//);
 await expect(page.locator('#important-month-links')).toBeVisible();
 const state=await links.evaluate(nav=>({viewport:document.documentElement.clientWidth,right:nav.getBoundingClientRect().right,heights:[...nav.querySelectorAll('a')].map(a=>a.getBoundingClientRect().height)}));
 expect(state.right).toBeLessThanOrEqual(state.viewport);
 expect(Math.min(...state.heights)).toBeGreaterThanOrEqual(44);
});
