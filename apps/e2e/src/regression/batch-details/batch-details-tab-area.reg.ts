import { expect, test } from '@playwright/test';
import { createBatchJob, deleteBatchJob, extractNumber } from '../../utils/test-utils';
import { CommonElements } from '../../page-objects/common-elements.po';
import { BasePage } from '../../page-objects/base-page.po';

/**
 * @group regression
 * @group batch-details
 * @group batch-details-tab-area
 */

let commonElements: CommonElements;

test.describe('Batch Details - Tab Area', () => {
  let workingBatchId: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    workingBatchId = await createBatchJob(page);
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await deleteBatchJob(workingBatchId, page);
  });

  test.beforeEach(async ({ page }) => {
    commonElements = new CommonElements(page);
    await page.goto(`./${BasePage.TENANT}/batches/${workingBatchId}`);
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('should have job logs tab with correct count', async ({ page }) => {
    // Use a more specific selector targeting the li.tab element with data-tab attribute
    const jobLogsTab = page.locator('li.tab[data-tab="Job Logs"]');

    // Wait for tabs to be rendered and check if Job Logs tab exists
    await page.waitForSelector('.tab-list', { timeout: 5000 });

    const tabCount = await jobLogsTab.count();

    // Skip the test if the Job Logs tab doesn't exist (no job logs in this batch)
    if (tabCount === 0) {
      console.log('Job Logs tab not found - skipping test as there are no job logs in this batch');
      return;
    }

    // Click the Job Logs tab
    await jobLogsTab.click();

    // Wait for grid to load
    await page.waitForFunction(() => {
      const agRoot = document.querySelector('.ag-root');
      const rowCount = agRoot?.getAttribute('aria-rowcount');
      return rowCount && parseInt(rowCount, 10) > 1;
    });

    // Confirm tab count matches number of rows
    const jobLogsTabCount = extractNumber(await page.locator('li[data-tab="Job Logs"]').locator('div').innerText());
    // Subtract 2 from the row count to account for the header row and the "no rows" overlay row
    const jobLogsRowCount = Number((await page.locator('.ag-root').getAttribute('aria-rowcount')) ?? 0) - 2;
    expect(jobLogsTabCount).toEqual(jobLogsRowCount);
  });

  test('should have failed jobs tab with correct count', async ({ page }) => {
    const failedJobsTab = page.locator('li.tab[data-tab="Failed Jobs"]');

    // Wait for tabs to be rendered and check if Failed Jobs tab exists
    await page.waitForSelector('.tab-list', { timeout: 5000 });

    const tabCount = await failedJobsTab.count();

    // Skip the test if the Failed Jobs tab doesn't exist (no failed jobs in this batch)
    if (tabCount === 0) {
      console.log('Failed Jobs tab not found - skipping test as there are no failed jobs in this batch');
      return;
    }

    // Click the Failed Jobs tab
    await failedJobsTab.click();

    // Wait for grid to load
    await page.waitForFunction(() => {
      const agRoot = document.querySelector('.ag-root');
      const rowCount = agRoot?.getAttribute('aria-rowcount');
      return rowCount && parseInt(rowCount, 10) > 1;
    });

    // Confirm tab count matches number of rows
    const failedJobsTabCount = extractNumber(
      await page.locator('li[data-tab="Failed Jobs"]').locator('div').innerText(),
    );
    const failedJobsRowCount = Number((await page.locator('.ag-root').getAttribute('aria-rowcount')) ?? 0) - 2;
    expect(failedJobsTabCount).toEqual(failedJobsRowCount);
  });

  test('should have remaining jobs tab with correct count', async ({ page }) => {
    const remainingJobsTab = page.locator('li.tab[data-tab="Remaining Jobs"]');

    // Wait for tabs to be rendered and check if Remaining Jobs tab exists
    await page.waitForSelector('.tab-list', { timeout: 5000 });

    const tabCount = await remainingJobsTab.count();

    // Skip the test if the Remaining Jobs tab doesn't exist (no remaining jobs in this batch)
    if (tabCount === 0) {
      console.log('Remaining Jobs tab not found - skipping test as there are no remaining jobs in this batch');
      return;
    }

    // Click the Remaining Jobs tab
    await remainingJobsTab.click();

    // Wait for grid to load
    await page.waitForFunction(() => {
      const agRoot = document.querySelector('.ag-root');
      const rowCount = agRoot?.getAttribute('aria-rowcount');
      return rowCount && parseInt(rowCount, 10) > 1;
    });

    // Confirm tab count matches number of rows
    const remainingJobsTabCount = extractNumber(
      await page.locator('li[data-tab="Remaining Jobs"]').locator('div').innerText(),
    );
    const remainingJobsRowCount = Number((await page.locator('.ag-root').getAttribute('aria-rowcount')) ?? 0) - 2;
    expect(remainingJobsTabCount).toEqual(remainingJobsRowCount);
  });

  test('should display tab headers correctly', async ({ page }) => {
    await page.waitForSelector('.tab-list', { timeout: 5000 });

    // Check if each tab exists and has a count displayed
    const jobLogsTab = page.locator('li[data-tab="Job Logs"]');
    if ((await jobLogsTab.count()) > 0) {
      const tabText = await jobLogsTab.locator('div').innerText();
      expect(tabText).toContain('Job Logs');
      expect(tabText).toMatch(/\(\d+\)/); // Should have a count in parentheses
    }

    const failedJobsTab = page.locator('li[data-tab="Failed Jobs"]');
    if ((await failedJobsTab.count()) > 0) {
      const tabText = await failedJobsTab.locator('div').innerText();
      expect(tabText).toContain('Failed Jobs');
      expect(tabText).toMatch(/\(\d+\)/);
    }

    const remainingJobsTab = page.locator('li[data-tab="Remaining Jobs"]');
    if ((await remainingJobsTab.count()) > 0) {
      const tabText = await remainingJobsTab.locator('div').innerText();
      expect(tabText).toContain('Remaining Jobs');
      expect(tabText).toMatch(/\(\d+\)/);
    }
  });

  test('should switch between tabs successfully', async ({ page }) => {
    await page.waitForSelector('.tab-list', { timeout: 5000 });

    const jobLogsTab = page.locator('li.tab[data-tab="Job Logs"]');
    const failedJobsTab = page.locator('li.tab[data-tab="Failed Jobs"]');
    const remainingJobsTab = page.locator('li.tab[data-tab="Remaining Jobs"]');

    // Collect available tabs
    const availableTabs = [];
    if ((await jobLogsTab.count()) > 0) availableTabs.push({ tab: jobLogsTab, name: 'Job Logs' });
    if ((await failedJobsTab.count()) > 0) availableTabs.push({ tab: failedJobsTab, name: 'Failed Jobs' });
    if ((await remainingJobsTab.count()) > 0) availableTabs.push({ tab: remainingJobsTab, name: 'Remaining Jobs' });

    // Skip if less than 2 tabs available
    if (availableTabs.length < 2) {
      console.log('Less than 2 tabs available - skipping tab switching test');
      return;
    }

    // Click first tab and verify it's active
    await availableTabs[0].tab.click();
    await expect(availableTabs[0].tab).toHaveClass(/active/);

    // Click second tab and verify it's active
    await availableTabs[1].tab.click();
    await expect(availableTabs[1].tab).toHaveClass(/active/);

    // Verify first tab is no longer active
    await expect(availableTabs[0].tab).not.toHaveClass(/active/);
  });

  test('should load grid data when tab is clicked', async ({ page }) => {
    await page.waitForSelector('.tab-list', { timeout: 5000 });

    const jobLogsTab = page.locator('li.tab[data-tab="Job Logs"]');

    // Skip if Job Logs tab doesn't exist
    if ((await jobLogsTab.count()) === 0) {
      console.log('Job Logs tab not found - skipping grid data test');
      return;
    }

    // Click the Job Logs tab
    await jobLogsTab.click();

    // Wait for grid to appear
    await expect(commonElements.grid).toBeVisible();

    // Wait for grid to populate with data
    await page.waitForFunction(() => {
      const agRoot = document.querySelector('.ag-root');
      const rowCount = agRoot?.getAttribute('aria-rowcount');
      return rowCount && parseInt(rowCount, 10) > 1;
    });

    // Verify grid has headers
    await expect(page.locator('.ag-header-cell-text').first()).toBeVisible();

    // Verify grid has data rows (if count > 0)
    const tabText = await jobLogsTab.locator('div').innerText();
    const count = extractNumber(tabText);

    if (count !== null && count > 0) {
      await expect(page.locator('.ag-center-cols-viewport .ag-row').first()).toBeVisible();
    }
  });
});
