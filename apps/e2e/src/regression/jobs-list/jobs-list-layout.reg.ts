import { expect, test } from '@playwright/test';
import { checkFluxnovaIcon, checkLeftNavBar } from '../../shared/layout';
import { BasePage } from '../../page-objects/base-page.po';

test.describe('Jobs List Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`./${BasePage.TENANT}/jobs`);
  });
  test('should display Fluxnova Icon in top left', async ({ page }) => {
    await checkFluxnovaIcon(page);
  });

  test('should display jobs page title', async ({ page }) => {
    await expect(page.locator('fluxnova-job-list').getByText('Jobs')).toBeVisible();
  });

  test('should display bulk action buttons', async ({ page }) => {
    await expect(page.locator('fluxnova-icon[iconname="play"]')).toBeVisible();
    await expect(page.locator('fluxnova-icon[iconname="pause"]')).toBeVisible();
    await expect(page.locator('fluxnova-icon[iconname="retry"]')).toBeVisible();
    await expect(page.locator('fluxnova-icon[iconname="trash-filled"]')).toBeVisible();
    await expect(page.locator('fluxnova-icon[iconname="due-date"]')).toBeVisible();
  });

  test('should expand left side bar on click in non-link area', async ({ page }) => {
    await checkLeftNavBar(page);
  });

  test('should display all default column headers', async ({ page }) => {
    await expect(page.getByRole('grid')).toContainText('Job ID');
    await expect(page.getByRole('grid')).toContainText('Job Definition ID');
    await expect(page.getByRole('grid')).toContainText('Process Definition Key');
    await expect(page.getByRole('grid')).toContainText('Exception Message');
    await expect(page.getByRole('grid')).toContainText('Retries Left');
    await expect(page.getByRole('grid')).toContainText('Suspended');
    await expect(page.getByRole('grid')).toContainText('Failed Activity ID');
    await expect(page.getByRole('grid')).toContainText('Process Definition ID');
    await expect(page.getByRole('grid')).toContainText('Due Time');
    await expect(page.getByRole('grid')).toContainText('Create Time');
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
});
