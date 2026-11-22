import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const events = [
  { id: 'holiday-2027', title: 'Dan spomina na mrtve', date: '2027-11-01', category: 'holiday', work_free: true, path: '/prazniki/2027/' },
  { id: 'holiday-2028', title: 'Novo leto', date: '2028-01-01', category: 'holiday', work_free: true, path: '/prazniki/2028/' },
  { id: 'festival-ljubljana', title: 'Jesenski festival', date: '2027-10-30', end_date: '2027-10-31', detail: 'Ljubljana', category: 'festival', path: '/festivali/' },
  { id: 'festival-maribor', title: 'Glasbeni festival', date: '2028-02-10', detail: 'Maribor', category: 'festival', path: '/festivali/' },
  { id: 'school-west', title: 'Zimske počitnice · zahod', date: '2028-02-21', category: 'school', region: 'west', school_level: 'primary' },
  { id: 'school-east', title: 'Zimske počitnice · vzhod', date: '2028-02-28', category: 'school', region: 'east', school_level: 'primary' }
];

async function loadCountdown(page) {
  await page.route(/\/odstevanje\/(?:\?.*)?$/, async route => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      /(<script\b[^>]*data-countdown-events[^>]*>)[\s\S]*?(<\/script>)/,
      (_, begin, end) => begin + JSON.stringify(events) + end
    );
    await route.fulfill({ response, body });
  });
  await page.goto('/odstevanje/');
  await expect(page.locator('html')).toHaveAttribute('data-free-ready', 'true');
}

test('aligns upcoming date badges and actions across compact and wide cards', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2027-10-29T12:00:00Z'));
  await loadCountdown(page);
  const cards = page.locator('[data-next-item]:visible button');
  await expect(cards).toHaveCount(3);
  await expect(cards.locator('[data-next-context]:visible')).toHaveText('Ljubljana');

  for (const width of [320, 390, 820, 821, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const boxes = await cards.evaluateAll(buttons => buttons.map(button => {
      const rect = selector => button.querySelector(selector).getBoundingClientRect().toJSON();
      return {
        card: button.getBoundingClientRect().toJSON(),
        date: rect('[data-next-date]'),
        copy: rect('.countdown-next__copy'),
        action: rect('.countdown-next__action')
      };
    }));
    for (const { card, date, copy, action } of boxes) {
      const narrow = card.width < 330;
      expect(Math.abs(date.top - copy.top), width + 'px').toBeLessThanOrEqual(1);
      expect(date.right, width + 'px').toBeLessThan(copy.left);
      expect(action.right, width + 'px').toBeLessThan(card.right);

      if (narrow) {
        expect(Math.abs(action.left - copy.left), width + 'px').toBeLessThanOrEqual(1);
        expect(Math.abs(action.bottom - date.bottom), width + 'px').toBeLessThanOrEqual(1);
        expect(action.top, width + 'px').toBeGreaterThanOrEqual(copy.bottom);
      } else {
        expect(action.left, width + 'px').toBeGreaterThan(copy.right);
        expect(Math.abs(action.top + action.bottom - date.top - date.bottom), width + 'px').toBeLessThanOrEqual(2);
      }
      if (width > 820) {
        expect(Math.abs(card.height - boxes[0].card.height), width + 'px').toBeLessThanOrEqual(1);
        expect(Math.abs(action.top - boxes[0].action.top), width + 'px').toBeLessThanOrEqual(1);
      }
    }
  }
});

test('selects calendar events immediately and handles the end of a festival in progress', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2027-10-31T12:00:00Z'));
  await loadCountdown(page);

  const title = page.locator('[data-feature-title]');
  const choices = page.locator('[data-event-select]');
  await expect(title).toHaveText('Dan spomina na mrtve');
  await expect(page.locator('[data-feature-hours]')).toHaveText('11');

  await page.getByRole('button', { name: 'Festivali', exact: true }).click();
  await expect(title).toHaveText('Glasbeni festival');
  await page.getByLabel('Leto', { exact: true }).selectOption('2027');
  await page.getByLabel('Iskanje', { exact: true }).fill('ljubljana');
  await expect(choices.locator('option')).toHaveCount(2);
  await choices.selectOption('festival-ljubljana');
  await expect(title).toHaveText('Jesenski festival');
  await expect(page.locator('[data-feature-venue]')).toHaveText('Ljubljana');
  await expect(page.locator('[data-feature-source]')).toHaveAttribute('href', '/festivali/');
  await expect(page.locator('[data-event-boundary]')).toHaveValue('end');
  await expect(page.locator('[data-feature-state]')).toHaveText('Dogodek poteka');
  await expect(page.locator('[data-feature-hours]')).toHaveText('11');

  await page.locator('[data-event-boundary]').selectOption('start');
  await expect(page.locator('[data-feature-hours]')).toHaveText('00');
  await expect(page.locator('[data-feature-status]')).toContainText('Dogodek se je začel');
  await page.locator('[data-event-boundary]').selectOption('end');
  await expect(page.locator('[data-feature-hours]')).toHaveText('11');

  await page.getByRole('button', { name: 'Šolski termini', exact: true }).click();
  await page.getByLabel('Regija', { exact: true }).selectOption('east');
  await expect(choices).toHaveValue('school-east');
  await expect(title).toHaveText('Zimske počitnice · vzhod');

  const upcomingDates = await page.locator('[data-next-item]:visible time').evaluateAll(dates => dates.map(date => date.dateTime));
  expect(upcomingDates).toEqual(['2027-11-01', '2028-02-10', '2028-02-28']);
  const shortcut = page.getByRole('button', { name: /Odštevaj · Glasbeni festival/ });
  await expect(shortcut.locator('time')).toHaveAttribute('datetime', '2028-02-10');
  await shortcut.click();
  await expect(title).toHaveText('Glasbeni festival');
  await expect(title).toBeFocused();
  await expect(choices).toHaveValue('festival-maribor');
});

test('counts exact seconds through the autumn clock change, shares the target and exports saved entries', async ({ page }) => {
  await page.clock.install({ time: new Date('2027-10-31T00:29:49Z') });
  await page.clock.pauseAt(new Date('2027-10-31T00:29:50Z'));
  await loadCountdown(page);

  await page.getByRole('button', { name: 'Moj datum', exact: true }).click();
  const form = page.locator('[data-custom-form]');
  await form.getByLabel('Ime dogodka').fill('Osebni termin');
  await form.getByLabel('Datum', { exact: true }).fill('2027-03-28');
  await form.getByLabel('Ura', { exact: true }).fill('02:30');
  await form.getByRole('button', { name: 'Začni odštevati' }).click();
  await expect(form.getByRole('status')).toContainText('ura v tem časovnem pasu ne obstaja');

  await form.getByLabel('Datum', { exact: true }).fill('2027-10-31');
  await form.getByRole('button', { name: 'Začni odštevati' }).click();
  await expect(page.locator('[data-feature-title]')).toHaveText('Osebni termin');
  await expect(page.locator('[data-feature-seconds]')).toHaveText('10');
  await page.clock.runFor(4000);
  await expect(page.locator('[data-feature-seconds]')).toHaveText('06');

  await page.getByRole('button', { name: 'Shrani', exact: true }).click();
  await expect(page.locator('[data-saved-list] h3')).toHaveText('Osebni termin');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Izvozi v koledar (.ics)' }).click();
  const download = await downloadPromise;
  const calendar = await readFile(await download.path(), 'utf8');
  expect(calendar).toContain('DTSTART:20271031T003000Z');
  expect(calendar).toContain('SUMMARY:Osebni termin');

  await page.getByRole('button', { name: 'Deli odštevanje' }).click();
  const share = page.getByLabel('Povezava do izbranega odštevanja');
  await expect(share).toBeVisible();
  await page.goto(await share.inputValue());
  await expect(page.locator('[data-feature-title]')).toHaveText('Osebni termin');
  await expect(page.locator('[data-feature-seconds]')).toHaveText('06');
  await expect(page.locator('[data-saved-list] h3')).toHaveText('Osebni termin');

  await page.clock.runFor(6000);
  await expect(page.locator('[data-feature-seconds]')).toHaveText('00');
  await expect(page.locator('[data-feature-state]')).toHaveText('Čas je potekel');
});
