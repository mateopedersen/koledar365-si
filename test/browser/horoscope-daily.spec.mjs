import { test, expect } from '@playwright/test';
import { makeEdition } from '../../lib/horoscope/edition.mjs';
import { localDate } from '../../public/horoscope/math-v1.mjs';

test('an early Yesterday click takes priority over the initial daily refresh', async ({ page }) => {
  const today = localDate();
  const previous = new Date(today + 'T12:00:00Z');
  previous.setUTCDate(previous.getUTCDate() - 1);
  const yesterday = previous.toISOString().slice(0, 10);
  const requests = [];

  await page.addInitScript(() => {
    const original = window.setTimeout;
    window.setTimeout = (callback, delay, ...args) => {
      if (delay === 50 && callback.toString().includes('refresh()')) {
        window.startInitialHoroscopeRefresh = () => callback(...args);
        return 0;
      }
      return original(callback, delay, ...args);
    };
  });

  await page.route('**/horoskop/dnevno.json?date=*', async route => {
    const date = new URL(route.request().url()).searchParams.get('date');
    requests.push(date);
    if (date === yesterday) {
      // Start the scheduled refresh while the selected edition is in flight.
      await page.evaluate(() => window.startInitialHoroscopeRefresh());
    }
    await route.fulfill({ json: makeEdition(date) });
  });

  await page.goto('/horoskop/tehtnica/');
  await page.waitForFunction(() => typeof window.startInitialHoroscopeRefresh === 'function');
  await page.getByRole('button', { name: 'Včeraj', exact: true }).click();
  await expect(page.locator('[data-edition-date]')).toHaveAttribute('datetime', yesterday);
  await expect(page.getByRole('button', { name: 'Včeraj', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(requests).toEqual([yesterday]);
});
