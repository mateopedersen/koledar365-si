import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const readability = fs.readFileSync(path.join(root, 'app/assets/stylesheets/readability.css'), 'utf8');
const marker = readability.indexOf('/* K365-control-system-v1');
if (marker < 0) throw new Error('Shared control sizing rules are missing');
const controlStyles = readability.slice(marker);

const pageFamilies = [
  '/',
  '/koledar/2027/februar/',
  '/koledar/2030/',
  '/prazen-koledar/',
  '/koledar-za-tiskanje/',
  '/prazniki/',
  '/prazniki/marijino-vnebovzetje/',
  '/solski-urnik/',
  '/datumski-kalkulator/',
  '/zasebnost/',
  '/solske-pocitnice/',
];

const publishedRoutes = [...fs.readFileSync(path.join(root, 'site/sitemap-pages.xml'), 'utf8').matchAll(/<loc>(.*?)<\/loc>/g)]
  .map(([, location]) => new URL(location).pathname);

async function applySizingRules(page) {
  await page.addStyleTag({ content: controlStyles });
}

test('shared controls have consistent, usable dimensions across site page families', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('k365.consent', JSON.stringify({
    version: 2,
    choice: 'essential',
    preferences: false,
    analytics: false,
    advertising: false,
    at: new Date().toISOString(),
    expiresAt: Date.now() + 86400000,
  })));

  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 960 });

    for (const route of pageFamilies) {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(response?.status(), route).toBe(200);
      await applySizingRules(page);

      const geometry = await page.evaluate(() => {
        const viewport = document.documentElement.clientWidth;
        const contentOverflow = document.documentElement.scrollWidth > viewport + 1
          ? [...document.querySelectorAll('#vsebina *')]
            .map((element) => {
              const rect = element.getBoundingClientRect();
              return { tag: element.tagName, className: typeof element.className === 'string' ? element.className : '', right: Math.round(rect.right), width: Math.round(rect.width) };
            })
            .filter((element) => element.width > 0 && element.right > viewport + 1)
            .slice(0, 8)
          : [];
        const visible = (element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const standard = [...document.querySelectorAll(
          '#vsebina button:not(.text-button):not(.square):not(.category-chip):not(.student-icon-button), #vsebina .button:not(.text-button):not(.square):not(.category-chip):not(.student-icon-button), #vsebina input[type="submit"]',
        )].filter(visible).map((element) => ({
          label: (element.innerText || element.getAttribute('aria-label') || element.value || '').trim().slice(0, 30),
          height: element.getBoundingClientRect().height,
        }));
        const fields = [...document.querySelectorAll(
          '#vsebina input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]), #vsebina select',
        )].filter(visible).map((element) => ({
          label: element.getAttribute('aria-label') || element.name || element.tagName,
          height: element.getBoundingClientRect().height,
        }));
        return {
          viewport,
          document: document.documentElement.scrollWidth,
          contentOverflow,
          standard,
          fields,
        };
      });

      expect(geometry.document, `${route} at ${width}px has horizontal overflow: ${JSON.stringify(geometry)}`).toBeLessThanOrEqual(geometry.viewport + 1);
      expect(geometry.standard.length, `${route} should expose at least one standard control`).toBeGreaterThan(0);
      for (const control of [...geometry.standard, ...geometry.fields]) {
        expect(control.height, `${route} at ${width}px: ${JSON.stringify(control)}`).toBeGreaterThanOrEqual(47);
      }
    }
  }
});

test('paired student, calendar and gallery controls keep matching box sizes', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('k365.consent', JSON.stringify({
    version: 2, choice: 'essential', preferences: false, analytics: false,
    advertising: false, at: new Date().toISOString(), expiresAt: Date.now() + 86400000,
  })));

  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 960 });
    await page.goto('/solski-urnik/', { waitUntil: 'domcontentloaded' });
    await applySizingRules(page);

    const student = await page.evaluate(() => {
      const rects = (selector) => [...document.querySelectorAll(selector)].filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }).map((element) => {
        const rect = element.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      });
      return {
        focus: rects('.student-focus-controls > :is(select, .button)'),
        backup: rects('.student-backup-actions > .button'),
      };
    });
    for (const [name, group] of Object.entries(student)) {
      expect(group.length, `${name} controls should render`).toBeGreaterThanOrEqual(2);
      expect(Math.max(...group.map((rect) => rect.height)) - Math.min(...group.map((rect) => rect.height)), `${name} heights at ${width}px`).toBeLessThanOrEqual(1);
      const widths = name === 'focus' && width < 761 ? group.slice(1) : group;
      expect(Math.max(...widths.map((rect) => rect.width)) - Math.min(...widths.map((rect) => rect.width)), `${name} widths at ${width}px`).toBeLessThanOrEqual(2);
    }

    await page.goto('/koledar/2027/februar/', { waitUntil: 'domcontentloaded' });
    await applySizingRules(page);
    await page.locator('[data-context-expand]').click();
    const monthControls = await page.locator('.calendar-title :is(button, .button)').evaluateAll((elements) => elements
      .filter((element) => element.getBoundingClientRect().width > 0)
      .map((element) => element.getBoundingClientRect().height));
    expect(monthControls.length).toBeGreaterThanOrEqual(3);
    expect(Math.max(...monthControls) - Math.min(...monthControls), `month toolbar at ${width}px`).toBeLessThanOrEqual(1);

    const downloadHeights = await page.locator('.calendar-design-downloads').first().evaluate((parent) => [...parent.children]
      .filter((element) => element.classList.contains('button'))
      .map((element) => element.getBoundingClientRect().height));
    expect(downloadHeights).toHaveLength(2);
    expect(Math.abs(downloadHeights[0] - downloadHeights[1]), `PDF/WebP pair at ${width}px`).toBeLessThanOrEqual(2);
  }
});

test('every published sitemap page fits a phone and keeps standard controls usable', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'A full 382-page audit runs once; the companion test covers the other engines.');
  test.setTimeout(300000);

  await page.addInitScript(() => localStorage.setItem('k365.consent', JSON.stringify({
    version: 2, choice: 'essential', preferences: false, analytics: false,
    advertising: false, at: new Date().toISOString(), expiresAt: Date.now() + 86400000,
  })));

  expect(publishedRoutes.length).toBeGreaterThan(300);
  for (const width of [390]) {
    await page.setViewportSize({ width, height: 960 });
    await page.route('**/*', (request) => ['image', 'media'].includes(request.request().resourceType()) ? request.abort() : request.continue());
    for (const route of publishedRoutes) {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(response?.status(), `${route} at ${width}px`).toBe(200);
      await applySizingRules(page);
      const geometry = await page.evaluate(() => {
        const visible = (element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const controls = [...document.querySelectorAll(
          '#vsebina button:not(.text-button):not(.square):not(.category-chip):not(.student-icon-button), #vsebina .button:not(.text-button):not(.square):not(.category-chip):not(.student-icon-button), #vsebina input[type="submit"], #vsebina input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]), #vsebina select',
        )].filter(visible);
        const viewport = document.documentElement.clientWidth;
        const contentOverflow = document.documentElement.scrollWidth > viewport + 1
          ? [...document.querySelectorAll('#vsebina *')]
            .map((element) => {
              const rect = element.getBoundingClientRect();
              return { tag: element.tagName, className: typeof element.className === 'string' ? element.className : '', right: Math.round(rect.right), width: Math.round(rect.width) };
            })
            .filter((element) => element.width > 0 && element.right > viewport + 1)
            .slice(0, 8)
          : [];
        return {
          viewport,
          document: document.documentElement.scrollWidth,
          contentOverflow,
          heights: controls.map((element) => element.getBoundingClientRect().height),
        };
      });
      expect(geometry.document, `${route} at ${width}px has horizontal overflow: ${JSON.stringify(geometry)}`).toBeLessThanOrEqual(geometry.viewport + 1);
      for (const height of geometry.heights) {
        expect(height, `${route} at ${width}px exposes a control shorter than 47px`).toBeGreaterThanOrEqual(47);
      }
    }
  }
});
