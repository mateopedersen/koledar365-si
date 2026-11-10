import {test,expect} from '@playwright/test';

for(const width of [390,850,851,900,1440,1920])test(`studio tool names stay inside their clickable tabs at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:1100});
 await page.goto('/ustvari-koledar/');
 await page.evaluate(()=>document.fonts.ready);
 const tabs=page.locator('.studio-rail > button');
 await expect(tabs).toHaveCount(6);
 for(const tab of await tabs.all()){
  await tab.scrollIntoViewIfNeeded();
  const bounds=await tab.evaluate(button=>{
   const label=button.lastElementChild,b=button.getBoundingClientRect(),r=label.getBoundingClientRect();
   return {left:r.left-b.left,right:b.right-r.right,top:r.top-b.top,bottom:b.bottom-r.bottom,height:b.height,text:label.textContent.trim()};
  });
  expect(bounds.left,bounds.text).toBeGreaterThanOrEqual(-.5);
  expect(bounds.right,bounds.text).toBeGreaterThanOrEqual(-.5);
  expect(bounds.top,bounds.text).toBeGreaterThanOrEqual(-.5);
  expect(bounds.bottom,bounds.text).toBeGreaterThanOrEqual(-.5);
  expect(bounds.height).toBeGreaterThanOrEqual(44);
  await tab.click();
  await expect(tab).toHaveAttribute('aria-selected','true');
  const panel=page.locator('#'+await tab.getAttribute('aria-controls'));
  await expect(panel).toBeVisible();
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
});

for(const width of [820,1440])test(`studio paper keeps its dimensions while the editor initializes at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:1180});
 await page.addInitScript(()=>localStorage.setItem('k365.consent',JSON.stringify({version:2,expiresAt:Date.now()+86400000,preferences:false})));
 let release;const gate=new Promise(resolve=>release=resolve);
 await page.route('**/studio/studio.mjs*',async route=>{await gate;await route.continue();});
 await page.goto('/ustvari-koledar/',{waitUntil:'commit'});
 const paper=page.locator('#studio-paper');await expect(paper).toBeVisible();
 // WebKit resolves fonts.ready after load; the deliberately paused module blocks load.
 const before=await paper.boundingBox();
 release();await expect(page.locator('#studio-paper svg')).toBeVisible();
 await page.evaluate(()=>document.fonts.ready);
 await expect(page.locator('#studio-presets button').first()).toBeVisible();
 const after=await paper.boundingBox();
 expect(Math.abs(before.width-after.width)).toBeLessThanOrEqual(1.1);
 expect(Math.abs(before.height-after.height)).toBeLessThanOrEqual(1.1);
 await page.locator('#studio-zoom').selectOption('1.25');
 await expect.poll(async()=>(await paper.boundingBox()).width).toBeGreaterThan(after.width);
 await page.locator('#studio-fit').click();
 await expect.poll(async()=>(await paper.boundingBox()).width).toBeCloseTo(after.width,0);
});
