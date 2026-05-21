import { expect, test } from '@playwright/test';
import { checkFluxnovaIcon, checkLeftNavBar } from '../../shared/layout';
import { BasePage } from '../../page-objects/base-page.po';

test.describe('Deployments List Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`./${BasePage.TENANT}/deployments`);
  });
  test('should display Fluxnova Icon in top left', async ({ page }) => {
    await checkFluxnovaIcon(page);
  });

  test('should display deployments page title', async ({ page }) => {
    await expect(page.locator('fluxnova-deployment-list').getByText('Deployments')).toBeVisible();
  });

  test('should display bulk action buttons', async ({ page }) => {
    await expect(page.locator('fluxnova-icon[iconname="trash-filled"]')).toBeVisible();
  });

  test('should expand left side bar on click in non-link area', async ({ page }) => {
    await checkLeftNavBar(page);
  });

  test('should display all default column headers', async ({ page }) => {
    await expect(page.getByRole('grid')).toContainText('ID');
    await expect(page.getByRole('grid')).toContainText('Name');
    await expect(page.getByRole('grid')).toContainText('Deploy Time');
    await expect(page.getByRole('grid')).toContainText('Source');
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

  test('should contain id link that opens process instance detail page', async ({ page }) => {
    await page.locator('fluxnova-link-cell a').first().click();
    await expect(page.getByText('DEPLOYMENT', { exact: true })).toBeVisible();
  });
});
