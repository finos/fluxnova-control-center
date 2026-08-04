import { expect, test } from '@playwright/test';
import { activateProcessDefinition, startProcessInstances, terminateProcessInstances } from '../utils/test-utils';
import { BasePage } from '../page-objects/base-page.po';

let workingInstanceIds: string[] = [];

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  await activateProcessDefinition('fluxnova_automation_incident', page);
  workingInstanceIds = await startProcessInstances('fluxnova_automation_incident', 3, page);
});

test.afterAll(async ({ browser }) => {
  const page = await browser.newPage();
  await terminateProcessInstances(workingInstanceIds, page);
});

test.beforeEach(async ({ page }) => {
  await page.goto(
    `./${BasePage.TENANT}/incidents?filters=%7B"status":%7B"filterType":"select","filter":"open","type":"equals"%7D,"processDefinitionKey":%7B"filterType":"commaSeparatedList","filter":"fluxnova_automation_incident","type":"multi"%7D%7D&sorting=%5B%7B"colId":"createTime","sort":"desc"%7D%5D`,
  );
  await expect(page).toHaveURL(/incidents/);
});

test('shows appropriate columns for incidents', async ({ page }) => {
  await expect(page.getByRole('columnheader').getByText('Incident ID', { exact: true })).toBeVisible();
  await expect(page.getByRole('columnheader').getByText('Process Instance ID')).toBeVisible();
  await expect(page.getByRole('columnheader').getByText('Process Definition ID')).toBeVisible();
  await expect(page.getByRole('columnheader').getByText('Definition Key')).toBeVisible();
  await expect(page.getByRole('columnheader').getByText('Status')).toBeVisible();
});

test('retries incidents', async ({ page }) => {
  await page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]').click();
  await page.locator('.ag-row[row-id="1"] .ag-selection-checkbox input[type="checkbox"]').click();
  await page.locator('#incident-retry').click();
  await page.getByRole('spinbutton').click();
  await expect(page.getByRole('paragraph')).toContainText('Set the retry count of the following jobs:');
  await page.getByRole('button', { name: 'Set Count' }).click();
  await expect(page.locator('fluxnova-toasts')).toContainText(
    'Request to set retry count for 2 jobs submitted successfully',
  );
});
