import { expect, test } from '@playwright/test';
import {
  getProcessDefinitionId,
  startProcessInstance,
  suspendProcessInstance,
  terminateProcessInstance,
} from '../../utils/test-utils';
import { BasePage } from '../../page-objects/base-page.po';

test.describe('Process Instances List - Modal Closeout', () => {
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

  test.describe('Suspend/Terminate Modals', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(
        `./${BasePage.TENANT}/process-instances?filters=%7B"id":%7B"filterType":"textArray","filter":"${workingInstanceId}","type":"multi"%7D%7D&sorting=%5B%7B"colId":"startTime","sort":"desc"%7D%5D`,
      );
      await page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]').click();
    });

    test('should close Suspend modal (X icon)', async ({ page }) => {
      await page.getByRole('button').nth(2).click();
      await expect(page.getByRole('heading', { name: 'Suspend Process Instance' })).toBeVisible();
      await page.getByRole('button', { name: 'Close' }).click();
      await expect(page.getByRole('heading', { name: 'Suspend Process Instance' })).not.toBeVisible();
    });

    test('should close Suspend modal (Cancel Button)', async ({ page }) => {
      await page.getByRole('button').nth(2).click();
      await expect(page.getByRole('heading', { name: 'Suspend Process Instance' })).toBeVisible();
      await page.getByRole('button', { name: 'Cancel' }).click();
      await expect(page.getByRole('heading', { name: 'Suspend Process Instance' })).not.toBeVisible();
    });

    test('should close Suspend modal (Click Off Modal)', async ({ page }) => {
      await page.getByRole('button').nth(2).click();
      await expect(page.getByRole('heading', { name: 'Suspend Process Instance' })).toBeVisible();
      await page.mouse.click(0, 0);
      await expect(page.getByRole('heading', { name: 'Suspend Process Instance' })).not.toBeVisible();
    });

    test('should close Terminate modal (X icon)', async ({ page }) => {
      await page.getByRole('button').nth(3).click();
      await expect(page.getByRole('heading', { name: 'Terminate Process Instance' })).toBeVisible();
      await page.getByRole('button', { name: 'Close' }).click();
      await expect(page.getByRole('heading', { name: 'Terminate Process Instance' })).not.toBeVisible();
    });

    test('should close Terminate modal (Cancel Button)', async ({ page }) => {
      await page.getByRole('button').nth(3).click();
      await expect(page.getByRole('heading', { name: 'Terminate Process Instance' })).toBeVisible();
      await page.getByRole('button', { name: 'Cancel' }).click();
      await expect(page.getByRole('heading', { name: 'Terminate Process Instance' })).not.toBeVisible();
    });

    test('should close Terminate modal (Click Off Modal)', async ({ page }) => {
      await page.getByRole('button').nth(3).click();
      await expect(page.getByRole('heading', { name: 'Terminate Process Instance' })).toBeVisible();
      await page.mouse.click(0, 0);
      await expect(page.getByRole('heading', { name: 'Terminate Process Instance' })).not.toBeVisible();
    });
  });

  test.describe('Activate Modal', () => {
    test.beforeEach(async ({ page }) => {
      await suspendProcessInstance(workingInstanceId, page);
      await page.goto(
        `./${BasePage.TENANT}/process-instances?filters=%7B"id":%7B"filterType":"textArray","filter":"${workingInstanceId}","type":"multi"%7D%7D&sorting=%5B%7B"colId":"startTime","sort":"desc"%7D%5D`,
      );
      await page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]').click();
    });

    test('should close Activate modal (X icon)', async ({ page }) => {
      await page.getByRole('button').nth(1).click();
      await expect(page.getByRole('heading', { name: 'Activate Process Instance' })).toBeVisible();
      await page.getByRole('button', { name: 'Close' }).click();
      await expect(page.getByRole('heading', { name: 'Activate Process Instance' })).not.toBeVisible();
    });

    test('should close Activate modal (Cancel Button)', async ({ page }) => {
      await page.getByRole('button').nth(1).click();
      await expect(page.getByRole('heading', { name: 'Activate Process Instance' })).toBeVisible();
      await page.getByRole('button', { name: 'Cancel' }).click();
      await expect(page.getByRole('heading', { name: 'Activate Process Instance' })).not.toBeVisible();
    });

    test('should close Activate modal (Click Off Modal)', async ({ page }) => {
      await page.getByRole('button').nth(1).click();
      await expect(page.getByRole('heading', { name: 'Activate Process Instance' })).toBeVisible();
      await page.mouse.click(0, 0);
      await expect(page.getByRole('heading', { name: 'Activate Process Instance' })).not.toBeVisible();
    });
  });
});
