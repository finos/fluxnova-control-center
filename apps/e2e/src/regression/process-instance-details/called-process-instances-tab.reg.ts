import { expect, test } from '@playwright/test';
import { ProcessInstancePage } from '../../page-objects/process-instance-page.po';
import { getProcessDefinitionId, startProcessInstance, terminateProcessInstance } from '../../utils/test-utils';

let processInstancePage: ProcessInstancePage;

test.describe('Called Process Instances Tab', () => {
  let workingInstanceId: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const callActivityProcessDefinitionId = await getProcessDefinitionId('fluxnova_automation_call_activity', page);
    workingInstanceId = await startProcessInstance(callActivityProcessDefinitionId, page);
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await terminateProcessInstance(workingInstanceId, page);
  });

  test.beforeEach(async ({ page }) => {
    processInstancePage = new ProcessInstancePage(page);
    await processInstancePage.navigateToInstanceDetailsPage(workingInstanceId);

    const calledProcessInstancesTab = page.locator('fluxnova-static-called-process-instances');
    await expect(calledProcessInstancesTab).not.toBeVisible();
    await page.locator('li[data-tab="called-process-instances"]').click();
    await expect(calledProcessInstancesTab).toBeVisible();
    await processInstancePage.waitForLoad();
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('should filter by id', async ({ page }) => {
    const firstCalledProcessInstance = page
      .locator('.ag-pinned-left-cols-container')
      .first()
      .locator('.ag-row')
      .first();
    const instanceId = (await firstCalledProcessInstance.locator('div[col-id="id"]').textContent()) ?? '';

    await page.fill('input#id', instanceId);
    await page.locator('ng-dropdown-panel').click();
    await expect(firstCalledProcessInstance).toContainText(instanceId);
    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(1);
    await expect(page.locator('li[data-tab="called-process-instances"]').locator('div')).toContainText('(1)');

    await page.locator('ng-dropdown-panel').click(); // Close the dropdown panel to avoid interference with the next action

    await page.waitForTimeout(500);

    await page.fill('input#id', 'fake-instance-id');
    await page.locator('ng-dropdown-panel').click();
    await expect(firstCalledProcessInstance).toHaveCount(0);
    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(0);
    await expect(page.locator('li[data-tab="called-process-instances"]').locator('div')).toContainText('(0)');
  });

  test('should filter by activity id', async ({ page }) => {
    const firstCalledProcessInstance = page.locator('.ag-center-cols-container').first().locator('.ag-row').first();
    const activityId = (await firstCalledProcessInstance.locator('div[col-id="activityId"]').textContent()) ?? '';

    await page.fill('input#activityId', activityId);
    await expect(firstCalledProcessInstance).toContainText(activityId);
    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(1);
    await expect(page.locator('li[data-tab="called-process-instances"]').locator('div')).toContainText('(1)');

    await page.waitForTimeout(500);

    await page.fill('input#activityId', 'Fake_Activity_ID');
    await expect(firstCalledProcessInstance).toHaveCount(0);
    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(0);
    await expect(page.locator('li[data-tab="called-process-instances"]').locator('div')).toContainText('(0)');
  });

  test('should filter by state', async ({ page }) => {
    const firstCalledProcessInstance = page.locator('.ag-center-cols-container').first().locator('.ag-row').first();

    await page.locator('ng-select.state').click();
    await expect(page.locator('ng-dropdown-panel')).toBeVisible();
    await page.locator('ng-dropdown-panel').locator('div[role="option"]', { hasText: 'Completed' }).click();
    await expect(page.locator('ng-dropdown-panel')).toBeHidden();

    await expect(firstCalledProcessInstance).toContainText('Completed');
    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(1);
    await expect(page.locator('li[data-tab="called-process-instances"]').locator('div')).toContainText('(1)');

    await page.waitForTimeout(500);

    await page.locator('ng-select.state').click();
    await expect(page.locator('ng-dropdown-panel')).toBeVisible();
    await page.locator('ng-dropdown-panel').locator('div[role="option"]', { hasText: 'Active' }).click();
    await expect(page.locator('ng-dropdown-panel')).toBeHidden();

    await expect(firstCalledProcessInstance).toHaveCount(0);
    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(0);
    await expect(page.locator('li[data-tab="called-process-instances"]').locator('div')).toContainText('(0)');
  });

  test('should allow moving unpinned columns', async ({ page }) => {
    const definitionNameColumnHeader = page.locator('div[role="columnheader"]', { hasText: 'Process Definition Name' });
    const activityIdColumnHeader = page.locator('div[role="columnheader"]', { hasText: 'Activity ID' });

    await expect(definitionNameColumnHeader).toHaveAttribute('aria-colindex', '2');
    await expect(activityIdColumnHeader).toHaveAttribute('aria-colindex', '3');

    await definitionNameColumnHeader.dragTo(activityIdColumnHeader);

    await expect(definitionNameColumnHeader).toHaveAttribute('aria-colindex', '3');
    await expect(activityIdColumnHeader).toHaveAttribute('aria-colindex', '2');
  });

  test('should not allow moving pinned left column', async ({ page }) => {
    const pinnedIdColumnHeader = page.locator('div[role="columnheader"]', { hasText: 'Instance ID' });
    const definitionNameColumnHeader = page.locator('div[role="columnheader"]', { hasText: 'Process Definition Name' });

    await expect(pinnedIdColumnHeader).toHaveAttribute('aria-colindex', '1');
    await expect(definitionNameColumnHeader).toHaveAttribute('aria-colindex', '2');

    await pinnedIdColumnHeader.dragTo(definitionNameColumnHeader);

    await expect(pinnedIdColumnHeader).toHaveAttribute('aria-colindex', '1');
    await expect(definitionNameColumnHeader).toHaveAttribute('aria-colindex', '2');
  });
});
