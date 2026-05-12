import { expect, test } from '@playwright/test';
import {
  getProcessDefinitionId,
  startProcessInstance,
  suspendProcessInstance,
  terminateProcessInstance,
} from '../../utils/test-utils';
import { BasePage } from '../../page-objects/base-page.po';

test.describe('Jobs List - Modal Closeout', () => {
  test.describe('Suspend Modal', () => {
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
      await page.goto(
        `./${BasePage.TENANT}/jobs?sorting=%5B%7B"colId":"dueDate","sort":"desc"%7D%5D&toggleFilters=withRetriesLeft&filters=%7B"suspended":%7B"filterType":"select","filter":"active","type":"equals"%7D,"processDefinitionKey":%7B"filter":"fluxnova_automation_basic","type":"equals"%7D%7D`,
      );
      await page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]').click();
      await page.getByRole('button').nth(2).click();
    });

    test('should close Suspend modal (X icon)', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Suspend Job' })).toBeVisible();
      await page.getByRole('button', { name: 'Close' }).click();
      await expect(page.getByRole('heading', { name: 'Suspend Job' })).not.toBeVisible();
    });

    test('should close Suspend modal (Cancel Button)', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Suspend Job' })).toBeVisible();
      await page.getByRole('button', { name: 'Cancel' }).click();
      await expect(page.getByRole('heading', { name: 'Suspend Job' })).not.toBeVisible();
    });

    test('should close Suspend modal (Click Off Modal)', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Suspend Job' })).toBeVisible();
      await page.mouse.click(0, 0);
      await expect(page.getByRole('heading', { name: 'Suspend Job' })).not.toBeVisible();
    });
  });

  test.describe('Activate Modal', () => {
    let workingInstanceId: string;

    test.beforeAll(async ({ browser }) => {
      const page = await browser.newPage();
      const basicProcessDefinitionId = await getProcessDefinitionId('fluxnova_automation_basic', page);
      workingInstanceId = await startProcessInstance(basicProcessDefinitionId, page);
      await suspendProcessInstance(workingInstanceId, page);
    });

    test.afterAll(async ({ browser }) => {
      const page = await browser.newPage();
      await terminateProcessInstance(workingInstanceId, page);
    });

    test.beforeEach(async ({ page }) => {
      await page.goto(
        `./${BasePage.TENANT}/jobs?sorting=%5B%7B"colId":"dueDate","sort":"desc"%7D%5D&toggleFilters=withRetriesLeft&filters=%7B"suspended":%7B"filterType":"select","filter":"suspended","type":"equals"%7D,"processDefinitionKey":%7B"filter":"fluxnova_automation_basic","type":"equals"%7D%7D`,
      );
      await page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]').click();
      await page.getByRole('button').nth(1).click();
    });

    test('should close Activate modal (X icon)', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Activate Job' })).toBeVisible();
      await page.getByRole('button', { name: 'Close' }).click();
      await expect(page.getByRole('heading', { name: 'Activate Job' })).not.toBeVisible();
    });

    test('should close Activate modal (Cancel Button)', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Activate Job' })).toBeVisible();
      await page.getByRole('button', { name: 'Cancel' }).click();
      await expect(page.getByRole('heading', { name: 'Activate Job' })).not.toBeVisible();
    });

    test('should close Activate modal (Click Off Modal)', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Activate Job' })).toBeVisible();
      await page.mouse.click(0, 0);
      await expect(page.getByRole('heading', { name: 'Activate Job' })).not.toBeVisible();
    });
  });

  test.describe('Retry Modal', () => {
    let workingInstanceId: string;

    test.beforeAll(async ({ browser }) => {
      const page = await browser.newPage();
      const basicProcessDefinitionId = await getProcessDefinitionId('fluxnova_automation_incident', page);
      workingInstanceId = await startProcessInstance(basicProcessDefinitionId, page);
    });

    test.afterAll(async ({ browser }) => {
      const page = await browser.newPage();
      await terminateProcessInstance(workingInstanceId, page);
    });

    test.beforeEach(async ({ page }) => {
      await page.goto(
        `./${BasePage.TENANT}/jobs?filters=%7B"processDefinitionKey":%7B"filter":"fluxnova_automation_incident","type":"equals"%7D,"retries":%7B"filterType":"select","filter":"noRetriesLeft","type":"equals"%7D%7D&sorting=%5B%7B"colId":"dueDate","sort":"desc"%7D%5D&toggleFilters=`,
      );
      await page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]').click();
      await page.getByRole('button').nth(3).click();
    });

    test('should close Retry modal (X icon)', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Set Retry Count' })).toBeVisible();
      await page.getByRole('button', { name: 'Close' }).click();
      await expect(page.getByRole('heading', { name: 'Set Retry Count' })).not.toBeVisible();
    });

    test('should close Retry modal (Cancel Button)', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Set Retry Count' })).toBeVisible();
      await page.getByRole('button', { name: 'Cancel' }).click();
      await expect(page.getByRole('heading', { name: 'Set Retry Count' })).not.toBeVisible();
    });

    test('should close Retry modal (Click Off Modal)', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Set Retry Count' })).toBeVisible();
      await page.mouse.click(0, 0);
      await expect(page.getByRole('heading', { name: 'Set Retry Count' })).not.toBeVisible();
    });
  });

  test.describe('Delete Modal', () => {
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
      await page.goto(
        `./${BasePage.TENANT}/jobs?sorting=%5B%7B"colId":"dueDate","sort":"desc"%7D%5D&toggleFilters=withRetriesLeft&filters=%7B"processDefinitionKey":%7B"filter":"fluxnova_automation_basic","type":"equals"%7D%7D`,
      );
      await page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]').click();
      await page.getByRole('button').nth(4).click();
    });

    test('should close Delete modal (X icon)', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Delete Job' })).toBeVisible();
      await page.getByRole('button', { name: 'Close' }).click();
      await expect(page.getByRole('heading', { name: 'Delete Job' })).not.toBeVisible();
    });

    test('should close Delete modal (Cancel Button)', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Delete Job' })).toBeVisible();
      await page.getByRole('button', { name: 'Cancel' }).click();
      await expect(page.getByRole('heading', { name: 'Delete Job' })).not.toBeVisible();
    });

    test('should close Delete modal (Click Off Modal)', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Delete Job' })).toBeVisible();
      await page.mouse.click(0, 0);
      await expect(page.getByRole('heading', { name: 'Delete Job' })).not.toBeVisible();
    });
  });

  test.describe('Change Due Date Modal', () => {
    let workingInstanceId: string;

    test.beforeAll(async ({ browser }) => {
      const page = await browser.newPage();
      const basicProcessDefinitionId = await getProcessDefinitionId('fluxnova_automation_incident', page);
      workingInstanceId = await startProcessInstance(basicProcessDefinitionId, page);
    });

    test.afterAll(async ({ browser }) => {
      const page = await browser.newPage();
      await terminateProcessInstance(workingInstanceId, page);
    });

    test.beforeEach(async ({ page }) => {
      await page.goto(
        `./${BasePage.TENANT}/jobs?sorting=%5B%7B"colId":"dueDate","sort":"desc"%7D%5D&toggleFilters=withRetriesLeft&filters=%7B"processDefinitionKey":%7B"filter":"fluxnova_automation_incident","type":"equals"%7D%7D`,
      );
      await page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]').click();
      await page.getByRole('button').nth(5).click();
    });

    test('should close Change Due Date modal (X icon)', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Change Job Due Date' })).toBeVisible();
      await page.getByRole('button', { name: 'Close' }).click();
      await expect(page.getByRole('heading', { name: 'Change Job Due Date' })).not.toBeVisible();
    });

    test('should close Change Due Date modal (Cancel Button)', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Change Job Due Date' })).toBeVisible();
      await page.getByRole('button', { name: 'Cancel' }).click();
      await expect(page.getByRole('heading', { name: 'Change Job Due Date' })).not.toBeVisible();
    });

    test('should close Change Due Date modal (Click Off Modal)', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Change Job Due Date' })).toBeVisible();
      await page.mouse.click(0, 0);
      await expect(page.getByRole('heading', { name: 'Change Job Due Date' })).not.toBeVisible();
    });
  });
});
