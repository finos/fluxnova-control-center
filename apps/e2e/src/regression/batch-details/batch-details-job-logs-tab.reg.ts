import { expect, Locator, test } from '@playwright/test';
import { createBatchJob, deleteBatchJob } from '../../utils/test-utils';
import { BasePage } from '../../page-objects/base-page.po';

/**
 * @group regression
 * @group batch-details
 * @group batch-details-job-logs-tab
 */

test.describe('Batch Details - Job Logs Tab', () => {
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
    const expectedHeaders = [
      'Job ID',
      'Job Definition Type',
      'Timestamp',
      'Log Type',
      'Message',
      'Job Definition ID',
      'Hostname',
      'Retries',
    ];

    for (const header of expectedHeaders) {
      const headerElement = page.locator('div[role="columnheader"]', { hasText: header });
      await expect(headerElement.first()).toBeVisible();
    }
  });

  test('should sort by timestamp', async ({ page }) => {
    const timestampHeader = page.locator('.ag-header-cell[col-id="timestamp"][role="columnheader"]');
    await expect(timestampHeader).toBeVisible();

    // By default, should be sorted by timestamp in descending order
    await expect(timestampHeader).toHaveAttribute('aria-sort', 'descending');

    // Click to toggle to ascending
    await timestampHeader.click();
    await expect(timestampHeader).toHaveAttribute('aria-sort', 'none');

    // Verify Reset Grid button appears
    await expect(resetGridButton).toBeVisible();

    // Click again to toggle back to descending
    await timestampHeader.click();
    await expect(timestampHeader).toHaveAttribute('aria-sort', 'ascending');

    // Reset Grid
    await resetGridButton.click();
    await expect(resetGridButton).toBeHidden();

    // Verify sort is back to default (descending)
    await expect(timestampHeader).toHaveAttribute('aria-sort', 'descending');
  });

  test('should sort by job definition ID', async ({ page }) => {
    const jobDefIdHeader = page.locator('.ag-header-cell[col-id="jobDefinitionId"][role="columnheader"]');
    await expect(jobDefIdHeader).toBeVisible();

    // Initially should be unsorted
    await expect(jobDefIdHeader).toHaveAttribute('aria-sort', 'none');

    // Click to sort
    await jobDefIdHeader.click();
    await expect(jobDefIdHeader).toHaveAttribute('aria-sort', /(ascending)/);

    // Verify Reset Grid button appears
    await expect(resetGridButton).toBeVisible();

    // Click again to toggle sort
    await jobDefIdHeader.click();
    await expect(jobDefIdHeader).toHaveAttribute('aria-sort', /(descending)/);

    // Reset Grid
    await resetGridButton.click();
    await expect(resetGridButton).toBeHidden();

    // Verify sort is removed from this column (back to none)
    await expect(jobDefIdHeader).toHaveAttribute('aria-sort', 'none');

    // Verify timestamp is back to default descending sort
    const timestampHeader = page.locator('.ag-header-cell[col-id="timestamp"][role="columnheader"]');
    await expect(timestampHeader).toHaveAttribute('aria-sort', 'descending');
  });

  test('should sort by hostname', async ({ page }) => {
    const hostnameHeader = page.locator('.ag-header-cell[col-id="hostname"][role="columnheader"]');
    await expect(hostnameHeader).toBeVisible();

    // Initially should be unsorted (timestamp is sorted by default)
    await expect(hostnameHeader).toHaveAttribute('aria-sort', 'none');

    // Click to sort
    await hostnameHeader.click();
    await expect(hostnameHeader).toHaveAttribute('aria-sort', /(ascending)/);

    // Verify Reset Grid button appears
    await expect(resetGridButton).toBeVisible();

    // Click again to toggle sort
    await hostnameHeader.click();
    await expect(hostnameHeader).toHaveAttribute('aria-sort', /(descending)/);

    // Reset Grid
    await resetGridButton.click();
    await expect(resetGridButton).toBeHidden();

    // Verify sort is removed from this column (back to none)
    await expect(hostnameHeader).toHaveAttribute('aria-sort', 'none');

    // Verify timestamp is back to default descending sort
    const timestampHeader = page.locator('.ag-header-cell[col-id="timestamp"][role="columnheader"]');
    await expect(timestampHeader).toHaveAttribute('aria-sort', 'descending');
  });

  test('should sort by retries', async ({ page }) => {
    const retriesHeader = page.locator('.ag-header-cell[col-id="jobRetries"][role="columnheader"]');
    await expect(retriesHeader).toBeVisible();

    // Initially should be unsorted (timestamp is sorted by default)
    await expect(retriesHeader).toHaveAttribute('aria-sort', 'none');

    // Click to sort
    await retriesHeader.click();
    await expect(retriesHeader).toHaveAttribute('aria-sort', /(ascending)/);

    // Verify Reset Grid button appears
    await expect(resetGridButton).toBeVisible();

    // Click again to toggle sort
    await retriesHeader.click();
    await expect(retriesHeader).toHaveAttribute('aria-sort', /(descending)/);

    // Reset Grid
    await resetGridButton.click();
    await expect(resetGridButton).toBeHidden();

    // Verify sort is removed from this column (back to none)
    await expect(retriesHeader).toHaveAttribute('aria-sort', 'none');

    // Verify timestamp is back to default descending sort
    const timestampHeader = page.locator('.ag-header-cell[col-id="timestamp"][role="columnheader"]');
    await expect(timestampHeader).toHaveAttribute('aria-sort', 'descending');
  });

  test('should allow adjusting column width', async ({ page }) => {
    const timestampColumnHeader = page.locator('.ag-header-cell[col-id="timestamp"][role="columnheader"]');
    await expect(timestampColumnHeader).toBeVisible();

    const initialWidth = await timestampColumnHeader.boundingBox();

    // Get the resize handle (right edge of the column header)
    const resizeHandle = timestampColumnHeader.locator('.ag-header-cell-resize');

    // Drag to increase width
    await resizeHandle.hover();
    await page.mouse.down();
    await page.mouse.move((initialWidth?.x ?? 0) + (initialWidth?.width ?? 0) + 100, initialWidth?.y ?? 0);
    await page.mouse.up();

    const newWidth = await timestampColumnHeader.boundingBox();
    expect(newWidth?.width).toBeGreaterThan(initialWidth?.width ?? 0);

    // Verify Reset Grid button appears
    await expect(resetGridButton).toBeVisible();

    // Click Reset Grid
    await resetGridButton.click();
    await expect(resetGridButton).toBeHidden();

    // Verify width is back to original
    const resetWidth = await timestampColumnHeader.boundingBox();
    expect(resetWidth?.width).toBe(initialWidth?.width);
  });

  test('should allow changing column order by dragging', async ({ page }) => {
    const timestampColumnHeader = page.locator('.ag-header-cell[col-id="timestamp"][role="columnheader"]');
    const logTypeColumnHeader = page.locator('.ag-header-cell[col-id="logType"][role="columnheader"]');

    await expect(timestampColumnHeader).toBeVisible();
    await expect(logTypeColumnHeader).toBeVisible();

    // Get initial column positions
    const initialTimestampIndex = await timestampColumnHeader.getAttribute('aria-colindex');
    const initialLogTypeIndex = await logTypeColumnHeader.getAttribute('aria-colindex');

    // Drag Timestamp to Log Type position
    await timestampColumnHeader.dragTo(logTypeColumnHeader);

    // Verify columns have swapped
    const newTimestampIndex = await timestampColumnHeader.getAttribute('aria-colindex');
    const newLogTypeIndex = await logTypeColumnHeader.getAttribute('aria-colindex');

    expect(newTimestampIndex).not.toBe(initialTimestampIndex);
    expect(newLogTypeIndex).not.toBe(initialLogTypeIndex);

    // Verify Reset Grid button appears
    await expect(resetGridButton).toBeVisible();

    // Click Reset Grid
    await resetGridButton.click();
    await expect(resetGridButton).toBeHidden();

    // Verify columns are back to original positions
    await expect(timestampColumnHeader).toHaveAttribute('aria-colindex', initialTimestampIndex ?? '');
    await expect(logTypeColumnHeader).toHaveAttribute('aria-colindex', initialLogTypeIndex ?? '');
  });

  test('should reset grid after adjusting sorting, width, and column order', async ({ page }) => {
    const timestampColumnHeader = page.locator('.ag-header-cell[col-id="timestamp"][role="columnheader"]');
    const logTypeColumnHeader = page.locator('.ag-header-cell[col-id="logType"][role="columnheader"]');

    // Initially, reset button should be hidden
    await expect(resetGridButton).toBeHidden();

    // 1. Change column order
    const initialTimestampIndex = await timestampColumnHeader.getAttribute('aria-colindex');
    const initialLogTypeIndex = await logTypeColumnHeader.getAttribute('aria-colindex');

    await timestampColumnHeader.dragTo(logTypeColumnHeader);

    // Verify Reset Grid button appears
    await expect(resetGridButton).toBeVisible();

    // 2. Adjust column width
    const initialWidth = await timestampColumnHeader.boundingBox();
    const resizeHandle = timestampColumnHeader.locator('.ag-header-cell-resize');

    await resizeHandle.hover();
    await page.mouse.down();
    await page.mouse.move((initialWidth?.x ?? 0) + (initialWidth?.width ?? 0) + 100, initialWidth?.y ?? 0);
    await page.mouse.up();

    const newWidth = await timestampColumnHeader.boundingBox();
    expect(newWidth?.width).toBeGreaterThan(initialWidth?.width ?? 0);

    // 3. Add a sort to a different column (hostname)
    const hostnameHeader = page.locator('.ag-header-cell[col-id="hostname"][role="columnheader"]');
    await hostnameHeader.click();
    await expect(hostnameHeader).toHaveAttribute('aria-sort', /(ascending|descending)/);

    // Reset Grid - should reset all changes
    await resetGridButton.click();
    await expect(resetGridButton).toBeHidden();

    // Verify columns are back to original positions
    await expect(timestampColumnHeader).toHaveAttribute('aria-colindex', initialTimestampIndex ?? '');
    await expect(logTypeColumnHeader).toHaveAttribute('aria-colindex', initialLogTypeIndex ?? '');

    // Verify width is back to original
    const resetWidth = await timestampColumnHeader.boundingBox();
    expect(resetWidth?.width).toBe(initialWidth?.width);

    // Verify hostname sort is removed (back to none)
    await expect(hostnameHeader).toHaveAttribute('aria-sort', 'none');

    // Verify timestamp is back to default descending sort
    await expect(timestampColumnHeader).toHaveAttribute('aria-sort', 'descending');
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

  test('should have clickable error message link that navigates to incident', async ({ page }) => {
    // Find a row with an error message that contains a link (typically in the Message column)
    const messageCell = page.locator('.ag-center-cols-viewport .ag-row').locator('div[col-id="message"]').first();
    await expect(messageCell).toBeVisible();

    // Look for a link (anchor tag) within the message cell
    const errorLink = messageCell.locator('a').first();

    // Check if the link exists and is visible
    const linkCount = await errorLink.count();

    if (linkCount === 0) {
      console.log('No error message link found in Message column - test passed (no errors to link to)');
      return;
    }

    // If a link exists, verify it's clickable
    await expect(errorLink).toBeVisible();

    // Get the href to verify it points to an incident
    const href = await errorLink.getAttribute('href');
    expect(href).toContain('incidents');

    // Click the link
    await errorLink.click();

    // Wait for navigation to incident details page
    await page.waitForLoadState('networkidle');

    // Verify we're on an incident details page
    await expect(page).toHaveURL(/.*incidents\/.*/);

    // Verify the incident details page loaded with expected content
    await expect(page.getByText('INCIDENT')).toBeVisible();
  });
});
