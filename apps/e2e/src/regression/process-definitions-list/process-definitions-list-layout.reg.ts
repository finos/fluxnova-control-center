import { expect, test } from '@playwright/test';
import { checkFluxnovaIcon, checkLeftNavBar } from '../../shared/layout';
import { BasePage } from '../../page-objects/base-page.po';

test.describe('Process Definitions List Page Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`./${BasePage.TENANT}/process-definitions`);
  });
  test('should display Fluxnova Icon in top left', async ({ page }) => {
    await checkFluxnovaIcon(page);
  });

  test('should display process definitions page title', async ({ page }) => {
    await expect(page.locator('fluxnova-process-list').getByText('Process Definitions')).toBeVisible();
  });

  test('should display bulk action buttons', async ({ page }) => {
    const playButton = page.locator('fluxnova-icon[iconname="play"]');
    const pauseButton = page.locator('fluxnova-icon[iconname="pause"]');
    const deleteButton = page.locator('fluxnova-icon[iconname="trash-filled"]');
    await expect(playButton).toBeVisible();
    await expect(pauseButton).toBeVisible();
    await expect(deleteButton).toBeVisible();
  });

  test('should have a clickable "Latest Version" checkbox', async ({ page }) => {
    const latestVersionCheckBox = page.locator('input[class="latestVersion pointer"]');
    await expect(page.locator('fluxnova-loading').locator('svg').first()).not.toBeVisible();
    await latestVersionCheckBox.check();
    await expect(latestVersionCheckBox).toBeChecked();
  });

  test('should expand left side bar on click in non-link area', async ({ page }) => {
    await checkLeftNavBar(page);
  });

  test('should display all default column headers', async ({ page }) => {
    await expect(page.getByRole('grid')).toContainText('Definition ID');
    await expect(page.getByRole('grid')).toContainText('Definition Name');
    await expect(page.getByRole('grid')).toContainText('Version');
    await expect(page.getByRole('grid')).toContainText('Description');
    await expect(page.getByRole('grid')).toContainText('Status');
    await expect(page.getByRole('grid')).toContainText('Definition Key');
    await expect(page.getByRole('grid')).toContainText('Deployment ID');
    await expect(page.getByRole('grid')).toContainText('Version Tag');
  });

  test('should display footer bar elements', async ({ page }) => {
    const userImage = page.locator('img.profile-menu-img[alt="profile image"]');
    const paginationSize = page.locator(
      'div.limit-selection.d-flex > ng-select > div.ng-select-container.ng-has-value',
    );
    const totalItems = page.locator('div.displayed-count-wrapper');
    const pageNav = page.locator('div.page-selection > ngb-pagination > ul');
    await expect(userImage).toBeVisible();
    await expect(paginationSize).toContainText('50');
    await expect(totalItems).toBeVisible();
    await expect(pageNav).toBeVisible();
  });

  test('should contain id link that opens process definition detail page', async ({ page }) => {
    const id = await page.locator('fluxnova-link-cell').first().innerText();
    const expectedUrl = `${BasePage.TENANT}/process-definitions/${id}?tab=instances`;

    await page.locator('fluxnova-link-cell a').first().click();
    await expect(page.getByText('PROCESS DEFINITION', { exact: true })).toBeVisible();
    await expect(page).toHaveURL(expectedUrl);
  });
});
