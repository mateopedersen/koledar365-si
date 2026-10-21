import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../../', import.meta.url);
const styles = readFileSync(fileURLToPath(new URL('app/assets/stylesheets/workdays.css', root)), 'utf8');
const script = readFileSync(fileURLToPath(new URL('app/assets/javascripts/workdays.js', root)), 'utf8');
const holidayDates = ['2027-01-01', '2027-01-02', '2027-02-08', '2027-03-28', '2027-03-29', '2027-04-27', '2027-05-01', '2027-05-02', '2027-05-16', '2027-06-25', '2027-08-15', '2027-10-31', '2027-11-01', '2027-12-25', '2027-12-26'];

const pageMarkup = () => {
  const months = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const holidays = holidayDates.filter((date) => Number(date.slice(5, 7)) === month);
    return `<a class="workdays-month-card" data-workdays-card data-month="${month}" data-holidays='${JSON.stringify(holidays)}' style="--month-progress:70%"><span>${String(month).padStart(2, '0')}</span><h3>Mesec ${month}</h3><div class="workdays-month-card__count"><strong data-month-days>0</strong><span data-month-day-label>delovnih dni</span></div><div class="workdays-month-card__meter"><span></span></div><div class="workdays-month-card__details"><span><strong data-month-hours>0</strong> ur</span><span><strong data-month-holidays>0</strong> izločenih praznikov</span></div></a>`;
  }).join('');

  return `<!doctype html><html lang="sl"><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>:root{--surface:#fff;--line:#dae6f2;--shadow:0 3px 20px #1a487407;--ink:#10274b;--muted:#617596;--soft:#edf4fd;--blue:#0769f9}*{box-sizing:border-box}body{margin:0;padding:16px;background:#f0f6fc;color:var(--ink);font:15px system-ui}main{max-width:1200px;margin:auto}.workdays-hero{min-height:230px}.workdays-dashboard{margin-top:16px}.workdays-controls__intro,.workdays-controls p{display:block}.workdays-weekdays label{display:inline-flex}.workdays-weekdays input{position:absolute;width:1px;height:1px;opacity:0}.workdays-holidays input{accent-color:#075da9}.workdays-month-grid{margin-top:14px}.workdays-discovery{margin-top:16px}</style><style>${styles}</style></head><body><main><section class="workdays-hero"><div class="workdays-hero__copy"><span class="workdays-kicker"><i></i> KOLEDAR365 · SLOVENIJA</span><h1>Delovni dnevi in ure</h1><p>Prilagodite izračun svojemu urniku.</p></div><div class="workdays-hero__visual"></div></section><section class="workdays-dashboard" data-workdays-dashboard data-year="2027"><div class="workdays-summary" aria-live="polite"><article><div><strong data-year-days>0</strong><span data-year-days-label>delovnih dni v letu</span></div></article><article><div><strong><span data-year-hours>0</span> ur</strong></div></article><article><div><strong data-year-holidays>0</strong></div></article><article><div><strong>365</strong></div></article></div><div class="workdays-controls" data-workdays-controls><div class="workdays-controls__intro"><h3>Prilagodi svojemu urniku</h3><p>Takojšen izračun</p></div><fieldset class="workdays-weekdays"><legend>Delovni dnevi v tednu</legend>${['pon', 'tor', 'sre', 'čet', 'pet', 'sob', 'ned'].map((day, index) => `<label><input type="checkbox" value="${index + 1}" ${index < 5 ? 'checked' : ''}><span>${day}</span></label>`).join('')}</fieldset><label class="workdays-hours">Ure na dan<input data-workdays-hours type="number" min="0" max="24" step="0.25" value="8"><span>ur</span><small id="workdays-hours-error" data-workdays-error role="alert" hidden></small></label><label class="workdays-holidays"><input type="checkbox" checked data-workdays-exclude><span><strong>Odštej praznike</strong><small>Zakonski dela prosti dnevi</small></span></label><button type="button" data-workdays-reset>Ponastavi</button></div><div class="workdays-month-grid">${months}</div></section></main><script>${script}</script></body></html>`;
};

const calculatorMarkup = () => `<!doctype html><html lang="sl"><head><base href="http://127.0.0.1:3661/"><meta name="viewport" content="width=device-width, initial-scale=1"><style>:root{--surface:#fff;--line:#dae6f2;--shadow:0 3px 20px #1a487407;--ink:#10274b;--muted:#617596;--soft:#edf4fd;--blue:#0769f9}*{box-sizing:border-box}body{margin:0;padding:12px;background:#f0f6fc;color:var(--ink);font:15px system-ui}main{max-width:1080px;margin:auto}</style><style>${styles}</style></head><body><main>
<section class="workday-tool" data-workday-calculator><div class="workday-tool__intro"><div><span class="workday-tool__eyebrow">ORODJE</span><h2>Roki in delovni dnevi</h2><p>Prilagodite izračun svojemu urniku.</p></div><div class="workday-tool__quick-facts"><span>2027–2030</span></div></div>
<div class="workday-tool__workspace"><div class="workday-tool__calculator"><div class="workday-tool__tabs" role="tablist"><button type="button" role="tab" aria-selected="true" data-wdc-mode="range">Obdobje</button><button type="button" role="tab" aria-selected="false" data-wdc-mode="shift" tabindex="-1">Datum roka</button></div>
<div class="workday-tool__panel" data-wdc-panel="range"><form action="/izracun/" method="post" data-wdc-form="range"><input type="hidden" name="tool" value="workdays"><div class="wdc-date-row"><label>Od<input type="date" name="from" value="2027-04-26" min="2027-01-01" max="2030-12-31" required></label><span class="wdc-date-row__connector">→</span><label>Do<input type="date" name="to" value="2027-04-30" min="2027-01-01" max="2030-12-31" required></label></div><div class="wdc-presets"><button type="button" data-wdc-preset="week">7 dni</button><button type="button" data-wdc-preset="month">30 dni</button></div><fieldset class="wdc-weekdays"><legend>Delovni dnevi</legend><div>${['Ponedeljek','Torek','Sreda','Četrtek','Petek','Sobota','Nedelja'].map((day,index)=>`<label><input type="checkbox" name="weekdays[]" value="${index+1}" ${index<5?'checked':''}><span>${day.slice(0,2)}</span></label>`).join('')}</div></fieldset><div class="wdc-settings"><label class="wdc-hours">Ure<input type="number" name="hours" min="0" max="24" step="0.25" value="8" required></label><label class="wdc-check"><input type="checkbox" name="exclude_holidays" value="1" checked><span><strong>Izključi praznike</strong></span></label></div><div class="wdc-boundaries"><span>Mejna datuma</span><label><input type="checkbox" name="include_start" value="1" checked>Vključi začetek</label><label><input type="checkbox" name="include_end" value="1" checked>Vključi konec</label></div><button class="wdc-submit" type="submit">Izračunaj</button></form></div>
<div class="workday-tool__panel" data-wdc-panel="shift" hidden><form action="/izracun/" method="post" data-wdc-form="shift"><input type="hidden" name="tool" value="workday_shift"><div class="wdc-date-row wdc-date-row--shift"><label>Izhodiščni datum<input type="date" name="from" value="2027-04-26" min="2027-01-01" max="2030-12-31" required></label><label>Delovni dnevi<input type="number" name="delta" min="-1000" max="1000" value="1" required></label></div><p class="wdc-hint">Začetni dan se ne šteje.</p><fieldset class="wdc-weekdays"><legend>Delovni dnevi</legend><div>${['Ponedeljek','Torek','Sreda','Četrtek','Petek','Sobota','Nedelja'].map((day,index)=>`<label><input type="checkbox" name="weekdays[]" value="${index+1}" ${index<5?'checked':''}><span>${day.slice(0,2)}</span></label>`).join('')}</div></fieldset><label class="wdc-check wdc-check--single"><input type="checkbox" name="exclude_holidays" value="1" checked><span><strong>Izključi praznike</strong></span></label><button class="wdc-submit" type="submit">Poišči datum</button></form></div></div>
<aside class="wdc-result" data-wdc-result aria-live="polite"><h2 data-wdc-title>Pregled</h2><p data-wdc-summary>Vnesite datuma.</p><div class="wdc-result__primary"><strong data-wdc-primary>—</strong><span data-wdc-caption>delovnih dni</span></div><div class="wdc-result__stats"><div><span data-wdc-label="calendar">Koledarski dnevi</span><strong data-wdc-stat="calendar">—</strong></div><div><span data-wdc-label="hours">Ure</span><strong data-wdc-stat="hours">—</strong></div><div><span data-wdc-label="holidays">Prazniki</span><strong data-wdc-stat="holidays">—</strong></div></div><p data-wdc-detail>Rezultat.</p><div class="wdc-result__actions"><button type="button" data-wdc-copy>Kopiraj</button><button type="button" data-wdc-share>Deli</button></div><p data-wdc-status role="status"></p></aside></div></section></main><script>Object.defineProperty(navigator,'clipboard',{value:{writeText:async value=>{window.__copied=value}}})</script><script>${script}</script></body></html>`;
test('schedule controls instantly recalculate month and year totals', async ({ page }) => {
  await page.setContent(pageMarkup());
  const january = page.locator('[data-workdays-card][data-month="1"]');

  await expect(january.locator('[data-month-days]')).toHaveText('20');
  await expect(january.locator('[data-month-hours]')).toHaveText('160');
  await expect(january.locator('[data-month-holidays]')).toHaveText('1');
  await expect(page.locator('[data-year-days]')).toHaveText('255');

  await page.locator('[data-workdays-exclude]').uncheck();
  await expect(january.locator('[data-month-days]')).toHaveText('21');
  await expect(january.locator('[data-month-holidays]')).toHaveText('0');

  await page.locator('[data-workdays-hours]').fill('25');
  await expect(page.locator('[data-workdays-error]')).toBeVisible();
  await expect(page.locator('[data-workdays-hours]')).toHaveAttribute('aria-invalid', 'true');

  await page.locator('[data-workdays-hours]').fill('7.5');
  await expect(page.locator('[data-workdays-error]')).toBeHidden();
  await expect(january.locator('[data-month-hours]')).toHaveText('157,5');

  await page.locator('.workdays-weekdays input[value="6"]').check();
  await expect(january.locator('[data-month-days]')).toHaveText('26');
  await expect(january.locator('[data-month-hours]')).toHaveText('195');

  await page.locator('[data-workdays-reset]').click();
  await expect(january.locator('[data-month-days]')).toHaveText('20');
  await expect(january.locator('[data-month-hours]')).toHaveText('160');
  await expect(page.locator('[data-year-days]')).toHaveText('255');
});

test('workdays overview fits narrow mobile and desktop viewports', async ({ page }) => {
  await page.setContent(pageMarkup());
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const layout = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
      cards: getComputedStyle(document.querySelector('.workdays-month-grid')).gridTemplateColumns,
      boxes: ['body', 'main', '.workdays-dashboard', '.workdays-controls', '.workdays-weekdays', '.workdays-weekdays legend'].map((selector) => { const rect = document.querySelector(selector).getBoundingClientRect(); return [selector, Math.round(rect.left), Math.round(rect.right), Math.round(rect.width)]; }),
      overflow: [...document.querySelectorAll('body *')].map((element) => ({
        tag: element.tagName.toLowerCase(),
        className: typeof element.className === 'string' ? element.className : '',
        right: Math.round(element.getBoundingClientRect().right),
        width: Math.round(element.getBoundingClientRect().width),
      })).filter((element) => element.width && element.right > document.documentElement.clientWidth + 1).slice(0, 8),
    }));
    expect(layout.scroll, `horizontal overflow at ${width}px: ${JSON.stringify(layout)}`).toBeLessThanOrEqual(width);
    expect(layout.cards).not.toBe('none');
  }
});

test('workday calculator handles both modes, shares settings, and fits mobile', async ({ page }) => {
  await page.route('**/izracun/', async (route) => {
    const payload = route.request().postDataJSON();
    if (payload.tool === 'workdays') {
      expect(payload.weekdays).toEqual(['1', '2', '3', '4', '5']);
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ result: 'Izračun pripravljen.', workdays: { calendar_days: 5, working_days: 3, hours: 24, excluded_holidays: ['2027-04-27'] } }) });
    } else {
      expect(payload.tool).toBe('workday_shift');
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ result: 'Datum pripravljen.', workday_shift: { start_date: '2027-04-26', target_date: '2027-04-28', calendar_days: 2, working_days: 1, excluded_holidays: ['2027-04-27'] } }) });
    }
  });
  await page.setContent(calculatorMarkup());

  await page.locator('[data-wdc-form="range"] [type="submit"]').click();
  await expect(page.locator('[data-wdc-primary]')).toHaveText('3');
  await expect(page.locator('[data-wdc-caption]')).toHaveText('delovne dni');
  await expect(page.locator('[data-wdc-detail]')).toContainText('27. april 2027');
  await expect(page.locator('[data-wdc-status]')).toHaveText('Izračun je pripravljen.');

  await page.locator('[data-wdc-mode="shift"]').click();
  await page.locator('[data-wdc-form="shift"] [type="submit"]').click();
  await expect(page.locator('[data-wdc-primary]')).toContainText('28. april 2027');
  await expect(page.locator('[data-wdc-stat="calendar"]')).toHaveText('2 dni');
  await page.locator('[data-wdc-share]').click();
  const shared = new URL(await page.evaluate(() => window.__copied));
  expect(shared.searchParams.get('mode')).toBe('shift');
  expect(shared.searchParams.get('delta')).toBe('1');
  expect(shared.searchParams.get('holidays')).toBe('1');

  await page.locator('[data-wdc-mode="range"]').click();
  await page.locator('[data-wdc-form="range"] input[name="include_start"]').uncheck();
  await page.locator('[data-wdc-form="range"] input[name="exclude_holidays"]').uncheck();
  await page.locator('[data-wdc-share]').click();
  const rangeShare = new URL(await page.evaluate(() => window.__copied));
  expect(rangeShare.searchParams.get('start')).toBe('0');
  expect(rangeShare.searchParams.get('holidays')).toBe('0');

  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const layout = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    expect(layout.scroll, `workday calculator horizontal overflow at ${width}px`).toBeLessThanOrEqual(width);
  }
});

test('exported calculator loads its script and calculates around a Slovenian holiday', async ({ page }) => {
  await page.goto('/kalkulator-delovnih-dni/');
  await expect(page.locator('[data-wdc-mode="range"]')).toHaveAttribute('aria-selected', 'true');
  const scripts = await page.evaluate(() => JSON.parse(document.querySelector('#k365-static-config').textContent).scripts);
  expect(scripts.some((src) => src.includes('/workdays-') && src.endsWith('.js'))).toBe(true);

  await page.locator('[data-wdc-form="range"] input[name="from"]').fill('2027-04-26');
  await page.locator('[data-wdc-form="range"] input[name="to"]').fill('2027-04-27');
  await page.locator('[data-wdc-form="range"] [type="submit"]').click();
  // The first static calculation also initializes Ruby-WASM. Wait for that
  // operation to finish within the existing test budget before checking values.
  await page.locator('[data-wdc-result]:not([aria-busy])').waitFor();
  await expect(page.locator('[data-wdc-primary]')).toHaveText('1');
  await expect(page.locator('[data-wdc-stat="hours"]')).toHaveText('8 ur');
  await expect(page.locator('[data-wdc-stat="holidays"]')).toHaveText('1');
  await expect(page.locator('[data-wdc-status]')).toHaveText('Izračun je pripravljen.');

  await page.locator('[data-wdc-mode="shift"]').click();
  await page.locator('[data-wdc-form="shift"] input[name="from"]').fill('2027-04-26');
  await page.locator('[data-wdc-form="shift"] input[name="delta"]').fill('1');
  await page.locator('[data-wdc-form="shift"] [type="submit"]').click();
  await page.locator('[data-wdc-result]:not([aria-busy])').waitFor();
  await expect(page.locator('[data-wdc-primary]')).toContainText('28. april 2027');
  await expect(page.locator('[data-wdc-status]')).toHaveText('Izračun je pripravljen.');
});
