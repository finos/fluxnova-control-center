import { expect, Locator, test } from '@playwright/test';
import {
  changeColumnOrderVerifyAndResetView,
  changeColumnWidthVerifyAndResetView,
  changeFilterVerifyAndResetView,
  changeSortingVerifyAndResetView,
  uncheckToggleFilterVerifyAndResetView,
} from '../../shared/reset-view';
import { BasePage } from '../../page-objects/base-page.po';

test.describe('Decision Definitions List - Reset View', () => {
  /*
  1. Verify that Reset View is not displayed.
  2. Uncheck Latest Version, verify that Reset View appears, click Reset View,
     verify Reset View is cleared and Latest Version is checked
  3. Change a column width, verify that Reset View appears, click Reset View,
     verify Reset View is cleared and column width is the original width
  4. Change a column order, verify that Reset View appears, click Reset View,
     verify Reset View is cleared and column order is the original order
  5. Change filtering, verify that Reset View appears, click Reset View,
     verify Reset View is cleared and filtering is gone
  6. Change sorting, verify that Reset View appears, click Reset View,
     verify Reset View is cleared and verify default sort
  */
  let resetViewButton: Locator;

  test.beforeEach(async ({ page }) => {
    await page.goto(
      `./${BasePage.TENANT}/decision-definitions?sorting=%5B%7B"colId":"key","sort":"asc"%7D%5D&filter=%7B%7D&toggleFilters=latestVersion`,
    );

    await page.waitForSelector('.ag-pinned-left-cols-container .ag-row');

    // 1. Verify that Reset View is not displayed
    resetViewButton = page.getByRole('button', { name: 'Reset View' });
    if (await resetViewButton.isVisible()) {
      await resetViewButton.click();
    }
    await expect(resetViewButton).toBeHidden();
  });

  test('should change state of Latest Version', async ({ page }) => {
    // 2. Uncheck Latest Version, verify that Reset View appears, click Reset View, verify Reset View is cleared and Latest Version is checked
    await uncheckToggleFilterVerifyAndResetView('latestVersion', page, resetViewButton);
  });

  test('should change column width', async ({ page }) => {
    // 3. Change a column width, verify Reset View appears, click it, verify it is cleared and column width is the original width
    await changeColumnWidthVerifyAndResetView('Version', 'Definition Key', page, resetViewButton);
  });

  test('should change column order', async ({ page }) => {
    // 4. Change a column order, verify that Reset View appears, click it, verify it is cleared and column order is the original order
    await changeColumnOrderVerifyAndResetView('Version', 'Definition Key', page, resetViewButton);
  });

  test('should change filtering', async ({ page }) => {
    // 5. Change filtering, verify that Reset View appears, click it, verify it is cleared and filtering is gone
    await changeFilterVerifyAndResetView('key', page, resetViewButton);
  });

  test('should change sorting', async ({ page }) => {
    // 6. Change sorting, verify Reset View appears, click Reset View, verify Reset View is cleared and verify default sort
    await changeSortingVerifyAndResetView('Name', 'Definition Key', true, page, resetViewButton);
  });
});
