import { expect, test } from '@playwright/test';
import { checkFluxnovaIcon, checkLeftNavBar } from '../../shared/layout';
import { DecisionDefinitionDetailsPage } from '../../page-objects/decision-definition-details-page.po';

test.describe('Decision Definition Details Page Layout', () => {
  let decisionDefinitionPage: DecisionDefinitionDetailsPage;

  test.beforeEach(async ({ page }) => {
    decisionDefinitionPage = new DecisionDefinitionDetailsPage(page);
    decisionDefinitionPage.navigateToDefinitionDetailsPage('fluxnova_automation_beverage_dmn_simple');
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('should display Fluxnova Icon in top left', async ({ page }) => {
    await checkFluxnovaIcon(page);
  });

  test('should expand left side bar on click in non-link area', async ({ page }) => {
    await checkLeftNavBar(page);
  });

  test('should display decision definition page title', async ({ page }) => {
    await expect(page.getByText('DECISION DEFINITION', { exact: true })).toBeVisible();
  });

  test('should show evaluate decision button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Evaluate Decision' })).toBeVisible();
  });

  test('should display all default column headers (Decision Instances Tab)', async ({ page }) => {
    await page.locator('li').filter({ hasText: 'Instances' }).click();
    await expect(page.getByRole('columnheader', { name: 'ID' }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Evaluation Time' }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Activity ID' }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Calling Instance ID' }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Process Definition ID' }).first()).toBeVisible();
  });

  test('should display Info Area headers', async ({ page }) => {
    await expect(page.locator('#leftPanel > div > fluxnova-decision-definition-info-section > div > h4')).toBeVisible();
    await expect(page.getByText('Definition ID', { exact: true })).toBeVisible();
    await expect(page.getByText('Version', { exact: true })).toBeVisible();
    await expect(page.getByText('Version Tag')).toBeVisible();
    await expect(page.getByText('Definition Key', { exact: true })).toBeVisible();
    await expect(page.getByText('Definition Name')).toBeVisible();
    await expect(page.getByText('History Time to Live')).toBeVisible();
    await expect(page.getByText('Deployment ID')).toBeVisible();
    await expect(page.getByText('Decision Requirement')).toBeVisible();
  });

  test('should show decision instances tab', async ({ page }) => {
    await expect(page.locator('nav')).toContainText('Decision Instances');
  });
});
