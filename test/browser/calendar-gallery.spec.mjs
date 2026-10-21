import { expect, test } from '@playwright/test';

const galleryPages = [
  { path: '/koledar-za-tiskanje/', card: '.design-card', heading: '.design-card h3' },
  { path: '/koledar/2027/januar/', card: '.calendar-design-card', heading: '.calendar-design-info h3' },
];

for (const gallery of galleryPages) {
  test(`${gallery.path} has distinct, readable download controls at mobile and desktop sizes`, async ({ page }) => {
    const iconFailures = [];
    const iconHttpErrors = [];
    page.on('requestfailed', (request) => {
      if (request.url().includes('/visuals/download-')) iconFailures.push(request.url());
    });
    page.on('response', (response) => {
      if (response.url().includes('/visuals/download-') && response.status() >= 400) {
        iconHttpErrors.push(`${response.status()} ${response.url()}`);
      }
    });

    const response = await page.goto(gallery.path);
    expect(response?.status()).toBe(200);
    const cards = page.locator(gallery.card);
    await expect(cards).toHaveCount(15);
    const first = cards.first();
    await expect(cards.locator('.design-number')).toHaveCount(15);
    await expect(cards.locator('.design-title')).toHaveCount(15);
    await expect(cards.locator('.calendar-download-action')).toHaveCount(30);
    await expect(cards.locator('.calendar-download-action--pdf img')).toHaveCount(15);
    await expect(cards.locator('.calendar-download-action--webp img')).toHaveCount(15);
    const heading = first.locator(gallery.heading);
    await expect(heading.locator('.design-number')).toHaveText('01');
    await expect(heading.locator('.design-title')).toHaveText(/.+/);

    const actions = first.locator('.calendar-download-action');
    await expect(actions).toHaveCount(2);
    await expect(actions.nth(0).locator('strong')).toHaveText('PDF');
    await expect(actions.nth(0).locator('small')).toHaveText('Prenesi');
    await expect(actions.nth(1).locator('strong')).toHaveText(/WebP/);
    await expect(actions.nth(1).locator('small')).toHaveText('Prenesi');
    await expect(actions.nth(0).locator('img')).toHaveAttribute('src', '/visuals/download-pdf-v1.svg');
    await expect(actions.nth(1).locator('img')).toHaveAttribute('src', '/visuals/download-webp-v1.svg');
    await expect(actions.nth(0)).toHaveAttribute('data-format', 'pdf');
    await expect(actions.nth(1)).toHaveAttribute('data-format', 'webp');

    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      const layout = await page.evaluate((cardSelector) => {
        const cards = [...document.querySelectorAll(cardSelector)];
        const titleRows = cards.map((card) => {
          const title = card.querySelector('h3 .design-title').getBoundingClientRect();
          const number = card.querySelector('h3 .design-number').getBoundingClientRect();
          return { titleLeft: title.left, titleRight: title.right, numberRight: number.right };
        });
        const buttons = cards.flatMap((card) => [...card.querySelectorAll('.calendar-download-action')]);
        const buttonRows = buttons.map((button) => {
          const style = getComputedStyle(button);
          const icon = button.querySelector('img').getBoundingClientRect();
          return {
            width: button.getBoundingClientRect().width,
            height: button.getBoundingClientRect().height,
            background: style.backgroundImage,
            borderWidth: style.borderTopWidth,
            borderColor: style.borderTopColor,
            textColor: style.color,
            iconWidth: icon.width,
            iconHeight: icon.height,
          };
        });
        return {
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          titleRows,
          buttonRows,
        };
      }, gallery.card);
      expect(layout.scrollWidth, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(layout.clientWidth);
      for (const [index, title] of layout.titleRows.entries()) {
        expect(title.titleLeft, `card ${index + 1}: number/title collision at ${width}px`).toBeGreaterThan(title.numberRight);
      }
      for (const [index, button] of layout.buttonRows.entries()) {
        expect(button.width, `button ${index + 1} too narrow at ${width}px`).toBeGreaterThan(56);
        expect(button.height, `button ${index + 1} too short at ${width}px`).toBeGreaterThanOrEqual(48);
        expect(button.background, `button ${index + 1} has no visible background`).not.toBe('none');
        expect(parseFloat(button.borderWidth), `button ${index + 1} border too thin`).toBeGreaterThanOrEqual(2);
        expect(button.borderColor, `button ${index + 1} has no visible outline`).not.toBe('rgb(218, 230, 242)');
        expect(button.textColor).not.toBe('rgb(16, 39, 75)');
        expect(button.iconWidth, `button ${index + 1} icon stretched at ${width}px`).toBeLessThanOrEqual(26);
        expect(button.iconHeight, `button ${index + 1} icon stretched at ${width}px`).toBeLessThanOrEqual(26);
      }
    }

    await expect(actions.nth(0).locator('img')).toHaveJSProperty('naturalWidth', 40);
    await expect(actions.nth(1).locator('img')).toHaveJSProperty('naturalWidth', 40);
    expect(iconFailures).toEqual([]);
    expect(iconHttpErrors).toEqual([]);
  });
}
