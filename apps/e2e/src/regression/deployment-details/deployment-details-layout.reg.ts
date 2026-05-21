import { expect, test } from '@playwright/test';
import { DeploymentDetailsPage } from '../../page-objects/deployment-details-page.po';
import { checkFluxnovaIcon, checkLeftNavBar } from '../../shared/layout';

let deploymentDetailsPage: DeploymentDetailsPage;

test.describe('Deployment Details - Layout', () => {
  test.beforeEach(async ({ page }) => {
    deploymentDetailsPage = new DeploymentDetailsPage(page);
    // Navigate to the Fluxnova Automation - All deployment created during test setup
    await deploymentDetailsPage.navigateToDeploymentDetailsByName('Fluxnova Automation - All');
  });

  test('should display Fluxnova Icon in top left', async ({ page }) => {
    await checkFluxnovaIcon(page);
  });

  test('should display deployment page title', async ({ page }) => {
    await expect(page.getByText('DEPLOYMENT', { exact: true })).toBeVisible();
  });

  test('should display bulk action buttons', async ({ page }) => {
    await expect(page.locator('#delete').getByRole('button')).toBeVisible();
    await expect(page.locator('#download_resource').getByRole('button')).toBeVisible();
  });

  test('should display canvas zoom controls', async ({ page }) => {
    // TODO We need to update the selectors for zoom controls once they are given unique IDs.
    const resetZoom = page.locator('fluxnova-diagram-toolbar').getByRole('button').first();
    const zoomOut = page.locator('fluxnova-diagram-toolbar').getByRole('button').nth(1);
    const zoomIn = page.locator('fluxnova-diagram-toolbar').getByRole('button').nth(2);
    await expect(resetZoom).toBeVisible();
    await expect(zoomOut).toBeVisible();
    await expect(zoomIn).toBeVisible();
  });
  test('should expand left side bar on click in non-link area', async ({ page }) => {
    await checkLeftNavBar(page);
  });

  test('should display correct tab names', async ({ page }) => {
    await expect(page.locator('nav')).toContainText('Definitions');
  });

  test('should display all default column headers (Definitions)', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: 'Name' }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Key' }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Instance Count' }).first()).toBeVisible();
  });
});
