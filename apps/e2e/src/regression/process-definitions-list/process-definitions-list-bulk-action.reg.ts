import { expect, test } from '@playwright/test';
import { activateProcessDefinition } from '../../utils/test-utils';
import { BasePage } from '../../page-objects/base-page.po';

test.describe('should suspend/activate from Process Definitions List', () => {
  test('excluding active instances', async ({ page }) => {
    // ensure automation basic is active
    await activateProcessDefinition('fluxnova_automation_basic', page);
    await page.goto(`${BasePage.TENANT}/process-definitions`);
    await expect(page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]')).toBeVisible();
    await page.locator('#name').fill('Fluxnova UI Automation - Basic');
    await expect(page.locator('fluxnova-loading').locator('svg').first()).toBeVisible();
    await page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]').click();
    await page.locator('fluxnova-process-list').getByRole('button').nth(1).click();
    await page.getByRole('button', { name: 'Suspend' }).click();
    await expect(page.getByText('Success', { exact: true })).toBeVisible();
    await page.locator('.suspended > .ng-select-container > .ng-arrow-wrapper').click();
    await page.getByText('Suspended').click();
    await page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]').click();
    await page.locator('fluxnova-process-list').getByRole('button').first().click();
    await page.getByRole('button', { name: 'Activate' }).click();
    await page.locator('.suspended > .ng-select-container > .ng-arrow-wrapper').click();
    await page.getByText('Active').click();
    await expect(page.getByRole('grid')).toContainText('Active');
  });

  test('including active instances', async ({ page }) => {
    // ensure automation incidents is active
    await activateProcessDefinition('fluxnova_automation_incident', page);
    await page.goto(`${BasePage.TENANT}/process-definitions`);
    await expect(page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]')).toBeVisible();
    await page.locator('#name').fill('Fluxnova UI Automation - Incidents');
    await expect(page.locator('fluxnova-loading').locator('svg').first()).toBeVisible();
    await page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]').click();
    await page.locator('fluxnova-process-list').getByRole('button').nth(1).click();
    await page.getByLabel('Suspend all instances of this').check();
    await page.getByRole('button', { name: 'Suspend' }).click();
    await expect(page.getByText('Success', { exact: true })).toBeVisible();
    await page.locator('.suspended > .ng-select-container > .ng-arrow-wrapper').click();
    await page.getByText('Suspended').click();
    await page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]').click();
    await page.locator('fluxnova-process-list').getByRole('button').first().click();
    await page.getByLabel('Activate all instances of').check();
    await page.getByRole('button', { name: 'Activate' }).click();
    await page.locator('.suspended > .ng-select-container > .ng-arrow-wrapper').click();
    await page.getByText('Active').click();
    await expect(page.getByRole('grid')).toContainText('Active');
  });

  test.describe('should delete from Process Definitions List', () => {
    test('excluding instances, historic instances, and jobs', async ({ page }) => {
      // Before running this test, ensure that 'Bulk Delete Me Model 1' Process Definition is deployed to your environment
      await page.goto(`${BasePage.TENANT}/process-definitions`);
      await page.locator('#name').fill('Bulk Delete Me Model 1');
      await expect(page.locator('fluxnova-loading').locator('svg').first()).toBeVisible();
      if ((await page.locator('.ag-row[row-id="0"]').count()) > 0) {
        await page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]').check();
        await page.locator('fluxnova-process-list').getByRole('button').nth(2).click();
        await page.getByRole('button', { name: 'Delete' }).click();
        await expect(page.getByText('SuccessDelete process')).toBeVisible();
      }
    });

    test('including instances, historic instances, and jobs', async ({ page }) => {
      // Before running this test, ensure that 'Bulk Delete Me Model 1' Process Definition is deployed to your environment
      await page.goto(`${BasePage.TENANT}/process-definitions`);
      await page.locator('#name').fill('Bulk Delete Me Model 1');
      await expect(page.locator('fluxnova-loading').locator('svg').first()).toBeVisible();
      if ((await page.locator('.ag-row[row-id="0"]').count()) > 0) {
        await page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]').check();
        await page.locator('fluxnova-process-list').getByRole('button').nth(2).click();
        await page.getByLabel('Include instances, historic').check();
        await page.getByRole('button', { name: 'Delete' }).click();
        await expect(page.getByText('SuccessDelete process')).toBeVisible();
      }
    });
  });
});
