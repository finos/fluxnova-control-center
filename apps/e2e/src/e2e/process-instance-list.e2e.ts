import { expect, test } from '@playwright/test';
import {
  activateProcessDefinition,
  getProcessDefinitionId,
  startProcessInstance,
  startProcessInstances,
  suspendProcessInstances,
  terminateProcessInstance,
  terminateProcessInstances,
} from '../utils/test-utils';
import { BasePage } from '../page-objects/base-page.po';

test.describe('Simple List Actions', () => {
  let workingInstanceId = '';

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const definitionId = await getProcessDefinitionId('fluxnova_automation_basic', page);
    await activateProcessDefinition('fluxnova_automation_basic', page);
    workingInstanceId = await startProcessInstance(definitionId, page);
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await terminateProcessInstance(workingInstanceId, page);
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(
      `${BasePage.TENANT}/process-instances?filters=%7B"id":%7B"filterType":"textArray","filter":"${workingInstanceId}","type":"multi"%7D%7D&sorting=%5B%7B"colId":"startTime","sort":"desc"%7D%5D&page=1&pageSize=10`,
    );
    await expect(page).toHaveURL(/process-instances/);
  });

  test('display process instance list', async ({ page }) => {
    await expect(page.locator('.items-list-view .items-list-view-header .header-label')).toHaveText(
      'Process Instances',
    );
  });

  test('allow a user to clear a filter', async ({ page }) => {
    await expect(page.locator('.ag-selection-checkbox')).toHaveCount(1);
    await page.locator('#processDefinitionName').fill('test bogus filter');
    await expect(page.locator('.ag-selection-checkbox')).toHaveCount(0);
  });

  test('display reset view link when toggle filter is applied', async ({ page }) => {
    // Reset View First
    const resetView = page.getByRole('button', { name: 'Reset View' });
    await resetView.click();

    await expect(resetView).toBeHidden();
    await page.locator('fluxnova-toggle-filters').getByRole('checkbox').check();
    await expect(resetView).toBeVisible();
    await page.getByRole('button', { name: 'Reset View' }).click();
    await expect(resetView).toBeHidden();
  });

  test('can click on instance id link and open detail page', async ({ page }) => {
    const id = await page.locator('fluxnova-link-cell').first().innerText();
    await page.locator('fluxnova-link-cell').first().click();
    await expect(page.getByText('PROCESS INSTANCE', { exact: true })).toBeVisible();
    const expectedUrl = `${BasePage.TENANT}/process-instances/${id}?tab=variables`;
    await expect(page).toHaveURL(expectedUrl);
  });
});

test.describe('Suspend Action', () => {
  let workingInstanceIds: string[] = [];

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await activateProcessDefinition('fluxnova_automation_basic', page);
    workingInstanceIds = await startProcessInstances('fluxnova_automation_basic', 3, page);
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await terminateProcessInstances(workingInstanceIds, page);
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(
      `${BasePage.TENANT}/process-instances?filters=%7B"state":%7B"filterType":"select","filter":"active","type":"equals"%7D,"id":%7B"filterType":"textArray","filter":"${workingInstanceIds.join(',')}","type":"multi"%7D%7D&sorting=%5B%7B"colId":"startTime","sort":"desc"%7D%5D&page=1&pageSize=10`,
    );
    await expect(page).toHaveURL(/process-instances/);
  });

  test('suspend an active instance', async ({ page }) => {
    const checkboxSelector = page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]');
    await checkboxSelector.hover();
    await checkboxSelector.click();
    await page.locator('[ngbtooltip=Suspend]').click();
    await page.getByRole('button', { name: 'Suspend' }).click();
    expect(await page.locator('.toast-body > .header').innerText()).toContain('Success');
  });

  test('suspend multiple instances at once', async ({ page }) => {
    const firstCheckboxSelector = page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]');
    const secondCheckboxSelector = page.locator('.ag-row[row-id="1"] .ag-selection-checkbox input[type="checkbox"]');
    await firstCheckboxSelector.hover();
    await firstCheckboxSelector.click();
    await secondCheckboxSelector.hover();
    await secondCheckboxSelector.click();
    await page.locator('[ngbtooltip=Suspend]').click();
    await page.getByRole('button', { name: 'Suspend' }).click();
    expect(await page.locator('.toast-body > .text-block > .body > span').first().innerText()).toContain(
      'Request to suspend 2 instances submitted successfully',
    );
  });
});

test.describe('Activate Action', () => {
  let workingInstanceIds: string[] = [];

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await activateProcessDefinition('fluxnova_automation_basic', page);
    workingInstanceIds = await startProcessInstances('fluxnova_automation_basic', 3, page);
    await suspendProcessInstances(workingInstanceIds, page);
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await terminateProcessInstances(workingInstanceIds, page);
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(
      `${BasePage.TENANT}/process-instances?filters=%7B"state":%7B"filterType":"select","filter":"suspended","type":"equals"%7D,"id":%7B"filterType":"textArray","filter":"${workingInstanceIds.join(',')}","type":"multi"%7D%7D&sorting=%5B%7B"colId":"startTime","sort":"desc"%7D%5D&page=1&pageSize=10`,
    );
    await expect(page).toHaveURL(/process-instances/);
  });

  test('activate a suspended instance', async ({ page }) => {
    const checkboxSelector = page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]');
    await checkboxSelector.hover();
    await checkboxSelector.click();
    await page.locator('[ngbtooltip=Activate]').click();
    await page.getByRole('button', { name: 'Activate' }).click();
    expect(await page.locator('.toast-body > .header').innerText()).toContain('Success');
  });

  test('activate multiple instances at once', async ({ page }) => {
    const firstCheckboxSelector = page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]');
    const secondCheckboxSelector = page.locator('.ag-row[row-id="1"] .ag-selection-checkbox input[type="checkbox"]');
    await firstCheckboxSelector.hover();
    await firstCheckboxSelector.click();
    await secondCheckboxSelector.hover();
    await secondCheckboxSelector.click();
    await page.locator('[ngbtooltip=Activate]').click();
    await page.getByRole('button', { name: 'Activate' }).click();
    expect(await page.locator('.toast-body > .text-block > .body > span').first().innerText()).toContain(
      'Request to activate 2 instances submitted successfully',
    );
  });
});

test.describe('Terminate Action', () => {
  let workingInstanceIds: string[] = [];

  test.beforeEach(async ({ browser }) => {
    const page = await browser.newPage();
    await activateProcessDefinition('fluxnova_automation_basic', page);
    workingInstanceIds = await startProcessInstances('fluxnova_automation_basic', 2, page);
  });

  test.afterEach(async ({ browser }) => {
    const page = await browser.newPage();
    if (workingInstanceIds.length > 0) {
      await terminateProcessInstances(workingInstanceIds, page);
    }
    workingInstanceIds = [];
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(
      `${BasePage.TENANT}/process-instances?filters=%7B"id":%7B"filterType":"textArray","filter":"${workingInstanceIds.join(',')}","type":"multi"%7D%7D&sorting=%5B%7B"colId":"startTime","sort":"desc"%7D%5D&page=1&pageSize=10`,
    );
    await expect(page).toHaveURL(/process-instances/);
  });

  test('terminate an instance', async ({ page }) => {
    const checkboxSelector = page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]');
    const terminatedId = await page.locator('fluxnova-link-cell').first().innerText();
    await checkboxSelector.hover();
    await checkboxSelector.click();
    await page.locator('[ngbtooltip=Terminate]').click();
    await page.getByRole('button', { name: 'Terminate' }).click();
    expect(await page.locator('.toast-body > .header').innerText()).toContain('Success');
    const idx = workingInstanceIds.indexOf(terminatedId);
    if (idx > -1) {
      workingInstanceIds.splice(idx, 1);
    }
  });

  test('terminate multiple instances at once', async ({ page }) => {
    const firstCheckboxSelector = page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]');
    const secondCheckboxSelector = page.locator('.ag-row[row-id="1"] .ag-selection-checkbox input[type="checkbox"]');
    const idsToTerminate = await Promise.all([
      page.locator('fluxnova-link-cell').nth(0).innerText(),
      page.locator('fluxnova-link-cell').nth(1).innerText(),
    ]);
    await firstCheckboxSelector.hover();
    await firstCheckboxSelector.click();
    await secondCheckboxSelector.hover();
    await secondCheckboxSelector.click();
    await page.locator('[ngbtooltip=Terminate]').click();
    await page.getByPlaceholder('Please enter a reason for').fill('just for fun');
    await page.getByRole('button', { name: 'Terminate' }).click();
    expect(await page.locator('.toast-body > .text-block > .body > span').first().innerText()).toContain(
      'Request to terminate 2 instances submitted successfully',
    );
    for (const id of idsToTerminate) {
      const idx = workingInstanceIds.indexOf(id);
      if (idx > -1) {
        workingInstanceIds.splice(idx, 1);
      }
    }
  });
});
