import { test, expect } from '@playwright/test';

test('cookie consent is visible before the main script and stays a compact bottom strip', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    if (sessionStorage.getItem('consent-test-reset') !== 'done') {
      localStorage.removeItem('k365.consent');
      sessionStorage.setItem('consent-test-reset', 'done');
    }
  });
  let releaseApplication;
  let markApplicationRequested;
  let applicationReleased = false;
  const applicationRequested = new Promise((resolve) => { markApplicationRequested = resolve; });
  const applicationMayLoad = new Promise((resolve) => { releaseApplication = resolve; });
  await page.route('**/assets/application-*.js', async (route) => {
    markApplicationRequested();
    await applicationMayLoad;
    applicationReleased = true;
    await route.continue();
  });

  await page.goto('/prazniki/2027/', { waitUntil: 'commit' });
  await applicationRequested;
  const consent = page.locator('#cookies');
  await expect(consent).toBeVisible();

  expect(applicationReleased).toBe(false);

  const layout = await consent.evaluate((bar) => ({
    height: bar.getBoundingClientRect().height,
    bottom: Math.round(innerHeight - bar.getBoundingClientRect().bottom),
    choices: [...bar.querySelectorAll('.cookie-actions button')].map((button) => ({
      consent: button.dataset.consent || 'settings',
      height: button.getBoundingClientRect().height,
    })),
  }));
  expect(layout.height).toBeLessThan(160);
  expect(layout.bottom).toBe(0);
  expect(layout.choices).toHaveLength(3);
  expect(layout.choices.every((choice) => choice.height >= 44)).toBe(true);

  releaseApplication();
  await page.waitForLoadState('load');
  await consent.getByRole('button', { name: 'Ne shrani mesta' }).click();
  await expect(consent).toBeHidden();
  await page.reload();
  await expect(consent).toBeHidden();
});
