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

test('home calendar centers its heading and aligns action buttons on narrow phones', async ({ page }) => {
  for (const width of [320, 390, 600]) {
    await page.setViewportSize({ width, height: 900 });
    // January 2026 has no previous-period link. The heading must still be centered.
    await page.goto('/?year=2026&month=1');
    await expect(page.locator('html')).toHaveAttribute('data-free-ready', 'true');
    const title = page.locator('.calendar-title');
    const heading = title.getByRole('heading', { name: 'Januar 2026' });
    const today = title.getByRole('link', { name: 'Danes', exact: true });
    const addEvent = title.getByRole('link', { name: 'Dodaj dogodek' });
    const [frame, label, todayBox, addBox] = await Promise.all(
      [title, heading, today, addEvent].map(locator => locator.boundingBox()),
    );
    expect(Math.abs((label.x + label.width / 2) - (frame.x + frame.width / 2))).toBeLessThanOrEqual(1);
    expect(todayBox.y).toBeGreaterThanOrEqual(label.y + label.height);
    expect(Math.abs(todayBox.y - addBox.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(todayBox.width - addBox.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(todayBox.height - addBox.height)).toBeLessThanOrEqual(1);

    const footer = page.locator('.calendar-footer');
    const buttons = await footer.locator('div > :is(a, button)').evaluateAll(elements =>
      elements.map(element => element.getBoundingClientRect().toJSON()));
    const bounds = await footer.boundingBox();
    expect(buttons).toHaveLength(3);
    for (const box of buttons) {
      expect(box.left).toBeGreaterThanOrEqual(bounds.x - 1);
      expect(box.right).toBeLessThanOrEqual(bounds.x + bounds.width + 1);
      expect(Math.abs(box.width - buttons[0].width)).toBeLessThanOrEqual(1);
      expect(Math.abs(box.top - buttons[0].top)).toBeLessThanOrEqual(1);
    }
  }
  await page.getByRole('link', { name: 'Dodaj dogodek', exact: true }).click();
  await expect(page.locator('#event-editor')).toHaveAttribute('open', '');
});

test('important-day filters and clock-change date picker keep long selections within their panels', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  for (const [path, panel, select] of [
    ['/pomembni-dnevi/', '.important-controls .filters', '[name=category]'],
    ['/pomembni-dnevi/september/', '.important-controls .filters', '[name=category]'],
    ['/premik-ure/', '.occasion-planner__controls', '#occasion-date-select'],
  ]) {
    await page.goto(path);
    const field = page.locator(select);
    const longest = await field.evaluate(element =>
      [...element.options].reduce((a, b) => a.text.length > b.text.length ? a : b).value);
    await field.selectOption(longest);
    const layout = await page.locator(panel).evaluate(async element => {
      await document.fonts.ready;
      return { content: element.scrollWidth, width: element.clientWidth, document: document.body.scrollWidth };
    });
    expect(layout.content, path).toBeLessThanOrEqual(layout.width + 1);
    expect(layout.document, path).toBeLessThanOrEqual(321);
    await expect(field).toHaveValue(longest);
    if (path === '/premik-ure/') {
      const optionFits = await field.evaluate(element => {
        const style = getComputedStyle(element);
        const text = document.createElement('canvas').getContext('2d');
        text.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        const available = element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
        return text.measureText(element.selectedOptions[0].text).width <= available;
      });
      expect(optionFits).toBe(true);
    } else {
      const form = page.locator(panel);
      const [view, submit] = await Promise.all([
        form.locator('[name=display]').boundingBox(),
        form.getByRole('button').boundingBox(),
      ]);
      expect(Math.abs(view.y - submit.y), path).toBeLessThanOrEqual(1);
      expect(Math.abs(view.height - submit.height), path).toBeLessThanOrEqual(1);
    }
  }
});

test('the study schedule selector fits when the form column is narrow', async ({ page }) => {
  await page.goto('/studijski-nacrtovalnik/');
  const field = page.locator('[data-study-form] [name=strategy]');
  for (const width of [390, 414, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await field.selectOption('workweek');
    const layout = await field.evaluate(async element => {
      await document.fonts.ready;
      const form = element.closest('form');
      const style = getComputedStyle(element);
      const text = document.createElement('canvas').getContext('2d');
      text.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const available = element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      return {
        formWidth: form.clientWidth,
        formContent: form.scrollWidth,
        fits: text.measureText(element.selectedOptions[0].text).width <= available,
      };
    });
    expect(layout.formContent, `Study form at ${width}px`).toBeLessThanOrEqual(layout.formWidth + 1);
    expect(layout.fits, `Study schedule option at ${width}px`).toBe(true);
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
test('the school holiday calendar keeps Sunday and both month arrows inside its card', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/solske-pocitnice/');
  const card = page.locator('.sp-calendar-layout');
  const next = card.getByRole('button', { name: 'Naslednji mesec' });
  const before = await card.locator('[data-month-title]').innerText();
  await next.click();
  await expect(card.locator('[data-month-title]')).not.toHaveText(before);
  for (const width of [320, 390, 480, 768]) {
    await page.setViewportSize({ width, height: 900 });
    const layout = await card.evaluate(element => {
      const frame = element.getBoundingClientRect();
      const selectors = '[data-prev-month], [data-next-month], .sp-calendar-days > *';
      return [...element.querySelectorAll(selectors)].every(node => {
        const rect = node.getBoundingClientRect();
        return rect.left >= frame.left && rect.right <= frame.right;
      });
    });
    expect(layout, width + 'px').toBe(true);
  }
});

test('the working-days description and methodology link align on narrow screens', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/delovni-dnevi/');
  const heading = page.locator('.workdays-section-heading');
  const text = await heading.locator(':scope > div').boundingBox();
  const link = await heading.getByRole('link', { name: 'Kako štejemo dneve' }).boundingBox();
  expect(link.y).toBeGreaterThanOrEqual(text.y + text.height);
  expect(Math.abs(link.x - text.x)).toBeLessThan(1);
});
test('adjacent action buttons share both edges when a phone wraps the longer label', async ({ page }) => {
  const rows = [
    ['/mesecni-koledar/', '.calendar-experience__download-actions > button'],
    ['/prazniki/2027/', '.holiday-list-actions > button'],
    ['/matura/2027/', '.ed-export-bar > div:first-child > button'],
    ['/zasebnost/', '.privacy-hero__actions > .privacy-action'],
  ];

  for (const [route, selector] of rows) {
    await page.goto(route);
    await page.evaluate(() => document.fonts.ready);
    const actions = page.locator(selector);
    await expect(actions).toHaveCount(2);

    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 900 });
      const [first, second] = await actions.evaluateAll(elements => elements.map(element => {
        const { top, bottom, width, left, right } = element.getBoundingClientRect();
        return { top, bottom, width, left, right };
      }));
      expect(first.right, route).toBeLessThanOrEqual(second.left);
      expect(Math.abs(first.top - second.top), route).toBeLessThanOrEqual(1);
      expect(Math.abs(first.bottom - second.bottom), route).toBeLessThanOrEqual(1);
      expect(Math.abs(first.width - second.width), route).toBeLessThanOrEqual(1);
    }
  }
});
