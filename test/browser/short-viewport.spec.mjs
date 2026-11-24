import { expect, test } from '@playwright/test';

async function simulateKeyboard(page, height, offsetTop = 0) {
  await page.evaluate(({ height, offsetTop }) => {
    const viewport = window.visualViewport;
    // Browser emulation has no native keyboard. Deliver the same viewport resize signal.
    Object.defineProperties(viewport, {
      height: { configurable: true, value: height },
      offsetTop: { configurable: true, value: offsetTop },
    });
    viewport.dispatchEvent(new Event('resize'));
  }, { height, offsetTop });
}

test('keyboard opening and reopening keeps the selected search suggestion visible', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  const field = page.locator('#search');
  const panel = page.locator('.topbar .site-search-suggestions');
  const options = panel.getByRole('option');
  await field.fill('prazniki');
  await expect(options).toHaveCount(7);
  await simulateKeyboard(page, 270);
  const box = await panel.boundingBox();
  expect(box.y + box.height).toBeLessThanOrEqual(263);
  expect(box.height).toBeGreaterThan(75);

  for (const option of await options.all()) {
    await field.press('ArrowDown');
    await expect(option).toHaveAttribute('aria-selected', 'true');
    const row = await option.boundingBox();
    expect(row.y).toBeGreaterThanOrEqual(box.y - 1);
    expect(row.y + row.height).toBeLessThanOrEqual(box.y + box.height + 1);
  }

  await field.press('Escape');
  await expect(panel).toBeHidden();
  await field.fill('dopust');
  await expect(options.first()).toBeVisible();
  await expect(field).not.toHaveAttribute('aria-activedescendant');
  await expect.poll(async () => (await panel.boundingBox()).height).toBeGreaterThan(75);
});

test('a low search field opens suggestions above itself when the keyboard leaves no room below', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 740 });
  await page.goto('/isci/');
  const form = page.locator('.search-page-form');
  const field = form.getByRole('combobox');
  await field.fill('prazniki');
  const panel = form.locator('.site-search-suggestions');
  await expect(panel.getByRole('option').first()).toBeVisible();
  const anchor = await form.boundingBox();
  await simulateKeyboard(page, Math.ceil(anchor.y + anchor.height + 55));
  await expect(panel).toHaveAttribute('data-search-above', '');
  expect((await panel.boundingBox()).height).toBeGreaterThan(85);
  expect(await panel.evaluate(element => element.getBoundingClientRect().bottom)).toBeLessThan(anchor.y);
  const first = panel.getByRole('option').first();
  const target = await first.getAttribute('href');
  if (await page.evaluate(() => matchMedia('(pointer: coarse)').matches)) await first.tap();
  else await first.click();
  await expect(page).toHaveURL(new URL(target, page.url()).href);
});

test('tools stay tappable in the shrunken visual viewport and the close button stays reachable', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  const trigger = page.locator('.nav-explorer > summary');
  const panel = page.locator('#site-tools-menu');
  await trigger.click();
  await panel.getByRole('searchbox').fill('kalkulator dohodnine');
  await simulateKeyboard(page, 219, 10);
  await expect(panel).toHaveClass(/nav-directory--compact/);
  await expect(panel).toHaveClass(/nav-directory--floating/);
  const close = panel.getByRole('button', { name: 'Zapri meni orodij' });
  await close.click();
  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await panel.getByRole('link', { name: /Letni izračun dohodnine/ }).click();
  await expect(page).toHaveURL(/\/kalkulator-dohodnine\/$/);
});

test('the first-visit notice and tools can both be used on a landscape phone', async ({ page }) => {
  await page.setViewportSize({ width: 568, height: 320 });
  await page.addInitScript(() => {
    localStorage.removeItem('koledar365:cookie-preferences:v1');
    localStorage.removeItem('k365.consent');
  });
  await page.goto('/');
  const notice = page.locator('#storage-notice');
  await expect(notice).toBeVisible();
  await expect(notice).toHaveCSS('position', 'relative');
  await page.locator('.nav-explorer > summary').click();
  const panel = page.locator('#site-tools-menu');
  await panel.getByRole('searchbox').fill('datumski kalkulator');
  await expect(panel.getByRole('link', { name: /Datumski kalkulator/ })).toBeVisible();
  await panel.getByRole('button', { name: 'Zapri meni orodij' }).click();
  await notice.getByRole('button', { name: 'Zapri obvestilo', exact: true }).click();
  await expect(notice).toBeHidden();
});

test('tools and empty search results stay above the first-visit notice', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('koledar365:cookie-preferences:v1');
    localStorage.removeItem('k365.consent');
  });
  const notice = page.locator('#storage-notice');
  const panel = page.locator('#site-tools-menu');
  for (const [width, height] of [[320, 568], [768, 650], [1024, 768]]) {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect(notice).toBeVisible();
    await page.locator('.nav-explorer > summary').click();
    const query = panel.getByRole('searchbox');
    await query.fill('zxq-neobstoj');
    await expect(panel.locator('[data-navigation-empty]')).toBeVisible();
    await expect(panel.getByLabel('Kategorija', { exact: true })).toBeVisible();
    await expect.poll(async () => {
      const [menuBox, noticeBox] = await Promise.all([panel.boundingBox(), notice.boundingBox()]);
      return menuBox.y + menuBox.height <= noticeBox.y + 1 && menuBox.height <= 350;
    }).toBe(true);

    await query.fill('kalkulator dohodnine');
    const result = panel.getByRole('link', { name: /Letni izračun dohodnine/ });
    await result.click();
    await expect(page).toHaveURL(/\/kalkulator-dohodnine\/$/);
  }
});

test('keyboard search options stay above the first-visit notice on a short phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.addInitScript(() => {
    localStorage.removeItem('koledar365:cookie-preferences:v1');
    localStorage.removeItem('k365.consent');
  });
  await page.goto('/isci/');
  const notice = page.locator('#storage-notice');
  await expect(notice).toBeVisible();
  const form = page.locator('.search-page-form');
  const field = form.getByRole('combobox');
  const popup = form.locator('.site-search-suggestions');
  await field.fill('prazniki');
  const options = popup.getByRole('option');
  await expect(options).toHaveCount(7);
  const [popupBox, noticeBox, fieldBox] = await Promise.all([popup.boundingBox(), notice.boundingBox(), field.boundingBox()]);
  expect(popupBox.y + popupBox.height).toBeLessThanOrEqual(noticeBox.y);
  expect(fieldBox.y + fieldBox.height).toBeLessThanOrEqual(noticeBox.y);
  for (const option of await options.all()) {
    await field.press('ArrowDown');
    await expect(option).toHaveAttribute('aria-selected', 'true');
    const box = await option.boundingBox();
    expect(box.y).toBeGreaterThanOrEqual(popupBox.y - 1);
    expect(box.y + box.height).toBeLessThanOrEqual(popupBox.y + popupBox.height + 1);
  }
});

test('the enlarged Moon and its caption fit together on a landscape phone', async ({ page }) => {
  await page.setViewportSize({ width: 568, height: 320 });
  const fullImageRequests = [];
  page.on('request', request => {
    if (request.url().endsWith('/lunar/atlas/2027-01-1.webp')) fullImageRequests.push(request.url());
  });
  await page.goto('/lunin-koledar/2027/januar/');
  const enlarge = page.locator('.lunar-enlarge');
  await enlarge.click();
  const dialog = page.locator('.lunar-dialog');
  await expect(dialog).toBeVisible();
  const clipping = await dialog.evaluate(element => {
    const frame = element.getBoundingClientRect();
    return [...element.children].filter(node => {
      const box = node.getBoundingClientRect();
      return box.right > frame.right + 1 || box.bottom > frame.bottom + 1 || box.width === 0;
    }).map(node => node.localName);
  });
  expect(clipping).toEqual([]);
  await expect(dialog.locator('[data-dialog-caption]')).toHaveCSS('color', 'rgb(238, 245, 252)');
  await expect(dialog.locator('image')).toHaveAttribute('href', '/lunar/atlas/2027-01-screen.webp');
  expect(fullImageRequests).toEqual([]);
  await dialog.getByRole('button', { name: 'Zapri' }).click();
  await expect(enlarge).toBeFocused();
});
