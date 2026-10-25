import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const months = ['januar', 'februar', 'marec', 'april', 'maj', 'junij', 'julij', 'avgust', 'september', 'oktober', 'november', 'december'];
const calendarRoutes = [2027, 2028, 2029, 2030].flatMap((year) => months.map((month) => `/koledar/${year}/${month}/`));

function parseCsv(source) {
  const lines = source.replace(/^\uFEFF/, '').trim().split(/\r?\n/);
  const parseLine = (line) => {
    const fields = [];
    let field = '';
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      if (quoted && character === '"' && line[index + 1] === '"') { field += '"'; index += 1; }
      else if (character === '"') quoted = !quoted;
      else if (character === ',' && !quoted) { fields.push(field); field = ''; }
      else field += character;
    }
    fields.push(field);
    return fields;
  };
  const headers = parseLine(lines.shift());
  return lines.map((line) => Object.fromEntries(parseLine(line).map((value, index) => [headers[index], value])));
}

const sourceEvents = [
  ...parseCsv(readFileSync(new URL('../../data/source/yasal-tatil-tarihleri-2027-2030.csv', import.meta.url), 'utf8')).map((row) => ({ date: row.date, title: row.name_sl })),
  ...parseCsv(readFileSync(new URL('../../data/source/ek-onemli-gun-tarihleri-2027-2030.csv', import.meta.url), 'utf8')).map((row) => ({ date: row.date, title: row.title_sl })),
];

test('all 48 monthly calendars show compact labels without expanding and retain full event names', async ({ page }) => {
  test.setTimeout(120_000);
  const routesToScan = test.info().project.name === 'chromium' ? calendarRoutes : ['/koledar/2027/oktober/'];
  const compactLabelsByTitle = new Map();

  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routesToScan) {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(response?.status(), `${route} at ${width}px`).toBe(200);
      const result = await page.evaluate(() => {
        const workspace = document.querySelector('.download-workspace');
        const context = document.querySelector('.calendar-context');
        const content = document.querySelector('#gallery-context-content');
        const labels = [...document.querySelectorAll('.calendar-context .calendar a.event-label')];
        return {
          pageWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          expanded: workspace?.classList.contains('context-expanded'),
          hidden: content?.hidden,
          contextVisible: !!context && getComputedStyle(context).display !== 'none',
          dayEvents: Object.fromEntries([...document.querySelectorAll('.calendar-context .calendar td[data-date]')].map((cell) => [cell.dataset.date, [...cell.querySelectorAll('a.event-label')].map((label) => label.getAttribute('aria-label'))])),
          labels: labels.map((label) => {
            const cell = label.closest('td');
            const compact = label.querySelector('.event-label__compact');
            const full = label.querySelector('.event-label__full');
            const rect = label.getBoundingClientRect();
            const compactRect = compact?.getBoundingClientRect();
            const textRange = document.createRange();
            if (compact) textRange.selectNodeContents(compact);
            const textRect = compact ? textRange.getBoundingClientRect() : null;
            const cellRect = cell.getBoundingClientRect();
            return {
              title: label.getAttribute('title'),
              accessibleName: label.getAttribute('aria-label'),
              fullText: full?.textContent?.trim(),
              compactText: compact?.textContent?.trim(),
              compactVisible: !!compact && getComputedStyle(compact).display !== 'none',
              width: rect.width,
              height: rect.height,
              cellLeft: cellRect.left,
              cellRight: cellRect.right,
              labelLeft: rect.left,
              labelRight: rect.right,
              compactRight: compactRect?.right,
              textRight: textRect?.right,
              compactClientWidth: compact?.clientWidth,
              compactScrollWidth: compact?.scrollWidth,
              whiteSpace: getComputedStyle(label).whiteSpace,
            };
          }),
        };
      });

      expect(result.contextVisible, `${route} calendar preview hidden at ${width}px`).toBe(true);
      expect(result.expanded, `${route} unexpectedly requires or enables expansion`).toBe(false);
      expect(result.pageWidth, `${route} page viewport`).toBe(width);
      expect(result.scrollWidth, `${route} horizontal overflow at ${width}px`).toBeLessThanOrEqual(width + 1);
      if (width <= 650) expect(result.hidden, `${route} mobile preview was hidden`).toBe(false);

      const monthMatch = route.match(/\/(\d{4})\/([^/]+)\/$/);
      const year = monthMatch[1];
      const monthNumber = String(months.indexOf(monthMatch[2]) + 1).padStart(2, '0');
      const sourceMonthEvents = sourceEvents.filter((event) => event.date.startsWith(`${year}-${monthNumber}-`));
      if (sourceMonthEvents.length) {
        expect(result.labels.length, `${route} has no calendar event links`).toBeGreaterThan(0);
      } else {
        expect(result.labels.length, `${route} should have no invented event links`).toBe(0);
      }
      for (const event of sourceMonthEvents) {
        expect(result.dayEvents[event.date]?.some((name) => name?.includes(event.title)), `${route} lost ${event.title} on ${event.date}`).toBe(true);
      }

      for (const [index, label] of result.labels.entries()) {
        compactLabelsByTitle.set(label.title, label.compactText);
        expect(label.title, `${route} event ${index + 1} lost its full title`).toBeTruthy();
        expect(label.accessibleName, `${route} event ${index + 1} accessible name omits its visible label`).toContain(label.compactText);
        expect(label.accessibleName, `${route} event ${index + 1} accessible name omits the full title`).toContain(label.title);
        expect(label.fullText, `${route} event ${index + 1} full text changed`).toBe(label.title);
        expect(label.compactText, `${route} event ${index + 1} has no compact label`).toBeTruthy();
        expect(Array.from(label.compactText).length, `${route} event ${index + 1} compact label exceeds seven characters`).toBeLessThanOrEqual(7);
        expect(label.compactVisible, `${route} event ${index + 1} requires expanding`).toBe(true);
        expect(label.whiteSpace, `${route} event ${index + 1} wraps into narrow columns`).toBe('nowrap');
        expect(label.labelLeft, `${route} event ${index + 1} starts outside its day`).toBeGreaterThanOrEqual(label.cellLeft);
        expect(label.labelRight, `${route} event ${index + 1} overflows its day`).toBeLessThanOrEqual(label.cellRight + 1);
        expect(label.compactRight, `${route} event ${index + 1} compact title ${JSON.stringify(label.compactText)} is clipped`).toBeLessThanOrEqual(label.labelRight + 0.5);
        expect(label.textRight, `${route} event ${index + 1} compact text ${JSON.stringify(label.compactText)} is visually clipped`).toBeLessThanOrEqual(label.labelRight + 0.5);
        expect(label.compactScrollWidth, `${route} event ${index + 1} compact text overflows its box`).toBeLessThanOrEqual(label.compactClientWidth + 1);
        expect(label.height, `${route} event ${index + 1} should retain a comfortable tap target`).toBeGreaterThanOrEqual(24);
        expect(label.height, `${route} event ${index + 1} grows beyond its compact tap target`).toBeLessThanOrEqual(24.5);
      }
    }
  }

  if (test.info().project.name === 'chromium') {
    const editorialLabels = new Map([
      ['Advent', 'Adv.'],
      ['Cvetna nedelja', 'Cvetna'],
      ['Dan Evrope', 'Evrop.'],
      ['Dan žena', 'Žena'],
      ['Gregorjevo', 'Greg.'],
      ['Jesensko enakonočje', 'Jesen'],
      ['Martinovo', 'Martin'],
      ['Materinski dan', 'Mater.'],
      ['Miklavž', 'Miklavž'],
      ['Poletni solsticij', 'Polet.'],
      ['Pomladno enakonočje', 'Pomlad'],
      ['Premik ure', 'Ura'],
      ['Pust', 'Pust'],
      ['Silvestrovo', 'Silv.'],
      ['Sveti trije kralji', 'Kralji'],
      ['Svetovni dan Zemlje', 'Zemlja'],
      ['Svetovni dan čebel', 'Čebele'],
      ['Valentinovo', 'Val.'],
      ['Veliki petek', 'Petek'],
      ['Zimski solsticij', 'Zima'],
      ['božič', 'Božič'],
    ]);
    for (const [title, compact] of editorialLabels) {
      expect(compactLabelsByTitle.get(title), `editorial event ${title} needs a meaningful compact label`).toBe(compact);
    }
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/koledar/2027/oktober/', { waitUntil: 'domcontentloaded' });
  const october = page.locator('.calendar-context .calendar a.event-label');
  await expect(october.filter({ hasText: 'Starejši' })).toHaveCount(1);
  await expect(october.filter({ hasText: 'Živali' })).toHaveCount(1);
  await expect(october.filter({ hasText: 'Učitelji' })).toHaveCount(1);
  const octoberCompactTitles = await page.locator('.calendar-context .calendar .event-label__compact').allTextContents();
  expect(octoberCompactTitles).toContain('Čar.');
  expect(octoberCompactTitles).toContain('Reform.');

  await page.getByRole('button', { name: /Razširi koledar/ }).click();
  await expect(page.getByRole('button', { name: /Nazaj k galeriji/ })).toHaveAttribute('aria-expanded', 'true');
  const expanded = await october.first().evaluate((label) => ({
    full: getComputedStyle(label.querySelector('.event-label__full')).display,
    compact: getComputedStyle(label.querySelector('.event-label__compact')).display,
  }));
  expect(expanded.full).toBe('inline');
  expect(expanded.compact).toBe('none');
});
