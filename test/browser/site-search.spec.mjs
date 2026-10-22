import { expect, test } from '@playwright/test';

test('leaving search cancels delayed suggestions so they cannot cover the tools menu', async ({ page }) => {
  let releaseSearch;
  const pendingSearch = new Promise(resolve => { releaseSearch = resolve; });
  await page.route('**/free/search.json', async route => { await pendingSearch; await route.continue(); });
  await page.goto('/');
  const input = page.locator('#search');
  const suggestions = page.locator('[data-search-suggestions]').first();
  await input.fill('dopust');
  await expect(suggestions).toBeVisible();
  await page.locator('[data-navigation-menu] > summary').focus();
  await expect(input).toHaveAttribute('aria-expanded', 'false');
  const response = page.waitForResponse('**/free/search.json');
  releaseSearch();
  await (await response).finished();
  // Give the delivered search response time to settle without waiting on unrelated weather requests.
  await page.waitForTimeout(150);
  await expect(suggestions).toBeHidden();
  await page.locator('[data-navigation-menu] > summary').press('Enter');
  await expect(page.locator('#site-tools-menu')).toBeVisible();
});

test('site search suggests relevant pages, handles keyboard use, and opens full results', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  const input = page.locator('#search');
  const suggestions = page.locator('[data-search-suggestions]').first();
  await input.fill('praznikii');
  await expect(suggestions).toBeVisible();
  await expect(suggestions).toContainText('Prazniki in dela prosti dnevi');
  await expect(input).toHaveAttribute('aria-controls', 'site-search-suggestions');
  await expect(suggestions.getByRole('listbox', { name: 'Predlogi iskanja' })).toBeVisible();
  await input.press('ArrowDown');
  await expect(input).toHaveAttribute('aria-activedescendant', /site-search-option-/);
  await input.press('Escape');
  await expect(suggestions).toBeHidden();
  await input.fill('x');
  await expect(suggestions).toBeVisible();
  await expect(suggestions.locator('[role="status"]')).toContainText('vsaj dve črki');
  await input.press('Escape');
  await expect(suggestions).toBeHidden();

  await input.fill('bozic');
  await page.getByRole('button', { name: 'Išči po spletnem mestu' }).click();
  await expect(page).toHaveURL(/\/isci\/\?q=bozic$/);
  await expect(page.locator('[data-search-heading]')).toContainText('bozic');
  await expect(page.locator('.search-results')).toContainText('Božič');
  await expect(page.locator('.search-summary')).toContainText('rezultatov');
});

test('search dropdown fits a narrow phone and date suggestions open the right calendar day', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await page.goto('/');

  const input = page.locator('#search');
  const suggestions = page.locator('[data-search-suggestions]').first();
  await input.fill('25. december 2027');
  await expect(suggestions).toBeVisible();
  await expect(suggestions).toContainText('25. december 2027');
  const layout = await page.evaluate(() => {
    const panel = document.querySelector('#site-search-suggestions').getBoundingClientRect();
    return { viewport: document.documentElement.clientWidth, document: document.documentElement.scrollWidth, left: panel.left, right: panel.right };
  });
  expect(layout.document, JSON.stringify(layout)).toBeLessThanOrEqual(321);
  expect(layout.left, JSON.stringify(layout)).toBeGreaterThanOrEqual(0);
  expect(layout.right, JSON.stringify(layout)).toBeLessThanOrEqual(320.5);
  await expect(suggestions.locator('a[role="option"]').first()).toHaveAttribute('href', '/?year=2027&month=12&date=2027-12-25&view=day');
  await suggestions.locator('a[role="option"]').first().click();
  await expect(page).toHaveURL(/date=2027-12-25&view=day$/);
  await expect(page.locator('#personal-planner')).toHaveAttribute('data-selected-date', '2027-12-25');
});
