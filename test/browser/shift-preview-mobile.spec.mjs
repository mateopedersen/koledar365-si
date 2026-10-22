import {test,expect} from '@playwright/test';
test('shift status and four statistics fit without clipping at accessible phone text sizes',async({page})=>{
 await page.goto('/razpored-izmen/',{waitUntil:'load'});
 for(const width of [320,360,390,650,768]){
  await page.setViewportSize({width,height:1000});
  for(const forced of [false,true]){
   if(forced)await page.addStyleTag({content:'.shift-preview__badge,.shift-stats small{font-size:16px!important}.shift-stats strong{font-size:22px!important}'});
   const bounds=await page.locator('.shift-preview').evaluate(el=>{
    const r=el.getBoundingClientRect();
    return{left:r.left,right:r.right,children:[...el.querySelectorAll('.shift-preview__top *,.shift-stats *')].map(n=>{const b=n.getBoundingClientRect();return{left:b.left,right:b.right,width:b.width}})};
   });
   expect(bounds.right).toBeLessThanOrEqual(width);
   for(const child of bounds.children.filter(n=>n.width)){
    expect(child.left).toBeGreaterThanOrEqual(bounds.left);
    expect(child.right).toBeLessThanOrEqual(bounds.right);
   }
  }
 }
});
