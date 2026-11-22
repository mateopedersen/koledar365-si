import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('switches school paths, exports the shown dates and saves an application reminder', async ({ page }) => {
  await page.goto('/vpisni-koledar/');
  const path = page.getByRole('navigation', { name: 'Raven izobraževanja' });
  const deadlines = page.locator('#vpis-visja');

  await expect(path.getByRole('link', { name: /Srednje šole/ })).toHaveAttribute('aria-current', 'true');
  await path.getByRole('link', { name: /Višje strokovne šole/ }).click();
  await expect(deadlines).toBeVisible();
  await expect(page.locator('#vpis-srednja')).toBeHidden();
  await expect(page).toHaveURL(/#vpis-visja$/);

  await deadlines.getByLabel('Faza vpisa').selectOption('prijava');
  await expect(deadlines.locator('[data-tool-row]:visible')).toHaveCount(2);

  const filePromise = page.waitForEvent('download');
  await deadlines.getByRole('button', { name: 'Prenesi roke (.ics)' }).click();
  const calendar = await readFile(await (await filePromise).path(), 'utf8');
  expect(calendar).toContain('DTSTART;VALUE=DATE:20270218');
  expect(calendar).toContain('DTEND;VALUE=DATE:20270319');
  expect(calendar).not.toContain('Rezultati prvega roka');

  await deadlines.getByRole('button', { name: 'Opomnik za Prvi prijavni rok' }).click();
  const plan = page.locator('#moji-opomniki');
  await expect(plan.getByLabel('Ime ali opravilo')).toHaveValue('Prvi prijavni rok');
  await expect(plan.getByLabel('Datum')).toHaveValue('2027-03-18');
  await plan.getByRole('button', { name: 'Dodaj', exact: true }).click();
  await expect(plan.getByRole('checkbox', { name: 'Prvi prijavni rok' })).toBeVisible();
  await page.reload();
  await expect(deadlines).toBeVisible();
  await expect(plan.getByRole('checkbox', { name: 'Prvi prijavni rok' })).toBeVisible();

  await path.getByRole('link', { name: /Visokošolski študij/ }).click();
  const university = page.locator('#vpis-fakulteta');
  await expect(university.locator('[data-admission-pending]')).toBeVisible();
  await expect(university.getByRole('link', { name: 'Odpri portal eVŠ' })).toHaveAttribute('href', 'https://portal.evs.gov.si/prijava/');
  await expect(university.getByRole('button', { name: 'Prenesi roke (.ics)' })).toHaveCount(0);
});

test('published admission paths and their official links work without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto('/vpisni-koledar/#vpis-visja');
  await expect(page.locator('#vpis-visja')).toBeVisible();
  await expect(page.locator('#vpis-visja').getByRole('link', { name: 'Odpri prijavo za višje šole v eVŠ' })).toHaveAttribute('href', 'https://portal.evs.gov.si/prijava/visjesole');
  await expect(page.locator('#vpis-srednja [data-tool-row][data-date="2027-04-05"]')).toBeVisible();
  await context.close();
});
