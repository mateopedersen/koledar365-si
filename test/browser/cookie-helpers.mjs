import { expect } from '@playwright/test';

export async function chooseNecessaryCookies(page) {
  const notice = page.locator('#storage-notice');
  await expect(notice).toBeAttached();
  if (await notice.isVisible()) await notice.locator('[data-storage-dismiss]').click();
  await expect(notice).toBeHidden();
}
