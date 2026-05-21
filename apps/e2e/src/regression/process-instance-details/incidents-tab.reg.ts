import { expect, test } from '@playwright/test';
import { ProcessInstancePage } from '../../page-objects/process-instance-page.po';
import { getProcessDefinitionId, startProcessInstance, terminateProcessInstance } from '../../utils/test-utils';

/**
 * @group regression
 * @group process-instance
 * @group process-instance-details
 * @group process-instance-details-incidents-tab
 */

let processInstancePage: ProcessInstancePage;

test.describe('Incidents Tab', () => {
  let workingInstanceId: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const basicProcessDefinitionId = await getProcessDefinitionId('fluxnova_automation_incident', page);
    workingInstanceId = await startProcessInstance(basicProcessDefinitionId, page);
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await terminateProcessInstance(workingInstanceId, page);
  });

  test.beforeEach(async ({ page }) => {
    processInstancePage = new ProcessInstancePage(page);
    await processInstancePage.navigateToInstanceDetailsPage(workingInstanceId);

    const incidentsTab = page.locator('fluxnova-incidents-tab');
    await expect(incidentsTab).not.toBeVisible();
    await page.locator('li[data-tab="incidents"]').click();
    await expect(incidentsTab).toBeVisible();
    await processInstancePage.waitForLoad();
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('should filter by id', async ({ page }) => {
    const firstIncident = page.locator('.ag-pinned-left-cols-container').first().locator('.ag-row').first();
    const incidentId = (await firstIncident.locator('div[col-id="id"]').textContent()) ?? '';

    await page.fill('input#id', incidentId);
    await expect(firstIncident).toContainText(incidentId);
    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(1);
    await expect(page.locator('li[data-tab="incidents"]').locator('div')).toContainText('(1)');

    await page.waitForTimeout(500);

    await page.fill('input#id', 'fake-id');
    await expect(firstIncident).toHaveCount(0);
    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(0);
    await expect(page.locator('li[data-tab="incidents"]').locator('div')).toContainText('(0)');
  });

  test('should filter by incident type', async ({ page }) => {
    const firstIncident = page.locator('.ag-center-cols-container').first().locator('.ag-row').first();

    await page.locator('ng-select.incidentType').click();
    await expect(page.locator('ng-dropdown-panel')).toBeVisible();
    await page.locator('ng-dropdown-panel').locator('div[role="option"]', { hasText: 'Failed Job' }).click();
    await expect(page.locator('ng-dropdown-panel')).toBeHidden();

    await expect(firstIncident).toContainText('Failed Job');
    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(1);
    await expect(page.locator('li[data-tab="incidents"]').locator('div')).toContainText('(1)');

    await page.waitForTimeout(500);

    await page.locator('ng-select.incidentType').click();
    await expect(page.locator('ng-dropdown-panel')).toBeVisible();
    await page.locator('ng-dropdown-panel').locator('div[role="option"]', { hasText: 'Failed External Task' }).click();
    await expect(page.locator('ng-dropdown-panel')).toBeHidden();

    await expect(firstIncident).toHaveCount(0);
    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(0);
    await expect(page.locator('li[data-tab="incidents"]').locator('div')).toContainText('(0)');
  });

  test('should filter by activity id', async ({ page }) => {
    const firstIncident = page.locator('.ag-center-cols-container').first().locator('.ag-row').first();
    const activityId = (await firstIncident.locator('div[col-id="activityId"]').textContent()) ?? '';

    await page.fill('input#activityId', activityId);
    await expect(firstIncident).toContainText(activityId);
    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(1);
    await expect(page.locator('li[data-tab="incidents"]').locator('div')).toContainText('(1)');

    await page.waitForTimeout(500);

    await page.fill('input#activityId', 'Fake_Activity_ID');
    await expect(firstIncident).toHaveCount(0);
    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(0);
    await expect(page.locator('li[data-tab="incidents"]').locator('div')).toContainText('(0)');
  });

  test('should allow moving unpinned columns', async ({ page }) => {
    const messageColumnHeader = page.locator('div[role="columnheader"]', { hasText: 'Incident Message' });
    const createTimeColumnHeader = page.locator('div[role="columnheader"]', { hasText: 'Create Time' });

    await expect(messageColumnHeader).toHaveAttribute('aria-colindex', '3');
    await expect(createTimeColumnHeader).toHaveAttribute('aria-colindex', '4');

    await messageColumnHeader.dragTo(createTimeColumnHeader);

    await expect(messageColumnHeader).toHaveAttribute('aria-colindex', '4');
    await expect(createTimeColumnHeader).toHaveAttribute('aria-colindex', '3');
  });

  test('should not allow moving pinned left column', async ({ page }) => {
    const pinnedIdColumnHeader = page.locator('div[role="columnheader"]', { hasText: 'Incident ID' });
    const messageColumnHeader = page.locator('div[role="columnheader"]', { hasText: 'Incident Message' });

    await expect(pinnedIdColumnHeader).toHaveAttribute('aria-colindex', '2');
    await expect(messageColumnHeader).toHaveAttribute('aria-colindex', '3');

    await pinnedIdColumnHeader.dragTo(messageColumnHeader);

    await expect(pinnedIdColumnHeader).toHaveAttribute('aria-colindex', '2');
    await expect(messageColumnHeader).toHaveAttribute('aria-colindex', '3');
  });

  test('should set retry count', async ({ page }) => {
    const setRetryCountButton = page.locator('#bottomPanel').getByRole('button');
    const confirmModal = page.locator('fluxnova-confirm-modal');
    await expect(setRetryCountButton).toBeDisabled();
    await page.locator('.ag-selection-checkbox').first().click();
    await expect(setRetryCountButton).toBeEnabled();

    await setRetryCountButton.click();

    await expect(confirmModal).toBeVisible();
    await confirmModal.locator('button', { hasText: 'Set Count' }).click();
    await expect(confirmModal).toBeHidden();

    await expect(processInstancePage.toastHeader).toHaveText('Success');
  });

  test('should show stack trace', async ({ page }) => {
    const firstIncident = page.locator('.ag-center-cols-container').first().locator('.ag-row').first();
    await expect(firstIncident.locator('fluxnova-stack-trace-renderer')).toHaveCount(1);
    await expect(page.locator('ngb-modal-window')).toBeHidden();
    await firstIncident.locator('fluxnova-stack-trace-renderer').click();
    await expect(page.locator('ngb-modal-window')).toBeVisible();
    await expect(page.locator('fluxnova-code-editor')).toBeVisible();
  });
});
