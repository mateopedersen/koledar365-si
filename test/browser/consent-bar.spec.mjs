import { test, expect } from '@playwright/test';

test('static sponsored ad appears before the main script and remains visible after rejecting cookies', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    if (sessionStorage.getItem('consent-test-reset') !== 'done') {
      localStorage.removeItem('k365.consent');
      localStorage.removeItem('koledar365:advertising-consent:v1');
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

  const response = await page.goto('/prazniki/2027/', { waitUntil: 'commit' });
  expect(response?.ok()).toBe(true);
  await applicationRequested;
  const ad = page.locator('[data-sponsored-link]');
  await expect(ad).toBeVisible();
  await expect(ad).toHaveAttribute('href', 'https://asiafilm.org/4/6b6aabe64d2bbfcdadd73b76443164f4');
  const consent = page.locator('.cookie-choice-banner');
  await expect(consent).toBeVisible();
  await expect(page.locator('#cookies')).toBeHidden();

  expect(applicationReleased).toBe(false);

  const layout = await consent.evaluate((bar) => ({
    height: bar.getBoundingClientRect().height,
    bottom: Math.round(innerHeight - bar.getBoundingClientRect().bottom),
    choices: [...bar.querySelectorAll('button')].map((button) => ({
      consent: button.dataset.advertisingChoice,
      height: button.getBoundingClientRect().height,
    })),
  }));
  expect(layout.height).toBeLessThanOrEqual(await page.evaluate(() => innerHeight * 0.78 + 1));
  expect(layout.bottom).toBe(8);
  expect(layout.choices).toHaveLength(3);
  expect(layout.choices.every((choice) => choice.height >= 44)).toBe(true);

  releaseApplication();
  await page.waitForLoadState('load');
  await consent.getByRole('button', { name: 'Samo nujni' }).click();
  await expect(consent).toBeHidden();
  await expect(ad).toBeVisible();
  expect(await page.locator('script[src*="bauval"],iframe[src*="bauval"]').count()).toBe(0);
  await expect(page.locator('#cookies')).toBeHidden();
  await page.reload();
  await expect(consent).toBeHidden();
  await expect(ad).toBeVisible();
  expect(await page.locator('script[src*="bauval"],iframe[src*="bauval"]').count()).toBe(0);
  await expect(page.locator('#cookies')).toBeHidden();
});
