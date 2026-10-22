import { test, expect } from '@playwright/test';

test('student planner WebP export produces an image in browsers without native Map.getOrInsertComputed', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'The full 600 ppi export is covered once in Chromium; Safari and mobile exercise the surrounding planner flows.');
  test.setTimeout(150000);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(() => {
    delete Map.prototype.getOrInsertComputed;
    localStorage.setItem('k365.consent', JSON.stringify({
      version: 2, choice: 'essential', preferences: false, analytics: false,
      advertising: false, at: new Date().toISOString(), expiresAt: Date.now() + 86400000,
    }));
  });

  const response = await page.goto('/solski-urnik/', { waitUntil: 'load' });
  expect(response?.status()).toBe(200);
  await expect(page.locator('#design-gallery .design-card')).toHaveCount(15);
  expect(await page.evaluate(() => typeof Map.prototype.getOrInsertComputed)).toBe('function');

  const card = page.locator('#design-gallery .design-card').first();
  await card.locator('[data-export][data-format="webp"]').click();
  await expect(card.locator('.export-status')).toContainText('Datoteka je pripravljena', { timeout: 120000 });

  const downloadPromise = page.waitForEvent('download');
  await card.locator('.export-status a').click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const bytes = Buffer.concat(chunks);
  expect(bytes.length).toBeGreaterThan(32);
  expect(bytes.subarray(0, 4).toString()).toBe('RIFF');
  expect(bytes.subarray(8, 12).toString()).toBe('WEBP');
});
