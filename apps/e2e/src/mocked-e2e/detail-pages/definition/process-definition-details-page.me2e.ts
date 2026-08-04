import { BrowserContext, expect, Page, test } from '@playwright/test';
import { ItemTypeActions } from '@fxn/types';
import { ResourcePermissionPair } from '@fxn/types/src/permissions';
import { FXN_SUPPORT_STORAGE_STATE } from '../../../../playwright.config';
import { ProcessDefinitionsPage } from '../../../page-objects/process-definitions-page.po';
import {
  buttonHiddenWithNoPermissions,
  buttonNotHiddenWhenAuthIsNone,
  buttonVisibleWithAllPermissions,
  buttonVisibleWithAtLeastOnePermission,
} from '../../../utils/button-permissions.test';

const PROCESS_DEFINITION_ID = '465cf569-eeb2-11ed-9b96-0a81d7d98f19';

async function initializePageWithPermissions(
  page: Page,
  context: BrowserContext,
  permissions?: ResourcePermissionPair[],
) {
  // Create and initialize the page object
  const processDefinitionsPage = new ProcessDefinitionsPage(page, PROCESS_DEFINITION_ID, 'instances');

  await processDefinitionsPage.initialize(context, permissions);

  return processDefinitionsPage;
}

test.describe('The process definitions page', () => {
  test.use({ storageState: FXN_SUPPORT_STORAGE_STATE });

  let processDefinitionsPage: ProcessDefinitionsPage;

  test.beforeEach(async ({ page, context }) => {
    processDefinitionsPage = await initializePageWithPermissions(page, context);
    await processDefinitionsPage.goto();
  });

  test(`should render with the proper url path ${new RegExp(String.raw`/process-definitions/${PROCESS_DEFINITION_ID}`)}`, async ({
    page,
  }) => {
    await expect(page).toHaveURL(new RegExp(String.raw`/process-definitions/${PROCESS_DEFINITION_ID}`));
  });

  test(`should render element fluxnova-process-definition-info-section`, async ({ page }) => {
    await expect(page.locator('fluxnova-process-definition-info-section')).toBeVisible();
  });

  test('should have visible fluxnova diagram', async () => {
    await expect(processDefinitionsPage.fluxnovaDiagramLegendTriggerOnPage).toBeVisible();
  });

  test.describe('migrate button', () => {
    test('should be visible', async () => {
      await expect(processDefinitionsPage.migrateButton).toBeVisible();
    });

    test('should be enabled when there are active process instances and multiple definition versions', async () => {
      await expect(processDefinitionsPage.migrateButton).toBeEnabled();
    });

    test('should be disabled when there are active process instances but not multiple definition versions', async () => {
      await processDefinitionsPage.stubProcessDefinitionsEndpoint({
        status: 201,
        json: [
          {
            id: '1fc528c2-eeb1-11ed-9b96-0a81d7d98f19',
            key: 'MODEL-7047e74a-bfca-4b2d-a574-f41e5f57b058',
            category: 'http://bpmn.io/schema/bpmn',
            description: null,
            name: 'Migration Test',
            version: 1,
            resource: 'Migration-Test v1.bpmn',
            deploymentId: '1fc3a21f-eeb1-11ed-9b96-0a81d7d98f19',
            diagram: null,
            suspended: false,
            tenantId: null,
            versionTag: null,
            historyTimeToLive: 30,
            startableInTasklist: true,
          },
        ],
      });
      await processDefinitionsPage.goto();

      await expect(processDefinitionsPage.migrateButton).toBeDisabled();
    });

    test('should be disabled when there are no active process instances but there are multiple definition versions', async ({
      page,
    }) => {
      await processDefinitionsPage.stubProcessInstancesEndpoint({
        status: 200,
        json: [
          {
            id: 'asdf',
            state: 'EXTERNALLY_TERMINATED',
          },
        ],
      });
      await page.route('api/process-instances/count', (route) => route.fulfill({ status: 200, body: '0' }));
      await expect(processDefinitionsPage.migrateButton).toBeDisabled();
    });
  });

  test('should show a migration modal when migrate instances button is clicked ', async () => {
    await processDefinitionsPage.migrateButton.click();
    await expect(processDefinitionsPage.migrateModal).toBeVisible();
  });
});

test.describe('Process definitions page permissions', () => {
  const initializerFunction = async (page: Page, context: BrowserContext, permissions?: ResourcePermissionPair[]) => {
    const pdPage = await initializePageWithPermissions(page, context, permissions);
    await pdPage.goto();
  };

  test.describe(`Activate/Suspend button`, () => {
    const selector = `#suspend`;

    buttonVisibleWithAtLeastOnePermission(selector, ItemTypeActions.SuspendProcessDefinition, initializerFunction);
  });

  test.describe(`Delete button`, () => {
    const selector = `#delete`;

    buttonVisibleWithAllPermissions(selector, ItemTypeActions.DeleteProcessDefinition, initializerFunction);
    buttonHiddenWithNoPermissions(selector, initializerFunction);
    buttonNotHiddenWhenAuthIsNone(selector, initializerFunction);
  });
});
