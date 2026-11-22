import { test, expect } from '@playwright/test';

test('lunar year covers and month links align even when one card is hovered', async ({ page }) => {
  await page.goto('/lunin-koledar/');
  const cards = page.locator('.lunar-year-card');

  const dimensions = () => cards.evaluateAll(years => years.map(card => {
    const frame = card.getBoundingClientRect();
    const box = selector => {
      const { x, y, width, height } = card.querySelector(selector).getBoundingClientRect();
      return { x: x - frame.x, y: y - frame.y, width, height };
    };
    return {
      y: frame.y,
      height: frame.height,
      cover: box('.lunar-year-art'),
      annual: box('.lunar-year-open'),
      months: [...card.querySelectorAll('.lunar-month-links a')].map(link => {
        const { width, height } = link.getBoundingClientRect();
        return { width, height, fits: link.scrollWidth <= link.clientWidth };
      })
    };
  }));
  const verticalSignature = list => list.map(({ y, cover, annual }) => ({ y: y - list[0].y, cover, annual }));

  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => document.fonts.ready);
    const layout = await dimensions();
    expect(layout).toHaveLength(4);
    for (const row of layout) {
      expect(row.annual.height).toBeGreaterThanOrEqual(44);
      expect(row.months).toHaveLength(12);
      for (const month of row.months) {
        expect(month.fits).toBe(true);
        expect(month.width).toBeCloseTo(row.months[0].width, 1);
        expect(month.height).toBeCloseTo(row.months[0].height, 1);
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);

    if (width >= 768) {
      for (const i of [0, 2]) {
        expect(layout[i].y).toBeCloseTo(layout[i + 1].y, 1);
        expect(layout[i].height).toBeCloseTo(layout[i + 1].height, 1);
        expect(layout[i].annual.y).toBeCloseTo(layout[i + 1].annual.y, 1);
      }
    }
  }

  const beforeHover = verticalSignature(await dimensions());
  await cards.last().locator('.lunar-month-links a').first().hover();
  await expect.poll(async () => verticalSignature(await dimensions())).toEqual(beforeHover);
  const hovered = await dimensions();
  expect(hovered[2].y).toBeCloseTo(hovered[3].y, 1);
  const firstLink = cards.last().locator('.lunar-month-links a').first();
  const linkTop = (await firstLink.boundingBox()).y;
  const neighborTop = (await cards.last().locator('.lunar-month-links a').nth(1).boundingBox()).y;
  expect(linkTop).toBeCloseTo(neighborTop, 1);
});
