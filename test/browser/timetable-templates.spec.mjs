import { expect, test } from '@playwright/test';

test('dated template links open the right sheet, retain the date and print only the selection', async ({ page }) => {
  await page.goto('/predloge-urnikov/');
  await page.getByRole('link', { name: 'Odpri primer šolskega urnika' }).click();
  const tool = page.locator('[data-sl-templates]');
  const school = tool.locator('[data-sl-template-sheet="school"]');
  const date = tool.getByLabel('Datum v tednu');
  await expect(tool.getByRole('radio', { name: /Šolski urnik/ })).toBeChecked();
  await expect(date).toHaveValue('2028-09-06');
  await expect(school.locator('thead th')).toHaveCount(6);
  await expect(school.locator('tbody tr')).toHaveCount(8);
  await expect(school.locator('[data-sl-template-week]')).toHaveText('4. september 2028 – 8. september 2028');

  await tool.getByRole('radio', { name: /Tedenski planer/ }).check();
  await expect(school).toBeHidden();
  const week = tool.locator('[data-sl-template-sheet="weekly"]');
  await expect(week.locator('thead th')).toHaveCount(8);
  await expect(week.locator('[data-sl-template-week]')).toHaveText('4. september 2028 – 10. september 2028');
  await page.reload();
  await expect(tool.getByRole('radio', { name: /Tedenski planer/ })).toBeChecked();
  await date.fill('2028-12-31');
  await expect(week.locator('[data-sl-template-week]')).toHaveText('25. december 2028 – 31. december 2028');
  expect(new URL(page.url()).searchParams.get('date')).toBe('2028-12-31');
  await tool.getByRole('button', { name: 'Počisti datum' }).click();
  await expect(date).toHaveValue('');
  await expect(week.locator('[data-sl-template-week]')).toHaveText('__________________');
  expect(new URL(page.url()).searchParams.has('date')).toBe(false);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','https://koledar365.si/predloge-urnikov/');

  await page.evaluate(() => { window.print = () => document.body.setAttribute('data-test-printed', 'true'); });
  await tool.getByRole('button', { name: 'Natisni ali shrani PDF' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-test-printed', 'true');
  await page.emulateMedia({ media: 'print' });
  await expect(tool.locator('[data-sl-template-sheet]:visible')).toHaveCount(1);
  await expect(tool.locator('[data-sl-template-controls]')).toBeHidden();
});

test('mobile template preview scrolls inside the page and keeps row headings visible', async ({ page }) => {
  await page.goto('/predloge-urnikov/?type=work&date=2027-01-01');
  const tool = page.locator('[data-sl-templates]');
  await expect(tool.getByRole('radio', { name: /Delovni razpored/ })).toBeChecked();
  await expect(tool.locator('[data-sl-template-sheet="work"] [data-sl-template-week]')).toHaveText('28. december 2026 – 3. januar 2027');
  for (const width of [320, 390, 620]) {
    await page.setViewportSize({ width, height: 844 });
    const result = await tool.locator('[data-sl-template-sheet="work"] .sl-template-table').evaluate(scroll => {
      scroll.scrollLeft = 0;
      const heading = scroll.querySelector('tbody th');
      const before = heading.getBoundingClientRect().left;
      scroll.scrollLeft = scroll.scrollWidth;
      return {
        innerOverflow: scroll.scrollWidth - scroll.clientWidth,
        scrolled: scroll.scrollLeft,
        headingShift: Math.abs(before - heading.getBoundingClientRect().left),
        pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    expect(result.innerOverflow).toBeGreaterThan(0);
    expect(result.scrolled).toBeGreaterThan(0);
    expect(result.headingShift).toBeLessThanOrEqual(1);
    expect(result.pageOverflow).toBeLessThanOrEqual(0);
  }
});
