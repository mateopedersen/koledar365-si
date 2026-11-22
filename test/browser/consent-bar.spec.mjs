import { test, expect } from '@playwright/test';

const noticeKey = 'koledar365:cookie-preferences:v1';

test('cookie consent appears without advertising before the main script loads', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(key => {
    if (sessionStorage.getItem('notice-test-reset') === 'done') return;
    localStorage.removeItem(key);
    localStorage.removeItem('k365.consent');
    sessionStorage.setItem('notice-test-reset', 'done');
  }, noticeKey);

  let release;
  const applicationMayLoad = new Promise(resolve => { release = resolve; });
  await page.route('**/assets/application-*.js', async route => {
    await applicationMayLoad;
    await route.continue();
  });

  try {
    const response = await page.goto('/prazniki/2027/', { waitUntil: 'commit' });
    expect(response?.ok()).toBe(true);
    const notice = page.locator('#storage-notice');
    await expect(notice).toBeVisible();
    await expect(notice.getByRole('link', { name: 'Politika piškotkov' })).toHaveAttribute('href', '/piskotki/');
    await expect(notice.locator('button')).toHaveCount(2);
    await expect(page.locator('[data-advertising-stage], [data-sponsored-link]')).toHaveCount(0);

    const layout = await notice.evaluate(bar => {
      const rect = bar.getBoundingClientRect();
      return { left: rect.left, right: rect.right, bottom: rect.bottom, height: rect.height, viewport: document.documentElement.clientWidth };
    });
    expect(layout.left).toBe(0);
    expect(layout.right).toBe(layout.viewport);
    expect(layout.bottom).toBe(844);
    expect(layout.height).toBeLessThanOrEqual(240);
    for (const button of await notice.getByRole('button').all()) {
      expect((await button.boundingBox()).height).toBeGreaterThanOrEqual(44);
    }

    await notice.getByRole('button', { name: 'Zapri obvestilo', exact: true }).click();
    await expect(notice).toBeHidden();
    expect(await page.evaluate(() => localStorage.getItem('k365.consent'))).toBeNull();
    const acknowledgement = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), noticeKey);
    expect(acknowledgement.expiresAt - acknowledgement.savedAt).toBe(180 * 86400000);
  } finally {
    release();
  }

  await page.reload();
  await expect(page.locator('#storage-notice')).toBeHidden();
  await expect(page.locator('script[src*="bauval"], iframe[src*="bauval"], script[src*="googletagmanager"]')).toHaveCount(0);
});

test('closing this page and allowing the city are separate actions', async ({ page }) => {
  await page.addInitScript(key => {
    localStorage.removeItem(key);
  }, noticeKey);
  await page.goto('/piskotki/');
  const notice = page.locator('#storage-notice');
  await expect(notice).toBeVisible();
  await notice.getByRole('button', { name: 'Zapri obvestilo na tej strani' }).click();
  await expect(notice).toBeHidden();
  expect(await page.evaluate(key => localStorage.getItem(key), noticeKey)).toBeNull();
  await page.reload();
  await expect(notice).toBeVisible();
  await notice.getByRole('button', { name: 'Zapri obvestilo na tej strani' }).click();

  const opener = page.locator('main [data-cookie-open]').first();
  const dialog = page.getByRole('dialog', { name: 'Pomnjenje izbranega mesta' });
  await opener.click();
  const checkbox = dialog.getByRole('checkbox', { name: 'Zapomni si izbrano mesto' });
  await expect(dialog.getByRole('checkbox')).toHaveCount(1);
  await expect(checkbox).not.toBeChecked();
  await checkbox.check();
  await dialog.getByRole('button', { name: 'Shrani izbiro' }).click();
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('k365.consent')).preferences)).toBe(true);

  await page.evaluate(() => {
    localStorage.setItem('k365.city', JSON.stringify('maribor'));
    localStorage.setItem('k365.personal.v1', JSON.stringify({ events: [], notes: { test: 'hranimo' } }));
  });
  await opener.click();
  await expect(checkbox).toBeChecked();
  await checkbox.uncheck();
  await dialog.getByRole('button', { name: 'Shrani izbiro' }).click();
  await expect(dialog).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('k365.city'))).toBeNull();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('k365.personal.v1')).notes.test)).toBe('hranimo');
});
