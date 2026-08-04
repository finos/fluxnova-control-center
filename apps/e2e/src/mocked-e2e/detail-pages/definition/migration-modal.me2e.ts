import { expect, test } from '@playwright/test';
import { FXN_SUPPORT_STORAGE_STATE } from '../../../../playwright.config';
import { ProcessDefinitionsPage } from '../../../page-objects/process-definitions-page.po';

const PROCESS_DEFINITION_ID = '465cf569-eeb2-11ed-9b96-0a81d7d98f19';
let processDefinitionsPage: ProcessDefinitionsPage;

test.beforeEach(async ({ page, context }) => {
  processDefinitionsPage = new ProcessDefinitionsPage(page, PROCESS_DEFINITION_ID, 'instances');

  await processDefinitionsPage.initialize(context);

  await page.route('api/process-instances/count', async (route) => {
    await route.fulfill({
      status: 201,
      body: JSON.stringify(1),
    });
  });

  await processDefinitionsPage.goto();
  await page.waitForURL('./default/process-definitions/465cf569-eeb2-11ed-9b96-0a81d7d98f19?tab=instances');
  await page.waitForTimeout(2000);
  // click on the instance id check mark
  await processDefinitionsPage.processInstanceCheckbox.click();

  await page.waitForTimeout(500);

  // click on migrate instances to make modal pop up
  await processDefinitionsPage.migrateButton.click();
});

test.describe('The migration modal', () => {
  test.use({ storageState: FXN_SUPPORT_STORAGE_STATE });

  test('should show a migration modal', async ({ page }) => {
    await processDefinitionsPage.clickableElementShowModels.click();

    await page.waitForTimeout(500);

    await expect(processDefinitionsPage.migrateModalDiagrams).toBeVisible();
  });

  test('initially has the next version selected', async () => {
    await expect(processDefinitionsPage.selectedVersionElement).toBeVisible();
    await expect(processDefinitionsPage.selectedVersionElement).toHaveText('5');
  });

  test('should give the user a summary of the migration', async () => {
    await expect(processDefinitionsPage.migrateModalSummaryText).toContainText(
      '1 out of 1 unfinished process instance(s) for this definition will be migrated from version 6 to version 5.',
    );
  });

  test('should list all versions of the definition in the dropdown', async ({ page }) => {
    const dropdown = page.locator(
      'body > ngb-modal-window > div > div > fluxnova-migrate-modal > div.modal-body > div > div',
    );
    await dropdown.click();

    await page.waitForTimeout(500);

    const selectOptions = await page.locator('ng-dropdown-panel .ng-dropdown-panel-items .ng-option').all();

    expect(selectOptions.length).toBe(6);
  });

  test('should show the corresponding target diagram', async ({ page }) => {
    const showModelsButton = page.getByText('Show Models');

    await showModelsButton.click();

    await expect(page.locator('fluxnova-migrate-modal').getByText('Version 6', { exact: true })).toBeVisible();
    await expect(page.locator('fluxnova-migrate-modal').getByText('Version 5', { exact: true })).toBeVisible();
  });
});
