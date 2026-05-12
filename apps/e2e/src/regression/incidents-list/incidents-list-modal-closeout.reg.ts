import { expect, test } from '@playwright/test';
import { getProcessDefinitionId, startProcessInstance, terminateProcessInstance } from '../../utils/test-utils';
import { BasePage } from '../../page-objects/base-page.po';

test.describe('Incidents List - Modal Closeout', () => {
  let workingInstanceId: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const incidentProcessDefinitionId = await getProcessDefinitionId('fluxnova_automation_incident', page);
    workingInstanceId = await startProcessInstance(incidentProcessDefinitionId, page);
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await terminateProcessInstance(workingInstanceId, page);
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(
      `./${BasePage.TENANT}/incidents?filters=%7B"status":%7B"filterType":"select","filter":"open","type":"equals"%7D,"processDefinitionKey":%7B"filterType":"commaSeparatedList","filter":"fluxnova_automation_incident","type":"multi"%7D%7D&sorting=%5B%7B"colId":"createTime","sort":"desc"%7D%5D`,
    );
    await page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]').click();
  });

  test('should close Retry modal (X icon)', async ({ page }) => {
    await page.getByRole('button').nth(1).click();
    await expect(page.getByRole('heading', { name: 'Set Retry Count' })).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('heading', { name: 'Set Retry Count' })).not.toBeVisible();
  });

  test('should close Retry modal (Cancel Button)', async ({ page }) => {
    await page.getByRole('button').nth(1).click();
    await expect(page.getByRole('heading', { name: 'Set Retry Count' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Set Retry Count' })).not.toBeVisible();
  });

  test('should close Retry modal (Click Off Modal)', async ({ page }) => {
    await page.getByRole('button').nth(1).click();
    await expect(page.getByRole('heading', { name: 'Set Retry Count' })).toBeVisible();
    await page.mouse.click(0, 0);
    await expect(page.getByRole('heading', { name: 'Set Retry Count' })).not.toBeVisible();
  });
});
