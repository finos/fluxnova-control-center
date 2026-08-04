import { expect, test } from '@playwright/test';
import { DecisionDefinitionDetailsPage } from '../../page-objects/decision-definition-details-page.po';

test.describe('Decision Definition Details - Modal Closeout', () => {
  let decisionDefinitionPage: DecisionDefinitionDetailsPage;

  test.beforeEach(async ({ page }) => {
    decisionDefinitionPage = new DecisionDefinitionDetailsPage(page);
    decisionDefinitionPage.navigateToDefinitionDetailsPage('fluxnova_automation_beverage_dmn_simple');
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('should close Evaluate Decision modal (X icon)', async ({ page }) => {
    // Open and close "Evaluate Decision" modal via 'X' Icon
    await page.getByRole('button', { name: 'Evaluate Decision' }).click();
    await expect(page.getByRole('heading', { name: 'Evaluate Decision' })).toBeVisible();
    await page.getByLabel('Close').click();
    await expect(page.getByRole('heading', { name: 'Evaluate Decision' })).not.toBeVisible();
  });

  test('should close Evaluate Decision modal (Cancel Button)', async ({ page }) => {
    // Open and close "Evaluate Decision" modal via 'Cancel' button
    await page.getByRole('button', { name: 'Evaluate Decision' }).click();
    await expect(page.getByRole('heading', { name: 'Evaluate Decision' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Evaluate Decision' })).not.toBeVisible();
  });

  test('should close Evaluate Decision modal (Click Off Modal)', async ({ page }) => {
    // Open and close "Evaluate Decision" modal via clicking off modal
    await page.getByRole('button', { name: 'Evaluate Decision' }).click();
    await expect(page.getByRole('heading', { name: 'Evaluate Decision' })).toBeVisible();
    await page.mouse.click(0, 0);
    await expect(page.getByRole('heading', { name: 'Evaluate Decision' })).not.toBeVisible();
  });
});
