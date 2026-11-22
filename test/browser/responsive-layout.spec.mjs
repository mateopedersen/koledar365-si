import { test, expect } from '@playwright/test';

test('holiday heading fits while its web font is unavailable', async ({ page }) => {
  await page.route('**/fonts/**', route => route.abort());
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/prazniki/');
  await expect(page.locator('#holiday-directory-title')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(321);
  expect(await page.locator('#holiday-directory-title').evaluate(el => getComputedStyle(el).whiteSpace)).toBe('normal');
});

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
    const response = await page.goto(path, { waitUntil: 'load' });
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
        bodyRight: document.body.getBoundingClientRect().right,
        nav: nav && { ...bounds(nav), clientWidth: nav.clientWidth, scrollWidth: nav.scrollWidth },
        cookie: bounds(cookie),
      };
    });

    expect(layout.document, `${path}: ${JSON.stringify(layout)}`).toBeLessThanOrEqual(321);
    expect(layout.bodyRight, `${path}: ${JSON.stringify(layout)}`).toBeLessThanOrEqual(320.5);
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

test('blog posts align their header, cover and body on one reading column', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/blog/', { waitUntil: 'domcontentloaded' });
  const paths = await page.locator('.editorial-index__cards article > a').evaluateAll(links => links.map(link => link.pathname));
  expect(paths.length).toBeGreaterThan(0);

  for (const path of paths) {
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
    expect(response?.status(), path).toBe(200);
    const layout = await page.evaluate(async () => {
      await document.fonts.ready;
      const selectors = [
        '.breadcrumb', '.editorial-article h1', '.editorial-article .editorial-lead',
        '.editorial-byline', '.editorial-cover img', '.editorial-cover figcaption',
        '.editorial-article__body section:first-child > h2', '.editorial-article__body section:first-child > p',
        '.editorial-related',
      ];
      return {
        parts: selectors.map(selector => {
          const { left, right } = document.querySelector(selector).getBoundingClientRect();
          return { selector, left, right };
        }),
        viewport: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      };
    });
    const column = layout.parts[0];
    expect(layout.scrollWidth, path).toBeLessThanOrEqual(layout.viewport + 1);
    for (const part of layout.parts) {
      const label = `${path} ${part.selector}`;
      expect(Math.abs(part.left - column.left), label).toBeLessThanOrEqual(1);
      expect(Math.abs(part.right - column.right), label).toBeLessThanOrEqual(1);
    }
  }

  const share = page.locator('.editorial-article .site-share');
  await expect(share).toHaveCSS('position', 'static');
  await share.locator('summary').click();
  await expect(share.locator('.site-share__panel')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});
