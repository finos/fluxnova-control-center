import { expect, test } from '@playwright/test';
import { ProcessInstancePage } from '../../page-objects/process-instance-page.po';
import {
  getProcessDefinitionId,
  startProcessInstance,
  suspendProcessInstance,
  terminateProcessInstances,
} from '../../utils/test-utils';
import { BasePage } from '../../page-objects/base-page.po';

let processInstancePage: ProcessInstancePage;

test.describe('Process Instances List Bulk Actions', () => {
  let workingInstanceId1: string;
  let workingInstanceId2: string;
  const ids: string[] = [];

  test.beforeEach(async ({ page }) => {
    const basicProcessDefinitionId = await getProcessDefinitionId('fluxnova_automation_basic', page);
    workingInstanceId1 = await startProcessInstance(basicProcessDefinitionId, page);
    workingInstanceId2 = await startProcessInstance(basicProcessDefinitionId, page);
    processInstancePage = new ProcessInstancePage(page);
    await page.goto(`./${BasePage.TENANT}/process-instances`);
  });

  test.afterEach(async ({ page }) => {
    if (workingInstanceId1 !== '') {
      ids.push(workingInstanceId1);
    }
    if (workingInstanceId2 !== '') {
      ids.push(workingInstanceId2);
    }
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await terminateProcessInstances(ids, page);
  });

  test('should suspend an instance', async ({ page }) => {
    await expect(page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]')).toBeVisible();
    // input one ID to filter down to one instance
    await page.locator('#id').fill(workingInstanceId1);
    await page.getByText('Add filter:"' + workingInstanceId1).click();
    await processInstancePage.waitForLoad();

    // select and suspend
    await page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]').click();
    await page.getByRole('button').nth(2).click();
    await page.getByRole('button', { name: 'Suspend' }).click();

    // expect a successful toast message
    await expect(page.getByText('SuccessSuccessfully suspended')).toBeVisible();

    // wait before cleaning up instances to avoid fluxnova error
    await page.waitForTimeout(1000);
  });

  test('should activate an instance', async ({ page }) => {
    await expect(page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]')).toBeVisible();
    // First, put instance into suspended state so it can be re-activated
    await suspendProcessInstance(workingInstanceId1, page);
    await page.reload();
    await processInstancePage.waitForLoad();

    // change the filters to show suspended instances
    await page.locator('.state > .ng-select-container > .ng-arrow-wrapper').click();
    await page.getByLabel('Options List').getByText('Suspended').click();

    // input one ID to filter down to one instance
    await page.locator('#id').fill(workingInstanceId1);
    await page.getByText('Add filter:"' + workingInstanceId1).click();
    await processInstancePage.waitForLoad();

    // select and activate
    await page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]').click();
    await page.getByRole('button').nth(1).click();
    await page.getByRole('button', { name: 'Activate' }).click();

    // expect a successful toast message
    await expect(page.getByText('SuccessSuccessfully activated')).toBeVisible();
  });

  test('should terminate an instance', async ({ page }) => {
    await expect(page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]')).toBeVisible();
    // input one ID to filter down to one instance
    await page.locator('#id').fill(workingInstanceId1);
    await page.getByText('Add filter:"' + workingInstanceId1).click();
    await processInstancePage.waitForLoad();

    // select and terminate
    await page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]').click();
    await page.getByRole('button').nth(3).click();
    await page.getByRole('button', { name: 'Terminate' }).click();

    // expect a successful toast message
    await expect(page.getByText('SuccessSuccessfully terminated')).toBeVisible();

    // clear workingInstanceId1 since it's already terminated
    workingInstanceId1 = '';
  });

  test('should enact bulk action polling (Suspend)', async ({ page }) => {
    await expect(page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]')).toBeVisible();
    // input two IDs to filter down to two instances
    await page.locator('#id').fill(workingInstanceId1);
    await page.getByText('Add filter:"' + workingInstanceId1).click();
    await processInstancePage.waitForLoad();
    await page.locator('#id').fill(workingInstanceId2);
    await page.getByText('Add filter:"' + workingInstanceId2).click();
    await processInstancePage.waitForLoad();

    //select both instances and suspend
    await page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]').click();
    await page.locator('.ag-row[row-id="1"] .ag-selection-checkbox input[type="checkbox"]').click();
    await page.getByRole('button').nth(2).click();
    await page.getByRole('button', { name: 'Suspend' }).click();

    // expect polling toast message to appear
    await expect(page.getByText('Request to suspend 2 instances submitted successfully')).toBeVisible();
  });
});
