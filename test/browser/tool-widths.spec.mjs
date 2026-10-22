import { test, expect } from '@playwright/test';
for (const path of ['/mesecni-koledar/', '/tedenski-koledar/', '/setveni-koledar/', '/ustvari-koledar/']) {
  test(`${path} keeps all tool controls within six phone, tablet and desktop widths`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'load' });
    const consent = page.locator('[data-consent="necessary"]');
    if (await consent.isVisible()) await consent.click();
    for (const width of [320, 360, 390, 768, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const size = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: document.documentElement.clientWidth }));
      expect(size.scroll, `${path} at ${width}px`).toBeLessThanOrEqual(size.width);
    }
  });
}
