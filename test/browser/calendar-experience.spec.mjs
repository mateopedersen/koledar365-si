import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { inflateRawSync } from 'node:zlib';

async function openPublication(page, path) {
  const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('data-free-ready', 'true');
}

// Read the downloaded ZIP's directory independently of the browser XLSX writer.
function workbookFiles(bytes) {
  expect(bytes.readUInt32LE(0)).toBe(0x04034b50);
  const end = bytes.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  expect(end, 'XLSX must contain a ZIP central directory').toBeGreaterThanOrEqual(0);
  const count = bytes.readUInt16LE(end + 10);
  let offset = bytes.readUInt32LE(end + 16);
  const files = new Map();
  for (let index = 0; index < count; index++) {
    expect(bytes.readUInt32LE(offset)).toBe(0x02014b50);
    const method = bytes.readUInt16LE(offset + 10);
    const size = bytes.readUInt32LE(offset + 20);
    const nameLength = bytes.readUInt16LE(offset + 28);
    const extraLength = bytes.readUInt16LE(offset + 30);
    const commentLength = bytes.readUInt16LE(offset + 32);
    const local = bytes.readUInt32LE(offset + 42);
    const name = bytes.subarray(offset + 46, offset + 46 + nameLength).toString('utf8');
    expect(bytes.readUInt32LE(local)).toBe(0x04034b50);
    const start = local + 30 + bytes.readUInt16LE(local + 26) + bytes.readUInt16LE(local + 28);
    const compressed = bytes.subarray(start, start + size);
    expect([0, 8], `supported ZIP compression for ${name}`).toContain(method);
    files.set(name, (method === 8 ? inflateRawSync(compressed) : compressed).toString('utf8'));
    offset += 46 + nameLength + extraLength + commentLength;
  }
  expect(files.get('[Content_Types].xml')).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml');
  expect(files.has('xl/workbook.xml')).toBe(true);
  return files;
}

async function downloadWorkbook(page, button, filename) {
  const pending = page.waitForEvent('download');
  await button.click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe(filename);
  expect(await download.failure()).toBeNull();
  return workbookFiles(await readFile(await download.path()));
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-21T12:00:00Z'));
  await page.addInitScript(() => {
    localStorage.setItem('k365.consent', JSON.stringify({ version: 2, preferences: false, expiresAt: Date.now() + 86400000 }));
  });
});

test('the selected 2026 home period survives the static print flow and an older saved draft', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('k365.options./koledar-za-tiskanje/', JSON.stringify({ year: 2029, month: 6, date: '2029-06-10', type: 'annual' }));
  });
  await openPublication(page, '/?year=2026&month=10&date=2026-10-21&view=month');
  const printLink = page.locator('[data-selected-calendar-download]');
  const printURL = new URL(await printLink.getAttribute('href'), page.url());
  expect(Object.fromEntries(printURL.searchParams)).toEqual({ year: '2026', month: '10', date: '2026-10-21', type: 'monthly' });
  const editorURL = new URL(await page.locator('[data-selected-calendar-editor]').getAttribute('href'), page.url());
  expect(editorURL.pathname).toBe('/ustvari-koledar/');
  expect(Object.fromEntries(editorURL.searchParams)).toEqual({ year: '2026', month: '10', view: 'month' });

  await printLink.click();
  await expect(page).toHaveURL(printURL.href);
  await expect(page.locator('html')).toHaveAttribute('data-free-ready', 'true');
  const form = page.locator('#planner-options');
  for (const [name, value] of Object.entries({ year: '2026', month: '10', date: '2026-10-21', type: 'monthly' })) {
    await expect(form.locator(`[name="${name}"]`)).toHaveValue(value);
  }
  await expect(form.locator('option[value="lunar"]')).toHaveJSProperty('disabled', true);
  await expect.poll(() => page.locator('[data-export-options]').first().evaluate(node => JSON.parse(node.dataset.exportOptions))).toMatchObject({ year: 2026, month: 10, date: '2026-10-21' });
  await expect.poll(() => page.locator('[data-preview-design]').first().evaluate(node => JSON.parse(node.dataset.freePreviewKey || '{}'))).toMatchObject({ year: '2026', month: '10', date: '2026-10-21', type: 'monthly' });
});

test('an explicit studio period overrides a saved project while retaining its personal content', async ({ page }) => {
  await openPublication(page, '/ustvari-koledar/?year=2028&month=5&view=month');
  await expect(page.locator('#studio-preview-label')).toHaveText('maj 2028');
  await page.locator('[data-tab="layout"]').click();
  await page.locator('[data-setting="year"]').fill('2029');
  await page.locator('#studio-month-select').selectOption('6');
  await page.locator('[data-tab="text"]').click();
  await page.locator('[data-setting="name"]').fill('Črtov koledar');
  await expect(page.locator('#studio-save-state')).toContainText('Shranjeno na tej napravi');

  await openPublication(page, '/ustvari-koledar/?year=2026&month=10&view=month');
  await expect(page.locator('#studio-preview-label')).toHaveText('oktober 2026');
  await expect(page.locator('[data-setting="year"]')).toHaveValue('2026');
  await expect(page.locator('#studio-month-select')).toHaveValue('10');
  await expect(page.locator('[data-setting="view"]')).toHaveValue('month');
  await expect(page.locator('[data-setting="name"]')).toHaveValue('Črtov koledar');
});

test('monthly and annual calendar controls download real editable XLSX workbooks', async ({ page }) => {
  await openPublication(page, '/mesecni-koledar/?year=2026&month=1');
  const hub = page.locator('[data-calendar-experience="monthly"]');
  await expect(hub).toHaveAttribute('data-calendar-ready', 'true');
  await hub.locator('[data-calendar-year="2028"]').click();
  await hub.locator('[data-calendar-month="2"]').click();
  await expect(hub.locator('[data-calendar-heading]')).toHaveText('Februar 2028');
  await expect(hub.locator('.calendar-sheet__month td:not(.is-outside)')).toHaveCount(29);
  await expect(hub.locator('[data-calendar-detail]')).toHaveAttribute('href', '/koledar/2028/februar/');
  await hub.locator('[data-period-notes]').fill('=SUM(1,2) · Črt in Špela');
  const month = await downloadWorkbook(page, hub.locator('[data-calendar-xlsx]'), 'koledar365-mesecni-koledar-2028-02.xlsx');
  expect(month.get('xl/workbook.xml')).toContain('name="Februar"');
  expect(month.get('xl/workbook.xml')).toContain('name="Datumi"');
  expect(month.get('xl/worksheets/sheet1.xml')).toContain('=SUM(1,2) · Črt in Špela</t>');
  expect(month.get('xl/worksheets/sheet1.xml')).not.toContain('<f>SUM(1,2)</f>');
  const dates = month.get('xl/worksheets/sheet2.xml');
  expect(dates).toContain('<v>46784</v>'); // 1 February 2028, as an Excel date.
  expect(dates).toContain('<v>46812</v>'); // Leap day, as an Excel date.
  expect((dates.match(/<f>IF\(/g) || []).length).toBe(29);
  expect(dates).toContain('<f>SUM(F5:F33)</f><v>20</v>');

  await openPublication(page, '/koledar/2026/');
  const annual = page.locator('[data-calendar-spreadsheet]');
  await expect(annual).toHaveAttribute('data-calendar-ready', 'true');
  const year = await downloadWorkbook(page, annual.locator('[data-calendar-xlsx]'), 'koledar365-letni-koledar-2026.xlsx');
  expect((year.get('xl/workbook.xml').match(/<sheet /g) || []).length).toBe(14);
  const yearDates = year.get('xl/worksheets/sheet13.xml');
  expect((yearDates.match(/<f>IF\(/g) || []).length).toBe(365);
  expect(yearDates).toContain('<f>SUM(F5:F369)</f><v>254</v>');
});

test('the static weekly hub uses the current Ljubljana date and preserves ISO year boundaries', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2027-11-09T12:00:00Z'));
  await openPublication(page, '/tedenski-koledar/');
  const hub = page.locator('[data-calendar-experience="weekly"]');
  await expect(hub).toHaveAttribute('data-calendar-ready', 'true');
  await expect(hub.locator('[data-week-date]')).toHaveValue('2027-11-09');
  await expect(hub.locator('[data-calendar-kicker]')).toHaveText('TEDEN 45 / 2027');
  await expect(hub.locator('[data-calendar-year="2028"]')).toHaveAttribute('href', '/tedenski-koledar/2028/');

  await hub.locator('[data-week-date]').fill('2027-01-01');
  await hub.locator('[data-week-date]').dispatchEvent('change');
  await expect(hub.locator('[data-calendar-kicker]')).toHaveText('TEDEN 53 / 2026');
  await expect(hub.locator('[data-day-notes]')).toHaveCount(7);
  await expect(hub.locator('[data-day-notes]').first()).toHaveAttribute('data-day-notes', '2026-12-28');
  await expect(hub.locator('[data-day-notes]').last()).toHaveAttribute('data-day-notes', '2027-01-03');
  await hub.locator('[data-day-notes="2027-01-01"]').fill('Novoletni načrti');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(hub.locator('[data-day-notes="2027-01-01"]')).toHaveValue('Novoletni načrti');

  await hub.locator('[data-week-date]').fill('2030-12-31');
  await hub.locator('[data-week-date]').dispatchEvent('change');
  await expect(hub.locator('[data-calendar-kicker]')).toHaveText('TEDEN 1 / 2031');
  await expect(hub.locator('[data-week-number]')).toHaveAttribute('max', '1');
  await expect(hub.locator('[data-calendar-next]')).toBeDisabled();
  const print = new URL(await hub.locator('[data-calendar-all-designs]').getAttribute('href'), page.url());
  expect(print.searchParams.get('year')).toBe('2030');
  expect(print.searchParams.get('date')).toBe('2030-12-31');

  await openPublication(page, '/tedenski-koledar/2028/');
  await expect(page.locator('[data-calendar-kicker]')).toHaveText('TEDEN 1 / 2028');
  await expect(page.locator('[data-export-options] .design-card')).toHaveCount(15);
});

test('exported annual workday dashboards retain their year and recalculate a custom schedule', async ({ page }) => {
  await openPublication(page, '/delovni-dnevi/2026/');
  const dashboard = page.locator('[data-workdays-dashboard]');
  const january = dashboard.locator('[data-workdays-card][data-month="1"]');
  await expect(dashboard).toHaveAttribute('data-year', '2026');
  await expect(dashboard.locator('[data-workdays-card]')).toHaveCount(12);
  await expect(dashboard.locator('[data-year-days]')).toHaveText('254');
  await expect(dashboard.locator('[data-year-holidays]')).toHaveText('7');
  await expect(january.locator('[data-month-days]')).toHaveText('20');
  const monthURL = new URL(await january.getAttribute('href'), page.url());
  expect(monthURL.pathname).toBe('/kalkulator-delovnih-dni/');
  expect(monthURL.searchParams.get('from')).toBe('2026-01-01');
  expect(monthURL.searchParams.get('to')).toBe('2026-01-31');

  await dashboard.locator('[data-workdays-hours]').fill('6.5');
  await expect(january.locator('[data-month-hours]')).toHaveText('130');
  await dashboard.locator('[data-workdays-exclude]').uncheck();
  await expect(january.locator('[data-month-days]')).toHaveText('22');
  await expect(january.locator('[data-month-hours]')).toHaveText('143');
  await expect(dashboard.locator('[data-year-days]')).toHaveText('261');
  await dashboard.locator('.workdays-weekdays label:has(input[value="6"])').click();
  await expect(january.locator('[data-month-days]')).toHaveText('27');
  await expect(january.locator('[data-month-hours]')).toHaveText('175,5');
  await dashboard.locator('[data-workdays-reset]').click();
  await expect(dashboard.locator('[data-year-days]')).toHaveText('254');
  await expect(january.locator('[data-month-hours]')).toHaveText('160');

  await dashboard.locator('a[href="/delovni-dnevi/2027/"]').click();
  await expect(page).toHaveURL(/\/delovni-dnevi\/2027\/$/);
  await expect(page.locator('html')).toHaveAttribute('data-free-ready', 'true');
  await expect(dashboard).toHaveAttribute('data-year', '2027');
  await expect(dashboard.locator('[data-year-days]')).toHaveText('255');
  await dashboard.locator('[data-workdays-exclude]').uncheck();
  await expect(dashboard.locator('[data-year-days]')).toHaveText('261');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
});

test('the print guide links open the calendar type and period described in the example', async ({ page }) => {
  const path = '/koledar-za-tiskanje/';
  await openPublication(page, path);

  await expect(page.locator('main h1')).toHaveText('Koledar za tiskanje');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /A4, A3 ali A5/);
  const guide = page.locator('#navodila-za-tisk');
  await page.getByRole('link', { name: 'Kako pripraviti koledar za tisk' }).click();
  await expect(page).toHaveURL(/#navodila-za-tisk$/);
  await expect(guide.getByRole('heading', { name: 'Trije koraki pred tiskanjem' })).toBeVisible();
  await expect(page.locator('[data-site-share-inline]')).toHaveCount(1);
  await expect(page.locator('.calendar-tool-share .site-share')).toHaveCSS('position', 'relative');

  for (const [width, height] of [[320, 740], [390, 844], [1366, 850]]) {
    await page.setViewportSize({ width, height });
    expect(await guide.evaluate(node => node.scrollWidth)).toBeLessThanOrEqual(await guide.evaluate(node => node.clientWidth));
  }

  for (const example of [
    { label: 'Prilagodite februar 2028', type: 'monthly', date: '2028-02-01' },
    { label: 'odprite teden od 28. februarja do 5. marca 2028', type: 'weekly', date: '2028-02-29' },
  ]) {
    await guide.getByRole('link', { name: example.label }).click();
    await expect(page.locator('html')).toHaveAttribute('data-free-ready', 'true');
    await expect(page.locator('#planner-options [name="type"]')).toHaveValue(example.type);
    await expect(page.locator('#planner-options [name="date"]')).toHaveValue(example.date);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://koledar365.si' + path);
  }
});

test('monthly guide examples show the stated month, holiday and February length', async ({ page }) => {
  await openPublication(page, '/mesecni-koledar/');
  const guide = page.locator('#uporaba-mesecnega-koledarja');
  const hub = page.locator('#mesecni-nacrt');
  await page.getByRole('link', { name: 'PDF ali Excel?' }).click();
  await expect(page).toHaveURL(/#uporaba-mesecnega-koledarja$/);
  await expect(page.locator('.calendar-tool-share .site-share')).toHaveCSS('position', 'relative');

  for (const width of [320, 390, 768, 1366]) {
    await page.setViewportSize({ width, height: 844 });
    const overflow = await guide.evaluate(node => node.scrollWidth - node.clientWidth);
    expect(overflow, `monthly guide overflows at ${width}px`).toBeLessThanOrEqual(0);
  }

  for (const [year, days] of [[2027, 28], [2028, 29]]) {
    await guide.getByRole('link', { name: `Februar ${year}`, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`year=${year}&month=2#mesecni-nacrt$`));
    await expect(hub.locator('[data-calendar-heading]')).toHaveText(`Februar ${year}`);
    await expect(hub.locator('.calendar-sheet__month td:not(.is-outside)')).toHaveCount(days);
    await expect(hub.locator(`.calendar-sheet__holidays time[datetime="${year}-02-08"]`)).toHaveCount(1);
    await expect(hub.locator('[data-calendar-detail]')).toHaveAttribute('href', `/koledar/${year}/februar/`);
  }
});

test('monthly preview arrows fit on phones and navigate across the calendar year', async ({ page }) => {
  await openPublication(page, '/mesecni-koledar/?year=2029&month=12');
  const hub = page.locator('#mesecni-nacrt');
  const navigation = hub.getByRole('group', { name: 'Prikaz meseca' });
  const previous = navigation.getByRole('button', { name: 'Prejšnji mesec' });
  const next = navigation.getByRole('button', { name: 'Naslednji mesec' });
  const heading = hub.locator('[data-calendar-heading]');
  await expect(heading).toHaveText('December 2029');

  for (const width of [320, 390, 768, 1366]) {
    await page.setViewportSize({ width, height: 844 });
    const sizes = await navigation.getByRole('button').evaluateAll(buttons => buttons.map(button => {
      const bounds = button.getBoundingClientRect();
      const icon = button.querySelector('svg').getBoundingClientRect();
      return {
        width: bounds.width,
        height: bounds.height,
        left: bounds.left,
        right: bounds.right,
        centerOffset: Math.abs((bounds.left + bounds.right - icon.left - icon.right) / 2),
      };
    }));
    for (const size of sizes) {
      expect(size.width).toBeGreaterThanOrEqual(48);
      expect(size.width).toBe(size.height);
      expect(size.centerOffset).toBeLessThanOrEqual(1);
    }
    expect(sizes[1].left - sizes[0].right).toBeGreaterThanOrEqual(8);
    expect(sizes[1].right).toBeLessThanOrEqual(width);
  }

  await next.click();
  await expect(heading).toHaveText('Januar 2030');
  await expect(page).toHaveURL(/year=2030&month=1$/);
  await expect(hub.locator('.calendar-sheet__month tbody th').first()).toHaveText('1');
  await expect(hub.locator('.calendar-sheet__holidays time[datetime^="2030-01-"]')).toHaveCount(2);
  await previous.press('Enter');
  await expect(heading).toHaveText('December 2029');

  await page.getByRole('link', { name: 'tedenski planer od 31. decembra do 6. januarja' }).click();
  await expect(page.locator('[data-calendar-kicker]')).toHaveText('TEDEN 1 / 2030');
  await expect(page.locator('[data-week-date]')).toHaveValue('2029-12-31');

  await openPublication(page, '/mesecni-koledar/?year=2026&month=1');
  await expect(previous).toBeDisabled();
  await openPublication(page, '/mesecni-koledar/?year=2030&month=12');
  await expect(next).toBeDisabled();
});

test('weekly planner keeps date and ISO controls usable and notes with their own week', async ({ page }) => {
  await openPublication(page, '/tedenski-koledar/');
  const hub = page.locator('#tedenski-nacrt');
  const controls = hub.locator('.weekly-controls');
  await page.getByRole('link', { name: 'Odpri tedenski planer' }).click();
  await expect(page).toHaveURL(/#tedenski-nacrt$/);

  for (const width of [320, 390, 768, 1366]) {
    await page.setViewportSize({ width, height: 844 });
    for (const region of [controls, hub.locator('.calendar-sheet__week'), hub.locator('#tedenski-pdf')]) {
      expect(await region.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
    }
  }

  await controls.getByText('Izberi po številki tedna ISO').click();
  await controls.locator('[data-week-year]').selectOption('2026');
  await controls.locator('[data-week-number]').fill('53');
  await controls.getByRole('button', { name: 'Odpri teden ISO' }).click();
  await expect(hub.locator('[data-week-date]')).toHaveValue('2026-12-28');
  await expect(hub.locator('[data-calendar-kicker]')).toHaveText('TEDEN 53 / 2026');
  await expect(hub.locator('.is-holiday time[datetime="2027-01-01"]')).toHaveCount(1);

  await hub.locator('[data-day-notes="2027-01-01"]').fill('Družinski načrt');
  await hub.locator('[data-period-notes]').fill('Prosti petek');
  await hub.getByRole('button', { name: 'Naslednji teden' }).click();
  await expect(hub.locator('[data-period-notes]')).toHaveValue('');
  await hub.getByRole('button', { name: 'Prejšnji teden' }).click();
  await expect(hub.locator('[data-day-notes="2027-01-01"]')).toHaveValue('Družinski načrt');
  await expect(hub.locator('[data-period-notes]')).toHaveValue('Prosti petek');

  await hub.getByRole('link', { name: 'Pripravi PDF' }).click();
  await expect(page).toHaveURL(/#tedenski-pdf$/);
  await expect(hub.locator('[data-calendar-paper]')).toBeVisible();
});
