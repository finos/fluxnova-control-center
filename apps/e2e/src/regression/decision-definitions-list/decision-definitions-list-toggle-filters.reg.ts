import { expect, Locator, test } from '@playwright/test';
import { BasePage } from '../../page-objects/base-page.po';

test.describe('Decision Definitions List - Latest Version Toggle', () => {
  /*
  1. Verify that Latest Version toggle is checked (selected).
  */
  let toggleButton: Locator;

  test.beforeEach(async ({ page }) => {
    await page.goto(
      `./${BasePage.TENANT}/decision-definitions?sorting=%5B%7B"colId":"key","sort":"asc"%7D%5D&filter=%7B%7D&toggleFilters=latestVersion`,
    );

    await page.waitForSelector('.ag-pinned-left-cols-container .ag-row');

    // 1. Verify that Latest Version toggle is checked (selected).
    toggleButton = page.locator('fluxnova-toggle-filters').locator('.latestVersion');
    if (!(await toggleButton.isChecked())) {
      await toggleButton.click();
    }
    await expect(toggleButton).toBeChecked();
  });

  test('should change toggle state', async ({ page }) => {
    /*
    1. Get Latest Version total count
    2. Uncheck 'Latest Version'
    3. Verify that Latest Version total count is less than all items total count
    */
    await page.waitForSelector('.ag-pinned-left-cols-container .ag-row');

    // 1. Get Latest Version total count
    const latestVersionTotal = Number(
      (await page.locator('.total-items').nth(0).innerText()).replace(/ of | items/g, ''),
    );
    // 2. Uncheck 'Latest Version'
    await page.getByText('Latest Version').click();
    // 3. Verify that Latest Version total count is less than all items total count
    const allItemsTotal = Number((await page.locator('.total-items').nth(0).innerText()).replace(/ of | items/g, ''));
    expect(latestVersionTotal).toBeLessThan(allItemsTotal);
  });
});
