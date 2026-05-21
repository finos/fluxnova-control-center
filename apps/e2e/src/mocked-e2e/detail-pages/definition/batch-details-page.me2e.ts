import { BrowserContext, expect, Page, test } from '@playwright/test';
import history from '../../../fixtures/batches/details-history.json';
import jobLogHistory from '../../../fixtures/batches/details-job-logs-history.json';
import statistics from '../../../fixtures/batches/details-statistics.json';
import failedJobs from '../../../fixtures/batches/details-failed-jobs.json';
import { FXN_SUPPORT_STORAGE_STATE } from '../../../../playwright.config';
import { BasePage } from '../../../page-objects/base-page.po';

async function goToPage(page: Page, context: BrowserContext) {
  const batchDetailsPage = new BasePage(page);

  await batchDetailsPage.initialize(context);
  await mockRoutes(page);
  await batchDetailsPage.goto(`./default/batches/dbb06fca-1a00-11ef-909a-5aee36430a26`);
}

async function mockRoutes(page: Page) {
  await page.route('api/batch/statistics?**', async (route) => {
    await route.fulfill({ json: statistics });
  });
  await page.route('api/batch/count**', async (route) => {
    await route.fulfill({ json: { count: 100 } });
  });
  await page.route('api/history/batch/**', async (route) => {
    await route.fulfill({ json: history });
  });
  await page.route('api/history/job-log?**', async (route) => {
    await route.fulfill({ json: jobLogHistory });
  });
  await page.route('api/history/job-log/count**', async (route) => {
    await route.fulfill({ json: { count: 23 } });
  });
  await page.route('api/jobs/count', async (route) => {
    await route.fulfill({ json: 2 });
  });
  await page.route('api/jobs', async (route) => {
    await route.fulfill({ json: failedJobs });
  });
  await page.route('api/batch/**/suspended', async (route) => {
    await route.fulfill();
  });
  await page.route('api/jobs/**/retries', async (route) => {
    await route.fulfill();
  });
  await page.route('api/job-definition/**/retries', async (route) => {
    await route.fulfill();
  });
}

test.describe('Batch details page', () => {
  test.use({ storageState: FXN_SUPPORT_STORAGE_STATE });

  test.beforeEach(async ({ page, context }) => {
    await goToPage(page, context);
  });

  test('shows batch detail info', async ({ page }) => {
    await expect(page.locator('as-split')).toContainText('Progress: In-Progress');
    await expect(page.locator('as-split')).toContainText('Type: instance-deletion');
    await expect(page.locator('as-split')).toContainText('Failed Jobs: 2');
  });

  test('shows columns for each tab', async ({ page }) => {
    await expect(page.locator('nav')).toContainText('Job Logs (23)');
    await expect(page.locator('nav')).toContainText('Failed Jobs (2)');
    await expect(page.getByRole('grid')).toContainText('Job ID');
    await expect(page.getByRole('grid')).toContainText('Job Definition ID');
    await expect(page.getByRole('grid')).toContainText('Timestamp');
    await page.getByText('Failed Jobs (2)').click();
    await expect(page.getByRole('grid')).toContainText('Job ID');
    await expect(page.getByRole('grid')).toContainText('Job Definition ID');
    await expect(page.getByRole('grid')).toContainText('Create Time');
  });

  test('confirms delete with a modal', async ({ page }) => {
    await page.locator('fluxnova-toolbar-button#delete').click();
    await expect(page.locator('#modal-basic-title')).toContainText('Delete Batch');
    await expect(page.getByRole('paragraph')).toContainText('Are you sure you want to delete this batch?');
    await expect(page.getByLabel('Delete the historic batch and')).toBeVisible();
  });

  test('Suspends/Activates the batch', async ({ page }) => {
    await page.locator('fluxnova-toolbar-button#suspend').click();
    await page.getByRole('button', { name: 'Suspend' }).click();
    await checkToast(page, 'Suspend batch was successful');
    await expect(page.locator('as-split')).toContainText('Suspended?: Yes');
    await page
      .getByRole('alert')
      .locator('div')
      .filter({ has: page.locator('[iconname="close"]') })
      .click(); // Close old alert
    await page.locator('fluxnova-toolbar-button#activate').click();
    await page.getByRole('button', { name: 'Activate' }).click();
    await checkToast(page, 'Activate batch was successful');
    await expect(page.locator('as-split')).toContainText('Suspended?: No');
  });

  test('retries all failed jobs in a batch', async ({ page }) => {
    await page.locator('fluxnova-toolbar-button#retry').click();
    await page.getByRole('button', { name: 'Retry' }).click();
    await checkToast(page, 'Retry job definition was successful for');
  });

  test('retries a specific failed job', async ({ page }) => {
    await page.getByText('Failed Jobs (2)').click();
    await page.locator('.ag-row[row-id="1"] .ag-selection-checkbox input[type="checkbox"]').click();
    await page.locator('.toolbar-actions').locator('button#tab-retry').click();
    await checkToast(page, 'The retry action was successful for all selected jobs');
  });

  test('shows a modal when deleting a specific batch', async ({ page }) => {
    await page.getByText('Failed Jobs (2)').click();
    await page.locator('.ag-row[row-id="1"] .ag-selection-checkbox input[type="checkbox"]').click();
    await page.locator('.toolbar-actions').locator('button#tab-delete').click();
    await expect(page.locator('#modal-basic-title')).toContainText('Delete Job(s)');
    await expect(page.getByRole('paragraph')).toContainText('Are you sure you want to delete these jobs?');
    await expect(page.getByRole('listitem')).toContainText('dbc0274d-1a00-11ef-909a-5aee36430a26');
  });

  async function checkToast(page: Page, str: string) {
    await expect(page.getByLabel('Loading...').first()).not.toBeVisible();
    await expect(page.getByRole('alert')).toContainText(str);
  }
});
