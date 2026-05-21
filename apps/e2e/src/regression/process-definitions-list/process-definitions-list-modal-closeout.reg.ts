import { expect, test } from '@playwright/test';
import { BasePage } from '../../page-objects/base-page.po';

test.describe('Process Definitions List - Modal Closeout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`./${BasePage.TENANT}/process-definitions`);
    await page.getByLabel('Press Space to toggle row').first().click();
  });

  test('should close Suspend modal (X icon)', async ({ page }) => {
    await page.getByRole('button').nth(2).click();
    await expect(page.getByRole('heading', { name: 'Suspend Process Definition' })).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('heading', { name: 'Suspend Process Definition' })).not.toBeVisible();
  });

  test('should close Suspend modal (Cancel Button)', async ({ page }) => {
    await page.getByRole('button').nth(2).click();
    await expect(page.getByRole('heading', { name: 'Suspend Process Definition' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Suspend Process Definition' })).not.toBeVisible();
  });

  test('should close Suspend modal (Click Off Modal)', async ({ page }) => {
    await page.getByRole('button').nth(2).click();
    await expect(page.getByRole('heading', { name: 'Suspend Process Definition' })).toBeVisible();
    await page.mouse.click(0, 0);
    await expect(page.getByRole('heading', { name: 'Suspend Process Definition' })).not.toBeVisible();
  });

  test('should close Activate modal (X icon)', async ({ page }) => {
    await page.locator('.suspended > .ng-select-container > .ng-arrow-wrapper').click();
    await page.getByText('Suspended').click();
    await page.getByLabel('Press Space to toggle row').first().click();
    await page.getByRole('button').nth(1).click();
    await expect(page.getByRole('heading', { name: 'Activate Process Definition' })).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('heading', { name: 'Activate Process Definition' })).not.toBeVisible();
  });

  test('should close Activate modal (Cancel Button)', async ({ page }) => {
    await page.locator('.suspended > .ng-select-container > .ng-arrow-wrapper').click();
    await page.getByText('Suspended').click();
    await page.getByLabel('Press Space to toggle row').first().click();
    await page.getByRole('button').nth(1).click();
    await expect(page.getByRole('heading', { name: 'Activate Process Definition' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Activate Process Definition' })).not.toBeVisible();
  });

  test('Close Activate modal (Click Off Modal)', async ({ page }) => {
    await page.locator('.suspended > .ng-select-container > .ng-arrow-wrapper').click();
    await page.getByText('Suspended').click();
    await page.getByLabel('Press Space to toggle row').first().click();
    await page.getByRole('button').nth(1).click();
    await expect(page.getByRole('heading', { name: 'Activate Process Definition' })).toBeVisible();
    await page.mouse.click(0, 0);
    await expect(page.getByRole('heading', { name: 'Activate Process Definition' })).not.toBeVisible();
  });

  test('Close Delete modal (X icon)', async ({ page }) => {
    await page.getByRole('button').nth(3).click();
    await expect(page.getByRole('heading', { name: 'Delete Process Definition' })).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('heading', { name: 'Delete Process Definition' })).not.toBeVisible();
  });

  test('Close Delete modal (Cancel Button)', async ({ page }) => {
    await page.getByRole('button').nth(3).click();
    await expect(page.getByRole('heading', { name: 'Delete Process Definition' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Delete Process Definition' })).not.toBeVisible();
  });

  test('Close Delete modal (Click Off Modal)', async ({ page }) => {
    await page.getByRole('button').nth(3).click();
    await expect(page.getByRole('heading', { name: 'Delete Process Definition' })).toBeVisible();
    await page.mouse.click(0, 0);
    await expect(page.getByRole('heading', { name: 'Delete Process Definition' })).not.toBeVisible();
  });
});
