import { expect, test } from '@playwright/test';
import { FXN_SUPPORT_STORAGE_STATE } from '../../../../playwright.config';
import { ProcessInstancePage } from '../../../page-objects/process-instance-page.po';
import historyMock from '../../../fixtures/history/historyMock.json';

const PROCESS_INSTANCE_ID = '2f0f49b6-ef70-11ed-b7c8-0a8ebe9048cf';
let processInstancePage: ProcessInstancePage;

test.use({ storageState: FXN_SUPPORT_STORAGE_STATE });

test.describe('when there are NO history instances', () => {
  test.beforeEach(async ({ page, context }) => {
    processInstancePage = new ProcessInstancePage(page, PROCESS_INSTANCE_ID, 'history');

    await processInstancePage.initialize(context);
    await processInstancePage.stubHistoryEndpoint({
      status: 200,
      json: {
        activityInstance: [],
        detail: [],
        incident: [],
        userOperation: [],
      },
    });

    await processInstancePage.goto();
  });

  test('should display No history items were found', async ({ page }) => {
    await expect(page.getByText('No history items were found')).toBeVisible();
  });
});

test.describe('when there are history instances', () => {
  test.beforeEach(async ({ page, context }) => {
    processInstancePage = new ProcessInstancePage(page, PROCESS_INSTANCE_ID, 'history');

    await processInstancePage.initialize(context);
    await processInstancePage.goto();
  });

  test('should show a grid containing columns related to each history item in this process instance', async ({
    page,
  }) => {
    await processInstancePage.goto();

    const headerTitles = [
      'Start Time',
      'End Time',
      'History Type',
      'Entity Type',
      'User',
      'Execution ID',
      'Task/Event Name',
      'Operation',
      'Data',
      'Details',
    ];

    await page.waitForSelector('fluxnova-tabs-view');

    for (const headerTitleItem of headerTitles) {
      await expect(page.getByText(headerTitleItem, { exact: true })).toBeVisible();
    }
  });
  // TODO: re-enable this test when all counts are finalized
  test.skip('should show the total number of incidents using this incidents within the tab name', async ({ page }) => {
    await processInstancePage.goto();

    const historyTab = page.getByText('History');

    await expect(historyTab.getByText('History').getByText('70')).toBeVisible();
  });

  test('should allow each row to be selected, as indicated by url change', async ({ page }) => {
    await processInstancePage.goto();

    let previousUrl = page.url();
    let newUrl = page.url();
    const rows = await page.locator('.ag-row').all();

    for (const rowItem of rows) {
      await rowItem.click();

      newUrl = page.url();

      expect(newUrl).not.toEqual(previousUrl);

      previousUrl = newUrl;
    }
  });

  test('should filter history list with incident option and show no items', async ({ page }) => {
    await processInstancePage.stubHistoryEndpoint({
      status: 200,
      json: {
        activityInstance: [],
        detail: [],
        incident: [],
        userOperation: [],
      },
    });

    await processInstancePage.goto();

    await page.locator('#undefined-multi-select span').first().click();
    await page.locator('#option-incident').check();

    await page.waitForTimeout(1000);

    const rows = await page.locator('.ag-row').all();

    expect(rows.length).toBe(0);
  });
  // TODO: re-enable this test when all counts are finalized
  test.skip('should filter history list and show only user operation type', async ({ page }) => {
    await processInstancePage.goto();
    await processInstancePage.stubHistoryEndpoint({
      status: 200,
      json: {
        activityInstance: [],
        detail: [],
        incident: [],
        userOperation: historyMock.userOperation,
      },
    });

    await page.locator('#undefined-multi-select span').first().click();
    await page.locator('#option-userOperation').check();

    const historyTab = page.getByText('History');

    await expect(historyTab.getByText('History').getByText('67')).toBeVisible();
  });
});
