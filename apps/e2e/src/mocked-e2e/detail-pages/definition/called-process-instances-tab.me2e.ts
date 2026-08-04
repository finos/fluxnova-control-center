import { expect, test } from '@playwright/test';
import { ProcessDefinitionsPage } from '../../../page-objects/process-definitions-page.po';

const PROCESS_DEFINITION_ID = '465cf569-eeb2-11ed-9b96-0a81d7d98f19';
let processDefinitionsPage: ProcessDefinitionsPage;

test.beforeEach(async ({ page, context }) => {
  processDefinitionsPage = new ProcessDefinitionsPage(page, PROCESS_DEFINITION_ID, 'called-process-definitions');

  await processDefinitionsPage.initialize(context);
});

test('it should show rows of called process definition', async ({ page }) => {
  await processDefinitionsPage.goto();

  await expect(page.getByText('Static Called 1')).toBeVisible();
  await expect(page.getByText('Static Called 2')).toBeVisible();
});

test('it should have message "No called process definitions were found"', async ({ page }) => {
  await processDefinitionsPage.stubStaticCalledProcessDefinitionsEndpoint({
    status: 200,
    json: [],
  });

  await processDefinitionsPage.goto();

  await expect(page.getByText('No called process definitions were found')).toBeVisible();
});
