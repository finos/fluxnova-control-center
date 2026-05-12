import { expect, test } from '@playwright/test';
import { ProcessInstancePage } from '../../page-objects/process-instance-page.po';
import {
  getProcessDefinitionId,
  startProcessInstance,
  suspendProcessInstance,
  terminateProcessInstance,
} from '../../utils/test-utils';

/**
 * @group regression
 * @group process-instance
 * @group process-instance-details
 * @group process-instance-details-actions
 */

let processInstancePage: ProcessInstancePage;

test.describe('Process Instance Detail Actions', () => {
  let workingInstanceId: string;

  test.beforeEach(async ({ page }) => {
    const basicProcessDefinitionId = await getProcessDefinitionId('fluxnova_automation_basic', page);
    workingInstanceId = await startProcessInstance(basicProcessDefinitionId, page);
    processInstancePage = new ProcessInstancePage(page);
    await processInstancePage.navigateToInstanceDetailsPage(workingInstanceId);
  });

  test.afterEach(async ({ page }) => {
    if (workingInstanceId !== '') {
      await terminateProcessInstance(workingInstanceId, page);
    }
    await page.close();
  });

  test('should activate suspended instance', async ({ page }) => {
    await suspendProcessInstance(workingInstanceId, page);
    await page.reload();
    await processInstancePage.waitForLoad();

    await expect(processInstancePage.activateButton).toBeEnabled();
    const confirmModal = page.locator('fluxnova-confirm-modal');
    await expect(confirmModal).not.toBeVisible();
    await processInstancePage.activateButton.click();
    await expect(confirmModal).toBeVisible();

    // Check modal content
    await expect(confirmModal.locator('.modal-header')).toHaveText('Activate Process Instance');
    await expect(confirmModal.locator('.modal-body')).toContainText(
      'Are you sure you want to activate this process instance?',
    );

    // Read more content check
    const activateReadMoreText = 'Tasks belonging to this process instance will also be activated.';
    await expect(confirmModal.locator('.modal-body')).not.toContainText(activateReadMoreText);
    await confirmModal.locator('span:has-text("Read More")').click();
    await expect(confirmModal.locator('.modal-body')).toContainText(activateReadMoreText);
    await confirmModal.locator('span:has-text("Read Less")').click();
    await expect(confirmModal.locator('.modal-body')).not.toContainText(activateReadMoreText);

    // Confirm activation
    await confirmModal.locator('button:has-text("Activate")').click();
    await expect(processInstancePage.toastHeader).toHaveText('Success');
  });

  test('should suspend active instance', async ({ page }) => {
    await processInstancePage.waitForLoad();
    await expect(processInstancePage.suspendButton).toBeEnabled();
    const confirmModal = page.locator('fluxnova-confirm-modal');
    await expect(confirmModal).not.toBeVisible();
    await processInstancePage.suspendButton.click();
    await expect(confirmModal).toBeVisible();

    // Check modal content
    await expect(confirmModal.locator('.modal-header')).toHaveText('Suspend Process Instance');
    await expect(confirmModal.locator('.modal-body')).toContainText(
      'Are you sure you want to suspend this process instance?',
    );

    // Read more content check
    const suspendReadMoreText = 'Tasks belonging to this process instance will also be suspended.';
    await expect(confirmModal.locator('.modal-body')).not.toContainText(suspendReadMoreText);
    await confirmModal.locator('span:has-text("Read More")').click();
    await expect(confirmModal.locator('.modal-body')).toContainText(suspendReadMoreText);
    await confirmModal.locator('span:has-text("Read Less")').click();
    await expect(confirmModal.locator('.modal-body')).not.toContainText(suspendReadMoreText);

    // Confirm suspension
    await confirmModal.locator('button:has-text("Suspend")').click();
    await expect(processInstancePage.toastHeader).toHaveText('Success');
  });

  test('should terminate instance with all options checked', async ({ page }) => {
    await expect(processInstancePage.terminateButton).toBeEnabled();
    const confirmModal = page.locator('fluxnova-confirm-modal');
    await expect(confirmModal).not.toBeVisible();
    await processInstancePage.terminateButton.click();
    await expect(confirmModal).toBeVisible();

    // Check modal content
    await expect(confirmModal.locator('.modal-header')).toHaveText('Terminate Process Instance');
    await expect(confirmModal.locator('.modal-body')).toContainText(
      'Are you sure you want to terminate this process instance?',
    );

    // Confirm termination
    await confirmModal.locator('button:has-text("Terminate")').click();
    await expect(processInstancePage.toastHeader).toHaveText('Success');
    workingInstanceId = '';
  });

  test('should terminate instance with no options checked', async ({ page }) => {
    await expect(processInstancePage.terminateButton).toBeEnabled();
    const confirmModal = page.locator('fluxnova-confirm-modal');
    await expect(confirmModal).not.toBeVisible();
    await processInstancePage.terminateButton.click();
    await expect(confirmModal).toBeVisible();

    // Set modal options
    const modalInputs = await confirmModal.locator('input[type="checkbox"]').all();
    for (const input of modalInputs) {
      await input.click();
    }

    // Confirm termination
    await confirmModal.locator('button:has-text("Terminate")').click();
    await expect(processInstancePage.toastHeader).toHaveText('Success');
    workingInstanceId = '';
  });

  test('should download resource', async ({ page }) => {
    await processInstancePage.waitForLoad();
    await expect(processInstancePage.downloadResourceButton).toBeEnabled();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      processInstancePage.downloadResourceButton.click(),
    ]);
    expect(download.suggestedFilename()).toBe('fluxnova_automation_basic.bpmn');
  });
});
