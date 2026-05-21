import { BrowserContext, expect, Page, test } from '@playwright/test';
import { ListPage } from '../../page-objects/list-page.po';
import batches from '../../fixtures/batches/default.json';
import historyBatches from '../../fixtures/batches/history.json';
import { FXN_SUPPORT_STORAGE_STATE } from '../../../playwright.config';

let listPage: ListPage;

async function mockRoutes(page: Page) {
  await page.route('api/batch?sortBy**', async (route) => {
    await route.fulfill({ json: batches });
  });
  await page.route('api/batch/count**', async (route) => {
    await route.fulfill({ json: { count: 100 } });
  });
  await page.route('api/history/batch**', async (route) => {
    await route.fulfill({ json: historyBatches });
  });
  await page.route('api/history/batch/count**', async (route) => {
    await route.fulfill({ json: { count: 100 } });
  });
  await page.route('api/batch/**/suspended', async (route) => {
    await route.fulfill({ json: {} });
  });
}

async function goToPage(page: Page, context: BrowserContext) {
  listPage = new ListPage(page);

  await listPage.initialize(context);
  await mockRoutes(page);

  await listPage.gotoBatches();
}

test.describe('Batch list page', () => {
  test.use({ storageState: FXN_SUPPORT_STORAGE_STATE });

  test.beforeEach(async ({ page, context }) => {
    await goToPage(page, context);
  });

  test('shows the correct columns for active batches', async ({ page }) => {
    const header = page.locator('fluxnova-tooltip-header-component');
    await expect(header.filter({ hasText: 'Batch ID' }).locator('div').nth(1)).toBeVisible();
    await expect(header.filter({ hasText: 'Create User' }).locator('div').nth(1)).toBeVisible();
    await expect(header.filter({ hasText: 'Start Time' }).locator('div').nth(1)).toBeVisible();
    await expect(header.filter({ hasText: 'Failed Jobs' }).locator('div').nth(1)).toBeVisible();
    await expect(header.filter({ hasText: 'Progress' }).locator('div').nth(1)).toBeVisible();
    await expect(header.filter({ hasText: 'Suspended' }).locator('div').nth(1)).toBeVisible();
    await expect(header.filter({ hasText: 'Type' }).locator('div').nth(1)).toBeVisible();
    await expect(page.getByText('50%')).toBeVisible();
  });

  test('shows the correct columns for completed batches', async ({ page }) => {
    await page.getByText('Show Completed Batches').click();
    const header = page.locator('fluxnova-tooltip-header-component');
    await expect(header.filter({ hasText: 'Batch ID' }).locator('div').nth(1)).toBeVisible();
    await expect(header.filter({ hasText: 'Create User' }).locator('div').nth(1)).toBeVisible();
    await expect(header.filter({ hasText: 'Start Time' }).locator('div').nth(1)).toBeVisible();
    await expect(header.filter({ hasText: 'End Time' }).locator('div').nth(1)).toBeVisible();
    await expect(header.filter({ hasText: 'Execution Start Time' }).locator('div').nth(1)).toBeVisible();
    await expect(header.filter({ hasText: 'Type' }).locator('div').nth(1)).toBeVisible();
  });

  test('pagination should have the correct page', async ({ page }) => {
    await page.getByText('Show Completed Batches').click();
    await expect(page.locator('fluxnova-ag-pagination')).toContainText('1 - 50 of 100 items');
    await page.getByRole('link', { name: '2', exact: true }).click();
    await expect(page.locator('fluxnova-ag-pagination')).toContainText('51 - 100 of 100 items');
  });

  test('selects and suspends batches', async ({ page }) => {
    await expect(page.locator('[data-action="suspend"]')).toHaveAttribute('disabled');
    await page.locator('.ag-row[row-id="1"] .ag-selection-checkbox input[type="checkbox"]').click();
    await page.locator('.ag-row[row-id="2"] .ag-selection-checkbox input[type="checkbox"]').click();
    await page.locator('[data-action="suspend"]').click();
    await page.getByRole('button', { name: 'Suspend' }).click();
    await expect(page.locator('fluxnova-items-table').getByLabel('Loading...')).not.toBeVisible();
    await expect(page.getByRole('alert')).toContainText('Suspend was successful');
  });

  test('confirms user delete with a modal', async ({ page }) => {
    await page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]').click();
    await page.locator('.ag-row[row-id="1"] .ag-selection-checkbox input[type="checkbox"]').click();
    await page.locator('[data-action="delete"]').click();
    await expect(page.locator('#modal-basic-title')).toContainText('Delete Batch');
    await expect(page.getByRole('paragraph')).toContainText('Are you sure you want to delete');
    await expect(page.getByRole('list')).toContainText('17f8ad47-1a00-11ef-8dbb-b6b98578b7b5');
    await expect(page.getByRole('list')).toContainText('dbb06fca-1a00-11ef-909a-5aee36430a26');
    await expect(page.getByLabel('Delete the historic batch and')).toBeVisible();
  });

  test('navigates to the batch details page', async ({ page }) => {
    await page.getByRole('link', { name: 'dbb06fca-1a00-11ef-909a-' }).click();
    await expect(page.locator('fluxnova-batch-details')).toContainText('Batch');
  });
});
