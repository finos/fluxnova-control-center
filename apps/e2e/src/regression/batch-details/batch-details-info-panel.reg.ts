import { expect, test } from '@playwright/test';
import { createBatchJob, deleteBatchJob } from '../../utils/test-utils';
import { BasePage } from '../../page-objects/base-page.po';

/**
 * @group regression
 * @group batch-details
 * @group batch-details-info-panel
 */

test.describe('Batch Details - Info Panel', () => {
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
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('should display batch ID', async ({ page }) => {
    const batchIdLabel = page.getByText('Batch ID');
    await expect(batchIdLabel).toBeVisible();

    // Verify the batch ID value is displayed
    const batchIdValue = page.locator('fluxnova-batch-info-section').getByText(workingBatchId);
    await expect(batchIdValue).toBeVisible();
  });

  test('should be able to copy batch ID', async ({ page }) => {
    const ctx = page.context();
    await ctx.grantPermissions(['clipboard-read']);

    // Click the copy icon for batch ID
    const copyIcon = page.locator('fluxnova-batch-info-section fluxnova-icon[iconname="copy"]').first();
    await copyIcon.click();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(workingBatchId);
  });

  test('should display progress', async ({ page }) => {
    const progressLabel = page.getByText('Progress:');
    await expect(progressLabel).toBeVisible();
  });

  test('should display start time', async ({ page }) => {
    const infoSection = page.locator('fluxnova-batch-info-section');
    await expect(infoSection).toBeVisible();

    const startTimeLabel = infoSection.getByText('Start Time:');
    await expect(startTimeLabel).toBeVisible();

    // The value should be in the parent container, find any div that's not the label
    const startTimeContainer = startTimeLabel.locator('..');
    await expect(startTimeContainer).toBeVisible();

    const startTimeText = await startTimeContainer.innerText();
    // Verify the container has more than just the label text
    expect(startTimeText.replace('Start Time:', '').trim().length).toBeGreaterThan(0);
  });

  test('should display execution time', async ({ page }) => {
    const infoSection = page.locator('fluxnova-batch-info-section');
    await expect(infoSection).toBeVisible();

    const executionTimeLabel = infoSection.getByText('Execution Time:');
    await expect(executionTimeLabel).toBeVisible();

    const executionTimeContainer = executionTimeLabel.locator('..');
    await expect(executionTimeContainer).toBeVisible();
  });

  test('should display user', async ({ page }) => {
    const infoSection = page.locator('fluxnova-batch-info-section');
    await expect(infoSection).toBeVisible();

    const userLabel = infoSection.getByText('User:');
    await expect(userLabel).toBeVisible();

    const userContainer = userLabel.locator('..');
    await expect(userContainer).toBeVisible();
  });

  test('should display type', async ({ page }) => {
    const infoSection = page.locator('fluxnova-batch-info-section');
    await expect(infoSection).toBeVisible();

    const typeLabel = infoSection.getByText('Type:');
    await expect(typeLabel).toBeVisible();

    const typeContainer = typeLabel.locator('..');
    await expect(typeContainer).toBeVisible();

    const typeText = await typeContainer.innerText();
    expect(typeText.replace('Type:', '').trim().length).toBeGreaterThan(0);
  });

  test('should display total jobs', async ({ page }) => {
    const infoSection = page.locator('fluxnova-batch-info-section');
    await expect(infoSection).toBeVisible();

    const totalJobsLabel = infoSection.getByText('Total Jobs:');
    await expect(totalJobsLabel).toBeVisible();

    const totalJobsContainer = totalJobsLabel.locator('..');
    await expect(totalJobsContainer).toBeVisible();

    const totalJobsText = await totalJobsContainer.innerText();
    const numericValue = totalJobsText.replace('Total Jobs:', '').trim();
    expect(parseInt(numericValue, 10)).toBeGreaterThanOrEqual(0);
  });

  test('should display suspended status', async ({ page }) => {
    const infoSection = page.locator('fluxnova-batch-info-section');
    await expect(infoSection).toBeVisible();

    const suspendedLabel = infoSection.getByText('Suspended?:');
    await expect(suspendedLabel).toBeVisible();

    const suspendedContainer = suspendedLabel.locator('..');
    await expect(suspendedContainer).toBeVisible();

    const suspendedText = await suspendedContainer.innerText();
    const value = suspendedText.replace('Suspended?:', '').trim().toLowerCase();
    expect(['yes', 'no']).toContain(value);
  });

  test('should display batch jobs per seed', async ({ page }) => {
    const infoSection = page.locator('fluxnova-batch-info-section');
    await expect(infoSection).toBeVisible();

    const batchJobsPerSeedLabel = infoSection.getByText('Batch Jobs Per Seed:');
    await expect(batchJobsPerSeedLabel).toBeVisible();

    const batchJobsPerSeedContainer = batchJobsPerSeedLabel.locator('..');
    await expect(batchJobsPerSeedContainer).toBeVisible();

    const containerText = await batchJobsPerSeedContainer.innerText();
    const numericValue = containerText.replace('Batch Jobs Per Seed:', '').trim();
    expect(parseInt(numericValue, 10)).toBeGreaterThanOrEqual(0);
  });

  test('should display invocations per batch job', async ({ page }) => {
    const infoSection = page.locator('fluxnova-batch-info-section');
    await expect(infoSection).toBeVisible();

    const invocationsLabel = infoSection.getByText('Invocations Per Batch Job:');
    await expect(invocationsLabel).toBeVisible();

    const invocationsContainer = invocationsLabel.locator('..');
    await expect(invocationsContainer).toBeVisible();

    const containerText = await invocationsContainer.innerText();
    const numericValue = containerText.replace('Invocations Per Batch Job:', '').trim();
    expect(parseInt(numericValue, 10)).toBeGreaterThanOrEqual(0);
  });

  test('should display batch job definition ID', async ({ page }) => {
    const infoSection = page.locator('fluxnova-batch-info-section');
    await expect(infoSection).toBeVisible();

    const batchJobDefLabel = infoSection.getByText('Batch Job Definition ID:');
    await expect(batchJobDefLabel).toBeVisible();

    const batchJobDefContainer = batchJobDefLabel.locator('..');
    await expect(batchJobDefContainer).toBeVisible();

    const containerText = await batchJobDefContainer.innerText();
    const value = containerText.replace('Batch Job Definition ID:', '').trim();
    expect(value.length).toBeGreaterThan(0);
  });

  test('should display monitor job definition ID', async ({ page }) => {
    const infoSection = page.locator('fluxnova-batch-info-section');
    await expect(infoSection).toBeVisible();

    const monitorJobDefLabel = infoSection.getByText('Monitor Job Definition ID:');
    await expect(monitorJobDefLabel).toBeVisible();

    const monitorJobDefContainer = monitorJobDefLabel.locator('..');
    await expect(monitorJobDefContainer).toBeVisible();

    const containerText = await monitorJobDefContainer.innerText();
    const value = containerText.replace('Monitor Job Definition ID:', '').trim();
    expect(value.length).toBeGreaterThan(0);
  });

  test('should display seed job definition ID', async ({ page }) => {
    const infoSection = page.locator('fluxnova-batch-info-section');
    await expect(infoSection).toBeVisible();

    const seedJobDefLabel = infoSection.getByText('Seed Job Definition ID:');
    await expect(seedJobDefLabel).toBeVisible();

    const seedJobDefContainer = seedJobDefLabel.locator('..');
    await expect(seedJobDefContainer).toBeVisible();

    const containerText = await seedJobDefContainer.innerText();
    const value = containerText.replace('Seed Job Definition ID:', '').trim();
    expect(value.length).toBeGreaterThan(0);
  });

  test('should have all required info panel sections', async ({ page }) => {
    const infoSection = page.locator('fluxnova-batch-info-section');
    await expect(infoSection).toBeVisible();

    // Verify all always-present labels exist
    await expect(infoSection.getByText('Batch ID')).toBeVisible();
    await expect(infoSection.getByText('Progress:')).toBeVisible();
    await expect(infoSection.getByText('Start Time:')).toBeVisible();
    await expect(infoSection.getByText('Execution Time:')).toBeVisible();
    await expect(infoSection.getByText('User:')).toBeVisible();
    await expect(infoSection.getByText('Type:')).toBeVisible();
    await expect(infoSection.getByText('Total Jobs:')).toBeVisible();
    await expect(page.getByText('Suspended?:')).toBeVisible();
    await expect(page.getByText('Batch Jobs Per Seed:')).toBeVisible();
    await expect(page.getByText('Invocations Per Batch Job:')).toBeVisible();
    await expect(page.getByText('Batch Job Definition ID:')).toBeVisible();
    await expect(page.getByText('Monitor Job Definition ID:')).toBeVisible();
    await expect(page.getByText('Seed Job Definition ID:')).toBeVisible();
  });

  test('should display conditional fields when available', async ({ page }) => {
    const infoSection = page.locator('fluxnova-batch-info-section');
    await expect(infoSection).toBeVisible();

    // These fields are conditional (*ngIf) - check if they exist and verify if present
    const failedJobsLabel = infoSection.getByText('Failed Jobs:');
    const remainingJobsLabel = infoSection.getByText('Remaining Jobs:');
    const completedJobsLabel = infoSection.getByText('Completed Jobs:');
    const jobsCreatedLabel = infoSection.getByText('Jobs Created:');
    const endTimeLabel = infoSection.getByText('End Time:');
    const removalTimeLabel = infoSection.getByText('Removal Time:');

    // If any conditional field is visible, verify its container has the value
    if (await failedJobsLabel.isVisible()) {
      const failedJobsContainer = failedJobsLabel.locator('..');
      await expect(failedJobsContainer).toBeVisible();
      const containerText = await failedJobsContainer.innerText();
      const value = containerText.replace('Failed Jobs:', '').trim();
      expect(parseInt(value, 10)).toBeGreaterThanOrEqual(0);
    }

    if (await remainingJobsLabel.isVisible()) {
      const remainingJobsContainer = remainingJobsLabel.locator('..');
      await expect(remainingJobsContainer).toBeVisible();
      const containerText = await remainingJobsContainer.innerText();
      const value = containerText.replace('Remaining Jobs:', '').trim();
      expect(parseInt(value, 10)).toBeGreaterThanOrEqual(0);
    }

    if (await completedJobsLabel.isVisible()) {
      const completedJobsContainer = completedJobsLabel.locator('..');
      await expect(completedJobsContainer).toBeVisible();
      const containerText = await completedJobsContainer.innerText();
      const value = containerText.replace('Completed Jobs:', '').trim();
      expect(parseInt(value, 10)).toBeGreaterThanOrEqual(0);
    }

    if (await jobsCreatedLabel.isVisible()) {
      const jobsCreatedContainer = jobsCreatedLabel.locator('..');
      await expect(jobsCreatedContainer).toBeVisible();
      const containerText = await jobsCreatedContainer.innerText();
      const value = containerText.replace('Jobs Created:', '').trim();
      expect(parseInt(value, 10)).toBeGreaterThanOrEqual(0);
    }

    if (await endTimeLabel.isVisible()) {
      const endTimeContainer = endTimeLabel.locator('..');
      await expect(endTimeContainer).toBeVisible();
      const containerText = await endTimeContainer.innerText();
      const value = containerText.replace('End Time:', '').trim();
      expect(value.length).toBeGreaterThan(0);
    }

    if (await removalTimeLabel.isVisible()) {
      const removalTimeContainer = removalTimeLabel.locator('..');
      await expect(removalTimeContainer).toBeVisible();
      const containerText = await removalTimeContainer.innerText();
      const value = containerText.replace('Removal Time:', '').trim();
      expect(value.length).toBeGreaterThan(0);
    }
  });
});
