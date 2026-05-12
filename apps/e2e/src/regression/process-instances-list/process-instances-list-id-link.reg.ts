import { expect, test } from '@playwright/test';
import { clickIdLinkVerifyPageAndData } from '../../shared/id-link';
import { BasePage } from '../../page-objects/base-page.po';

test.beforeEach(async ({ page }) => {
  await page.goto(
    `./${BasePage.TENANT}/process-instances?filters=%7B"state":%7B"type":"equals","filter":"active","filterType":"select"%7D%7D&sorting=%5B%7B"colId":"startTime","sort":"desc"%7D%5D&page=1&pageSize=50`,
  );
});

test('should have valid process instances list process instance ID link', async ({ page }) => {
  await clickIdLinkVerifyPageAndData(true, 1, 'PROCESS INSTANCE', 'Variables', 'process-instances', page);
});

test('should have valid process instances list process definition ID link', async ({ page }) => {
  await clickIdLinkVerifyPageAndData(false, 7, 'PROCESS DEFINITION', 'Instances', 'process-definitions', page);
});

test('should have valid process instances list root process instance ID link', async ({ page }) => {
  await clickIdLinkVerifyPageAndData(false, 9, 'PROCESS INSTANCE', 'Variables', 'process-instances', page);
});

test('should have valid process instances list with incidents option', async ({ page }) => {
  /*
  1. Get all items total count
  2. Check 'With Incidents'
  3. Verify that With Incidents total count is less than all items total count
  */

  await page.waitForSelector('.ag-pinned-left-cols-container .ag-row');

  // 1. Get all items total count
  const allItemsTotal = Number((await page.locator('.total-items').nth(0).innerText()).replace(/ of | items/g, ''));
  // 2. Check 'With Incidents'
  await page.getByText('With Incidents').click();
  // 3. Verify that With Incidents total count is less than all items total count
  const withIncidentsTotal = Number(
    (await page.locator('.total-items').nth(0).innerText()).replace(/ of | items/g, ''),
  );
  expect(withIncidentsTotal).toBeLessThan(allItemsTotal);
});
