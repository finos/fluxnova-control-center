import { expect, test } from '@playwright/test';
import { getProcessDefinitionId, startProcessInstance, terminateProcessInstance } from '../../utils/test-utils';
import { ProcessInstancePage } from '../../page-objects/process-instance-page.po';

test.describe('Process Instance Details - Modal Closeout', () => {
  let workingInstanceId: string;
  let processInstancePage: ProcessInstancePage;

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

  test('should close Suspend/Activate modal (X icon)', async ({ page }) => {
    await page.locator('#suspend').getByRole('button').click();
    await expect(page.getByRole('heading', { name: 'Suspend Process Instance' })).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('heading', { name: 'Suspend Process Instance' })).not.toBeVisible();
  });

  test('should close Suspend/Activate modal (Cancel Button)', async ({ page }) => {
    await page.locator('#suspend').getByRole('button').click();
    await expect(page.getByRole('heading', { name: 'Suspend Process Instance' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Suspend Process Instance' })).not.toBeVisible();
  });

  test('should close Suspend/Activate modal (Click Off Modal)', async ({ page }) => {
    await page.locator('#suspend').getByRole('button').click();
    await expect(page.getByRole('heading', { name: 'Suspend Process Instance' })).toBeVisible();
    await page.mouse.click(0, 0);
    await expect(page.getByRole('heading', { name: 'Suspend Process Instance' })).not.toBeVisible();
  });

  test('should close Terminate modal (X icon)', async ({ page }) => {
    await page.locator('#terminate').getByRole('button').click();
    await expect(page.getByRole('heading', { name: 'Terminate Process Instance' })).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('heading', { name: 'Terminate Process Instance' })).not.toBeVisible();
  });

  test('should close Terminate modal (Cancel Button)', async ({ page }) => {
    await page.locator('#terminate').getByRole('button').click();
    await expect(page.getByRole('heading', { name: 'Terminate Process Instance' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Terminate Process Instance' })).not.toBeVisible();
  });

  test('should close Delete modal (Click Off Modal)', async ({ page }) => {
    await page.locator('#terminate').getByRole('button').click();
    await expect(page.getByRole('heading', { name: 'Terminate Process Instance' })).toBeVisible();
    await page.mouse.click(0, 0);
    await expect(page.getByRole('heading', { name: 'Terminate Process Instance' })).not.toBeVisible();
  });

  test('should close Add Variable modal (X icon)', async ({ page }) => {
    await page.getByLabel('Add Variable').click();
    await expect(page.getByRole('heading', { name: 'Add Variable' })).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('heading', { name: 'Add Variable' })).not.toBeVisible();
  });

  test('should close Add Variable modal (Cancel Button)', async ({ page }) => {
    await page.getByLabel('Add Variable').click();
    await expect(page.getByRole('heading', { name: 'Add Variable' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Add Variable' })).not.toBeVisible();
  });

  test('should close Add Variable modal (Click Off Modal)', async ({ page }) => {
    await page.getByLabel('Add Variable').click();
    await expect(page.getByRole('heading', { name: 'Add Variable' })).toBeVisible();
    await page.mouse.click(0, 0);
    await expect(page.getByRole('heading', { name: 'Add Variable' })).not.toBeVisible();
  });
});
