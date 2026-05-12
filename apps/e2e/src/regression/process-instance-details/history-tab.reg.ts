import { expect, Page, test } from '@playwright/test';
import { ProcessInstancePage } from '../../page-objects/process-instance-page.po';
import { getProcessDefinitionId, startProcessInstance, terminateProcessInstance } from '../../utils/test-utils';

/**
 * @group regression
 * @group process-instance
 * @group process-instance-details
 * @group process-instance-details-history-tab
 */

let processInstancePage: ProcessInstancePage;

test.describe('History Tab', () => {
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
    processInstancePage = new ProcessInstancePage(page);
    await processInstancePage.navigateToInstanceDetailsPage(workingInstanceId);

    const historyTab = page.locator('fluxnova-history-tab');
    await expect(historyTab).not.toBeVisible();
    await page.locator('li[data-tab="history"]').click();
    await expect(historyTab).toBeVisible();
    await processInstancePage.waitForLoad();
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('should filter by history type', async ({ page }) => {
    const dropdownPanel = page.locator('ng-dropdown-panel');

    // Activity Instance
    await selectHistoryFilter('Activity Instance', page);

    expect(await page.locator('.ag-center-cols-container').first().locator('.ag-row').count()).toEqual(
      await page
        .locator('.ag-center-cols-container')
        .first()
        .locator('.ag-row', { hasText: 'Activity Instance' })
        .count(),
    );
    const activityInstanceCount = Number((await page.locator('.ag-root').getAttribute('aria-rowcount')) ?? 0) - 1;
    await expect(page.locator('li[data-tab="history"]').locator('div')).toContainText(`(${activityInstanceCount})`);
    await page.locator('fluxnova-multi-select').locator('.ng-clear-wrapper').click();
    await expect(dropdownPanel).toBeHidden();

    await page.waitForTimeout(500);

    // Detail
    await selectHistoryFilter('Detail', page);

    expect(await page.locator('.ag-center-cols-container').first().locator('.ag-row').count()).toEqual(
      await page.locator('.ag-center-cols-container').first().locator('.ag-row', { hasText: 'Detail' }).count(),
    );
    const detailCount = Number((await page.locator('.ag-root').getAttribute('aria-rowcount')) ?? 0) - 1;
    await expect(page.locator('li[data-tab="history"]').locator('div')).toContainText(`(${detailCount})`);
    await page.locator('fluxnova-multi-select').locator('.ng-clear-wrapper').click();
    await expect(dropdownPanel).toBeHidden();

    await page.waitForTimeout(500);

    // Incident
    await selectHistoryFilter('Incident', page);

    expect(await page.locator('.ag-center-cols-container').first().locator('.ag-row').count()).toEqual(
      await page.locator('.ag-center-cols-container').first().locator('.ag-row', { hasText: 'Incident' }).count(),
    );
    const incidentCount = Number((await page.locator('.ag-root').getAttribute('aria-rowcount')) ?? 0) - 1;
    await expect(page.locator('li[data-tab="history"]').locator('div')).toContainText(`(${incidentCount})`);
    await page.locator('fluxnova-multi-select').locator('.ng-clear-wrapper').click();
    await expect(dropdownPanel).toBeHidden();

    await page.waitForTimeout(500);

    // User Operation
    await selectHistoryFilter('User Operation', page);

    expect(await page.locator('.ag-center-cols-container').first().locator('.ag-row').count()).toEqual(
      await page.locator('.ag-center-cols-container').first().locator('.ag-row', { hasText: 'User Operation' }).count(),
    );
    const userOperationCount = Number((await page.locator('.ag-root').getAttribute('aria-rowcount')) ?? 0) - 1;
    await expect(page.locator('li[data-tab="history"]').locator('div')).toContainText(`(${userOperationCount})`);
    await page.locator('fluxnova-multi-select').locator('.ng-clear-wrapper').click();
    await expect(dropdownPanel).toBeHidden();
  });

  test('should allow moving columns', async ({ page }) => {
    const startTimeColumnHeader = page.locator('div[role="columnheader"]', { hasText: 'Start Time' });
    const endTimeColumnHeader = page.locator('div[role="columnheader"]', { hasText: 'End Time' });

    await expect(startTimeColumnHeader).toHaveAttribute('aria-colindex', '1');
    await expect(endTimeColumnHeader).toHaveAttribute('aria-colindex', '2');

    await startTimeColumnHeader.dragTo(endTimeColumnHeader);

    await expect(startTimeColumnHeader).toHaveAttribute('aria-colindex', '2');
    await expect(endTimeColumnHeader).toHaveAttribute('aria-colindex', '1');
  });

  async function selectHistoryFilter(option: string, page: Page): Promise<void> {
    const dropdownPanel = page.locator('ng-dropdown-panel');

    await expect(dropdownPanel).toBeHidden();
    await page.locator('fluxnova-multi-select').click();
    await expect(dropdownPanel).toBeVisible();
    await dropdownPanel.locator('div[role="option"]', { hasText: option }).click();
    await processInstancePage.waitForLoad();
  }
});
