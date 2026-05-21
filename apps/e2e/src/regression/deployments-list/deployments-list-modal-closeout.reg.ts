import { expect, test } from '@playwright/test';
import { BasePage } from '../../page-objects/base-page.po';

test.describe('Deployments List - Modal Closeout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`./${BasePage.TENANT}/deployments`);
    await page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]').click();
  });

  test('should close Delete modal (X icon)', async ({ page }) => {
    await page.locator('button[ngbtooltip="Delete"]').click();
    await expect(page.getByRole('heading', { name: 'Delete Deployment' })).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('heading', { name: 'Delete Deployment' })).not.toBeVisible();
  });

  test('should close Delete modal (Cancel Button)', async ({ page }) => {
    await page.locator('button[ngbtooltip="Delete"]').click();
    await expect(page.getByRole('heading', { name: 'Delete Deployment' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Delete Deployment' })).not.toBeVisible();
  });

  test('should close Delete modal (Click Off Modal)', async ({ page }) => {
    await page.locator('button[ngbtooltip="Delete"]').click();
    await expect(page.getByRole('heading', { name: 'Delete Deployment' })).toBeVisible();
    await page.mouse.click(0, 0);
    await expect(page.getByRole('heading', { name: 'Delete Deployment' })).not.toBeVisible();
  });
});
