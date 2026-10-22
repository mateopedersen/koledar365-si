import { test, expect } from '@playwright/test';

const widths = [320, 390, 600, 768, 1024, 1280, 1440, 1920];
const paths = ['/', '/koledar/2029/februar/', '/koledar/2027/', '/kalkulator-delovnih-dni/', '/solski-koledar/', '/setveni-koledar/', '/druzinski-planer/'];

test('navigation vector assets and every referenced symbol resolve in the publication', async ({ page }) => {
  await page.goto('/');
  const refs = await page.locator('.topbar svg use, .site-navigation svg use').evaluateAll(nodes => [...new Set(nodes.map(node => node.getAttribute('href')))]);
  for (const ref of refs) {
    const [asset, symbol] = ref.split('#');
    const response = await page.request.get(asset);
    expect(response.ok(), asset).toBe(true);
    expect(await response.text(), ref).toContain(`id="${symbol}"`);
  }
  for (const image of await page.locator('.topbar img, .site-navigation img').all()) {
    await expect.poll(() => image.evaluate(el => el.complete && el.naturalWidth > 0)).toBe(true);
  }
});

test('all shared navigation controls fit without clipped links or intersecting borders', async ({ page }) => {
  test.setTimeout(60_000); // Seven complete page families and 56 viewport layouts per browser.
  for (const path of paths) {
    expect((await page.goto(path))?.status(), path).toBe(200);
    for (const width of widths) {
      await page.setViewportSize({ width, height: 1000 });
      const layout = await page.evaluate(() => {
        const boxes = [...document.querySelectorAll('.topbar > *, .site-navigation .nav-years, .site-navigation .nav-shortcut, .nav-explorer > summary')]
          .filter(el => el.getBoundingClientRect().height && getComputedStyle(el).display !== 'none')
          .map(el => {
            const r = el.getBoundingClientRect();
            return { label: el.getAttribute('aria-label') || el.innerText, left: r.left, right: r.right, top: r.top, bottom: r.bottom, client: el.clientWidth, scroll: el.scrollWidth };
          });
        const rail = document.querySelector('.subnav');
        const overflowing = document.documentElement.scrollWidth > innerWidth + 1 ? [...document.querySelectorAll('body *')].filter(el => {
          const r = el.getBoundingClientRect();
          if (!r.width || r.right <= innerWidth + 1) return false;
          for (let parent = el.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
            if (['auto', 'scroll', 'hidden', 'clip'].includes(getComputedStyle(parent).overflowX)) return false;
          }
          return true;
        }).slice(0, 20).map(el => ({ element: el.tagName + '#' + el.id + '.' + String(el.className).replaceAll(' ', '.'), right: el.getBoundingClientRect().right, text: el.innerText?.slice(0, 80) })) : [];
        return { width: innerWidth, document: document.documentElement.scrollWidth, rail: { client: rail.clientWidth, scroll: rail.scrollWidth }, boxes, overflowing };
      });
      expect(layout.document, `${path} at ${width}px: ${JSON.stringify(layout.overflowing)}`).toBeLessThanOrEqual(width + 1);
      expect(layout.rail.scroll, `navigation has no sideways scroll at ${width}px`).toBeLessThanOrEqual(layout.rail.client + 1);
      for (const box of layout.boxes) {
        expect(box.left, `${box.label} at ${width}px`).toBeGreaterThanOrEqual(-1);
        expect(box.right, `${box.label} at ${width}px`).toBeLessThanOrEqual(width + 1);
        expect(box.scroll, `${box.label} text at ${width}px`).toBeLessThanOrEqual(box.client + 1);
      }
      for (let i = 0; i < layout.boxes.length; i++) {
        for (let j = i + 1; j < layout.boxes.length; j++) {
          const a = layout.boxes[i], b = layout.boxes[j];
          const overlap = Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
          expect(overlap, `${a.label} overlaps ${b.label} at ${path}, ${width}px`).toBe(false);
        }
      }
    }
  }
});

test('homepage header uses the open desktop space for the live next-day-off shortcut', async ({ page }) => {
  await page.goto('/');
  const spotlight = page.locator('.home-header-spotlight');
  for (const width of [1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    if (width < 1400) {
      await expect(spotlight).toBeHidden();
      continue;
    }
    await expect(spotlight).toBeVisible();
    const visibleNameParts = await spotlight.locator('.home-header-spotlight__eyebrow, time, strong, small').allTextContents();
    await expect(spotlight).toHaveAccessibleName(visibleNameParts.join(' ').replace(/\s+/g, ' ').trim());
    expect((await spotlight.getAttribute('href')).startsWith('/prazniki/')).toBe(true);
    const holidayDate = await spotlight.locator('time').getAttribute('datetime');
    expect(new Date(holidayDate).toISOString().slice(0, 10)).toBe(holidayDate);
    const boxes = await page.evaluate(() => ['.topbar > .brand', '.topbar > nav', '.topbar > .home-header-spotlight', '.topbar > .search', '.topbar > .country'].map(selector => {
      const rect = document.querySelector(selector).getBoundingClientRect();
      return { selector, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
    }));
    for (let i = 0; i < boxes.length; i++) {
      expect(boxes[i].left, boxes[i].selector).toBeGreaterThanOrEqual(-1);
      expect(boxes[i].right, boxes[i].selector).toBeLessThanOrEqual(width + 1);
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j];
        const intersects = Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
        expect(intersects, `${a.selector} overlaps ${b.selector} at ${width}px`).toBe(false);
      }
    }
  }
});

test('tools disclosure supports keyboard, close button, outside clicks, scrolling and real destinations', async ({ page }) => {
  test.setTimeout(60_000); // Four viewport changes and full keyboard/pointer flows on mobile Safari.
  await page.goto('/');
  const menu = page.locator('[data-navigation-menu]');
  const trigger = menu.locator('summary');
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await trigger.focus();
    await trigger.press('Enter');
    await expect(menu).toHaveAttribute('open', '');
    await expect(menu.getByRole('link', { name: /Načrtovalnik dopusta/ })).toBeVisible();
    const panel = page.locator('#site-tools-menu');
    const box = await panel.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
    await expect.poll(async () => panel.evaluate(el => el.getBoundingClientRect().bottom)).toBeLessThanOrEqual(901);
    await trigger.press('Escape');
    await expect(menu).not.toHaveAttribute('open', '');
    await expect(trigger).toBeFocused();
    await trigger.click();
    await page.getByRole('button', { name: 'Zapri meni orodij' }).click();
    await expect(menu).not.toHaveAttribute('open', '');
    await trigger.click();
    await page.locator('#search').click();
    await expect(menu).not.toHaveAttribute('open', '');
    await expect(page.locator('#search')).toBeFocused();
  }
  await trigger.click();
  await menu.getByRole('link', { name: /Načrtovalnik dopusta/ }).click();
  await expect(page).toHaveURL(/\/nacrtovalnik-dopusta\/$/);
  await expect(page.locator('h1')).toContainText(/dopust/i);
});

test('the native tools disclosure remains usable when JavaScript is unavailable', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
  const page = await context.newPage();
  await page.goto(baseURL + '/');
  await page.locator('[data-navigation-menu] > summary').click();
  await expect(page.getByRole('link', { name: /Družinski planer/ })).toBeVisible();
  await page.getByRole('link', { name: /Družinski planer/ }).click();
  await expect(page).toHaveURL(/\/druzinski-planer\/$/);
  await context.close();
});
