import { expect, Locator, test } from '@playwright/test';
import { createBatchJob, deleteBatchJob } from '../../utils/test-utils';
import { BasePage } from '../../page-objects/base-page.po';

/**
 * @group regression
 * @group batch-details
 * @group batch-details-remaining-jobs-tab
 */

test.describe('Batch Details - Remaining Jobs Tab', () => {
  let workingBatchId: string;
  let resetGridButton: Locator;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    workingBatchId = await createBatchJob(page);
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await deleteBatchJob(workingBatchId, page);
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(`./${BasePage.TENANT}/batches/${workingBatchId}`);
    await page.waitForLoadState('networkidle');

    // Navigate to Remaining Jobs tab
    const remainingJobsTab = page.locator('li.tab[data-tab="remaining-jobs"]');
    await remainingJobsTab.click();

    // Wait for the grid to load
    await page.waitForSelector('.ag-header-cell-text');

    // Wait for grid to load and be interactive
    await page.waitForFunction(() => {
      const agRoot = document.querySelector('.ag-root');
      const rowCount = agRoot?.getAttribute('aria-rowcount');
      return rowCount && parseInt(rowCount, 10) > 1;
    });

    // Initialize reset grid button locator
    resetGridButton = page.getByRole('button', { name: 'Reset Grid' });

    // Reset grid if it's visible from a previous test
    if (await resetGridButton.isVisible()) {
      await resetGridButton.click();
    }
    await expect(resetGridButton).toBeHidden();
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('should display all required column headers', async ({ page }) => {
    const expectedHeaders = ['Job ID', 'Job Definition ID', 'Create Time', 'Suspended'];

    for (const header of expectedHeaders) {
      const headerElement = page.locator('div[role="columnheader"]', { hasText: header });
      await expect(headerElement.first()).toBeVisible();
    }
  });

  test('should sort by job ID', async ({ page }) => {
    const jobIdHeader = page.locator('.ag-header-cell[col-id="id"][role="columnheader"]');
    await expect(jobIdHeader).toBeVisible();

    // Initially should be unsorted
    await expect(jobIdHeader).toHaveAttribute('aria-sort', 'none');

    // Click to sort ascending
    await jobIdHeader.click();
    await expect(jobIdHeader).toHaveAttribute('aria-sort', 'ascending');

    // Verify Reset Grid button appears
    await expect(resetGridButton).toBeVisible();

    // Click again to toggle to descending
    await jobIdHeader.click();
    await expect(jobIdHeader).toHaveAttribute('aria-sort', 'descending');

    // Reset Grid
    await resetGridButton.click();
    await expect(resetGridButton).toBeHidden();

    // Verify sort is removed (back to none)
    await expect(jobIdHeader).toHaveAttribute('aria-sort', 'none');
  });

  test('should allow adjusting column width', async ({ page }) => {
    const jobIdColumnHeader = page.locator('.ag-header-cell[col-id="id"][role="columnheader"]');
    await expect(jobIdColumnHeader).toBeVisible();

    const initialWidth = await jobIdColumnHeader.boundingBox();

    // Get the resize handle (right edge of the column header)
    const resizeHandle = jobIdColumnHeader.locator('.ag-header-cell-resize');

    // Drag to increase width
    await resizeHandle.hover();
    await page.mouse.down();
    await page.mouse.move((initialWidth?.x ?? 0) + (initialWidth?.width ?? 0) + 100, initialWidth?.y ?? 0);
    await page.mouse.up();

    const newWidth = await jobIdColumnHeader.boundingBox();
    expect(newWidth?.width).toBeGreaterThan(initialWidth?.width ?? 0);

    // Verify Reset Grid button appears
    await expect(resetGridButton).toBeVisible();

    // Click Reset Grid
    await resetGridButton.click();
    await expect(resetGridButton).toBeHidden();

    // Verify width is back to original
    const resetWidth = await jobIdColumnHeader.boundingBox();
    expect(resetWidth?.width).toBe(initialWidth?.width);
  });

  test('should not show reset grid button when no changes are made', async ({ page }) => {
    // Initially, reset button should be hidden
    await expect(resetGridButton).toBeHidden();

    // Click on a cell (not a sortable action)
    const firstRow = page.locator('.ag-center-cols-viewport .ag-row').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
    }

    // Reset Grid button should still be hidden
    await expect(resetGridButton).toBeHidden();
  });
});
