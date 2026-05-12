import { expect, test } from '@playwright/test';
import { checkFluxnovaIcon, checkLeftNavBar } from '../../shared/layout';
import { BulkActionButtons, CommonElements, CommonToggles } from '../../page-objects/common-elements.po';
import { BasePage } from '../../page-objects/base-page.po';

test.describe('Batch List Page', () => {
  let commonElements: CommonElements;
  let bulkActions: BulkActionButtons;
  let toggles: CommonToggles;

  test.beforeEach(async ({ page }) => {
    await page.goto(`./${BasePage.TENANT}/batches`);
    commonElements = new CommonElements(page);
    bulkActions = new BulkActionButtons(page);
    toggles = new CommonToggles(page);
  });
  test('should display Fluxnova Icon in top left', async ({ page }) => {
    await checkFluxnovaIcon(page);
  });

  test('should display batches page title', async ({ page }) => {
    await expect(page.locator('fluxnova-batch-list')).toContainText('Batches');
  });

  test('should display bulk action buttons', async () => {
    await expect(bulkActions.batchSuspendButton).toBeVisible();
    await expect(bulkActions.batchRetryButton).toBeVisible();
    await expect(bulkActions.batchDeleteButton).toBeVisible();
  });

  test('should have a clickable "Show Completed Batches" toggle switch', async () => {
    await toggles.showCompletedBatchesToggle.check();
    await expect(toggles.showCompletedBatchesToggle).toBeChecked();
  });

  test('should expand left side bar on click in non-link area', async ({ page }) => {
    await checkLeftNavBar(page);
  });

  test('should display all default column headers', async ({ page }) => {
    await expect(page.getByRole('columnheader').nth(3)).toContainText('Batch ID');
    await expect(page.getByRole('columnheader').nth(5)).toContainText('Create User');
    await expect(page.getByRole('columnheader').nth(7)).toContainText('Start Time');
    await expect(page.getByRole('columnheader').nth(9)).toContainText('Failed Jobs');
    await expect(page.getByRole('columnheader').nth(11)).toContainText('Progress');
    await expect(page.getByRole('columnheader').nth(13)).toContainText('Suspended');
    await expect(page.getByRole('columnheader').nth(15)).toContainText('Type');
  });

  test('should display footer bar elements', async () => {
    await expect(commonElements.userImage).toBeVisible();
    await expect(commonElements.paginationSize).toContainText('50');
    await expect(commonElements.totalItems).toBeVisible();
    await expect(commonElements.pageNav).toBeVisible();
  });
});
