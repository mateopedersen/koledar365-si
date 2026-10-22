import { test, expect } from '@playwright/test';

async function quietConsent(page, withLegacyEntry = false) {
  await page.addInitScript(({ withLegacyEntry }) => {
    localStorage.setItem('k365.consent', JSON.stringify({
      version: 2, choice: 'essential', preferences: false, analytics: false,
      advertising: false, at: new Date().toISOString(), expiresAt: Date.now() + 86400000,
    }));
    if (withLegacyEntry && !localStorage.getItem('student-timetable-test-fixture')) {
      localStorage.setItem('k365.entries./solski-urnik/', JSON.stringify([
        { entry_id: 'legacy-entry', title: 'Stari zapisek', date: '2027-03-29', source: 'legacy' },
      ]));
      localStorage.setItem('student-timetable-test-fixture', 'installed');
    }
  }, { withLegacyEntry });
}

test('student timetable works on mobile, persists locally, and exports a valid Ljubljana-time ICS', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await quietConsent(page, true);
  const response = await page.goto('/solski-urnik/', { waitUntil: 'load' });
  expect(response?.status()).toBe(200);
  await expect(page.locator('[data-student-timetable]')).toBeVisible();
  await expect(page.locator('.design-card')).toHaveCount(15);
  await expect(page.locator('[data-personal-preview]')).toHaveCount(15);
  await expect(page.locator('[data-day-panel="1"]')).toBeVisible();

  await page.locator('[data-add-lesson-open]').first().click();
  const lesson = page.locator('[data-lesson-form]');
  await lesson.locator('[name="subject"]').fill('Matematika');
  await lesson.locator('[name="day"]').selectOption('1');
  await lesson.locator('[name="start"]').fill('08:00');
  await lesson.locator('[name="end"]').fill('08:45');
  await lesson.locator('[data-lesson-save]').click();
  await expect(page.locator('[data-lesson-id]')).toHaveCount(1);
  const storedPrintEntries = await page.evaluate(() => JSON.parse(localStorage.getItem('k365.entries./solski-urnik/') || '[]'));
  expect(storedPrintEntries.map(entry => entry.title)).toContain('Stari zapisek');
  expect(storedPrintEntries.map(entry => entry.title)).toContain('Matematika');

  await page.locator('[data-add-lesson-open]').first().click();
  await lesson.locator('[name="subject"]').fill('Naravoslovje');
  await lesson.locator('[name="day"]').selectOption('1');
  await lesson.locator('[name="start"]').fill('08:30');
  await lesson.locator('[name="end"]').fill('09:00');
  await lesson.locator('[data-lesson-save]').click();
  await expect(page.locator('[data-lesson-status]')).toContainText('že imaš predmet');
  await expect(page.locator('[data-lesson-id]')).toHaveCount(1);

  const task = page.locator('[data-task-form]');
  await task.locator('[name="title"]').fill('Ponovi ulomke');
  await task.locator('[name="due"]').fill('2027-03-29');
  await task.locator('[name="subject"]').fill('Matematika');
  await task.locator('button[type="submit"]').click();
  await expect(page.locator('[data-task-id]')).toHaveCount(1);

  await expect.poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem('k365.student.timetable.v1') || '{}').lessons?.length)).toBe(1);
  const icsDownload = page.waitForEvent('download');
  await page.locator('[data-ics-from]').fill('2027-03-29');
  await page.locator('[data-ics-until]').fill('2027-04-02');
  await page.locator('[data-export-ics]').click();
  const ics = await icsDownload;
  const file = await ics.createReadStream();
  let content = '';
  for await (const chunk of file) content += chunk.toString('utf8');
  expect(content).toContain('DTSTART:20270329T060000Z');
  expect(content).toContain('SUMMARY:Matematika');
  expect(content).toContain('SUMMARY:Domača naloga: Ponovi ulomke');

  await page.reload({ waitUntil: 'load' });
  await expect(page.locator('[data-lesson-id]')).toHaveCount(1);
  await expect(page.locator('[data-task-id]')).toHaveCount(1);
  await page.locator('[data-student-day="2"]').click();
  await expect(page.locator('[data-day-panel="2"]')).toBeVisible();
  const widths = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth }));
  expect(widths.document, JSON.stringify(widths)).toBeLessThanOrEqual(widths.viewport + 1);
});

test('student print view includes the saved weekly schedule and all obligations, while hiding controls and gallery', async ({ page }) => {
  await quietConsent(page);
  await page.addInitScript(() => { window.__k365PrintCalls = 0; window.print = () => { window.__k365PrintCalls += 1; }; });
  const response = await page.goto('/solski-urnik/', { waitUntil: 'load' });
  expect(response?.status()).toBe(200);
  await expect(page.locator('#design-gallery .design-card')).toHaveCount(15);
  // The publication bootstraps its student bundle after the static page loads.
  // Wait for its first rendered panel before interacting so WebKit cannot race
  // the hydration script on the print button.
  await expect(page.locator('[data-day-panel="1"]')).toBeVisible();

  await page.locator('[data-add-lesson-open]').first().click();
  const lesson = page.locator('[data-lesson-form]');
  await lesson.locator('[name="subject"]').fill('Matematika');
  await lesson.locator('[name="day"]').selectOption('1');
  await lesson.locator('[name="start"]').fill('08:00');
  await lesson.locator('[name="end"]').fill('08:45');
  await lesson.locator('[data-lesson-save]').click();

  const task = page.locator('[data-task-form]');
  await task.locator('[name="title"]').fill('Ponovi ulomke');
  await task.locator('[name="due"]').fill('2027-01-08');
  await task.locator('[name="subject"]').fill('Matematika');
  await task.locator('button[type="submit"]').click();
  await task.locator('[name="title"]').fill('Preverjanje ulomkov');
  await task.locator('[name="kind"]').selectOption('test');
  await task.locator('[name="due"]').fill('2027-01-11');
  await task.locator('[name="subject"]').fill('Matematika');
  await task.locator('button[type="submit"]').click();
  await expect(page.locator('.student-task')).toHaveCount(2);

  await page.locator('[data-print-week]').fill('2027-01-06');
  await page.locator('[data-print-schedule]').click();
  const printedRange = page.locator('[data-student-print-range]');
  await expect(printedRange).toHaveText(/Teden:.*4\. 1\. 2027.*8\. 1\. 2027/);
  expect(await page.evaluate(() => window.__k365PrintCalls)).toBe(1);

  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.student-day-panel')).toHaveCount(5);
  await expect(page.locator('.student-print-only')).toBeVisible();
  await expect(page.locator('[data-day-panel="1"] .student-lesson')).toContainText('Matematika');
  await expect(page.locator('.student-tasks')).toBeVisible();
  await expect(page.locator('.student-task')).toHaveCount(2);
  await expect(page.locator('.student-task-list')).toContainText('Ponovi ulomke');
  await expect(page.locator('.student-task-list')).toContainText('Preverjanje ulomkov');
  await expect(page.locator('.student-task-form')).toBeHidden();
  await expect(page.locator('.student-focus')).toBeHidden();
  await expect(page.locator('.student-backup')).toBeHidden();
  await expect(page.locator('.design-section')).toBeHidden();
  await expect(page.locator('.student-print-tools')).toBeHidden();
});

test('week date field and template button align on desktop and fit on mobile', async ({ page }) => {
  await quietConsent(page);
  const response = await page.goto('/solski-urnik/', { waitUntil: 'load' });
  expect(response?.status()).toBe(200);

  await page.setViewportSize({ width: 1440, height: 900 });
  const desktop = await page.evaluate(() => {
    const date = document.querySelector('[data-print-week]').getBoundingClientRect();
    const button = document.querySelector('.student-print-tools__actions .button').getBoundingClientRect();
    const label = document.querySelector('.student-print-tools__actions label').getBoundingClientRect();
    const actions = document.querySelector('.student-print-tools__actions').getBoundingClientRect();
    return { dateTop: date.top, buttonTop: button.top, dateHeight: date.height, buttonHeight: button.height, dateBottom: date.bottom, buttonBottom: button.bottom, labelTop: label.top, labelBottom: label.bottom, actionsTop: actions.top, actionsBottom: actions.bottom, grid: getComputedStyle(document.querySelector('.student-print-tools__actions')).gridTemplateRows };
  });
  expect(Math.abs(desktop.dateTop - desktop.buttonTop), JSON.stringify(desktop)).toBeLessThanOrEqual(1);
  expect(Math.abs(desktop.dateHeight - desktop.buttonHeight), JSON.stringify(desktop)).toBeLessThanOrEqual(1);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobile = await page.evaluate(() => {
    const date = document.querySelector('[data-print-week]').getBoundingClientRect();
    const button = document.querySelector('.student-print-tools__actions .button').getBoundingClientRect();
    return { document: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth, date, button };
  });
  expect(mobile.document, JSON.stringify(mobile)).toBeLessThanOrEqual(mobile.viewport + 1);
  expect(mobile.button.top, JSON.stringify(mobile)).toBeGreaterThan(mobile.date.bottom);
});

test('student print gallery stays full width and the WebP action remains reachable on desktop and mobile', async ({ page }) => {
  await quietConsent(page);
  const response = await page.goto('/solski-urnik/', { waitUntil: 'load' });
  expect(response?.status()).toBe(200);

  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 844 });
    const webpButton = page.locator('#design-gallery .design-card').first().locator('[data-export][data-format="webp"]');
    await webpButton.scrollIntoViewIfNeeded();
    const geometry = await page.evaluate(() => {
      const workspace = document.querySelector('.download-workspace').getBoundingClientRect();
      const gallery = document.querySelector('#design-gallery').getBoundingClientRect();
      const button = document.querySelector('#design-gallery [data-export][data-format="webp"]');
      const rect = button.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return { workspaceWidth: workspace.width, galleryWidth: gallery.width, webpButtonHit: !!hit && button.contains(hit) };
    });
    expect(geometry.galleryWidth, JSON.stringify(geometry)).toBeGreaterThan(geometry.workspaceWidth * 0.9);
    expect(geometry.webpButtonHit, JSON.stringify(geometry)).toBe(true);
  }
});
