import { expect, Locator, test } from '@playwright/test';
import {
  changeColumnOrderVerifyAndResetView,
  changeColumnWidthVerifyAndResetView,
  changeFilterVerifyAndResetView,
  changeSortingVerifyAndResetView,
} from '../../shared/reset-view';
import { BasePage } from '../../page-objects/base-page.po';

test.describe('Deployments List - Reset View', () => {
  /*
  1. Verify that Reset View is not displayed.
  2. Change a column width, verify that Reset View appears, click Reset View,
     verify Reset View is cleared and column width is the original width
  3. Change a column order, verify that Reset View appears, click Reset View,
     verify Reset View is cleared and column order is the original order
  4. Change filtering, verify that Reset View appears, click Reset View,
     verify Reset View is cleared and filtering is gone
  5. Change sorting, verify that Reset View appears, click Reset View,
     verify Reset View is cleared and verify default sort
  */
  let resetViewButton: Locator;

  test.beforeEach(async ({ page }) => {
    await page.goto(`./${BasePage.TENANT}/deployments?sorting=%5B%7B"colId":"deploymentTime","sort":"desc"%7D%5D`);

    await page.waitForSelector('.ag-pinned-left-cols-container .ag-row');

    // 1. Verify that Reset View is not displayed
    resetViewButton = page.getByRole('button', { name: 'Reset View' });
    if (await resetViewButton.isVisible()) {
      await resetViewButton.click();
    }
    await expect(resetViewButton).toBeHidden();
  });

  test('should change column width', async ({ page }) => {
    // 2. Change a column width, verify Reset View appears, click it, verify it is cleared and column width is the original width
    await changeColumnWidthVerifyAndResetView('ID', 'Name', page, resetViewButton);
  });

  test('should change column order', async ({ page }) => {
    // 3. Change a column order, verify that Reset View appears, click it, verify it is cleared and column order is the original order
    await changeColumnOrderVerifyAndResetView('Name', 'Deploy Time', page, resetViewButton);
  });

  test('should change filtering', async ({ page }) => {
    // 4. Change filtering, verify that Reset View appears, click it, verify it is cleared and filtering is gone
    await changeFilterVerifyAndResetView('name', page, resetViewButton);
  });

  test('should change sorting', async ({ page }) => {
    // 5. Change sorting, verify Reset View appears, click Reset View, verify Reset View is cleared and verify default sort
    await changeSortingVerifyAndResetView('ID', 'Deploy Time', false, page, resetViewButton);
  });
});
