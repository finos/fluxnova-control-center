import { expect, test } from '@playwright/test';
import { ProcessDefinitionsPage } from '../../../page-objects/process-definitions-page.po';

const PROCESS_DEFINITION_ID = '465cf569-eeb2-11ed-9b96-0a81d7d98f19';
let processDefinitionsPage: ProcessDefinitionsPage;

test.describe('when there are decision instances', () => {
  test.beforeEach(async ({ page, context }) => {
    processDefinitionsPage = new ProcessDefinitionsPage(page, PROCESS_DEFINITION_ID, 'decision-instances');

    await processDefinitionsPage.initialize(context);

    await processDefinitionsPage.goto();

    await page.locator('fluxnova-decision-instance-list').waitFor({ state: 'visible' });
  });

  test('it should show decision instances tab title as Decision Instances', async ({ page }) => {
    await expect(page.getByRole('navigation').getByText('Decision Instances')).toBeVisible();
  });

  test('it should have 2 rows', async ({ page }) => {
    await expect(page.getByText('test-decision-instance-id-1')).toBeVisible();
    await expect(page.getByText('test-decision-instance-id-2')).toBeVisible();
  });
});

test.describe('when there are no decision instances', () => {
  test.beforeEach(async ({ page, context }) => {
    processDefinitionsPage = new ProcessDefinitionsPage(page, PROCESS_DEFINITION_ID, 'decision-instances');

    await processDefinitionsPage.initialize(context);

    await processDefinitionsPage.stubDecisionInstancesEndpoint({
      json: [],
      status: 201,
    });

    await processDefinitionsPage.goto();
  });

  test('it should show decision instances tab title as Decision Instances', async ({ page }) => {
    await expect(page.getByRole('navigation').getByText('Decision Instances')).toBeVisible();
  });

  test('it should have message "No decision instances were found"', async ({ page }) => {
    await expect(page.getByText('No decision-instances were found')).toBeVisible();
  });
});
