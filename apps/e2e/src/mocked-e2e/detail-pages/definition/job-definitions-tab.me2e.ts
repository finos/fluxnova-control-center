import { expect, test } from '@playwright/test';
import { ProcessDefinitionsPage } from '../../../page-objects/process-definitions-page.po';

const PROCESS_DEFINITION_ID = '465cf569-eeb2-11ed-9b96-0a81d7d98f19';

async function stubJobs(processDefinitionsPage: ProcessDefinitionsPage) {
  await processDefinitionsPage.stubJobDefinitionsEndpoint({
    json: [],
    status: 201,
  });
}

test.describe('when there are job definitions', () => {
  let processDefinitionsPage: ProcessDefinitionsPage;

  test.beforeEach(async ({ page, context }) => {
    processDefinitionsPage = new ProcessDefinitionsPage(page, PROCESS_DEFINITION_ID, 'job-definitions');
    await processDefinitionsPage.initialize(context);
  });

  test('it should show job definitions tab title as Job Definitions (3)', async ({ page }) => {
    await page.route('api/jobs/job-definitions/count*', async (route) => {
      await route.fulfill({
        status: 201,
        body: JSON.stringify(3),
      });
    });
    await processDefinitionsPage.goto();

    await expect(page.getByText('Job Definitions (3)')).toBeVisible();
  });
});

test.describe('when there are no job definitions', () => {
  let processDefinitionsPage: ProcessDefinitionsPage;

  test.beforeEach(async ({ page, context }) => {
    processDefinitionsPage = new ProcessDefinitionsPage(page, PROCESS_DEFINITION_ID, 'job-definitions');
    await processDefinitionsPage.initialize(context);

    await stubJobs(processDefinitionsPage);

    await processDefinitionsPage.goto();
  });

  test('it should show incidents tab title as Job Definitions (0)', async ({ page }) => {
    await expect(page.getByText('Job Definitions (0)')).toBeVisible();
  });

  test('it should have message "No job definitions were found"', async ({ page }) => {
    await expect(page.getByText('No job-definitions were found')).toBeVisible();
  });
});
