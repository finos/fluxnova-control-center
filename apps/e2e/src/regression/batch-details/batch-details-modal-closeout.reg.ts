import { expect, test } from '@playwright/test';
import { createBatchJob, deleteBatchJob } from '../../utils/test-utils';
import { BasePage } from '../../page-objects/base-page.po';

test.describe('Batch Details - Modal Closeout', () => {
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

  test('should close batch suspend/activate modal (X icon)', async ({ page }) => {
    // Open and close activate/suspend modal via 'X' Icon
    await page.getByRole('button').nth(1).click();
    await expect(page.getByRole('heading', { name: 'Suspend Batch' })).toBeVisible();
    await page.getByLabel('Close').click();
    await expect(page.getByRole('heading', { name: 'Suspend Batch' })).not.toBeVisible();
  });

  test('should close batch suspend/activate modal (Cancel Button)', async ({ page }) => {
    // Open and close activate/suspend modal via 'Cancel' button
    await page.getByRole('button').nth(1).click();
    await expect(page.getByRole('heading', { name: 'Suspend Batch' })).toBeVisible();
    await page.getByLabel('cancel').click();
    await expect(page.getByRole('heading', { name: 'Suspend Batch' })).not.toBeVisible();
  });

  test('should close batch suspend/activate modal (Click Off Modal)', async ({ page }) => {
    // Open activate/suspend modal and close it by clicking outside of modal
    await page.getByRole('button').nth(1).click();
    await expect(page.getByRole('heading', { name: 'Suspend Batch' })).toBeVisible();
    await page.mouse.click(0, 0);
    await expect(page.getByRole('heading', { name: 'Suspend Batch' })).not.toBeVisible();
  });

  test('should close batch retry modal (X icon)', async ({ page }) => {
    // Open and close retry modal via 'X' Icon
    await page.getByRole('button').nth(2).click();
    await expect(page.getByRole('heading', { name: 'Retry Job Definition' })).toBeVisible();
    await page.getByLabel('Close').click();
    await expect(page.getByRole('heading', { name: 'Retry Job Definition' })).not.toBeVisible();
  });

  test('should close batch retry modal (Cancel Button)', async ({ page }) => {
    // Open and close retry modal via 'Cancel' button
    await page.getByRole('button').nth(2).click();
    await expect(page.getByRole('heading', { name: 'Retry Job Definition' })).toBeVisible();
    await page.getByLabel('cancel').click();
    await expect(page.getByRole('heading', { name: 'Retry Job Definition' })).not.toBeVisible();
  });

  test('should close batch retry modal (Click Off Modal)', async ({ page }) => {
    // Open retry modal and close it by clicking outside of modal
    await page.getByRole('button').nth(2).click();
    await expect(page.getByRole('heading', { name: 'Retry Job Definition' })).toBeVisible();
    await page.mouse.click(0, 0);
    await expect(page.getByRole('heading', { name: 'Retry Job Definition' })).not.toBeVisible();
  });

  test('should close batch delete modal (X icon)', async ({ page }) => {
    // Open delete modal and close it by clicking on the 'X' Icon
    await page.getByRole('button').nth(3).click();
    await expect(page.getByRole('heading', { name: 'Delete Batch' })).toBeVisible();
    await page.getByLabel('Close').click();
    await expect(page.getByRole('heading', { name: 'Delete Batch' })).not.toBeVisible();
  });

  test('should close batch delete modal (Cancel Button)', async ({ page }) => {
    // Open and close delete modal via 'Cancel' button
    await page.getByRole('button').nth(3).click();
    await expect(page.getByRole('heading', { name: 'Delete Batch' })).toBeVisible();
    await page.getByLabel('cancel').click();
    await expect(page.getByRole('heading', { name: 'Delete Batch' })).not.toBeVisible();
  });

  test('should close batch delete modal (Click Off Modal)', async ({ page }) => {
    // Open and close delete modal via clicking off modal
    await page.getByRole('button').nth(3).click();
    await expect(page.getByRole('heading', { name: 'Delete Batch' })).toBeVisible();
    await page.mouse.click(0, 0);
    await expect(page.getByRole('heading', { name: 'Delete Batch' })).not.toBeVisible();
  });
});
