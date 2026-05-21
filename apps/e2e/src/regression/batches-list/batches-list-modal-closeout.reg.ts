import { expect, test } from '@playwright/test';
import { createBatchJob, deleteBatchJob } from '../../utils/test-utils';
import { BasePage } from '../../page-objects/base-page.po';

test.describe('Batches List - Modal Closeout', () => {
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
    await page.goto(
      `./${BasePage.TENANT}/batches?sorting=%5B%7B"colId":"startTime","sort":"desc"%7D%5D&filters=%7B"batchId":%7B"filter":"${workingBatchId}","type":"equals"%7D%7D`,
    );
  });

  test('should close batch suspend/activate modal (X icon)', async ({ page }) => {
    // Open and close activate/suspend modal via 'X' Icon
    await page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]').click();
    await page.getByRole('button').nth(1).click();
    await expect(page.getByRole('heading', { name: 'Suspend Batch' })).toBeVisible();
    await page.getByLabel('Close').click();
    await expect(page.getByRole('heading', { name: 'Suspend Batch' })).not.toBeVisible();
  });

  test('should close batch suspend/activate modal (Cancel Button)', async ({ page }) => {
    // Open and close activate/suspend modal via 'Cancel' button
    await page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]').click();
    await page.getByRole('button').nth(1).click();
    await expect(page.getByRole('heading', { name: 'Suspend Batch' })).toBeVisible();
    await page.getByLabel('cancel').click();
    await expect(page.getByRole('heading', { name: 'Suspend Batch' })).not.toBeVisible();
  });

  test('should close batch suspend/activate modal (Click Off Modal)', async ({ page }) => {
    // Open and close activate/suspend modal via clicking off modal
    await page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]').click();
    await page.getByRole('button').nth(1).click();
    await expect(page.getByRole('heading', { name: 'Suspend Batch' })).toBeVisible();
    await page.mouse.click(0, 0);
    await expect(page.getByRole('heading', { name: 'Suspend Batch' })).not.toBeVisible();
  });

  test('should close batch retry modal (X icon)', async ({ page }) => {
    // Open and close retry modal via 'X' Icon
    await page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]').click();
    await page.getByRole('button').nth(2).click();
    await expect(page.getByRole('heading', { name: 'Retry Job Definition for Batch' })).toBeVisible();
    await page.getByLabel('Close').click();
    await expect(page.getByRole('heading', { name: 'Retry Job Definition for Batch' })).not.toBeVisible();
  });

  test('should close batch retry modal (Cancel Button)', async ({ page }) => {
    // Open and close retry modal via 'Cancel' button
    await page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]').click();
    await page.getByRole('button').nth(2).click();
    await expect(page.getByRole('heading', { name: 'Retry Job Definition for Batch' })).toBeVisible();
    await page.getByLabel('cancel').click();
    await expect(page.getByRole('heading', { name: 'Retry Job Definition for Batch' })).not.toBeVisible();
  });

  test('should close batch retry modal (Click Off Modal)', async ({ page }) => {
    // Open and close retry modal via clicking off modal
    await page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]').click();
    await page.getByRole('button').nth(2).click();
    await expect(page.getByRole('heading', { name: 'Retry Job Definition for Batch' })).toBeVisible();
    await page.mouse.click(0, 0);
    await expect(page.getByRole('heading', { name: 'Retry Job Definition for Batch' })).not.toBeVisible();
  });

  test('should close batch delete modal (X icon)', async ({ page }) => {
    // Open and close delete modal via 'X' Icon
    await page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]').click();
    await page.getByRole('button').nth(3).click();
    await expect(page.getByRole('heading', { name: 'Delete Batch' })).toBeVisible();
    await page.getByLabel('Close').click();
    await expect(page.getByRole('heading', { name: 'Delete Batch' })).not.toBeVisible();
  });

  test('should close batch delete modal (Cancel Button)', async ({ page }) => {
    // Open and close delete modal via 'Cancel' button
    await page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]').click();
    await page.getByRole('button').nth(3).click();
    await expect(page.getByRole('heading', { name: 'Delete Batch' })).toBeVisible();
    await page.getByLabel('cancel').click();
    await expect(page.getByRole('heading', { name: 'Delete Batch' })).not.toBeVisible();
  });

  test('should close batch delete modal (Click Off Modal)', async ({ page }) => {
    // Open and close delete modal via clicking off modal
    await page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]').click();
    await page.getByRole('button').nth(3).click();
    await expect(page.getByRole('heading', { name: 'Delete Batch' })).toBeVisible();
    await page.mouse.click(0, 0);
    await expect(page.getByRole('heading', { name: 'Delete Batch' })).not.toBeVisible();
  });
});
