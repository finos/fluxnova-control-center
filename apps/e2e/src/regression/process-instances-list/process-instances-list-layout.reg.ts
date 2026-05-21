import { expect, test } from '@playwright/test';
import { checkFluxnovaIcon, checkLeftNavBar } from '../../shared/layout';
import { BulkActionButtons, CommonElements, CommonToggles } from '../../page-objects/common-elements.po';
import { BasePage } from '../../page-objects/base-page.po';

test.describe('Process Instances List Page', () => {
  let commonElements: CommonElements;
  let bulkActions: BulkActionButtons;
  let toggles: CommonToggles;

  test.beforeEach(async ({ page }) => {
    await page.goto(`./${BasePage.TENANT}/process-instances`);
    commonElements = new CommonElements(page);
    bulkActions = new BulkActionButtons(page);
    toggles = new CommonToggles(page);
  });
  test('should display Fluxnova Icon in top left', async ({ page }) => {
    await checkFluxnovaIcon(page);
  });

  test('should display process instances page title', async ({ page }) => {
    await expect(page.locator('fluxnova-process-instance-list').getByText('Process Instances')).toBeVisible();
  });

  test('should display bulk action buttons', async () => {
    await expect(bulkActions.play).toBeVisible();
    await expect(bulkActions.pause).toBeVisible();
    await expect(bulkActions.terminate).toBeVisible();
  });

  test('should have a clickable "With Incidents" checkbox', async () => {
    await toggles.withIncidentsCheckbox.check();
    await expect(toggles.withIncidentsCheckbox).toBeChecked();
  });

  test('should expand left side bar on click in non-link area', async ({ page }) => {
    await checkLeftNavBar(page);
  });

  test('should display all default column headers', async ({ page }) => {
    await expect(page.getByRole('grid')).toContainText('Instance ID');
    await expect(page.getByRole('grid')).toContainText('Definition Name');
    await expect(page.getByRole('grid')).toContainText('Version');
    await expect(page.getByRole('grid')).toContainText('Start Time');
    await expect(page.getByRole('grid')).toContainText('State');
    await expect(page.getByRole('grid')).toContainText('Instance Business Key');
    await expect(page.getByRole('grid')).toContainText('Start User ID');
    await expect(page.getByRole('grid')).toContainText('End Time');
    await expect(page.getByRole('grid')).toContainText('Definition ID');
    await expect(page.getByRole('grid')).toContainText('Definition Key');
    await expect(page.getByRole('grid')).toContainText('Root Process Instance ID');
    await expect(page.getByRole('grid')).toContainText('Super Process Instance ID');
    await expect(page.getByRole('grid')).toContainText('Duration');
  });

  test('should display footer bar elements', async () => {
    await expect(commonElements.userImage).toBeVisible();
    await expect(commonElements.paginationSize).toContainText('50');
    await expect(commonElements.totalItems).toBeVisible();
    await expect(commonElements.pageNav).toBeVisible();
  });

  test('should contain id link that opens process definition detail page', async ({ page }) => {
    await page.locator('fluxnova-link-cell a').first().click();
    await expect(page.getByText('PROCESS INSTANCE', { exact: true })).toBeVisible();
  });
});
