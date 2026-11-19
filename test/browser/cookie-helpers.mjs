import {expect} from '@playwright/test';
export async function chooseNecessaryCookies(page){
 if(await page.locator('#cookie-preferences-runtime').count()){
  const banner=page.locator('.cookie-choice-banner');await expect(banner).toBeAttached();
  if(await banner.isVisible())await banner.locator('[data-cookie-choice="deny"]').click();
  await expect(banner).toBeHidden();await expect(page.locator('#cookies')).toBeHidden();
 }else{
  const legacy=page.locator('[data-consent="necessary"]');if(await legacy.isVisible())await legacy.click();
 }
}
