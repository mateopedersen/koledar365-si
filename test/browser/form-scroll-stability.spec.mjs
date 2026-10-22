import {test,expect} from '@playwright/test';

async function ready(page,path){
  await page.setViewportSize({width:390,height:844});
  await page.goto(path);
  const consent=page.locator('[data-consent="necessary"]');if(await consent.isVisible())await consent.click();
  await expect(page.locator('html')).toHaveAttribute('data-free-ready','true');
  await expect(page.locator('html')).toHaveCSS('scroll-behavior','auto');
}

async function stableFocus(page,field,button){
  await field.focus();
  await button.scrollIntoViewIfNeeded();
  const positions=await button.evaluate(async element=>{
    const positions=[];
    for(let index=0;index<8;index++){
      positions.push({scrollY:window.scrollY,top:element.getBoundingClientRect().top});
      await new Promise(requestAnimationFrame);
    }
    return positions;
  });
  for(const key of ['scrollY','top']){
    const values=positions.map(row=>row[key]);
    expect(Math.max(...values)-Math.min(...values),`Submit target moved while focus settled: ${JSON.stringify(positions)}`).toBeLessThanOrEqual(1);
  }
}

test('weekly lesson save stays under the pointer after focusing a time field',async({page})=>{
  await ready(page,'/solski-urnik/');
  await page.locator('[data-add-lesson-open]').first().click();
  const form=page.locator('[data-lesson-form]'),save=form.locator('[data-lesson-save]');
  await form.locator('[name="subject"]').fill('Matematika');
  await form.locator('[name="day"]').selectOption('1');
  await form.locator('[name="start"]').fill('08:00');
  await form.locator('[name="end"]').fill('08:45');
  await stableFocus(page,form.locator('[name="end"]'),save);
  await save.click();
  await expect(page.locator('[data-lesson-id]')).toHaveCount(1);
  await expect(page.locator('[data-lesson-id]')).toContainText('Matematika');
});

test('workday calculation stays under the pointer after focusing a date field',async({page})=>{
  test.setTimeout(90000);
  await ready(page,'/kalkulator-delovnih-dni/');
  const form=page.locator('[data-wdc-form="range"]'),save=form.locator('[type="submit"]');
  await form.locator('[name="from"]').fill('2027-04-26');
  await form.locator('[name="to"]').fill('2027-04-27');
  await stableFocus(page,form.locator('[name="to"]'),save);
  await save.click();
  await page.locator('[data-wdc-result]:not([aria-busy])').waitFor();
  await expect(page.locator('[data-wdc-primary]')).toHaveText('1');
  await expect(page.locator('[data-wdc-stat="hours"]')).toHaveText('8 ur');
  await expect(page.locator('[data-wdc-stat="holidays"]')).toHaveText('1');
  await expect(page.locator('[data-wdc-status]')).toHaveText('Izračun je pripravljen.');
});
