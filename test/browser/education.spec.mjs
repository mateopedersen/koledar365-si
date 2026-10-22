import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

const timetableKey = 'k365.school-timetable.v1';

test.beforeEach(async ({ page }) => {
  // The published school year and its "next date" must not depend on CI's day.
  await page.clock.setFixedTime(new Date('2026-10-21T12:00:00Z'));
});

async function openPage(page, path) {
  const response = await page.goto(path);
  expect(response?.status()).toBe(200);
  const consent = page.locator('[data-consent="necessary"]');
  if (await consent.isVisible()) await consent.click();
  await expect(page.locator('h1')).toHaveCount(1);
  if (path === '/solski-urnik/') await page.getByRole('tab', { name: 'Urnik za obdobje' }).click();
}

async function downloadedText(page, control) {
  const pending = page.waitForEvent('download');
  await control.click();
  const download = await pending;
  expect(await download.failure()).toBeNull();
  return { text: await readFile(await download.path(), 'utf8'), filename: download.suggestedFilename() };
}

async function expectNoOverflow(page) {
  const size = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(size.scroll).toBeLessThanOrEqual(size.width);
}

async function addLesson(page, { subject, start = '08:00', end = '08:45', room = '', teacher = '' }) {
  const form = page.locator('[data-tt-lesson]');
  await form.locator('[name="subject"]').fill(subject);
  await form.locator('[name="startTime"]').fill(start);
  await form.locator('[name="endTime"]').fill(end);
  await form.locator('[name="room"]').fill(room);
  await form.locator('[name="teacher"]').fill(teacher);
  await page.locator('[data-tt-submit]').click();
}

test('school filters keep grade and region dates distinct in the annual view, ICS and print', async ({ page }) => {
  await openPage(page, '/solski-koledar/');
  await expect(page.locator('[data-ed-next-date]')).toHaveAttribute('datetime', '2026-10-26');
  await page.locator('[name="grade"]').selectOption('9');
  await page.locator('[name="region"]').selectOption('east');
  await expect(page.locator('[data-event-id="school-primary-end9"] time')).toHaveAttribute('datetime', '2027-06-15');
  await expect(page.locator('[data-event-id="school-primary-end1-8"]')).toHaveCount(0);
  await expect(page.locator('[data-event-id="school-primary-winter-west"]')).toHaveCount(0);

  const { text: ics, filename } = await downloadedText(page, page.locator('[data-ed-ics]'));
  expect(filename).toMatch(/\.ics$/);
  const winter = ics.split('BEGIN:VEVENT').find(event => event.includes('UID:school-primary-winter-east@'));
  expect(winter).toContain('DTSTART;VALUE=DATE:20270215');
  expect(winter).toContain('DTEND;VALUE=DATE:20270220'); // The official final day, 19 February, is included.
  expect(ics).not.toContain('UID:school-primary-winter-west@');
  expect(ics).toContain('https://www.gov.si/teme/solski-koledar-za-osnovne-sole/');

  await page.locator('[data-ed-view="year"]').click();
  await expect(page.locator('[data-ed-year] .ed-mini-month')).toHaveCount(12);
  await page.locator('[data-ed-day="2027-02-15"]').click();
  await expect(page.locator('[data-ed-day-detail]')).toContainText('Zimske počitnice');
  await page.evaluate(() => { window.print = () => { window.__educationPrintRequested = true; }; });
  await page.locator('[data-ed-print]').click();
  expect(await page.evaluate(() => window.__educationPrintRequested)).toBe(true);
  await expect(page.locator('[data-ed-print-sheet] .ed-mini-month')).toHaveCount(12);
  await expect(page.locator('[data-ed-print-sheet] header')).toContainText('Vzhodna skupina · 9. razred');
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  await expect(page.locator('body')).not.toHaveClass(/education-printing/);
});

test('matura subjects and exam types preserve different result dates and export only selected events', async ({ page }) => {
  await openPage(page, '/matura/2027/');
  await page.locator('[data-ed-subject-search]').fill('spanscina');
  await expect(page.locator('[data-ed-subjects] label:visible')).toHaveText(['Španščina']);
  await page.locator('[data-ed-subject-search]').fill('');
  await page.locator('[name="subject"][value="math"]').check();
  await expect(page.locator('[data-event-id="matura-general-2027-06-05-math"]')).toHaveCount(1);
  await expect(page.locator('[data-event-id="matura-general-2027-05-29-en"]')).toHaveCount(0);
  await expect(page.locator('[data-event-id="matura-general-results"] time')).toHaveAttribute('datetime', '2027-07-13');
  await page.locator('[data-ed-select="matura-general-results"]').check();

  await page.locator('[name="examType"]').selectOption('vocational');
  await expect(page.locator('[data-event-id="matura-general-results"]')).toHaveCount(0);
  await expect(page.locator('[data-ed-selected-count]')).toHaveText('Izbrano: 0');
  await expect(page.locator('[data-event-id="matura-vocational-results"] time')).toHaveAttribute('datetime', '2027-07-08');
  await page.locator('[data-ed-select="matura-vocational-results"]').check();
  const { text: ics } = await downloadedText(page, page.locator('[data-ed-ics]'));
  expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
  expect(ics).toContain('DTSTART;VALUE=DATE:20270708');
  expect(ics).toContain('DTEND;VALUE=DATE:20270709');
  expect(ics).toContain('https://www.ric.si/poklicna-matura/koledar-poklicne-mature/');
  expect(ics).not.toContain('UID:matura-general-results@');
  await expect(page).toHaveURL(/examType=vocational/);
});

test('NPZ grade pages and university filters keep their scopes on a narrow phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await openPage(page, '/npz/');
  await page.locator('[name="grade"]').selectOption('6');
  await expect(page.locator('[data-event-id="npz-6-results"] time')).toHaveAttribute('datetime', '2027-05-03');
  await expect(page.locator('[data-event-id="npz-9-results"]')).toHaveCount(0);
  await expectNoOverflow(page);

  // A conflicting query must not change the dedicated route's grade.
  await openPage(page, '/npz/9-razred/?grade=3');
  await expect(page.locator('[name="grade"]')).toHaveValue('9');
  await expect(page.locator('[data-event-id="npz-9-results"] time')).toHaveAttribute('datetime', '2027-04-20');
  await expect(page.locator('[data-event-id="npz-3-results"]')).toHaveCount(0);
  await expectNoOverflow(page);

  await openPage(page, '/studijski-koledar/');
  await page.locator('[name="institution"]').selectOption('ung');
  await expect(page.locator('[data-ed-list] [data-event-id]')).toHaveCount(7);
  await expect(page.locator('[data-ed-list] [data-event-id]:not([data-event-id^="study-ung-"])')).toHaveCount(0);
  await expect(page.locator('[data-event-id="study-ung-1"] time')).toHaveAttribute('datetime', '2027-01-25');
  const { text: ics } = await downloadedText(page, page.locator('[data-ed-ics]'));
  expect(ics).toContain('https://ung.si/sl/studij/akademski-koledar/');
  expect(ics).not.toContain('UID:study-ul-');
  await expectNoOverflow(page);
  await page.reload();
  await expect(page.locator('[name="institution"]')).toHaveValue('ung');
});

test('school timetable keeps edits, conflicts, recurrence and real exports after a reload', async ({ page }) => {
  test.setTimeout(60000);
  await openPage(page, '/solski-urnik/');
  await expect(page.locator('[name="code"]')).toHaveCount(0);
  await addLesson(page, { subject: 'Matematika', room: '204', teacher: 'Učiteljica Č.' });
  await addLesson(page, { subject: 'Slovenščina', start: '08:30', end: '09:15' });
  await expect(page.locator('[data-tt-lesson-count]')).toHaveText('2');
  await expect(page.locator('[data-tt-conflicts]')).toContainText('Matematika');
  await expect(page.locator('[data-tt-conflicts]')).toContainText('Slovenščina');

  await page.locator('[data-tt-lessons] tr').filter({ hasText: 'Slovenščina' }).locator('[data-tt-edit]').click();
  await page.locator('[data-tt-lesson] [name="startTime"]').fill('08:45');
  await page.locator('[data-tt-submit]').click();
  await expect(page.locator('[data-tt-conflicts]')).toBeHidden(); // Touching intervals do not overlap.
  await page.reload();
  await expect(page.locator('[data-tt-lesson-count]')).toHaveText('2');
  await expect(page.locator('[data-tt-lessons]')).toContainText('Učiteljica Č.');
  const stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), timetableKey);
  expect(stored.lessons.find(lesson => lesson.subject === 'Slovenščina').startTime).toBe('08:45');

  const backup = await downloadedText(page, page.locator('[data-tt-backup]'));
  expect(backup.filename).toMatch(/\.json$/);
  expect(JSON.parse(backup.text).lessons).toHaveLength(2);
  const { text: ics } = await downloadedText(page, page.locator('[data-tt-ics]'));
  expect(ics).toContain('LOCATION:204');
  expect(ics).toContain('DTSTART:20261019T060000Z'); // 08:00 CEST, before the autumn change.
  expect(ics).toContain('DTSTART:20261102T070000Z'); // 08:00 CET, after the autumn change.
  expect(ics).not.toContain('DTSTART:20261026'); // Official autumn holidays are skipped.
  expect(ics.match(/BEGIN:VEVENT/g).length).toBeGreaterThan(50);

  await page.locator('[data-tt-lessons] [data-tt-remove]').first().click();
  await expect(page.locator('[data-tt-lesson-count]')).toHaveText('1');
  await page.locator('[data-tt-toast]').getByRole('button', { name: 'Razveljavi' }).click();
  await expect(page.locator('[data-tt-lesson-count]')).toHaveText('2');
  await page.evaluate(() => { window.print = () => { window.__timetablePrintRequested = true; }; });
  await page.locator('[data-tt-print]').click();
  expect(await page.evaluate(() => window.__timetablePrintRequested)).toBe(true);
  await expect(page.locator('[data-tt-print-sheet]')).toContainText('Matematika');
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  await page.setViewportSize({ width: 320, height: 900 });
  await expectNoOverflow(page);
});

test('timetable JSON restore requires a choice and rejects invalid backups without losing the plan', async ({ page }) => {
  await openPage(page, '/solski-urnik/');
  await addLesson(page, { subject: 'Obstoječi predmet' });
  const imported = {
    schema: 'koledar365-school-timetable', version: 1, title: 'Urnik 8. a', className: '8. a',
    from: '2026-09-01', to: '2027-06-24', level: 'primary', region: 'east', skipBreaks: true,
    lessons: [{ id: 'restored-physics', subject: 'Fizika', day: 2, startTime: '09:00', endTime: '09:45',
      room: '105', teacher: 'Učitelj', repeat: 'weekly', date: '' }],
  };
  const file = { name: 'urnik.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(imported)) };
  await page.locator('[data-tt-import]').setInputFiles(file);
  await expect(page.locator('dialog')).toContainText('Urnik 8. a');
  await page.locator('dialog [data-cancel]').click();
  await expect(page.locator('[data-tt-lessons]')).toContainText('Obstoječi predmet');

  await page.locator('[data-tt-import]').setInputFiles(file);
  await page.locator('dialog [data-accept]').click();
  await expect(page.locator('[data-tt-title]')).toHaveText('Urnik 8. a · 8. a');
  await expect(page.locator('[data-tt-lessons]')).toContainText('Fizika');
  await expect(page.locator('[data-tt-lessons]')).not.toContainText('Obstoječi predmet');
  await page.locator('[data-tt-import]').setInputFiles({
    name: 'neveljaven.json', mimeType: 'application/json', buffer: Buffer.from('{"schema":"unknown","lessons":[]}'),
  });
  await expect(page.locator('[data-tt-toast]')).toContainText('Datoteka ni veljavna kopija');
  await expect(page.locator('dialog')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('[data-tt-lesson-count]')).toHaveText('1');
  await expect(page.locator('[data-tt-lessons]')).toContainText('Fizika');
});
