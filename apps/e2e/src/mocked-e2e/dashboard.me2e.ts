import { expect, type Locator, test } from '@playwright/test';
import { DashboardPage } from '../page-objects/dashboard-page.po';

let dashboardPage: DashboardPage;

const clickFirstSlice = async (canvas: Locator) => {
  const box = await canvas.boundingBox();
  if (!box) {
    throw new Error('Incident chart canvas is not visible');
  }

  const radius = Math.min(box.width, box.height) / 2;
  await canvas.click({
    position: { x: box.width / 2 + radius * 0.8, y: box.height / 2 },
  });
};

test.beforeEach(async ({ context, page }) => {
  dashboardPage = new DashboardPage(page);

  await dashboardPage.initialPageLoad(context);
});

test.describe('The Dashboard', () => {
  test.describe('has an incident volume widget', () => {
    test('that should allow drilling down into the subset of data', async ({ page }) => {
      const dataPoint = page.locator('.chart-wrapper .chart-canvas').first();

      await clickFirstSlice(dataPoint);

      await page.waitForTimeout(2000);

      // center label is a link with the total
      await expect(page.getByRole('link', { name: '2' })).toBeVisible();
    });

    test('that should allow drilling up into the subset of data', async ({ page }) => {
      const dataPoint = page.locator('.chart-wrapper .chart-canvas').first();
      await clickFirstSlice(dataPoint);

      await page.waitForTimeout(2000);

      await page.getByRole('button', { name: 'Return to main view' }).click();

      await page.waitForTimeout(2000);

      await expect(page.getByRole('link', { name: '4' })).toBeVisible();
    });

    test('that should show correct total after drilling in/out with one or more section hidden', async ({ page }) => {
      const firstWidget = page.locator('.chart-wrapper').first();
      const centerLabel = firstWidget.locator('.chart-center-label');
      const firstLegendItem = firstWidget.locator('.chart-legend .legend-item').first();

      const getTotal = async () => parseInt((await centerLabel.textContent()) || '', 10);

      // 1. Get unfiltered total
      const unfilteredTotal1 = await getTotal();

      // 2. Toggle visibility of an item via the legend
      await firstLegendItem.click();

      // 3. The total should decrease accordingly
      const filteredTotal1 = await getTotal();
      expect(filteredTotal1).toBeLessThanOrEqual(unfilteredTotal1);

      await page.waitForTimeout(2000);

      // 4. Click a visible series (drill down)
      const dataPoint = firstWidget.locator('.chart-canvas');
      await clickFirstSlice(dataPoint);

      await page.waitForTimeout(2000);

      // 5. Click the Main link in the breadcrumb (drill up)
      await firstWidget.getByRole('button', { name: 'Return to main view' }).click();

      await page.waitForTimeout(2000);

      // 6. Get (filtered) total - it should be the same as after step 3
      const filteredTotal2 = await getTotal();
      expect(filteredTotal2).toEqual(filteredTotal1);

      // 7. Toggle visibility of the invisible series item
      await firstLegendItem.click();

      // 8. Get unfiltered total - it should match the total from step 1
      const unfilteredTotal2 = await getTotal();
      expect(unfilteredTotal2).toEqual(unfilteredTotal1);
      expect(unfilteredTotal2).toBeGreaterThanOrEqual(filteredTotal2);
    });
  });
});
