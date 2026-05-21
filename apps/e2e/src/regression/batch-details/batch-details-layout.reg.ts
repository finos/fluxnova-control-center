import { expect, test } from '@playwright/test';
import { checkFluxnovaIcon } from '../../shared/layout';
import { createBatchJob, deleteBatchJob } from '../../utils/test-utils';
import { BasePage } from '../../page-objects/base-page.po';

test.describe('Batch Details - Layout', () => {
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
    await page.goto(`./${BasePage.TENANT}/batches/${workingBatchId}`);
  });

  test('should display Fluxnova Icon in top left', async ({ page }) => {
    await checkFluxnovaIcon(page);
  });

  test('should have info headers displayed in info section', async ({ page }) => {
    // Always present fields
    await expect(page.getByText('Batch ID')).toBeVisible();
    await expect(page.getByText('Progress:')).toBeVisible();
    await expect(page.getByText('Start Time:')).toBeVisible();
    await expect(page.getByText('Execution Time:')).toBeVisible();
    await expect(page.getByText('User:')).toBeVisible();
    await expect(page.getByText('Type:')).toBeVisible();
    await expect(page.getByText('Total Jobs:')).toBeVisible();
    await expect(page.getByText('Suspended?:')).toBeVisible();
    await expect(page.getByText('Batch Jobs Per Seed:')).toBeVisible();
    await expect(page.getByText('Invocations Per Batch Job:')).toBeVisible();
    await expect(page.getByText('Batch Job Definition ID:')).toBeVisible();
    await expect(page.getByText('Monitor Job Definition ID:')).toBeVisible();
    await expect(page.getByText('Seed Job Definition ID:')).toBeVisible();

    // Note: The following fields are conditional (*ngIf) and may not always be visible:
    // - Failed Jobs: (only if batch.failedJobs exists)
    // - Remaining Jobs: (only if batch.remainingJobs exists)
    // - Completed Jobs: (only if batch.completedJobs exists)
    // - Jobs Created: (only if batch.jobsCreated exists)
    // - End Time: (only if batch.endTime exists)
    // - Removal Time: (only if batch.removalTime exists)
  });

  test('should display batch header', async ({ page }) => {
    await expect(page.getByText('BATCH', { exact: true })).toBeVisible();
  });

  test('should display bulk action buttons', async ({ page }) => {
    await expect(page.locator('#suspend').getByRole('button')).toBeVisible();
    await expect(page.locator('#retry').getByRole('button')).toBeVisible();
    await expect(page.locator('#delete').getByRole('button')).toBeVisible();
  });

  test('should have correct column headers (Job Logs)', async ({ page }) => {
    // Use a more specific selector targeting the li.tab element with data-tab attribute
    const jobLogsTab = page.locator('li.tab[data-tab="Job Logs"]');

    // Wait for tabs to be rendered and check if Job Logs tab exists
    await page.waitForSelector('.tab-list', { timeout: 5000 });

    const tabCount = await jobLogsTab.count();

    // Skip the assertions if the Job Logs tab doesn't exist (no Job Logs in this batch)
    if (tabCount === 0) {
      console.log('Job Logs tab not found - skipping test as there are no job logs in this batch');
      return;
    }

    // Click the Jobs Log tab
    await jobLogsTab.click();

    // Wait for the grid to load
    await page.waitForSelector('.ag-header-cell-text', { timeout: 5000 });

    await expect(page.getByText('Job ID')).toBeVisible();
    await expect(page.getByText('Job Definition Type')).toBeVisible();
    await expect(page.getByText('Timestamp')).toBeVisible();
    await expect(page.getByText('Log Type')).toBeVisible();
    await expect(page.getByText('Message')).toBeVisible();
    await expect(page.getByText('Job Definition ID', { exact: true })).toBeVisible();
    await expect(page.getByText('Hostname')).toBeVisible();
    await expect(page.getByText('Retries')).toBeVisible();
  });

  test('should have correct column headers (Failed Jobs)', async ({ page }) => {
    // Use a more specific selector targeting the li.tab element with data-tab attribute
    const failedJobsTab = page.locator('li.tab[data-tab="Failed Jobs"]');

    // Wait for tabs to be rendered and check if Failed Jobs tab exists
    await page.waitForSelector('.tab-list', { timeout: 5000 });

    const tabCount = await failedJobsTab.count();

    // Skip the assertions if the Failed Jobs tab doesn't exist (no failed jobs in this batch)
    if (tabCount === 0) {
      console.log('Failed Jobs tab not found - skipping test as there are no failed jobs in this batch');
      return;
    }

    // Click the Failed Jobs tab
    await failedJobsTab.click();

    // Wait for the grid to load
    await page.waitForSelector('.ag-header-cell-text', { timeout: 5000 });

    await expect(page.getByText('Job ID')).toBeVisible();
    await expect(page.getByText('Job Definition ID', { exact: true })).toBeVisible();
    await expect(page.getByText('Create Time')).toBeVisible();
    await expect(page.getByText('Exception Message')).toBeVisible();
  });

  test('should have correct column headers (Remaining Jobs)', async ({ page }) => {
    // Use a more specific selector targeting the li.tab element with data-tab attribute
    const remainingJobsTab = page.locator('li.tab[data-tab="Remaining Jobs"]');

    // Wait for tabs to be rendered and check if Remaining Jobs tab exists
    await page.waitForSelector('.tab-list', { timeout: 5000 });

    const tabCount = await remainingJobsTab.count();

    // Skip the assertions if the Remaining Jobs tab doesn't exist (no remaining jobs in this batch)
    if (tabCount === 0) {
      console.log('Remaining Jobs tab not found - skipping test as there are no remaining jobs in this batch');
      return;
    }

    // Click the Remaining Jobs tab
    await remainingJobsTab.click();

    // Wait for the grid to load
    await page.waitForSelector('.ag-header-cell-text', { timeout: 5000 });

    await expect(page.getByText('Job ID')).toBeVisible();
    await expect(page.getByText('Job Definition ID', { exact: true })).toBeVisible();
    await expect(page.getByText('Create Time')).toBeVisible();
    await expect(page.getByText('Suspended', { exact: true })).toBeVisible();
  });
});
