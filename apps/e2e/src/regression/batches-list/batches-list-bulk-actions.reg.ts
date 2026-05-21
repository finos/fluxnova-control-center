import { expect, test } from '@playwright/test';
import { createBatchJob, terminateProcessInstancesInBatch } from '../../utils/test-utils';
import { BasePage } from '../../page-objects/base-page.po';

test.describe('Batch List Page Bulk Actions', () => {
  test.describe.configure({ mode: 'serial' });

  let workingBatchId: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    workingBatchId = await createBatchJob(page);
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await terminateProcessInstancesInBatch(workingBatchId, page);
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(
      `./${BasePage.TENANT}/batches?sorting=%5B%7B"colId":"startTime","sort":"desc"%7D%5D&filters=%7B"batchId":%7B"filter":"${workingBatchId}","type":"equals"%7D%7D`,
    );
  });

  // These tests will begin in process definitions in order to create instances that will then be terminated, creating a batch that will linger and can be utilized to test batch list actions
  test('should suspend from batch list', async ({ page }) => {
    await page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]').click();
    await page.getByRole('button').nth(1).click();
    await page.getByRole('button', { name: 'Suspend' }).click();
    await expect(page.getByText('SuccessSuspend was successful')).toBeVisible();
  });

  test('should activate from batch list', async ({ page }) => {
    await page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]').click();
    await page.getByRole('button').nth(1).click();
    await page.getByRole('button', { name: 'Activate' }).click();
    await expect(page.getByText('SuccessActivate was')).toBeVisible();
  });

  test('should retry from batch list', async ({ page }) => {
    await page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]').click();
    await page.getByRole('button').nth(2).click();
    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(page.locator('div').filter({ hasText: 'SuccessRetry was successful' }).nth(1)).toBeVisible();
  });

  test('should delete from batch list', async ({ page }) => {
    await page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]').click();
    await page.getByRole('button').nth(3).click();
    await page.getByLabel('Delete the historic batch and').check();
    await page.getByRole('button', { name: 'Delete' }).click();
    await expect(page.locator('div').filter({ hasText: 'SuccessDelete was successful' }).nth(1)).toBeVisible();
  });
});
