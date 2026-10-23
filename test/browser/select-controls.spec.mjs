import {test,expect} from '@playwright/test';

for(const width of [320,390,768,1024,1440])test(`period labels have room beside one dropdown indicator at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});
 await page.goto('/');
 await expect(page.locator('html')).toHaveAttribute('data-free-ready','true');
 await page.evaluate(()=>document.fonts.ready);
 const year=page.locator('.period-form select[name=year]');
 await year.selectOption('2030');
 for(const select of [year,page.locator('.period-form select[name=month]')]){
  const state=await select.evaluate(el=>{
   const s=getComputedStyle(el),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
   ctx.font=`${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
   return {appearance:s.appearance,image:s.backgroundImage,repeat:s.backgroundRepeat,usable:el.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight),text:ctx.measureText(el.selectedOptions[0].textContent).width};
  });
  expect(state.appearance).toBe('none');
  expect(state.image).toContain('data:image/svg+xml');
  expect(state.repeat).toBe('no-repeat');
  expect(state.usable).toBeGreaterThanOrEqual(state.text);
 }
 // The existing city shell already supplies its own SVG; don't double its caret.
 await expect(page.locator('#city-select')).toHaveCSS('background-image','none');
 await expect(year).toHaveValue('2030');
 await year.focus();await page.keyboard.press('Tab');
 await expect(page.locator('.period-form select[name=month]')).toBeFocused();
 await page.locator('.period-form').screenshot({path:test.info().outputPath('period-controls.png')});
});
