import { BrowserContext, expect, Page, test } from '@playwright/test';
import {
  ActionPermissionsSpec,
  ItemTypeAction,
  ItemTypeActions,
  UpdateProcessInstancePermission,
} from '@fxn/types/src';
import { ResourcePermissionPair } from '@fxn/types/src/permissions';
import { ProcessInstancePage } from '../../../page-objects/process-instance-page.po';
import activityInstancesMockResponse from '../../../fixtures/process-instances/activity-instances-single-active-token.json';
import {
  buttonHiddenWithNoPermissions,
  buttonNotHiddenWhenAuthIsNone,
  buttonVisibleWithAtLeastOnePermission,
} from '../../../utils/button-permissions.test';

const PROCESS_INSTANCE_ID = '2f0f49b6-ef70-11ed-b7c8-0a8ebe9048cf';

async function initializePageWithPermissions(
  page: Page,
  context: BrowserContext,
  permissions?: ResourcePermissionPair[],
) {
  const processInstancePage = new ProcessInstancePage(page, PROCESS_INSTANCE_ID, 'variables');
  await processInstancePage.initialize(context, permissions);

  return processInstancePage;
}

test.describe('Process instance page permissions', () => {
  const initializerFunction = async (page: Page, context: BrowserContext, permissions?: ResourcePermissionPair[]) => {
    const piPage = await initializePageWithPermissions(page, context, permissions);
    await piPage.goto();
  };

  const initializerFunctionRightClick = async (
    page: Page,
    context: BrowserContext,
    permissions?: ResourcePermissionPair[],
  ) => {
    const piPage = await initializePageWithPermissions(page, context, permissions);
    await piPage.stubActivityInstancesEndpoint({
      status: 200,
      json: activityInstancesMockResponse,
    });
    await piPage.goto();
    await page.locator('[data-element-id="Activity_0xd3o73"]').click({
      button: 'right',
    });
  };

  for (const button of ['Suspend', 'Terminate']) {
    test.describe(`${button} button`, () => {
      const selector = `#${button.toLowerCase()}`;

      buttonVisibleWithAtLeastOnePermission(
        selector,
        ItemTypeActions[`${button}ProcessInstance` as ItemTypeAction],
        initializerFunction,
      );
      buttonHiddenWithNoPermissions(selector, initializerFunction);
      buttonNotHiddenWhenAuthIsNone(selector, async (page: Page, context: BrowserContext) => {
        const processInstancePage = new ProcessInstancePage(page, PROCESS_INSTANCE_ID, 'variables');
        await processInstancePage.initialize(context);
        await processInstancePage.goto();
      });
    });
  }

  test.describe(`move tokens button`, () => {
    const selector = `#move_tokens`;

    buttonVisibleWithAtLeastOnePermission(selector, ItemTypeActions.MoveTokens, initializerFunction);
    buttonHiddenWithNoPermissions(selector, initializerFunction);
    buttonNotHiddenWhenAuthIsNone(selector, async (page: Page, context: BrowserContext) => {
      const processInstancePage = new ProcessInstancePage(page, PROCESS_INSTANCE_ID, 'variables');
      await processInstancePage.initialize(context);
      await processInstancePage.goto();
    });
  });

  test.describe(`context menu`, () => {
    const selector = `#context-menu`;

    buttonVisibleWithAtLeastOnePermission(selector, ItemTypeActions.MoveTokens, initializerFunctionRightClick);
    buttonHiddenWithNoPermissions(selector, initializerFunctionRightClick);
    buttonNotHiddenWhenAuthIsNone(selector, async (page: Page, context: BrowserContext) => {
      const processInstancePage = new ProcessInstancePage(page, PROCESS_INSTANCE_ID, 'variables');
      await processInstancePage.initialize(context);
      await processInstancePage.stubActivityInstancesEndpoint({
        status: 200,
        json: activityInstancesMockResponse,
      });
      await processInstancePage.goto();
      await page.locator('[data-element-id="Activity_0xd3o73"]').click({
        button: 'right',
      });
    });
  });

  test.describe('applying token changes', () => {
    const updatePermission: ResourcePermissionPair = UpdateProcessInstancePermission;
    const deletePermissions: ResourcePermissionPair[] = ActionPermissionsSpec.TerminateProcessInstance
      .OneOf as ResourcePermissionPair[];

    for (const deletePermission of deletePermissions) {
      test(`allows applying changes when user has minimum permission ${deletePermission.resourceName}`, async ({
        page,
        context,
      }) => {
        await initializerFunctionRightClick(page, context, [updatePermission, deletePermission]);

        await page.locator('#context-menu').isVisible();
        await page.locator('[data-action="remove_token"]').click();
        await page.getByRole('button', { name: 'Apply Changes' }).click();

        await expect(page.locator('fluxnova-apply-changes-confirm-modal .warning')).toHaveText(
          /Applying this change set will put this process into an Externally Terminated state/,
        );
      });
    }

    test('disallows applying changes when user does not have the required permissions', async ({ page, context }) => {
      await initializerFunctionRightClick(page, context, [updatePermission]);

      await page.locator('#context-menu').isVisible();
      await page.locator('[data-action="remove_token"]').click();
      await page.getByRole('button', { name: 'Apply Changes' }).click();

      await expect(page.locator('fluxnova-apply-changes-confirm-modal .warning')).toHaveText(
        /Insufficient Permissions/,
      );
      await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();
    });
  });
});
