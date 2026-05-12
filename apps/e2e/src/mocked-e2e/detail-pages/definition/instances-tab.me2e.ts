import { expect, Page, test } from '@playwright/test';
import { range } from 'lodash-es';
import {
  getOverrideDefinitionObject,
  getOverrideInstanceObject,
} from '../../../fixtures/process-definitions/instances-tab';
import { ProcessDefinitionsPage } from '../../../page-objects/process-definitions-page.po';
import { FXN_SUPPORT_STORAGE_STATE } from '../../../../playwright.config';

const PROCESS_DEFINITION_ID = '465cf569-eeb2-11ed-9b96-0a81d7d98f19';
let processDefinitionsPage: ProcessDefinitionsPage;

async function getCheckboxes(page: Page) {
  return page.locator('.ag-selection-checkbox input[type="checkbox"]').all();
}

async function getCheckboxesLength(page: Page) {
  return (await getCheckboxes(page)).length;
}

async function getClickedCheckboxes(page: Page) {
  return page.locator('[aria-label="Press Space to toggle row selection (checked)"]').all();
}

async function getClickedCheckboxesCount(page: Page) {
  return (await getClickedCheckboxes(page)).length;
}

async function clickCheckbox(page: Page, checkboxIndex: number) {
  const checkboxItem = page.locator('.ag-selection-checkbox input[type="checkbox"]').nth(checkboxIndex);

  await checkboxItem.scrollIntoViewIfNeeded();

  await checkboxItem.check({ force: true });
}

test.use({ storageState: FXN_SUPPORT_STORAGE_STATE });

test.beforeEach(async ({ page, context }) => {
  processDefinitionsPage = new ProcessDefinitionsPage(page, PROCESS_DEFINITION_ID, 'instances');

  await processDefinitionsPage.initialize(context);
});

test.describe('The instances tab on the process definition detail page', () => {
  test.use({ storageState: FXN_SUPPORT_STORAGE_STATE });

  test('should show a grid containing columns related to each process instance that uses this definition', async ({
    page,
  }) => {
    await processDefinitionsPage.goto();
    await expect(page.getByRole('columnheader').getByText('Instance ID')).toBeVisible();
    await expect(page.getByRole('columnheader').getByText('Start Time')).toBeVisible();
    await expect(page.getByRole('columnheader').getByText('End Time')).toBeVisible();
    await expect(page.getByText('State')).toBeVisible();
    await expect(page.getByText('Start User ID')).toBeVisible();
  });

  test('should show a row for each instance with an ID that links to the instance detail page', async ({ page }) => {
    await processDefinitionsPage.goto();
    await expect(page.getByRole('link', { name: '2f0f49b6-ef70-11ed-b7c8-' })).toBeVisible();
  });

  test("should show message 'No instances were found' with case of zero instances", async ({ page }) => {
    await processDefinitionsPage.stubProcessInstancesEndpoint({
      status: 201,
      json: [],
    });

    await processDefinitionsPage.goto();
    await expect(page.getByText('No instances were found')).toBeVisible();
  });

  test('should show a tooltip on the migrate button if there is only one definition version', async ({ page }) => {
    const overrideJsonResponse = getOverrideDefinitionObject('testDefinitionId', 'testDeploymentId');

    await processDefinitionsPage.stubProcessDefinitionsEndpoint({
      status: 201,
      json: [overrideJsonResponse],
    });
    await processDefinitionsPage.goto();

    const migrateInstancesButton = page.getByRole('button', { name: 'Migrate All Instances' });

    await expect(migrateInstancesButton).toBeVisible();
    await expect(migrateInstancesButton).toBeDisabled();

    await migrateInstancesButton.hover({ force: true });

    const tooltip = page.locator('ngb-tooltip-window').first();

    expect(await tooltip.textContent()).toBe('Migration requires multiple versions');
  });

  test.describe('should show the total number of instances using this definition within the tab name', () => {
    test('with one instance', async ({ page }) => {
      await page.route(`api/process-instances/history/count`, async (route) => {
        await route.fulfill({ json: 1 });
      });
      await processDefinitionsPage.goto();
      await expect(page.getByText('Instances (1)')).toBeVisible();
    });

    test('with 10 instances', async ({ page }) => {
      await page.route(`api/process-instances/history/count`, async (route) => {
        await route.fulfill({ json: 10 });
      });
      await processDefinitionsPage.goto();
      await expect(page.getByText('Instances (10)')).toBeVisible();
    });
  });

  test('should allow each ACTIVE row to be selected, as indicated by a checkmark', async ({ page }) => {
    const totalInstances = 4;
    const mockInstances = range(0, totalInstances).map((rangeIndex: number) =>
      getOverrideInstanceObject(`testId-${rangeIndex}`, PROCESS_DEFINITION_ID),
    );

    await processDefinitionsPage.stubProcessInstancesEndpoint({
      status: 201,
      json: mockInstances,
    });

    await processDefinitionsPage.goto();

    for (let clickedCount = 0; clickedCount < totalInstances; clickedCount++) {
      await clickCheckbox(page, clickedCount);
    }

    expect(await getCheckboxesLength(page)).toBe(totalInstances);
    expect(await getClickedCheckboxesCount(page)).toBe(totalInstances);
  });
});
