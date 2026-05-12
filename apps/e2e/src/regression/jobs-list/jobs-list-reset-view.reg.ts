import { expect, Locator, test } from '@playwright/test';
import {
  changeColumnOrderVerifyAndResetView,
  changeColumnWidthVerifyAndResetView,
  changeFilterVerifyAndResetView,
  changeSortingVerifyAndResetView,
  checkToggleFilterVerifyAndResetView,
  uncheckToggleFilterVerifyAndResetView,
} from '../../shared/reset-view';
import { BasePage } from '../../page-objects/base-page.po';

test.describe('Jobs List - Reset View', () => {
  /*
  Before each test: navigate to Jobs list with 'Has Retries Left' toggle active,
  wait for rows to load, and ensure Reset View is not displayed (click it away if present).

  1. Verify that Reset View is not displayed.
  2. Uncheck 'Has Retries Left', verify that Reset View appears, click Reset View,
     verify Reset View is cleared and Has Retries Left is checked.
  3. Check 'Ready to be Executed', verify that Reset View appears, click Reset View,
     verify Reset View is cleared and Ready to be Executed is unchecked.
  4. Check 'Has Exception', verify that Reset View appears, click Reset View,
     verify Reset View is cleared and Has Exception is unchecked.
  5. Change a column width, verify that Reset View appears, click Reset View,
     verify Reset View is cleared and column width is the original width.
  6. Change a column order, verify that Reset View appears, click Reset View,
     verify Reset View is cleared and column order is the original order.
  7. Change filtering, verify that Reset View appears, click Reset View,
     verify Reset View is cleared and filtering is gone.
  8. Change sorting, verify that Reset View appears, click Reset View,
     verify Reset View is cleared and default sort is restored.
  */
  let resetViewButton: Locator;

  test.beforeEach(async ({ page }) => {
    await page.goto(`./${BasePage.TENANT}/jobs?toggleFilters=withRetriesLeft`);

    await page.waitForSelector('.ag-pinned-left-cols-container .ag-row');

    // 1. Verify that Reset View is not displayed
    resetViewButton = page.getByRole('button', { name: 'Reset View' });
    if (await resetViewButton.isVisible()) {
      await resetViewButton.click();
    }
    await expect(resetViewButton).toBeHidden();
  });

  test('should change state of Has Retries Left', async ({ page }) => {
    // 2. Uncheck 'Has Retries Left', verify Reset View appears, click Reset View, verify it is cleared and Has Retries Left is checked
    await uncheckToggleFilterVerifyAndResetView('withRetriesLeft', page, resetViewButton);
  });

  test('should change state of Ready to be Executed', async ({ page }) => {
    // Check 'Ready to be Executed', verify Reset View appears, click Reset View, verify it is cleared and Ready to be Executed is unchecked
    await checkToggleFilterVerifyAndResetView('executable', page, resetViewButton);
  });

  test('should change state of Has Exception', async ({ page }) => {
    // Check 'Has Exception', verify Reset View appears, click Reset View, verify it is cleared and Has Exception is unchecked
    await checkToggleFilterVerifyAndResetView('withException', page, resetViewButton);
  });

  test('should change column width', async ({ page }) => {
    // 3. Change a column width, verify Reset View appears, click it, verify it is cleared and column width is the original width
    await changeColumnWidthVerifyAndResetView('Job Definition ID', 'Process Definition Key', page, resetViewButton);
  });

  test('should change column order', async ({ page }) => {
    // 4. Change a column order, verify that Reset View appears, click it, verify it is cleared and column order is the original order
    await changeColumnOrderVerifyAndResetView('Process Definition Key', 'Exception Message', page, resetViewButton);
  });

  test('should change filtering', async ({ page }) => {
    // 5. Change filtering, verify that Reset View appears, click it, verify it is cleared and filtering is gone
    await changeFilterVerifyAndResetView('processDefinitionKey', page, resetViewButton);
  });

  test('should change sorting', async ({ page }) => {
    // 6. Change sorting, verify Reset View appears, click Reset View, verify Reset View is cleared and verify default sort
    await changeSortingVerifyAndResetView('Job ID', 'Due Time', false, page, resetViewButton);
  });
});
