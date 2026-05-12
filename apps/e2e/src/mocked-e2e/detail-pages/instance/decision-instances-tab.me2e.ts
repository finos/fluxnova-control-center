import { expect, test } from '@playwright/test';
import { FXN_SUPPORT_STORAGE_STATE } from '../../../../playwright.config';
import { ProcessInstancePage } from '../../../page-objects/process-instance-page.po';

const PROCESS_INSTANCE_ID = '2f0f49b6-ef70-11ed-b7c8-0a8ebe9048cf';
let processInstancePage: ProcessInstancePage;

test.describe('when there are NO decision instances rows', () => {
  test.use({
    storageState: FXN_SUPPORT_STORAGE_STATE,
    locale: 'en-US',
    timezoneId: 'America/Denver',
  });

  test.beforeEach(async ({ page, context }) => {
    processInstancePage = new ProcessInstancePage(page, PROCESS_INSTANCE_ID, 'decision-instances');

    await processInstancePage.initialize(context);

    await processInstancePage.stubDecisionInstancesEndpoint({
      status: 200,
      json: [],
    });

    await processInstancePage.goto();
  });

  testTabName();
  testTableColumns();

  test('should display No decision instances were found', async ({ page }) => {
    await expect(page.getByText('No decision-instances were found')).toBeVisible();
  });
});

test.describe('when there are decision instances rows', () => {
  test.use({
    storageState: FXN_SUPPORT_STORAGE_STATE,
    locale: 'en-US',
    timezoneId: 'America/Denver',
  });

  test.beforeEach(async ({ page, context }) => {
    processInstancePage = new ProcessInstancePage(page, PROCESS_INSTANCE_ID, 'decision-instances');

    await processInstancePage.initialize(context);

    await processInstancePage.goto();
  });

  testTabName();
  testTableColumns();
});

function testTabName() {
  test('should have tab name Decision Instances', async ({ page }) => {
    await expect(page.getByRole('navigation').getByText('Decision Instances')).toBeVisible();
  });
}

function testTableColumns() {
  test.describe('should have decision instances table', () => {
    test.describe('show columns names in table', () => {
      const columnNames = ['ID', 'Evaluation Time', 'Activity ID'];

      columnNames.forEach((columnNameItem) => {
        test(`should have a column named ${columnNameItem}`, async ({ page }) => {
          await expect(
            page
              .locator('fluxnova-tabs-view')
              .getByRole('columnheader', {
                name: columnNameItem,
                exact: true,
              })
              .first(),
          ).toBeVisible();
        });
      });
    });
  });
}
