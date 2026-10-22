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
