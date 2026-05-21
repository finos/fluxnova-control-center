import { expect, test } from '@playwright/test';
import { FXN_SUPPORT_STORAGE_STATE } from '../../../../playwright.config';
import { ProcessDefinitionsPage } from '../../../page-objects/process-definitions-page.po';

const PROCESS_DEFINITION_ID = '465cf569-eeb2-11ed-9b96-0a81d7d98f19';
let processDefinitionsPage: ProcessDefinitionsPage;

test.beforeEach(async ({ page, context }) => {
  processDefinitionsPage = new ProcessDefinitionsPage(page, PROCESS_DEFINITION_ID, 'instances');

  await processDefinitionsPage.initialize(context);
  await processDefinitionsPage.goto();
});

test.describe('The version dropdown on the process definition detail page', () => {
  test.use({ storageState: FXN_SUPPORT_STORAGE_STATE });

  test('shows which versions have instances in the version dropdown', async ({ page }) => {
    await page.waitForTimeout(2000);

    const versionLocator = page.locator('fluxnova-process-definition-info-section span').nth(2);

    await versionLocator.click({ force: true });

    const listOfOptionRoles = ['1 *', '2 *', '3 *', '4 *', '5', '6 *'];

    // should be 6 ng-options
    expect((await page.locator('.ng-dropdown-panel-items.scroll-host').getByRole('option').all()).length).toBe(6);

    for (const roleName of listOfOptionRoles) {
      await expect(page.getByRole('option', { name: roleName })).toBeVisible();
    }
  });
});
