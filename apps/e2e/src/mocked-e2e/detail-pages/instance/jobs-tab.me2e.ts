import { expect, test } from '@playwright/test';
import { ProcessInstancePage } from '../../../page-objects/process-instance-page.po';

const PROCESS_INSTANCE_ID = '2f0f49b6-ef70-11ed-b7c8-0a8ebe9048cf';

test.describe('when there are jobs', () => {
  let processInstancePage: ProcessInstancePage;

  test.beforeEach(async ({ page, context }) => {
    processInstancePage = new ProcessInstancePage(page, PROCESS_INSTANCE_ID, 'jobs');

    await processInstancePage.initialize(context);
    await processInstancePage.goto();
    await page.waitForTimeout(500);
  });

  test('should show a grid containing columns related to each job in this process instance', async ({ page }) => {
    const headerTitles = [
      'Job ID',
      'Job Definition ID',
      'Due Time',
      'Create Time',
      'Retries Left',
      'Activity ID',
      'Activity Name',
      'Suspended',
      'Failed Activity ID',
    ];

    await page.waitForSelector('fluxnova-tabs-view');

    for (const headerTitleItem of headerTitles) {
      await expect(page.getByText(headerTitleItem, { exact: true })).toBeVisible();
    }
  });

  test('should show the total number of jobs using this jobs within the tab name', async ({ page }) => {
    const jobsTab = page.getByText(`Jobs (${processInstancePage.jobsMockedUsed.length})`);

    await expect(jobsTab).toBeVisible();
  });

  test('should allow each row to be selected, as indicated by url change', async ({ page }) => {
    const jobs = processInstancePage.jobsMockedUsed;
    const targetActivityId = 'Activity_0xd3o73';

    for (let i = 0; i < jobs.length; i++) {
      const jobItem = jobs[i];
      const rowItem = page.getByText(jobItem.id.slice(0, 24));

      await rowItem.click();

      await expect.poll(() => page.url()).toContain(`activityId=${targetActivityId}`);
      await expect.poll(() => page.url()).toContain(`jobId=${jobItem.id}`);
    }
  });

  test('should show a row that links to the selected job definition page', async ({ page }) => {
    const jobDefinitionIds = new Set(processInstancePage.jobsMockedUsed.map((o: any) => o?.jobDefinitionId ?? ''));

    for (const id of jobDefinitionIds) {
      await page.locator(`[href*="${id}"]`).first().isVisible();
    }
  });

  test('should filter jobs tab when an activity is clicked on the diagram', async ({ page }) => {
    await page.waitForSelector('fluxnova-generic-diagram-viewer', { timeout: 5000 });

    const targetActivityId = 'Activity_0xd3o73';
    const activitySelector = `[data-element-id="${targetActivityId}"]`;
    await page.waitForSelector(activitySelector, { timeout: 5000 });

    await page.click(activitySelector);

    await page.waitForTimeout(500);

    await expect(page).toHaveURL(
      new RegExp(`[?&]activityId=${targetActivityId}&filteredActivityId=${targetActivityId}(&|$)`),
    );
  });
});

test.describe('when there are no jobs', () => {
  let processInstancePage: ProcessInstancePage;

  test.beforeEach(async ({ page, context }) => {
    processInstancePage = new ProcessInstancePage(page, PROCESS_INSTANCE_ID, 'jobs');

    await processInstancePage.initialize(context);

    await processInstancePage.stubJobsForProcessInstance({
      status: 201,
      json: [],
    });

    await processInstancePage.stubJobDefinitionsForProcessInstance({
      status: 201,
      json: [],
    });

    await processInstancePage.goto();
    await page.waitForTimeout(500);
  });

  test('should show title as Jobs (0)', async ({ page }) => {
    await expect(page.getByText('Jobs (0)')).toBeVisible();
  });

  test('should show No jobs were found', async ({ page }) => {
    await expect(page.getByText('No jobs were found')).toBeVisible();
  });
});
