import { test, expect } from '@playwright/test';

const pagePaths = [
  '/',
  '/koledar/2027/februar/',
  '/koledar/2027/',
  '/prazen-koledar/',
  '/prazniki/',
  '/prazniki/marijino-vnebovzetje/',
  '/solske-pocitnice/',
];

test('shared navigation and cookie bar stay inside narrow screens across page families', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });

  for (const path of pagePaths) {
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
    expect(response?.status(), path).toBe(200);

    const layout = await page.evaluate(() => {
      const nav = document.querySelector('.subnav');
      const cookie = document.querySelector('.cookie-bar');
      const bounds = (element) => {
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return { left: rect.left, right: rect.right, width: rect.width };
      };

      return {
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
        nav: nav && { ...bounds(nav), clientWidth: nav.clientWidth, scrollWidth: nav.scrollWidth },
        cookie: bounds(cookie),
      };
    });

    expect(layout.document, `${path}: ${JSON.stringify(layout)}`).toBeLessThanOrEqual(321);
    expect(layout.body, `${path}: ${JSON.stringify(layout)}`).toBeLessThanOrEqual(321);
    expect(layout.nav?.right, `${path}: ${JSON.stringify(layout)}`).toBeLessThanOrEqual(320.5);
    expect(layout.cookie?.right, `${path}: ${JSON.stringify(layout)}`).toBeLessThanOrEqual(320.5);
  }
});

test('holiday directory remains readable with a wider fallback font on a small screen', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/prazniki/', { waitUntil: 'domcontentloaded' });
  await page.addStyleTag({ content: 'main { font-family: monospace !important; }' });
  const heading = page.getByRole('heading', { level: 1 });
  await expect(heading).toHaveText('Prazniki in dela prosti dnevi.');
  const layout = await heading.evaluate(element => ({
    right: element.getBoundingClientRect().right,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(layout.document).toBeLessThanOrEqual(321);
  expect(layout.body).toBeLessThanOrEqual(321);
  expect(layout.right).toBeLessThanOrEqual(320.5);
});
