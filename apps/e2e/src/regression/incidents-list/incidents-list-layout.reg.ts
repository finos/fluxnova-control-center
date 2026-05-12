import { expect, test } from '@playwright/test';
import { checkFluxnovaIcon, checkLeftNavBar } from '../../shared/layout';
import { IncidentsListPage } from '../../page-objects/incidents-list-page.po';

test.describe('Incidents List Page', () => {
  let incidentsListPage: IncidentsListPage;

  test.beforeEach(async ({ page }) => {
    incidentsListPage = new IncidentsListPage(page);
    await incidentsListPage.navigateToIncidentsList();
    await page.waitForLoadState('networkidle'); // Wait for page to fully load
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('should display Fluxnova Icon in top left', async ({ page }) => {
    await checkFluxnovaIcon(page);
  });

  test('should display incidents page title', async ({ page }) => {
    await expect(page.locator('.items-list-view-header .header-label')).toHaveText('Incidents');
  });

  test('should display bulk action buttons', async ({ page }) => {
    await expect(page.locator('fluxnova-icon[iconname="retry"]')).toBeVisible();
  });

  test('should expand left side bar on click in non-link area', async ({ page }) => {
    await checkLeftNavBar(page);
  });

  test('should display all default column headers', async ({ page }) => {
    await expect(page.getByRole('grid')).toContainText('Incident ID');
    await expect(page.getByRole('grid')).toContainText('Process Instance ID');
    await expect(page.getByRole('grid')).toContainText('Incident Message');
    await expect(page.getByRole('grid')).toContainText('Create Time');
    await expect(page.getByRole('grid')).toContainText('Incident Type');
    await expect(page.getByRole('grid')).toContainText('Status');
    await expect(page.getByRole('grid')).toContainText('Failed Activity ID');
    await expect(page.getByRole('grid')).toContainText('Activity ID');
    await expect(page.getByRole('grid')).toContainText('End Time');
    await expect(page.getByRole('grid')).toContainText('Process Definition ID');
    await expect(page.getByRole('grid')).toContainText('Definition Key');
    await expect(page.getByRole('grid')).toContainText('Cause Incident ID');
    await expect(page.getByRole('grid')).toContainText('Root Cause Incident ID');
    await expect(page.getByRole('grid')).toContainText('Job Definition ID');
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
