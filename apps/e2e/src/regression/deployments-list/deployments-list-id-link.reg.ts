import { test } from '@playwright/test';
import { clickIdLinkVerifyPageAndData } from '../../shared/id-link';
import { BasePage } from '../../page-objects/base-page.po';

test.beforeEach(async ({ page }) => {
  await page.goto(
    `./${BasePage.TENANT}/deployments?sorting=%5B%7B"colId":"deploymentTime","sort":"desc"%7D%5D&page=1&pageSize=50`,
  );
});

test('should have valid deployments list deployment ID link', async ({ page }) => {
  await clickIdLinkVerifyPageAndData(true, 1, 'DEPLOYMENT', 'Definitions', 'deployments', page);
});
