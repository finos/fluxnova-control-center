import { expect, test } from '@playwright/test';
import { checkFluxnovaIcon, checkLeftNavBar } from '../../shared/layout';
import { BasePage } from '../../page-objects/base-page.po';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`./${BasePage.TENANT}`);
  });
  test('should display Fluxnova Icon in top left', async ({ page }) => {
    await checkFluxnovaIcon(page);
  });

  test('should display dashboard page title', async ({ page }) => {
    await expect(page.locator('fluxnova-dashboard').getByText('Dashboard')).toBeVisible();
  });

  test('should display left nav bar links', async ({ page }) => {
    await checkLeftNavBar(page);
  });

  test('should display tenant info, legal/about, and user info', async ({ page }) => {
    await page.getByText('××Process DefinitionsProcess').click();

    //The label is dynamic based on configuration, and the other tests verify the label
    //displays properly, so just check that the select tenant component is there.
    await expect(page.locator('fluxnova-select-tenant')).toBeVisible();
    await expect(page.locator('a').filter({ hasText: 'About' })).toBeVisible();
    await expect(page.locator('a').filter({ hasText: 'Anonymous User' })).toBeVisible();
  });

  test('should show headers for unresolved incidents', async ({ page }) => {
    await expect(page.getByText('Unresolved Incidents opened')).toBeVisible();
  });

  test('should show headers for unfinished process instances', async ({ page }) => {
    await expect(page.getByText('Unfinished Process Instances')).toBeVisible();
  });

  test('should show incident widget timeframe dropdown', async ({ page }) => {
    await page.locator('fluxnova-incident-volume span').nth(2).click();
    await expect(page.getByRole('option', { name: 'Past 1 Hour' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Past 4 Hours' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Past 8 Hours' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Past 1 day' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Past 7 days' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Past 30 days' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Past 90 days' })).toBeVisible();
  });

  test('should show instance widget timeframe dropdown', async ({ page }) => {
    await page.locator('fluxnova-process-instances span').nth(2).click();
    await expect(page.getByRole('option', { name: 'Past 1 Hour' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Past 4 Hours' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Past 8 Hours' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Past 1 day' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Past 7 days' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Past 30 days' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Past 90 days' })).toBeVisible();
  });
});
