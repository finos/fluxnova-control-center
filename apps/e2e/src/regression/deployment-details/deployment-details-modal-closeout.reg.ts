import { expect, test } from '@playwright/test';
import { DeploymentDetailsPage } from '../../page-objects/deployment-details-page.po';

let deploymentDetailsPage: DeploymentDetailsPage;

test.describe('Deployment Details - Modal Closeout', () => {
  test.beforeEach(async ({ page }) => {
    deploymentDetailsPage = new DeploymentDetailsPage(page);
    // Navigate to the Fluxnova Automation - All deployment created during test setup
    await deploymentDetailsPage.navigateToDeploymentDetailsByName('Fluxnova Automation - All');
  });

  test('should close Delete modal (X icon)', async ({ page }) => {
    await page.locator('#delete').getByRole('button').click();
    await expect(page.getByRole('heading', { name: 'Delete Deployment' })).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('heading', { name: 'Delete Deployment' })).not.toBeVisible();
  });

  test('should close Delete modal (Cancel Button)', async ({ page }) => {
    await page.locator('#delete').getByRole('button').click();
    await expect(page.getByRole('heading', { name: 'Delete Deployment' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Delete Deployment' })).not.toBeVisible();
  });

  test('should close Delete modal (Click Off Modal)', async ({ page }) => {
    await page.locator('#delete').getByRole('button').click();
    await expect(page.getByRole('heading', { name: 'Delete Deployment' })).toBeVisible();
    await page.mouse.click(0, 0);
    await expect(page.getByRole('heading', { name: 'Delete Deployment' })).not.toBeVisible();
  });
});
