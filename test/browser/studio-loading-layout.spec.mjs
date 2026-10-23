import {test,expect} from '@playwright/test';

for(const width of [820,1440])test(`studio paper keeps its dimensions while the editor initializes at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:1180});
 await page.addInitScript(()=>localStorage.setItem('k365.consent',JSON.stringify({version:2,expiresAt:Date.now()+86400000,preferences:false})));
 let release;const gate=new Promise(resolve=>release=resolve);
 await page.route('**/studio/studio.mjs*',async route=>{await gate;await route.continue();});
 await page.goto('/ustvari-koledar/',{waitUntil:'commit'});
 const paper=page.locator('#studio-paper');await expect(paper).toBeVisible();
 await page.evaluate(()=>document.fonts.ready);
 const before=await paper.boundingBox();
 release();await expect(page.locator('#studio-paper svg')).toBeVisible();
 await expect(page.locator('#studio-presets button').first()).toBeVisible();
 const after=await paper.boundingBox();
 expect(Math.abs(before.width-after.width)).toBeLessThanOrEqual(1.1);
 expect(Math.abs(before.height-after.height)).toBeLessThanOrEqual(1.1);
 await page.locator('#studio-zoom').selectOption('1.25');
 await expect.poll(async()=>(await paper.boundingBox()).width).toBeGreaterThan(after.width);
 await page.locator('#studio-fit').click();
 await expect.poll(async()=>(await paper.boundingBox()).width).toBeCloseTo(after.width,0);
});
