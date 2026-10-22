import { test, expect } from '@playwright/test';

// Keep the complete persistence/copy/keyboard flow at each group of widths.
// Each scenario retains the default 30 s limit on the slower iPhone runner.
for (const [label, widths] of [['phone', [320, 360, 390]], ['tablet and desktop', [768, 1280, 1440]]]) {
test(`weekly and period modes preserve both saved plans and copy lessons without duplicates on ${label}`, async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem('k365.consent', JSON.stringify({ version: 2, choice: 'essential', preferences: false, analytics: false, advertising: false, at: new Date().toISOString(), expiresAt: Date.now() + 86400000 }));
  });
  await page.goto('/solski-urnik/');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('[data-student-timetable]')).toBeVisible();
  await expect(page.locator('[data-school-timetable]')).toBeHidden();
  await page.locator('[data-add-lesson-open]').first().click();
  const form = page.locator('[data-lesson-form]');
  await form.locator('[name=subject]').fill('Matematika');
  await form.locator('[name=start]').fill('08:00');
  await form.locator('[name=end]').fill('08:45');
  await form.locator('[data-lesson-save]').click();
  await expect(page.locator('[data-lesson-count]')).toHaveText('1');
  const original = await page.evaluate(() => localStorage.getItem('k365.student.timetable.v1'));

  await page.getByRole('tab', { name: 'Urnik za obdobje' }).click();
  await expect(page.locator('[data-student-timetable]')).toBeHidden();
  await expect(page.locator('[data-school-timetable]')).toBeVisible();
  await page.locator('[data-copy-weekly-lessons]').click();
  await expect(page.locator('[data-tt-lesson-count]')).toHaveText('1');
  await expect(page.locator('[data-tt-lessons]')).toContainText('Matematika');
  await page.locator('[data-copy-weekly-lessons]').click();
  await expect(page.locator('[data-tt-lesson-count]')).toHaveText('1');
  await expect(page.locator('[data-timetable-mode-status]')).toContainText('Podvojenih vnosov nismo dodali');
  expect(await page.evaluate(() => localStorage.getItem('k365.student.timetable.v1'))).toBe(original);

  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    for (const name of ['Tedenski planer', 'Urnik za obdobje']) {
      await page.getByRole('tab', { name }).click();
      const size = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: document.documentElement.clientWidth }));
      expect(size.scroll, `${name} at ${width}px: ${JSON.stringify(size)}`).toBeLessThanOrEqual(size.width);
    }
  }
  await page.reload();
  await expect(page.locator('[data-school-timetable]')).toBeVisible();
  await expect(page.locator('[data-tt-lesson-count]')).toHaveText('1');
  const periodTab = page.getByRole('tab', { name: 'Urnik za obdobje' });
  await periodTab.focus();
  await periodTab.press('ArrowLeft');
  await expect(page.getByRole('tab', { name: 'Tedenski planer' })).toBeFocused();
  await expect(page.locator('[data-student-timetable]')).toBeVisible();
  await expect(page.locator('[data-lesson-count]')).toHaveText('1');
  expect(errors).toEqual([]);
});
}
