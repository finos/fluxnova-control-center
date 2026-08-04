import { expect, Page, test } from '@playwright/test';
import {
  activateProcessDefinition,
  getProcessDefinitionId,
  startProcessInstance,
  terminateProcessInstance,
} from '../utils/test-utils';
import { BasePage } from '../page-objects/base-page.po';

test.describe('Process Instance Modification', () => {
  test.describe('given the process instance is Active', () => {
    test.describe.configure({ mode: 'serial' });
    let workingInstanceId = '';

    test.beforeAll(async ({ browser }) => {
      const page = await browser.newPage();
      const definitionId = await getProcessDefinitionId('fluxnova_automation_basic', page);
      await activateProcessDefinition('fluxnova_automation_basic', page);
      workingInstanceId = await startProcessInstance(definitionId, page);
    });

    test.beforeEach(async ({ page }) => {
      await page.goto(`${BasePage.TENANT}/process-instances/${workingInstanceId}`);
    });

    test('Move token button is visible', async ({ page }) => {
      await expect(page.locator('#move_tokens')).toBeVisible();
    });

    test('Cannot add token to a shape which has one already', async ({ page }) => {
      await getDataElement(page, 'Empty_Task').click({ button: 'right' });
      await expect(page.locator('#context-menu')).toBeVisible();
      await expect(page.locator('[data-action="add_token"]')).toHaveClass(/disabled/);
    });

    test('Can remove token from shapes which currently have a token', async ({ page }) => {
      await getDataElement(page, 'Empty_Task').click({ button: 'right' });
      await contextMenuVisible(page);
      await page.locator('[data-action="remove_token"]').click();
      await saveChanges(page, workingInstanceId);
    });

    test('Can add token to activity', async ({ page }) => {
      await getDataElement(page, 'Empty_Task').click({ button: 'right' });
      await contextMenuVisible(page);
      await page.locator('[data-action="add_token"]').click();
      await saveChanges(page, workingInstanceId);
    });

    test('Modal shows warning that you will remove all tokens from an instances', async ({ page }) => {
      await getDataElement(page, 'Empty_Task').click({ button: 'right' });
      await contextMenuVisible(page);
      await page.locator('[data-action="remove_token"]').click();

      await getDataElement(page, 'alternate_task').click({ button: 'right' });
      await contextMenuVisible(page);
      const removeTokenButton = page.locator('[data-action="remove_token"]');
      if (!(await removeTokenButton.evaluate((node, className) => node.classList.contains(className), 'disabled'))) {
        await removeTokenButton.click();
      }

      await getDataElement(page, 'Event_0ukhwx0').click({ button: 'right' });
      await contextMenuVisible(page);
      await page.locator('[data-action="remove_token"]').click();

      await saveChanges(page, workingInstanceId, true, false);
      await expect(page.locator('fluxnova-apply-changes-confirm-modal')).toBeVisible();
      await expect(page.locator('fluxnova-apply-changes-confirm-modal').locator('.modal-body')).toContainText(
        'Applying this change set will put this process into an Externally Terminated state, which then cannot be restarted. Are you sure you want to continue?',
      );

      // the modal cancel
      await page.locator('fluxnova-apply-changes-confirm-modal').getByRole('button', { name: 'Cancel' }).click();
      // the diagram cancel
      await page.locator('#cancel').click();
    });

    test('Instance shows externally terminated after removing all tokens from the instance', async ({ page }) => {
      await getDataElement(page, 'Empty_Task').click({ button: 'right' });
      await contextMenuVisible(page);
      await page.locator('[data-action="remove_token"]').click();

      await getDataElement(page, 'alternate_task').click({ button: 'right' });
      await contextMenuVisible(page);
      const removeTokenButton = page.locator('[data-action="remove_token"]');
      if (!(await removeTokenButton.evaluate((node, className) => node.classList.contains(className), 'disabled'))) {
        await removeTokenButton.click();
      }

      await getDataElement(page, 'Event_0ukhwx0').click({ button: 'right' });
      await contextMenuVisible(page);
      await page.locator('[data-action="remove_token"]').click();

      await saveChanges(page, workingInstanceId, true);

      await getDataElement(page, 'Flow_152gdj3').click({ button: 'right', force: true });
      await page.reload();
      await contextMenuHidden(page);
    });
  });

  test.describe('given the process instance is COMPLETE/TERMINATED', () => {
    let workingInstanceId = '';

    test.beforeAll(async ({ browser }) => {
      const page = await browser.newPage();
      const definitionId = await getProcessDefinitionId('fluxnova_automation_basic', page);
      await activateProcessDefinition('fluxnova_automation_basic', page);
      workingInstanceId = await startProcessInstance(definitionId, page);
      await terminateProcessInstance(workingInstanceId, page);
    });

    test.beforeEach(async ({ page }) => {
      await page.goto(`${BasePage.TENANT}/process-instances/${workingInstanceId}`);
    });

    test('Context menu should remain hidden when right clicking', async ({ page }) => {
      await getDataElement(page, 'Flow_152gdj3').click({ button: 'right', force: true });
      await contextMenuHidden(page);
    });

    test('Move tokens button should be disabled', async ({ page }) => {
      await expect(page.locator('#move_tokens')).toBeDisabled();
    });
  });
});

function getDataElement(page: Page, dataElementId: string) {
  return page.locator(`[data-element-id=${dataElementId}]`);
}

async function contextMenuVisible(page: Page) {
  return await expect(page.locator('#context-menu')).toBeVisible();
}

async function contextMenuHidden(page: Page) {
  return await expect(page.locator('#context-menu')).toBeHidden();
}

async function saveChanges(page: Page, id: string, confirmRequired: boolean = true, confirmResult: boolean = true) {
  await page.locator('#save_changes').click();
  if (confirmResult && confirmRequired) {
    await page.getByRole('button', { name: 'Continue' }).click();
  } else if (confirmRequired && !confirmResult) {
    // do nothing
  } else {
    await expect(page.locator('.toast').locator('.text-block').locator('.body')).toBeVisible();
    await expect(page.locator('.toast').locator('.text-block').locator('.body')).toHaveText(
      `Successfully modified process: ${id}`,
    );
  }
}
