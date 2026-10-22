import {test,expect} from '@playwright/test';

test('workday calculation survives a trapped Ruby VM and uses a fresh real engine',async({page})=>{
 test.setTimeout(120000);
 let workers=0;
 await page.route('**/free/ruby-worker.js',async route=>{
  const response=await route.fetch(),source=await response.text();
  workers++;
  // Fail at the same initialization boundary seen in iPhone CI. The second
  // worker runs the unchanged real Ruby VM and actual application calculation.
  const body=workers===1?source.replace("vm.eval('require \"/app/boot\"')","(()=>{throw new WebAssembly.RuntimeError('injected initialization trap')})()"):source;
  if(workers===1)expect(body).not.toBe(source);
  await route.fulfill({response,body});
 });
 await page.goto('/kalkulator-delovnih-dni/');
 const consent=page.locator('[data-consent="necessary"]');if(await consent.isVisible())await consent.click();
 await expect(page.locator('html')).toHaveAttribute('data-free-ready','true');
 const form=page.locator('[data-wdc-form="range"]');
 await form.locator('[name="from"]').fill('2027-04-26');
 await form.locator('[name="to"]').fill('2027-04-27');
 await form.locator('[type="submit"]').click();
 await expect(page.locator('[data-wdc-primary]')).toHaveText('1',{timeout:90000});
 await expect(page.locator('[data-wdc-stat="hours"]')).toHaveText('8 ur');
 await expect(page.locator('[data-wdc-stat="holidays"]')).toHaveText('1');
 await expect(page.locator('[data-wdc-status]')).toHaveText('Izračun je pripravljen.');
 expect(workers).toBe(2);
 // The replacement remains usable for subsequent calculations.
 await form.locator('[name="to"]').fill('2027-04-28');
 await form.locator('[type="submit"]').click();
 await expect(page.locator('[data-wdc-primary]')).toHaveText('2');
 expect(workers).toBe(2);
});
