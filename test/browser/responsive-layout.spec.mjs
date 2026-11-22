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
  await page.addInitScript(() => localStorage.removeItem('koledar365:cookie-preferences:v1'));

  for (const path of pagePaths) {
    const response = await page.goto(path, { waitUntil: 'load' });
    expect(response?.status(), path).toBe(200);

    const layout = await page.evaluate(() => {
      const nav = document.querySelector('.subnav');
      const cookie = document.getElementById('storage-notice');
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

test('narrow payment shortcuts and month chips contain their full labels', async ({ page }) => {
  for (const [path, width, selector] of [
    ['/izplacila-pokojnin/', 320, '.payment-nav a'],
    ['/izplacila-socialnih-transferjev/', 320, '.payment-nav a'],
    ['/mesecni-koledar/', 320, '.calendar-experience__months strong'],
    ['/mesecni-koledar/', 768, '.calendar-experience__months small'],
  ]) {
    await page.setViewportSize({ width, height: 850 });
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    const clips = await page.locator(selector).evaluateAll(nodes => nodes.flatMap(node => {
      const box = node.getBoundingClientRect();
      const contents = document.createRange();
      contents.selectNodeContents(node);
      const label = contents.getBoundingClientRect();
      return label.right > box.right + 1 || label.left < box.left - 1 ? [node.textContent] : [];
    }));
    expect(clips, path + ' at ' + width).toEqual([]);
  }
});

test('sharing stays below the page controls on phones', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 850 });
  await page.goto('/soncni-vzhod-in-zahod/');
  const share = page.locator('body > .site-share');
  await expect(share).toHaveCSS('position', 'static');
  await share.getByText('Deli stran', { exact: true }).click();
  await expect(share.getByText('Kopiraj povezavo')).toBeVisible();
  const [panel, main] = await Promise.all([
    share.locator('.site-share__panel').boundingBox(),
    page.locator('main').boundingBox(),
  ]);
  expect(panel.x).toBeGreaterThanOrEqual(0);
  expect(panel.x + panel.width).toBeLessThanOrEqual(320);
  expect(panel.y).toBeGreaterThanOrEqual(main.y + main.height);
});

test('filled workday and astronomy actions retain contrast on hover', async ({ page }) => {
  test.skip(!await page.evaluate(() => matchMedia('(hover: hover)').matches), 'Desktop hover state');
  for (const [path, selector] of [
    ['/kalkulator-delovnih-dni/', '[data-wdc-form="range"] .wdc-submit'],
    ['/lunin-mrk/', '.astro-toolbar .astro-button'],
    ['/o-nas/', '.about-hero__actions .primary'],
  ]) {
    await page.goto(path);
    const action = page.locator(selector).first();
    await action.hover();
    await expect.poll(() => action.evaluate(element => {
      const css = getComputedStyle(element);
      const luminance = color => color.match(/\d+(?:\.\d+)?/g).slice(0, 3)
        .map(Number).map(channel => channel / 255)
        .map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
        .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
      const colors = [css.color, css.backgroundColor].map(luminance).sort((a, b) => b - a);
      return (colors[0] + 0.05) / (colors[1] + 0.05);
    }), { message: path }).toBeGreaterThanOrEqual(4.5);
  }
});
