import {test, expect} from '@playwright/test';

const pageFamilies = [
  '/',
  '/datumski-kalkulator/',
  '/horoskop/',
  '/horoskop/bik/',
  '/solske-pocitnice/',
];

test('branded SVG icons and real imagery stay colorful and visible in every major page family', async ({page}) => {
  for (const path of pageFamilies) {
    await page.goto(path);
    const logo = page.locator('img.brand-mark').first();
    await expect(logo).toBeVisible();
    await expect.poll(() => logo.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);

    const icon = page.locator('svg.ui-icon:visible').first();
    await expect(icon).toBeVisible();
    const localPaintDefinitions = page.locator('svg[data-k365-ui-paint-defs] defs');
    await expect(localPaintDefinitions).toHaveCount(1);
    await expect(localPaintDefinitions.locator('#k-navy')).toHaveCount(1);
    await expect(localPaintDefinitions.locator('#k-red')).toHaveCount(1);
    const iconState = await icon.evaluate(svg => {
      const use = svg.querySelector('use');
      const bounds = use?.getBBox();
      const rect = svg.getBoundingClientRect();
      return {
        href: use?.getAttribute('href'),
        xlink: use?.getAttributeNS('http://www.w3.org/1999/xlink', 'href'),
        width: rect.width,
        height: rect.height,
        paintedWidth: bounds?.width || 0,
        paintedHeight: bounds?.height || 0,
        filter: getComputedStyle(svg).filter,
      };
    });
    expect(iconState.href).toMatch(/^\/visuals\/ui-material-v3\.[a-f0-9]{16}\.svg#/);
    expect(iconState.xlink).toBe(iconState.href);
    expect(iconState.width).toBeGreaterThan(0);
    expect(iconState.height).toBeGreaterThan(0);
    expect(iconState.paintedWidth).toBeGreaterThan(0);
    expect(iconState.paintedHeight).toBeGreaterThan(0);
    if (page.viewportSize()?.width <= 700) expect(iconState.filter).toBe('none');

    const flag = page.locator('img.country-flag').first();
    if (await flag.count()) {
      await expect.poll(() => flag.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
      await expect(flag).toHaveAttribute('src', /\/visuals\/slovenia-fabric-v3\.[a-f0-9]{16}\.svg$/);
    }

    if (path === '/horoskop/' || path === '/horoskop/bik/') {
      const zodiac = page.locator('img[src*="/horoscope/art/"]').first();
      await expect.poll(() => zodiac.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
      await expect(zodiac).toHaveAttribute('src', /\/horoscope\/art\/.*\.[a-f0-9]{16}\.svg$/);
    }

    if (path === '/solske-pocitnice/') {
      const seasonalArt = page.locator('.sp-holiday .sp-card-art img').first();
      await seasonalArt.scrollIntoViewIfNeeded();
      await expect.poll(() => seasonalArt.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
      await expect(seasonalArt).toHaveAttribute('src', /\/school\/photos\/.*\.jpg$/);
      await expect(seasonalArt).not.toHaveAttribute('alt', '');
    }
  }
});
