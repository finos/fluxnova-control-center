import { expect, Locator, test } from '@playwright/test';
import {
  changeColumnOrderVerifyAndResetView,
  changeColumnWidthVerifyAndResetView,
  changeFilterVerifyAndResetView,
  changeSortingVerifyAndResetView,
  checkToggleFilterVerifyAndResetView,
} from '../../shared/reset-view';
import { BasePage } from '../../page-objects/base-page.po';

test.describe('Process Instances List - Reset View', () => {
  /*
  1. Verify that Reset View is not displayed.
  2. Check 'With Incidents' toggle, verify that Reset View appears, click Reset View,
     verify Reset View is cleared and With Incidents is unchecked
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
    await page.goto(`./${BasePage.TENANT}/process-instances?page=1&pageSize=50`);

    await page.waitForSelector('.ag-pinned-left-cols-container .ag-row');

    // 1. Verify that Reset View is not displayed
    resetViewButton = page.getByRole('button', { name: 'Reset View' });
    if (await resetViewButton.isVisible()) {
      await resetViewButton.click();
    }
    await expect(resetViewButton).toBeHidden();
  });

  test('should change state of With Incidents', async ({ page }) => {
    // 2. Check 'With Incidents' toggle, verify Reset View appears, click Reset View, verify it is cleared and With Incidents is unchecked
    await checkToggleFilterVerifyAndResetView('withIncidents', page, resetViewButton);
  });

  test('should change column width', async ({ page }) => {
    // 3. Change a column width, verify Reset View appears, click it, verify it is cleared and column width is the original width
    await changeColumnWidthVerifyAndResetView('Definition Name', 'Version', page, resetViewButton);
  });

  test('should change column order', async ({ page }) => {
    // 4. Change a column order, verify that Reset View appears, click it, verify it is cleared and column order is the original order
    await changeColumnOrderVerifyAndResetView('Definition Name', 'Version', page, resetViewButton);
  });

  test('should change filtering', async ({ page }) => {
    // 5. Change filtering, verify that Reset View appears, click it, verify it is cleared and filtering is gone
    await changeFilterVerifyAndResetView('processDefinitionName', page, resetViewButton);
  });

  test('should change sorting', async ({ page }) => {
    // 6. Change sorting, verify Reset View appears, click Reset View, verify Reset View is cleared and verify default sort
    await changeSortingVerifyAndResetView('Instance ID', 'Start Time', false, page, resetViewButton);
  });
});
