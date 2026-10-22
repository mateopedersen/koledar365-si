import {test,expect} from '@playwright/test';

test('one complete, crisp brand appears identically in the header and footer across page families',async({page})=>{
 test.setTimeout(120000);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 const routes=['/','/koledar/2030/','/koledar/2028/februar/','/setveni-koledar/','/ustvari-koledar/','/premik-ure/','/prestopno-leto/','/solski-koledar/','/fotografije-in-licence/'];
 for(const route of routes){
  await page.goto(route,{waitUntil:'load'});
  await page.evaluate(()=>document.fonts.ready);
  for(const width of [320,390,768,1440]){
   await page.setViewportSize({width,height:1000});
   const brands=page.locator('header .brand-lockup,footer .brand-lockup');
   await expect(brands).toHaveCount(2);
   const states=await brands.evaluateAll(nodes=>nodes.map(el=>{
    const image=el.querySelector('.brand-mark'),name=el.querySelector('.brand-name');
    const r=el.getBoundingClientRect(),im=image.getBoundingClientRect(),n=name.getBoundingClientRect(),style=getComputedStyle(el);
    return {src:image.getAttribute('src'),loaded:image.complete&&image.naturalWidth>0,html:el.innerHTML,label:el.getAttribute('aria-label'),href:el.getAttribute('href'),font:style.fontSize,color:getComputedStyle(name).color,opacity:getComputedStyle(image).opacity,width:im.width,height:im.height,left:r.left,right:r.right,nameRight:n.right,bottom:r.bottom,nameBottom:n.bottom};
   }));
   expect(states[0].html).toBe(states[1].html);
   expect(states[0].font).toBe(states[1].font);
   for(const state of states){
    expect(state.src).toMatch(/^\/visuals\/brand-calendar-v3\.[a-f0-9]{16}\.svg$/);
    expect(state.loaded).toBe(true);expect(state.opacity).toBe('1');
    expect(state.href).toBe('/');expect(state.label).toBe('Koledar365 – domov');
    expect(state.width).toBeGreaterThanOrEqual(46);expect(state.height).toBe(state.width);
    expect(state.left).toBeGreaterThanOrEqual(0);expect(state.right).toBeLessThanOrEqual(width);
    expect(state.nameRight).toBeLessThanOrEqual(state.right+1);expect(state.nameBottom).toBeLessThanOrEqual(state.bottom+1);
   }
   expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
 }
 expect(errors).toEqual([]);
});
