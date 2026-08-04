import { test } from '@playwright/test';
import { clickIdLinkVerifyPageAndData } from '../../shared/id-link';
import { BasePage } from '../../page-objects/base-page.po';

test.beforeEach(async ({ page }) => {
  await page.goto(`./${BasePage.TENANT}/jobs?toggleFilters=withRetriesLeft&page=1&pageSize=50`);
});

test('should have valid jobs list job ID link', async ({ page }) => {
  await clickIdLinkVerifyPageAndData(true, 1, 'PROCESS INSTANCE', 'Jobs', 'jobId', page);
});

test('should have valid jobs list job definition ID link', async ({ page }) => {
  await clickIdLinkVerifyPageAndData(true, 2, 'PROCESS DEFINITION', 'Job Definitions', 'jobDefinitionId', page);
});

test('should have valid jobs list process definition ID link', async ({ page }) => {
  await clickIdLinkVerifyPageAndData(false, 5, 'PROCESS DEFINITION', 'Instances', 'process-definitions', page);
});
