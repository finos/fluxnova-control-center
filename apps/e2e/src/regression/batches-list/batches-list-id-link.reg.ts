import { test } from '@playwright/test';
import { clickIdLinkVerifyPageAndData } from '../../shared/id-link';
import { createBatchJob, deleteBatchJob } from '../../utils/test-utils';
import { BasePage } from '../../page-objects/base-page.po';

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

test('should have valid ID link from batch list', async ({ page }) => {
  await clickIdLinkVerifyPageAndData(true, 1, 'BATCH', 'Job Logs', 'batches', page);
});
