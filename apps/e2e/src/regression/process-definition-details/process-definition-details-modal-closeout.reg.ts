import { expect, test } from '@playwright/test';
import { ProcessDefinitionsPage } from '../../page-objects/process-definitions-page.po';
import { getProcessDefinitionId, startProcessInstance, terminateProcessInstance } from '../../utils/test-utils';

test.describe('Process Definition Details - Modal Closeout', () => {
  let processDefinitionsPage: ProcessDefinitionsPage;
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
    processDefinitionsPage = new ProcessDefinitionsPage(page);
    await processDefinitionsPage.navigateToDefinitionDetailsPage('fluxnova_automation_basic');
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('should close Suspend/Activate modal (X icon)', async ({ page }) => {
    await page.locator('#suspend').getByRole('button').click();
    await expect(page.getByRole('heading', { name: 'Suspend Process Definition' })).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('heading', { name: 'Suspend Process Definition' })).not.toBeVisible();
  });

  test('should close Suspend/Activate modal (Cancel Button)', async ({ page }) => {
    await page.locator('#suspend').getByRole('button').click();
    await expect(page.getByRole('heading', { name: 'Suspend Process Definition' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Suspend Process Definition' })).not.toBeVisible();
  });

  test('should close Suspend/Activate modal (Click Off Modal)', async ({ page }) => {
    await page.locator('#suspend').getByRole('button').click();
    await expect(page.getByRole('heading', { name: 'Suspend Process Definition' })).toBeVisible();
    await page.mouse.click(0, 0);
    await expect(page.getByRole('heading', { name: 'Suspend Process Definition' })).not.toBeVisible();
  });

  test('should close Delete modal (X icon)', async ({ page }) => {
    await page.locator('#delete').getByRole('button').click();
    await expect(page.getByRole('heading', { name: 'Delete Process Definition' })).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('heading', { name: 'Delete Process Definition' })).not.toBeVisible();
  });

  test('should close Delete modal (Cancel Button)', async ({ page }) => {
    await page.locator('#delete').getByRole('button').click();
    await expect(page.getByRole('heading', { name: 'Delete Process Definition' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Delete Process Definition' })).not.toBeVisible();
  });

  test('should close Delete modal (Click Off Modal)', async ({ page }) => {
    await page.locator('#delete').getByRole('button').click();
    await expect(page.getByRole('heading', { name: 'Delete Process Definition' })).toBeVisible();
    await page.mouse.click(0, 0);
    await expect(page.getByRole('heading', { name: 'Delete Process Definition' })).not.toBeVisible();
  });

  test('should close Start Process modal (X icon)', async ({ page }) => {
    await page.getByRole('button', { name: 'Start Process' }).click();
    await expect(page.getByRole('heading', { name: 'Start Process' })).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('heading', { name: 'Start Process' })).not.toBeVisible();
  });

  test('should close Start Process modal (Cancel Button)', async ({ page }) => {
    await page.getByRole('button', { name: 'Start Process' }).click();
    await expect(page.getByRole('heading', { name: 'Start Process' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Start Process' })).not.toBeVisible();
  });

  test('should close Start Process modal (Click Off Modal)', async ({ page }) => {
    await page.getByRole('button', { name: 'Start Process' }).click();
    await expect(page.getByRole('heading', { name: 'Start Process' })).toBeVisible();
    await page.mouse.click(0, 0);
    await expect(page.getByRole('heading', { name: 'Start Process' })).not.toBeVisible();
  });

  test('should close Migrate Instances modal (X icon)', async ({ page }) => {
    await page.getByRole('button', { name: 'Migrate All Instances' }).click();
    await expect(page.getByRole('heading', { name: 'Migrate Instances to Another Version' })).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('heading', { name: 'Migrate Instances to Another Version' })).not.toBeVisible();
  });

  test('should close Migrate Instances modal (Click Off Modal)', async ({ page }) => {
    await page.getByRole('button', { name: 'Migrate All Instances' }).click();
    await expect(page.getByRole('heading', { name: 'Migrate Instances to Another Version' })).toBeVisible();
    await page.mouse.click(0, 0);
    await expect(page.getByRole('heading', { name: 'Migrate Instances to Another Version' })).not.toBeVisible();
  });
});
