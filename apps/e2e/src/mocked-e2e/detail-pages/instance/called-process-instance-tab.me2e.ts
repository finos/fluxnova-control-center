import { expect, test } from '@playwright/test';
import { FXN_SUPPORT_STORAGE_STATE } from '../../../../playwright.config';
import { ProcessInstancePage } from '../../../page-objects/process-instance-page.po';
import {
  getResponseForActivityInstancesEndpoint,
  processInstancesWithIncidentInfoResponse,
} from '../../../fixtures/process-instances/mocks-called-process-instance-tab';

const PROCESS_INSTANCE_ID = '2f0f49b6-ef70-11ed-b7c8-0a8ebe9048cf';
let processInstancePage: ProcessInstancePage;

test.use({ storageState: FXN_SUPPORT_STORAGE_STATE, locale: 'en-US', timezoneId: 'America/Denver' });

test.beforeEach(async ({ page, context }) => {
  processInstancePage = new ProcessInstancePage(page, PROCESS_INSTANCE_ID, 'called-process-instances');

  await processInstancePage.initialize(context);
  await processInstancePage.stubActivityInstancesEndpoint(getResponseForActivityInstancesEndpoint());
  await processInstancePage.stubProcessInstances(processInstancesWithIncidentInfoResponse());

  await processInstancePage.goto();
});

test('page should have tab name Called Process Instances', async ({ page }) => {
  await expect(page.getByText('Called Process Instances')).toBeVisible();
});

test.describe('show columns names in table', () => {
  const columnNames = [
    'Instance ID',
    'Process Definition Name',
    'Activity ID',
    'Activity Name',
    'Start Time',
    'End Time',
    'State',
    'Start User ID',
    'Version',
  ];

  columnNames.forEach((columnNameItem) => {
    test(`should column name ${columnNameItem}`, async ({ page }) => {
      await expect(page.locator('ag-grid-angular').getByText(columnNameItem, { exact: true })).toBeVisible();
    });
  });
});

test.describe('should show', () => {
  test.describe('first row', () => {
    const expectedTextList = [
      'TestActivityProcess2',
      'Activity_15tomdk',
      'Test activity name',
      '2024-09-05 11:02:47',
      '2024-09-05 22:07:47',
      'Externally Terminated',
      'usr1234',
      '2',
    ];

    // Handle the pinned column
    test(`column at position 0 has text ad29f398-6ba8-11ef-922b-e6cb99cec601`, async ({ page }) => {
      const element = page.locator('[row-id="0"]').first().locator('.ag-cell').nth(0);

      await expect(element).toHaveText('ad29f398-6ba8-11ef-922b-e6cb99cec601');
    });

    // Handle the rest of the columns
    expectedTextList.forEach((expectedTextItem, columnIndex) => {
      test(`column at position ${columnIndex + 1} has text\n${expectedTextItem}`, async ({ page }) => {
        const element = page.locator('[row-id="0"]').nth(1).locator('.ag-cell').nth(columnIndex);

        await expect(element).toHaveText(expectedTextItem);
      });
    });
  });

  test(`second row should have an incident icon link`, async ({ page }) => {
    const element = page.locator('[row-id="1"]').first().locator('.ag-cell').first().locator('a').nth(1);

    await expect(element).toHaveClass(/icon-link/);

    const link = await element.locator('use').getAttribute('href');

    expect(link).toBeDefined();
    expect(link).toContain('warning');
  });
});

test.describe('when there are NO rows to show', () => {
  test.beforeEach(async ({ context, page }) => {
    processInstancePage = new ProcessInstancePage(page, PROCESS_INSTANCE_ID, 'called-process-instances');

    await processInstancePage.initialize(context);

    await processInstancePage.goto();
  });

  test('should show No static called process instances were found', async ({ page }) => {
    await expect(page.getByText('No called-process-instances were found')).toBeVisible();
  });
});
