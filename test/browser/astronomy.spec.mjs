import { test, expect } from '@playwright/test';

const dismissCookies = async page => {
  const button=page.locator('[data-consent="necessary"]');
  if(await button.isVisible()) await button.click();
};

test('full moon year selection changes real rows and UTC ICS without changing the next event',async({page})=>{
  await page.clock.setFixedTime(new Date('2026-10-21T12:00:00Z'));
  await page.goto('/polna-luna/');
  await dismissCookies(page);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('[data-astro-year]')).toHaveValue('2026');
  await expect(page.locator('[data-moon-rows] tr')).toHaveCount(13);
  await expect(page.locator('[data-next-date]')).toHaveText('26. oktobra 2026');
  await expect(page.locator('[data-next-time]')).toHaveText('05:12 CET');
  await page.locator('[data-astro-year]').selectOption('2028');
  await expect(page).toHaveURL(/year=2028/);
  await expect(page.locator('[data-year-title]')).toHaveText('Polne lune 2028');
  await expect(page.locator('[data-moon-source]')).toHaveAttribute('href','https://aa.usno.navy.mil/api/moon/phases/year?year=2028');
  await expect(page.locator('[data-next-date]')).toHaveText('26. oktobra 2026');
  const response=await page.request.get('/astronomy/full_moon-2028.ics');
  expect(response.ok()).toBeTruthy();
  expect(await response.text()).toContain('BEGIN:VEVENT');
});

test('moon-phase photos load locally and the illustrated guide keeps the year and ICS in sync', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-23T12:00:00Z'));
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/lunine-mene/');
  const photos = page.locator('.moon-masthead img, .moon-phase-card img');
  await expect(photos).toHaveCount(8);
  for (const photo of await photos.all()) {
    await photo.scrollIntoViewIfNeeded();
    await expect.poll(() => photo.evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
    expect(new URL(await photo.evaluate(img => img.currentSrc)).pathname).toMatch(/^\/images\/astronomy\/moon-phases\//);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.locator('[data-astro-year]').selectOption('2027');
  await expect(page.locator('[data-moon-rows] tr')).toHaveCount(49);
  await expect(page.locator('[data-next-date]')).toHaveText('24. novembra 2026');
  await expect(page.locator('[data-astro-ics]')).toHaveAttribute('href', '/astronomy/all-2027.ics');
  const response = await page.request.get('/astronomy/all-2027.ics');
  expect(response.ok()).toBe(true);
  expect((await response.text()).match(/BEGIN:VEVENT/g)).toHaveLength(49);
});

test('the new-moon guide keeps the local date, two photographs and new-moon-only export', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/mlaj/?year=2027');
  await expect(page.locator('.new-moon-geometry svg')).toBeVisible();
  for (const photo of await page.locator('.moon-masthead__photo img, .new-moon-guide__photo img').all()) {
    await photo.scrollIntoViewIfNeeded();
    await expect.poll(() => photo.evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  const april = page.locator('[data-moon-rows] tr').filter({ has: page.locator('time[datetime="2027-04-06T23:51:00Z"]') });
  const meterTops = await page.locator('.new-moon-comparison meter').evaluateAll(meters => meters.map(meter => meter.getBoundingClientRect().top));
  expect(meterTops).toHaveLength(2);
  expect(Math.abs(meterTops[0] - meterTops[1])).toBeLessThanOrEqual(1);
  await expect(april.locator('th')).toHaveText('7. aprila 2027');
  await expect(april.locator('td').nth(1)).toHaveText('01:51 CEST');
  await expect(april.locator('td').last()).toContainText('6. aprila 2027');
  await page.locator('[data-astro-year]').selectOption('2030');
  await expect(page.locator('[data-year-title]')).toHaveText('Mlaji 2030');
  await expect(page.locator('[data-astro-ics]')).toHaveAttribute('href', '/astronomy/new_moon-2030.ics');
  const response = await page.request.get('/astronomy/new_moon-2030.ics');
  expect(response.ok()).toBe(true);
  expect((await response.text()).match(/BEGIN:VEVENT/g)).toHaveLength(await page.locator('[data-moon-rows] tr').count());
});

test('eclipse controls distinguish a visible interval from a maximum below the horizon',async({page})=>{
  await page.goto('/soncni-mrk/?year=2026&city=maribor');
  await dismissCookies(page);
  await expect(page.locator('[data-astro-city]')).toHaveValue('maribor');
  await expect(page.locator('[data-detail-summary]')).toContainText('Maksimum je pod obzorjem');
  await expect(page.locator('[data-detail-percent]')).toBeHidden();
  await expect(page.locator('.astro-altitude-chart:visible path')).toHaveAttribute('d',/^M/);
  await page.locator('[data-astro-year]').selectOption('2028');
  await page.locator('[data-astro-city]').selectOption('ljubljana');
  await expect(page.locator('[data-detail-status]')).toHaveText('Delni mrk nad obzorjem');
  await page.locator('[data-astro-year]').selectOption('2029');
  await expect(page.locator('[data-astro-ics]')).toHaveAttribute('aria-disabled','true');
  await expect(page.locator('[data-detail-status]')).toHaveText('Iz kraja ni viden');
});

test('Perseids compare night and moon conditions with a calendar export and no invented exact peak',async({page})=>{
  await page.goto('/perzeidi/?year=2027&city=koper');
  await dismissCookies(page);
  await expect(page.locator('.astro-night')).toHaveCount(3);
  await expect(page.locator('.astro-purpose-note')).toContainText('ne točna napoved maksimuma');
  await expect(page.locator('[data-astro-ics]')).toHaveAttribute('href','/astronomy/perseids-2027-koper.ics');
  await page.locator('[data-astro-city]').selectOption('murska-sobota');
  await expect(page.locator('.astro-night-heading strong').first()).toContainText('Murska Sobota');
  await expect(page.locator('[data-astro-ics]')).toHaveAttribute('href','/astronomy/perseids-2027-murska-sobota.ics');
});

test('astronomy pages fit a narrow phone and use the legible mobile illustration',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  for(const route of ['/polna-luna/','/soncni-mrk/','/lunin-mrk/','/perzeidi/']){
    await page.goto(route);
    await dismissCookies(page);
    expect(await page.evaluate(()=>document.body.scrollWidth)).toBeLessThanOrEqual(390);
    await page.locator('.astro-explainer-figure').scrollIntoViewIfNeeded();
    await expect.poll(()=>page.locator('.astro-explainer-figure img').evaluate(img=>img.currentSrc)).toMatch(/-mobile\.webp/);
    await expect(page.locator('h1')).toHaveCount(1);
  }
});

test('astronomy calendar keeps cards, controls and event times aligned', async ({ page }) => {
  await page.goto('/astronomski-koledar/?year=2027&month=8');
  await expect(page.locator('[data-sl-sky-row="eclipse"]:visible')).toHaveCount(2);
  await page.evaluate(() => document.fonts.ready);

  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });

    const dimensions = await page.evaluate(() => {
      const box = element => element.getBoundingClientRect();
      const actions = [...document.querySelectorAll('.sky-masthead__actions a')].map(box);
      const topicOffsets = [...document.querySelectorAll('.sky-topic')].map(card =>
        box(card.querySelector('strong')).top - box(card).top);
      const [row] = [...document.querySelectorAll('[data-sl-sky-row="eclipse"]')]
        .filter(element => element.getClientRects().length);
      const titleTop = box(row.querySelector('a')).top;
      const canvas = document.createElement('canvas').getContext('2d');
      const clippedFilters = [...document.querySelectorAll('.sky-filters select')].filter(select => {
        const style = getComputedStyle(select);
        canvas.font = [style.fontWeight, style.fontSize, style.fontFamily].join(' ');
        const available = select.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
        return [...select.options].some(option => canvas.measureText(option.text).width > available + 1);
      });
      return {
        overflow: document.documentElement.scrollWidth - innerWidth,
        buttonWidthDifference: Math.abs(actions[0].width - actions[1].width),
        headingOffsetDifference: Math.max(...topicOffsets) - Math.min(...topicOffsets),
        clippedFilters: clippedFilters.map(select => select.name),
        rowDateOffset: Math.abs(box(row.querySelector('.sky-row__day')).top - titleTop),
        rowTimeOffset: Math.abs(box(row.querySelector('.sky-row__time')).top - titleTop)
      };
    });

    expect(dimensions.overflow, 'horizontal overflow at ' + width).toBe(0);
    expect(dimensions.buttonWidthDifference).toBeLessThanOrEqual(1);
    expect(dimensions.headingOffsetDifference).toBeLessThanOrEqual(1);
    expect(dimensions.clippedFilters).toEqual([]);
    expect(dimensions.rowDateOffset).toBeLessThanOrEqual(1);
    expect(dimensions.rowTimeOffset).toBeLessThanOrEqual(4);
  }
});
