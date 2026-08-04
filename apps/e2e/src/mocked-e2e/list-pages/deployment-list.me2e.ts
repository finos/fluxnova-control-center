import { BrowserContext, expect, Page, test } from '@playwright/test';
import deployments from '../../fixtures/deployments/default.json';
import { FXN_SUPPORT_STORAGE_STATE } from '../../../playwright.config';
import { ListPage } from '../../page-objects/list-page.po';

async function goToPage(page: Page, context: BrowserContext) {
  const listPage = new ListPage(page);
  await listPage.initialize(context);
  await page.route('api/deployment?**', async (route) => {
    await route.fulfill({ json: deployments });
  });
  await page.route('api/deployment/count**', async (route) => {
    await route.fulfill({ json: { count: deployments.length } });
  });
  await listPage.gotoDeployments();
}

test.describe('Deployment list page', () => {
  test.use({ storageState: FXN_SUPPORT_STORAGE_STATE });

  test.beforeEach(async ({ page, context }) => {
    await goToPage(page, context);
  });

  test('should have the correct columns displayed', async ({ page }) => {
    await page.locator('a').filter({ hasText: 'Deployments' }).click();
    const header = page.locator('fluxnova-tooltip-header-component');
    await expect(header.filter({ hasText: 'Deploy Time' }).locator('div').nth(1)).toBeVisible();
    await expect(header.filter({ hasText: 'Source' }).locator('div').nth(1)).toBeVisible();
    await expect(header.filter({ hasText: 'Name' }).locator('div').nth(1)).toBeVisible();
    await expect(page.locator('fluxnova-ag-pagination div').filter({ hasText: 'items' })).toBeVisible();
  });
});
