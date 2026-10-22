import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function openShift(page, path) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const response = await page.goto(path, { waitUntil: 'load' });
  expect(response.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('data-free-ready', 'true');
  const consent = page.locator('[data-consent="necessary"]');
  if (await consent.isVisible()) await consent.click();
  await expect(page.locator('.shift-workbench')).toBeVisible();
  await expect(page.locator('#planner-options [name="type"]')).toHaveValue('shift');
  return errors;
}

async function downloadText(page, button) {
  const pending = page.waitForEvent('download');
  await button.click();
  const download = await pending;
  expect(await download.failure()).toBeNull();
  return readFile(await download.path(), 'utf8');
}

test('fixed shift type initializes its preview and backup without a selector', async ({ page }) => {
  const errors = await openShift(page, '/razpored-izmen/');
  await expect(page.locator('#shift-calendar [data-date]')).toHaveCount(28);
  const backup = JSON.parse(await downloadText(page, page.locator('#planner-backup')));
  expect(backup.options.type).toBe('shift');
  expect(backup.entries).toEqual([]);
  expect(errors).toEqual([]);
});

test('shift period query preserves the fixed type and generated shifts export to JSON and ICS', async ({ page }) => {
  test.setTimeout(90000);
  const errors = await openShift(page, '/razpored-izmen/?type=annual&year=2030&month=2');
  const settings = page.locator('#planner-options');
  await expect(settings.locator('[name="year"]')).toHaveValue('2030');
  await expect(settings.locator('[name="month"]')).toHaveValue('2');
  await expect(settings.locator('[name="date"]')).toHaveValue('2030-02-01');
  const form = page.locator('.shift-workbench #shift-form');
  await form.locator('[name="from"]').fill('2030-02-01');
  await form.locator('[name="to"]').fill('2030-02-07');
  await form.locator('[name="cycle"]').fill('D,N,Prosto');
  await form.locator('[name="person"]').fill('Ana Č.');
  await form.locator('[type="submit"]').click();
  await expect(page.locator('#planner-entries .planner-entry-row')).toHaveCount(7, { timeout: 60000 });
  const backup = JSON.parse(await downloadText(page, page.locator('#planner-backup')));
  expect(backup.options).toMatchObject({ type: 'shift', year: '2030', month: '2' });
  expect(backup.entries).toHaveLength(7);
  expect(backup.entries[0]).toMatchObject({ date: '2030-02-01', person: 'Ana Č.' });
  const ics = await downloadText(page, page.locator('#planner-ics'));
  expect(ics).toContain('BEGIN:VCALENDAR');
  expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(7);
  expect(errors).toEqual([]);
});
