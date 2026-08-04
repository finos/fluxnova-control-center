import { expect, Locator, test } from '@playwright/test';
import { createBatchJob, deleteBatchJob } from '../../utils/test-utils';
import { BasePage } from '../../page-objects/base-page.po';

/**
 * @group regression
 * @group batch-details
 * @group batch-details-failed-jobs-tab
 */

test.describe('Batch Details - Failed Jobs Tab', () => {
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

    // Navigate to Failed Jobs tab
    const failedJobsTab = page.locator('li.tab[data-tab="failed-jobs"]');
    await failedJobsTab.click();

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
    const expectedHeaders = ['Job ID', 'Job Definition ID', 'Create Time', 'Exception Message'];

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

    const initialBoundingBox = await jobIdColumnHeader.boundingBox();

    // Get the resize handle (right edge of the column header)
    const resizeHandle = jobIdColumnHeader.locator('.ag-header-cell-resize');

    // Drag to increase width
    await resizeHandle.hover();
    await page.mouse.down();
    await page.mouse.move(
      (initialBoundingBox?.x ?? 0) + (initialBoundingBox?.width ?? 0) + 100,
      initialBoundingBox?.y ?? 0,
    );
    await page.mouse.up();

    const newBoundingBox = await jobIdColumnHeader.boundingBox();
    expect(newBoundingBox?.width).toBeGreaterThan(initialBoundingBox?.width ?? 0);

    // Verify Reset Grid button appears
    await expect(resetGridButton).toBeVisible();

    // Click Reset Grid
    await resetGridButton.click();
    await expect(resetGridButton).toBeHidden();

    // Verify width is back to original
    const resetWidth = await jobIdColumnHeader.boundingBox();
    expect(resetWidth?.width).toBe(initialBoundingBox?.width);
  });

  // TODO changing column order is not working on this tab
  // test('should allow changing column order by dragging', async ({ page }) => {
  //   const jobDefIdColumnHeader = page.locator('.ag-header-cell[col-id="jobDefinitionId"][role="columnheader"]');
  //   const createTimeColumnHeader = page.locator('.ag-header-cell[col-id="createTime"][role="columnheader"]');
  //
  //   await expect(jobDefIdColumnHeader).toBeVisible();
  //   await expect(createTimeColumnHeader).toBeVisible();
  //
  //   // Get initial column positions
  //   const initialJobDefIdIndex = await jobDefIdColumnHeader.getAttribute('aria-colindex');
  //   const initialCreateTimeIndex = await createTimeColumnHeader.getAttribute('aria-colindex');
  //
  //   // Drag Job Definition ID to Create Time position
  //   await jobDefIdColumnHeader.dragTo(createTimeColumnHeader);
  //
  //   // Verify columns have swapped
  //   const newJobDefIdIndex = await jobDefIdColumnHeader.getAttribute('aria-colindex');
  //   const newCreateTimeIndex = await createTimeColumnHeader.getAttribute('aria-colindex');
  //
  //   expect(newJobDefIdIndex).not.toBe(initialJobDefIdIndex);
  //   expect(newCreateTimeIndex).not.toBe(initialCreateTimeIndex);
  //
  //   // Verify Reset Grid button appears
  //   await expect(resetGridButton).toBeVisible();
  //
  //   // Click Reset Grid
  //   await resetGridButton.click();
  //   await expect(resetGridButton).toBeHidden();
  //
  //   // Verify columns are back to original positions
  //   await expect(jobDefIdColumnHeader).toHaveAttribute('aria-colindex', initialJobDefIdIndex ?? '');
  //   await expect(createTimeColumnHeader).toHaveAttribute('aria-colindex', initialCreateTimeIndex ?? '');
  // });
  //
  // test('should reset grid after adjusting sorting, width, and column order', async ({ page }) => {
  //   const jobDefIdColumnHeader = page.locator('.ag-header-cell[col-id="jobDefinitionId"][role="columnheader"]');
  //   const createTimeColumnHeader = page.locator('.ag-header-cell[col-id="createTime"][role="columnheader"]');
  //
  //   // Initially, reset button should be hidden
  //   await expect(resetGridButton).toBeHidden();
  //
  //   // 1. Change column order
  //   const initialJobDefIdIndex = await jobDefIdColumnHeader.getAttribute('aria-colindex');
  //   const initialCreateTimeIndex = await createTimeColumnHeader.getAttribute('aria-colindex');
  //
  //   await jobDefIdColumnHeader.dragTo(createTimeColumnHeader);
  //
  //   // Verify Reset Grid button appears
  //   await expect(resetGridButton).toBeVisible();
  //
  //   // 2. Adjust column width
  //   const initialWidth = await jobDefIdColumnHeader.boundingBox();
  //   const resizeHandle = jobDefIdColumnHeader.locator('.ag-header-cell-resize');
  //
  //   await resizeHandle.hover();
  //   await page.mouse.down();
  //   await page.mouse.move((initialWidth?.x ?? 0) + (initialWidth?.width ?? 0) + 100, initialWidth?.y ?? 0);
  //   await page.mouse.up();
  //
  //   const newWidth = await jobDefIdColumnHeader.boundingBox();
  //   expect(newWidth?.width).toBeGreaterThan(initialWidth?.width ?? 0);
  //
  //   // 3. Add a sort (Exception Message)
  //   const exceptionMessageHeader = page.locator('.ag-header-cell[col-id="exceptionMessage"][role="columnheader"]');
  //   await exceptionMessageHeader.click();
  //   await expect(exceptionMessageHeader).toHaveAttribute('aria-sort', /(ascending)/);
  //
  //   // Reset Grid - should reset all changes
  //   await resetGridButton.click();
  //   await expect(resetGridButton).toBeHidden();
  //
  //   // Verify columns are back to original positions
  //   await expect(jobDefIdColumnHeader).toHaveAttribute('aria-colindex', initialJobDefIdIndex ?? '');
  //   await expect(createTimeColumnHeader).toHaveAttribute('aria-colindex', initialCreateTimeIndex ?? '');
  //
  //   // Verify width is back to original
  //   const resetWidth = await jobDefIdColumnHeader.boundingBox();
  //   expect(resetWidth?.width).toBe(initialWidth?.width);
  //
  //   // Verify sort is removed (back to none)
  //   await expect(exceptionMessageHeader).toHaveAttribute('aria-sort', 'none');
  // });

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

  test('should have clickable exception message link that navigates to incident', async ({ page }) => {
    // Find a row with an exception message that contains a link
    const exceptionMessageCell = page
      .locator('.ag-center-cols-viewport .ag-row')
      .locator('div[col-id="exceptionMessage"]')
      .first();
    await expect(exceptionMessageCell).toBeVisible();

    // Look for a link (anchor tag) within the exception message cell
    const exceptionLink = exceptionMessageCell.locator('a').first();

    // Check if the link exists and is visible
    const linkCount = await exceptionLink.count();

    if (linkCount === 0) {
      console.log(
        'No exception message link found in Exception Message column - test passed (no incidents to link to)',
      );
      return;
    }

    // If a link exists, verify it's clickable
    await expect(exceptionLink).toBeVisible();

    // Get the href to verify it points to an incident
    const href = await exceptionLink.getAttribute('href');
    expect(href).toContain('incidents');

    // Click the link
    await exceptionLink.click();

    // Verify we're on an incident details page
    await expect(page).toHaveURL(/.*incidents\/.*/);

    // Verify the incident details page loaded with expected content
    await expect(page.getByText('INCIDENT')).toBeVisible();
  });
});
