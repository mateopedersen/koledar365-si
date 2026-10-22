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
      const schoolIcon = page.locator('.sp-filter-illustration').first();
      await schoolIcon.scrollIntoViewIfNeeded();
      await expect(schoolIcon).toBeVisible();
      await expect.poll(() => schoolIcon.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
      await expect(schoolIcon).toHaveAttribute('src', /\/school\/.*\.[a-f0-9]{16}\.svg$/);

      const seasonalCard = page.locator('.sp-holiday[data-break-id]').first();
      const seasonalPhoto = seasonalCard.locator('.sp-card-art img');
      const photo = await seasonalCard.evaluate(card => {
        const data = JSON.parse(card.closest('[data-school-page]').querySelector('#sp-data').textContent);
        const schoolBreak = data.breaks.find(row => row.id === card.dataset.breakId);
        return data.photos[schoolBreak.photo];
      });
      expect(photo.path).toMatch(/^\/school\/photos\/[^/]+-[a-f0-9]{8}\.jpg$/);
      expect(photo.alt.trim()).not.toBe('');
      await expect(seasonalPhoto).toHaveAttribute('src', photo.display_path || photo.path);
      if(photo.srcset) await expect(seasonalPhoto).toHaveAttribute('srcset',photo.srcset);
      await expect(seasonalPhoto).toHaveAttribute('alt', photo.alt);
      await seasonalPhoto.scrollIntoViewIfNeeded();
      await expect(seasonalPhoto).toBeVisible();
      await expect.poll(() => seasonalPhoto.evaluate(image => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0)).toBe(true);
      const photoBounds = await seasonalPhoto.boundingBox();
      expect(photoBounds.width).toBeGreaterThan(0);
      expect(photoBounds.height).toBeGreaterThan(0);

      const credit = seasonalCard.locator('.sp-photo-credit');
      await expect(credit).toBeVisible();
      const source = credit.getByRole('link', {name: `Foto: ${photo.author}`, exact: true});
      await expect(source).toBeVisible();
      await expect(source).toHaveAttribute('href', photo.source);
      if (photo.licenseUrl) {
        const license = credit.getByRole('link', {name: photo.license, exact: true});
        await expect(license).toBeVisible();
        await expect(license).toHaveAttribute('href', photo.licenseUrl);
      } else {
        await expect(credit).toContainText(photo.license);
      }
    }
  }
});
