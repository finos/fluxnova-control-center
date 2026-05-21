import { test } from '@playwright/test';
import { clickIdLinkVerifyPageAndData } from '../../shared/id-link';
import { BasePage } from '../../page-objects/base-page.po';

test.beforeEach(async ({ page }) => {
  await page.goto(`./${BasePage.TENANT}/process-definitions?toggleFilters=latestVersion&page=1&pageSize=50`);
});
test.describe('should have valid process definition list ID links', () => {
  test('process definition ID link', async ({ page }) => {
    await clickIdLinkVerifyPageAndData(true, 1, 'PROCESS DEFINITION', 'Instances', 'process-definitions', page);
  });

  test('deployment ID link', async ({ page }) => {
    await clickIdLinkVerifyPageAndData(false, 5, 'DEPLOYMENT', 'Definitions', 'deployments', page);
  });
});
