import { expect, test } from '@playwright/test';
import { ProcessInstancePage } from '../../page-objects/process-instance-page.po';
import { getProcessDefinitionId, startProcessInstance, terminateProcessInstance } from '../../utils/test-utils';

/**
 * @group regression
 * @group process-instance
 * @group process-instance-details
 * @group process-instance-details-info-panel
 */

let processInstancePage: ProcessInstancePage;

test.describe('Process Instance Detail Info Panel', () => {
  let workingInstanceId: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const basicProcessDefinitionId = await getProcessDefinitionId('fluxnova_automation_basic', page);
    workingInstanceId = await startProcessInstance(basicProcessDefinitionId, page);
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await terminateProcessInstance(workingInstanceId, page);
  });

  test.beforeEach(async ({ page }) => {
    processInstancePage = new ProcessInstancePage(page);
    await processInstancePage.navigateToInstanceDetailsPage(workingInstanceId);
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('should have back button load process instance list', async ({ page }) => {
    const backButton = page.locator('fluxnova-back-button');
    await expect(backButton).toHaveCount(1);

    // Make sure we're on the detail page
    await expect(page).toHaveURL(/\/process-instances\/[^/]+\?.+$/);

    await backButton.locator('a').first().click();
    await page.waitForURL(/\/process-instances\?.+$/, { waitUntil: 'load' });

    // Now we should be on the list page
    await expect(page).toHaveURL(/\/process-instances\?.+$/);
    await expect(page.locator('.header-label').first()).toHaveText('Process Instances');
  });

  test('should have definition name header link to the correct process definition', async ({ page }) => {
    const infoSection = page
      .locator('#leftPanel')
      .locator('fluxnova-process-instance-info-section')
      .locator('.content');
    await expect(infoSection).toHaveCount(1);

    const definitionId = await infoSection.locator('> *').nth(6).locator('div').innerText();
    const definitionLink = infoSection.locator('h4').locator('a');
    await expect(definitionLink).toHaveCount(1);

    // Make sure we're on the instance detail page
    await expect(page).toHaveURL(/\/process-instances\/[^/]+\?.+$/);

    await definitionLink.click();
    await page.waitForURL(new RegExp(`/process-definitions/${definitionId}\\?.+`), { waitUntil: 'load' });

    // Now we should be on the definition detail page
    await expect(page).toHaveURL(new RegExp(`/process-definitions/${definitionId}\\?.+`));
    await expect(page.locator('.header-label').first()).toHaveText('PROCESS DEFINITION');
    await expect(page.locator('[data-info-section-definition-id]')).toHaveText(definitionId);
  });

  test('should be able to copy instance ID', async ({ page }) => {
    const ctx = page.context();
    await ctx.grantPermissions(['clipboard-read']);

    const infoSection = page
      .locator('#leftPanel')
      .locator('fluxnova-process-instance-info-section')
      .locator('.content');
    await expect(infoSection).toHaveCount(1);

    const instanceId = await infoSection.locator('div').first().locator('div').innerText();

    await page.locator('fluxnova-process-instance-info-section fluxnova-icon').first().click();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(instanceId);
  });

  test('should be able to copy definition ID', async ({ page }) => {
    const ctx = page.context();
    await ctx.grantPermissions(['clipboard-read']);

    const infoSection = page
      .locator('#leftPanel')
      .locator('fluxnova-process-instance-info-section')
      .locator('.content');
    await expect(infoSection).toHaveCount(1);

    const definitionId = await infoSection.locator('> *').nth(6).locator('div').innerText();

    await page.locator('fluxnova-process-instance-info-section fluxnova-icon').nth(1).click();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(definitionId);
  });

  test('should have definition id link to the correct process definition', async ({ page }) => {
    const infoSection = page
      .locator('#leftPanel')
      .locator('fluxnova-process-instance-info-section')
      .locator('.content');
    await expect(infoSection).toHaveCount(1);

    const definitionIdLink = infoSection.locator('> *').nth(6);
    const definitionId = await definitionIdLink.locator('div').innerText();
    await expect(definitionIdLink).toHaveCount(1);

    // Make sure we're on the instance detail page
    await expect(page).toHaveURL(/\/process-instances\/[^/]+\?.+$/);

    await definitionIdLink.click();
    await page.waitForURL(new RegExp(`/process-definitions/${definitionId}\\?.+`), { waitUntil: 'load' });

    // Now we should be on the definition detail page
    await expect(page.locator('.header-label').first()).toHaveText('PROCESS DEFINITION');
    await expect(page.locator('[data-info-section-definition-id]')).toHaveText(definitionId);
    await expect(page).toHaveURL(new RegExp(`/process-definitions/${definitionId}\\?.+`));
  });

  test('should be able to copy definition key', async ({ page }) => {
    const ctx = page.context();
    await ctx.grantPermissions(['clipboard-read']);

    const infoSection = page
      .locator('#leftPanel')
      .locator('fluxnova-process-instance-info-section')
      .locator('.content');
    await expect(infoSection).toHaveCount(1);

    const definitionKey = await infoSection.locator('> *').nth(13).innerText();

    await page.locator('fluxnova-process-instance-info-section fluxnova-icon').nth(2).click();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(definitionKey);
  });

  test('should be able to copy root process instance id', async ({ page }) => {
    const ctx = page.context();
    await ctx.grantPermissions(['clipboard-read']);

    const infoSection = page
      .locator('#leftPanel')
      .locator('fluxnova-process-instance-info-section')
      .locator('.content');
    await expect(infoSection).toHaveCount(1);

    const rootProcessInstanceId = await infoSection.locator('> *').nth(16).innerText();

    await page.locator('fluxnova-process-instance-info-section fluxnova-icon').nth(3).click();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(rootProcessInstanceId);
  });
});
