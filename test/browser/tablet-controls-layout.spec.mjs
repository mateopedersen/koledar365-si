import {test,expect} from '@playwright/test';

for(const route of ['/solske-pocitnice/','/odstevanje/']){
 test(`${route} contains complete native selectors at phone, tablet and desktop widths`,async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(route,{waitUntil:'load'});
  await expect(page.locator('html')).toHaveAttribute('data-free-ready','true');
  await page.evaluate(()=>document.fonts.ready);
  const university=page.locator('[data-university-select]');
  if(route==='/solske-pocitnice/'){
   await university.selectOption('eu');
   await expect(university).toHaveValue('eu');
  }
  for(const width of [320,360,390,768,1024,1440]){
   await page.setViewportSize({width,height:1000});
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const bounds=await page.evaluate(()=>({
    viewport:document.documentElement.clientWidth,
    document:document.documentElement.scrollWidth,
    controls:[...document.querySelectorAll('.sp-uni-select-label select,.sp-faculty-select select,.countdown-school-controls select')].filter(el=>el.getClientRects().length).map(el=>{const r=el.getBoundingClientRect();return{left:r.left,right:r.right,width:r.width}})
   }));
   expect(bounds.document,`${route} at ${width}px`).toBeLessThanOrEqual(bounds.viewport);
   expect(bounds.controls.length).toBeGreaterThan(0);
   for(const control of bounds.controls){expect(control.left).toBeGreaterThanOrEqual(0);expect(control.right).toBeLessThanOrEqual(bounds.viewport);expect(control.width).toBeGreaterThan(40);}
  }
  expect(errors).toEqual([]);
 });
}
