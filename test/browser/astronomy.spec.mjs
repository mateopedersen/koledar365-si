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
