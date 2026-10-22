import { test, expect } from '@playwright/test';

const views = ['month', 'week', 'day', 'list', 'year'];
const widths = [320, 390, 644, 768, 1024, 1440];

test('personal calendar action borders align and fit across home views and screen widths', async ({ page }) => {
  for (const view of views) {
    await page.goto(`/?year=2026&month=10&date=2026-10-22&view=${view}`);
    const grid = page.locator('.right-panel .button-grid');
    await expect(grid, `${view} view exposes the shared personal calendar actions`).toBeVisible();
    await expect(grid.locator(':scope > *')).toHaveCount(4);

    for (const width of widths) {
      await page.setViewportSize({ width, height: 1000 });
      const layout = await grid.evaluate((container) => {
        const gridRect = container.getBoundingClientRect();
        const controls = [...container.children].map((item) => {
          const rect = item.getBoundingClientRect();
          return {
            left: rect.left,
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
            margin: getComputedStyle(item).margin,
            clientWidth: item.clientWidth,
            scrollWidth: item.scrollWidth,
          };
        });
        const rows = [...new Set(controls.map((box) => Math.round(box.top)))].map((top) =>
          controls.filter((box) => Math.round(box.top) === top),
        );
        return {
          controls,
          rows,
          grid: { left: gridRect.left, right: gridRect.right, top: gridRect.top, bottom: gridRect.bottom },
          pageWidth: document.documentElement.scrollWidth,
        };
      });

      expect(layout.pageWidth, `page overflow at ${view}, ${width}px`).toBeLessThanOrEqual(width);
      expect(layout.rows, `two aligned rows at ${view}, ${width}px`).toHaveLength(2);
      for (const row of layout.rows) {
        expect(row).toHaveLength(2);
        expect(Math.abs(row[0].top - row[1].top), `row top at ${view}, ${width}px`).toBeLessThanOrEqual(1);
        expect(Math.abs(row[0].height - row[1].height), `row height at ${view}, ${width}px`).toBeLessThanOrEqual(1);
        expect(Math.abs(row[0].width - row[1].width), `column width at ${view}, ${width}px`).toBeLessThanOrEqual(1);
      }
      for (const control of layout.controls) {
        expect(control.margin, `control margin at ${view}, ${width}px`).toBe('0px');
        expect(control.left, `left border at ${view}, ${width}px`).toBeGreaterThanOrEqual(layout.grid.left - 1);
        expect(control.right, `right border at ${view}, ${width}px`).toBeLessThanOrEqual(layout.grid.right + 1);
        expect(control.top, `top border at ${view}, ${width}px`).toBeGreaterThanOrEqual(layout.grid.top - 1);
        expect(control.bottom, `bottom border at ${view}, ${width}px`).toBeLessThanOrEqual(layout.grid.bottom + 1);
        expect(control.scrollWidth, `content fits control at ${view}, ${width}px`).toBeLessThanOrEqual(control.clientWidth + 1);
      }
    }
  }
});

test('backup and restore action borders align on the other planner pages', async ({ page }) => {
  const groups = [
    { path: '/solski-urnik/', selector: '.student-backup-actions', count: 2 },
    { path: '/druzinski-planer/', selector: '.family-backup-actions', count: 2 },
    { path: '/razpored-izmen/', selector: '.shift-saved__actions', count: 3 },
    ...['/prazen-koledar/', '/rojstnodnevni-koledar/', '/dnevni-planer/', '/druzinski-planer/', '/koledar-za-tiskanje/'].map((path) => ({ path, selector: '.planner-backup-actions', count: 3, openDetails: true })),
  ];

  for (const { path, selector, count, openDetails } of groups) {
    await page.goto(path);
    if (openDetails) {
      await page.locator('[data-context-expand]').click();
      await page.locator('details.planner-inputs > summary').click();
    }
    const group = page.locator(selector);
    await expect(group, `${path} exposes its backup actions`).toBeVisible();
    await expect(group.locator(':scope > *')).toHaveCount(count);

    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 1000 });
      await expect(group, `${path} actions visible at ${width}px`).toBeVisible();
      const layout = await group.evaluate((container) => {
        const groupRect = container.getBoundingClientRect();
        const controls = [...container.children].map((item) => {
          const rect = item.getBoundingClientRect();
          return {
            left: rect.left,
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
            margin: getComputedStyle(item).margin,
            clientWidth: item.clientWidth,
            scrollWidth: item.scrollWidth,
          };
        });
        const rows = [...new Set(controls.map((box) => Math.round(box.top)))].map((top) =>
          controls.filter((box) => Math.round(box.top) === top),
        );
        return { controls, rows, group: { left: groupRect.left, right: groupRect.right, top: groupRect.top, bottom: groupRect.bottom } };
      });

      for (const row of layout.rows) {
        expect(Math.max(...row.map((box) => box.height)) - Math.min(...row.map((box) => box.height)), `${path} row heights at ${width}px`).toBeLessThanOrEqual(1);
        if (row.length > 1) {
          expect(Math.max(...row.map((box) => box.width)) - Math.min(...row.map((box) => box.width)), `${path} column widths at ${width}px`).toBeLessThanOrEqual(1);
        }
      }
      for (const control of layout.controls) {
        expect(control.margin, `${path} control margin at ${width}px`).toBe('0px');
        expect(control.left, `${path} left border at ${width}px`).toBeGreaterThanOrEqual(layout.group.left - 1);
        expect(control.right, `${path} right border at ${width}px`).toBeLessThanOrEqual(layout.group.right + 1);
        expect(control.top, `${path} top border at ${width}px`).toBeGreaterThanOrEqual(layout.group.top - 1);
        expect(control.bottom, `${path} bottom border at ${width}px`).toBeLessThanOrEqual(layout.group.bottom + 1);
        expect(control.scrollWidth, `${path} content at ${width}px`).toBeLessThanOrEqual(control.clientWidth + 1);
      }
    }
  }
});
