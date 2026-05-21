import { expect, test } from '@playwright/test';
import { activateProcessDefinition } from '../utils/test-utils';
import { BasePage } from '../page-objects/base-page.po';

test('should display process definitions in list', async ({ page }) => {
  await page.goto(`${BasePage.TENANT}/process-definitions`);
  await expect(page.locator('.items-list-view .items-list-view-header .header-label')).toHaveText(
    'Process Definitions',
  );
});

test('should contain id link that opens process definition detail page', async ({ page }) => {
  await page.goto(`${BasePage.TENANT}/process-definitions`);

  const id = await page.locator('fluxnova-link-cell').first().innerText();
  const expectedUrl = `${BasePage.TENANT}/process-definitions/${id}?tab=instances`;

  await page.locator('fluxnova-link-cell a').first().click();
  await expect(page.getByText('PROCESS DEFINITION', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(expectedUrl);
});

test('suspend and activate a definition', async ({ page }) => {
  // Ensure the definition is active at the beginning of the test
  await activateProcessDefinition('fluxnova_automation_terminate_test', page);

  try {
    await page.goto(
      `${BasePage.TENANT}/process-definitions?filters=%7B"suspended":%7B"filterType":"select","filter":"active","type":"equals"%7D,"name":%7B"filter":"Fluxnova%20UI%20Automation%20-%20Terminate%20Test","type":"contains"%7D%7D&sorting=&toggleFilters=latestVersion`,
    );

    await page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]').click();
    await page.locator('[ngbtooltip=Suspend]').click();
    await page.getByRole('button', { name: 'Suspend' }).click();

    expect(await page.locator('.toast-body > .header').innerText()).toContain('Success');

    await page.goto(
      `${BasePage.TENANT}/process-definitions?filters=%7B"suspended":%7B"filterType":"select","filter":"suspended","type":"equals"%7D,"name":%7B"filter":"Fluxnova%20UI%20Automation%20-%20Terminate%20Test","type":"contains"%7D%7D&sorting=&toggleFilters=latestVersion`,
    );

    await page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]').click();
    await page.locator('[ngbtooltip=Activate]').click();
    await page.getByRole('button', { name: 'Activate' }).click();

    expect(await page.locator('.toast-body > .header').innerText()).toContain('Success');
  } finally {
    // Ensure the definition is active at the end of the test
    await activateProcessDefinition('fluxnova_automation_terminate_test', page);
  }
});
