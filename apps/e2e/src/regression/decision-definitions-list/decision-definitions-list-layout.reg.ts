import { expect, test } from '@playwright/test';
import { checkFluxnovaIcon, checkLeftNavBar } from '../../shared/layout';
import { BasePage } from '../../page-objects/base-page.po';

test.describe('Decision Definitions List Page Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`./${BasePage.TENANT}/decision-definitions`);
  });

  test('should display Fluxnova Icon in top left', async ({ page }) => {
    await checkFluxnovaIcon(page);
  });

  test('should expand left side bar on click in non-link area', async ({ page }) => {
    await checkLeftNavBar(page);
  });

  test('should display decision definitions page title', async ({ page }) => {
    await expect(page.locator('fluxnova-decision-definition-list').getByText('Decision Definitions')).toBeVisible();
  });

  test('should have a clickable "Latest Version" checkbox', async ({ page }) => {
    const latestVersionCheckBox = page.locator('input[class*="latestVersion"]');
    await latestVersionCheckBox.check();
    await expect(latestVersionCheckBox).toBeChecked();
  });

  test('should display all default column headers', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: 'ID' }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Name' }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Version' }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Definition Key' }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Deployment ID' }).first()).toBeVisible();
  });
});
