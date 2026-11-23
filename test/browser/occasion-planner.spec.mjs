import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('selected holiday date opens the correct Google event and preserves the date and reminder for each calendar', async ({ page }) => {
  await page.goto('/prazniki/dan-drzavnosti/?datum=2028-06-25#dodaj-v-koledar');
  const planner = page.locator('[data-occasion-planner]');
  await expect(planner.locator('[data-occasion-date]')).toHaveAttribute('datetime', '2028-06-25');
  await planner.getByLabel('Opomnik').selectOption('evening');

  const google = new URL(await planner.locator('[data-occasion-google]').getAttribute('href'));
  expect(google.hostname).toBe('calendar.google.com');
  expect(google.searchParams.get('dates')).toBe('20280625/20280626');
  expect(google.searchParams.get('details')).toContain('?datum=2028-06-25#dodaj-v-koledar');

  await expect(planner.locator('[data-occasion-google] img')).toHaveAttribute('src', /google-calendar[.-]/);
  for (const [name, logo] of [['Apple Calendar', /apple[.-]/], ['Microsoft Outlook', /microsoft-outlook[.-]/]]) {
    const link = planner.getByRole('link', { name: `${name} Prenesi datoteko ICS`, exact: true });
    await expect(link.locator('img')).toHaveAttribute('src', logo);
    const downloadPromise = page.waitForEvent('download');
    await link.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('koledar365-dan-drzavnosti-2028-06-25.ics');
    const ics = await readFile(await download.path(), 'utf8');
    expect(ics).toContain('DTSTART;VALUE=DATE:20280625\r\nDTEND;VALUE=DATE:20280626');
    expect(ics).toContain('TRIGGER;VALUE=DATE-TIME:20280624T190000Z');
  }

  const add = planner.getByRole('button', { name: /Moj Koledar365/ });
  await expect(add.locator('img')).toHaveAttribute('src', /brand-calendar-v3[.-]/);
  await add.click();
  await expect(planner.locator('[data-occasion-message]')).toContainText('shranjen');
  await add.click();
  await expect(planner.locator('[data-occasion-message]')).toContainText('že');
  const book = await page.evaluate(() => JSON.parse(localStorage.getItem('k365.personal.v1')));
  expect(book.events).toHaveLength(1);
  expect(book.events[0]).toMatchObject({ date: '2028-06-25', reminder_at: '2028-06-24T19:00:00.000Z' });

  await planner.getByRole('link', { name: /Odpri moj koledar/ }).click();
  await expect(page.locator('#personal-events')).toContainText(/dan državnosti/i);
  await expect(page.locator('#personal-events .personal-reminder')).toContainText('21');
});

test('festivals use published date ranges and keep sharing available for pending dates', async ({ page }) => {
  await page.goto('/festivali/kurentovanje/');
  const planner = page.locator('[data-occasion-planner]');
  await expect(planner.locator('[data-occasion-date]')).toHaveAttribute('datetime', '2027-02-03');
  const google = new URL(await planner.locator('[data-occasion-google]').getAttribute('href'));
  expect(google.searchParams.get('dates')).toBe('20270203/20270210');

  await planner.getByRole('button', { name: /Moj Koledar365/ }).click();
  await expect(planner.locator('[data-occasion-message]')).toContainText('shranjen');
  await page.goto('/?year=2027&month=2&date=2027-02-09&view=day');
  await expect(page.locator('#personal-events')).toContainText(/kurentovanje/i);

  await page.goto('/festivali/pikin-festival/');
  await expect(planner.getByText(/Organizator še ni objavil novega termina/)).toBeVisible();
  await expect(planner.locator('[data-occasion-google]')).toHaveCount(0);
  await expect(planner.getByRole('button', { name: 'Kopiraj povezavo' })).toBeVisible();
  await expect(planner.getByRole('link', { name: 'Pošlji po e-pošti' })).toHaveAttribute('href', /pikin-festival/);
});
