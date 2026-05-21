import { test } from '@playwright/test';
import { clickIdLinkVerifyPageAndData } from '../../shared/id-link';
import { BasePage } from '../../page-objects/base-page.po';

test.beforeEach(async ({ page }) => {
  await page.goto(
    `./${BasePage.TENANT}/decision-definitions?sorting=%5B%7B"colId":"key","sort":"asc"%7D%5D&filter=%7B%7D&toggleFilters=latestVersion&page=1&pageSize=50`,
  );
});

test('should have valid decision definitions list ID link', async ({ page }) => {
  await clickIdLinkVerifyPageAndData(
    true,
    0,
    'DECISION DEFINITION',
    'Decision Instances',
    'decision-definitions',
    page,
  );
});
