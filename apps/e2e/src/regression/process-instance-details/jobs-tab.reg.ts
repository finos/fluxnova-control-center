import { expect, Locator, test } from '@playwright/test';
import moment from 'moment/moment';
import { ProcessInstancePage } from '../../page-objects/process-instance-page.po';
import { getProcessDefinitionId, startProcessInstance, terminateProcessInstance } from '../../utils/test-utils';

/**
 * @group regression
 * @group process-instance
 * @group process-instance-details
 * @group process-instance-details-jobs-tab
 */

let processInstancePage: ProcessInstancePage;

test.describe('Jobs Tab', () => {
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

    const jobsTab = page.locator('fluxnova-jobs-tab');
    await expect(jobsTab).not.toBeVisible();
    await page.locator('li[data-tab="jobs"]').click();
    await expect(jobsTab).toBeVisible();
    await processInstancePage.waitForLoad();
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('should filter by id', async ({ page }) => {
    const firstJob = page.locator('.ag-pinned-left-cols-container').first().locator('.ag-row').first();
    const jobId = (await firstJob.locator('div[col-id="id"]').textContent()) ?? '';

    await page.fill('input#id', jobId);
    await page.locator('ng-dropdown-panel').click();
    await expect(firstJob).toContainText(jobId);
    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(1);
    await expect(page.locator('li[data-tab="jobs"]').locator('div')).toContainText('(1)');

    await page.locator('ng-dropdown-panel').click();

    await page.waitForTimeout(500);

    await page.fill('input#id', 'fake-id');
    await page.locator('ng-dropdown-panel').click();
    await expect(firstJob).toHaveCount(0);
    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(0);
    await expect(page.locator('li[data-tab="jobs"]').locator('div')).toContainText('(0)');
  });

  test('should filter by job definition id', async ({ page }) => {
    const firstJob = page.locator('.ag-pinned-left-cols-container').first().locator('.ag-row').first();
    const jobDefinitionId = (await firstJob.locator('div[col-id="jobDefinitionId"]').textContent()) ?? '';
    const jobWithDefinitionIdCount = await page
      .locator('.ag-pinned-left-cols-container')
      .first()
      .locator('.ag-row', { hasText: jobDefinitionId })
      .count();

    await page.fill('input#jobDefinitionId', jobDefinitionId);
    await expect(firstJob).toContainText(jobDefinitionId);
    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(
      jobWithDefinitionIdCount,
    );
    await expect(page.locator('li[data-tab="jobs"]').locator('div')).toContainText(`(${jobWithDefinitionIdCount})`);

    await page.waitForTimeout(500);

    await page.fill('input#jobDefinitionId', 'Fake_Activity_ID');
    await expect(firstJob).toHaveCount(0);
    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(0);
    await expect(page.locator('li[data-tab="jobs"]').locator('div')).toContainText('(0)');
  });

  test('should filter by retries left', async ({ page }) => {
    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row').first()).toBeVisible();
    const hasRetriesCount = await page
      .locator('.ag-center-cols-container')
      .first()
      .locator('.ag-cell[col-id="retries"]')
      .filter({ hasText: /^[1-9]\d*$/ })
      .count();
    const noRetriesCount = await page
      .locator('.ag-center-cols-container')
      .first()
      .locator('.ag-cell[col-id="retries"]')
      .filter({ hasText: '0' })
      .count();

    await page.locator('ng-select.retries').click();
    await expect(page.locator('ng-dropdown-panel')).toBeVisible();
    await page.locator('ng-dropdown-panel').locator('div[role="option"]', { hasText: 'Has Retries Left' }).click();
    await expect(page.locator('ng-dropdown-panel')).toBeHidden();

    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(hasRetriesCount);
    await expect(page.locator('li[data-tab="jobs"]').locator('div')).toContainText(`(${hasRetriesCount})`);

    await page.waitForTimeout(500);

    await page.locator('ng-select.retries').click();
    await expect(page.locator('ng-dropdown-panel')).toBeVisible();
    await page.locator('ng-dropdown-panel').locator('div[role="option"]', { hasText: 'Has No Retries Left' }).click();
    await expect(page.locator('ng-dropdown-panel')).toBeHidden();

    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(noRetriesCount);
    await expect(page.locator('li[data-tab="jobs"]').locator('div')).toContainText(`(${noRetriesCount})`);
  });

  test('should filter by activity id', async ({ page }) => {
    const firstJob = page.locator('.ag-center-cols-container').first().locator('.ag-row').first();
    const activityId = (await firstJob.locator('div[col-id="activityId"]').textContent()) ?? '';
    const jobWithActivityIdCount = await page
      .locator('.ag-center-cols-container')
      .first()
      .locator('.ag-row', { hasText: activityId })
      .count();

    await page.fill('input#activityId', activityId);
    await expect(firstJob).toContainText(activityId);
    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(
      jobWithActivityIdCount,
    );
    await expect(page.locator('li[data-tab="jobs"]').locator('div')).toContainText(`(${jobWithActivityIdCount})`);

    await page.waitForTimeout(500);

    await page.fill('input#activityId', 'Fake_Activity_ID');
    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(0);
    await expect(page.locator('li[data-tab="jobs"]').locator('div')).toContainText('(0)');
  });

  test('should filter by suspended', async ({ page }) => {
    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row').first()).toBeVisible();
    const suspendedCount = await page
      .locator('.ag-center-cols-container')
      .first()
      .locator('.ag-cell[col-id="suspended"]')
      .filter({ hasText: 'true' })
      .count();
    const activeCount = await page
      .locator('.ag-center-cols-container')
      .first()
      .locator('.ag-cell[col-id="suspended"]')
      .filter({ hasText: 'false' })
      .count();

    await page.locator('ng-select.suspended').click();
    await expect(page.locator('ng-dropdown-panel')).toBeVisible();
    await page.locator('ng-dropdown-panel').locator('div[role="option"]', { hasText: 'False' }).click();
    await expect(page.locator('ng-dropdown-panel')).toBeHidden();

    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(activeCount);
    await expect(page.locator('li[data-tab="jobs"]').locator('div')).toContainText(`(${activeCount})`);

    await page.waitForTimeout(500);

    await page.locator('ng-select.suspended').click();
    await expect(page.locator('ng-dropdown-panel')).toBeVisible();
    await page.locator('ng-dropdown-panel').locator('div[role="option"]', { hasText: 'True' }).click();
    await expect(page.locator('ng-dropdown-panel')).toBeHidden();

    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(suspendedCount);
    await expect(page.locator('li[data-tab="jobs"]').locator('div')).toContainText(`(${suspendedCount})`);
  });

  test('should allow moving unpinned columns', async ({ page }) => {
    const dueTimeColumnHeader = page.locator('div[role="columnheader"]', { hasText: 'Due Time' });
    const createTimeColumnHeader = page.locator('div[role="columnheader"]', { hasText: 'Create Time' });

    await expect(dueTimeColumnHeader).toHaveAttribute('aria-colindex', '4');
    await expect(createTimeColumnHeader).toHaveAttribute('aria-colindex', '5');

    await dueTimeColumnHeader.dragTo(createTimeColumnHeader);

    await expect(dueTimeColumnHeader).toHaveAttribute('aria-colindex', '5');
    await expect(createTimeColumnHeader).toHaveAttribute('aria-colindex', '4');
  });

  test('should not allow moving pinned left column', async ({ page }) => {
    const pinnedIdColumnHeader = page.locator('div[role="columnheader"]', { hasText: 'Job ID' });
    const pinnedDefinitionColumnHeader = page.locator('div[role="columnheader"]', { hasText: 'Job Definition ID' });

    await expect(pinnedIdColumnHeader).toHaveAttribute('aria-colindex', '2');
    await expect(pinnedDefinitionColumnHeader).toHaveAttribute('aria-colindex', '3');

    await pinnedIdColumnHeader.dragTo(pinnedDefinitionColumnHeader);

    await expect(pinnedIdColumnHeader).toHaveAttribute('aria-colindex', '2');
    await expect(pinnedDefinitionColumnHeader).toHaveAttribute('aria-colindex', '3');
  });

  test('should activate/suspend job', async ({ page }) => {
    const activateButton = page.locator('button[ngbtooltip="Activate"]');
    const suspendButton = page.locator('button[ngbtooltip="Suspend"]');
    const confirmModal = page.locator('fluxnova-confirm-modal');

    // Suspend
    await expect(suspendButton).toBeDisabled();
    await page.locator('.ag-selection-checkbox').first().click();
    await expect(suspendButton).toBeEnabled();

    await suspendButton.click();

    await expect(confirmModal).toBeVisible();
    await confirmModal.locator('button', { hasText: 'Suspend' }).click();
    await expect(confirmModal).toBeHidden();

    await expect(processInstancePage.toastHeader).toHaveText('Success');
    await expect(suspendButton).toBeDisabled();
    await page.locator('.toast-header').locator('fluxnova-icon[iconname="close"]').click();

    // Activate
    await expect(activateButton).toBeDisabled();
    await page.locator('.ag-selection-checkbox').first().click();
    await expect(activateButton).toBeEnabled();

    await activateButton.click();

    await expect(confirmModal).toBeVisible();
    await confirmModal.locator('button', { hasText: 'Activate' }).click();
    await expect(confirmModal).toBeHidden();

    await expect(processInstancePage.toastHeader).toHaveText('Success');
    await expect(activateButton).toBeDisabled();
  });

  test('should set retry count', async ({ page }) => {
    const setRetryCountButton = page.locator('button[ngbtooltip="Set Retry Count"]');
    const confirmModal = page.locator('fluxnova-confirm-modal');
    await expect(setRetryCountButton).toBeDisabled();
    const noRetriesRowIndex =
      (await page
        .locator('.ag-center-cols-container')
        .locator('.ag-row', { hasText: 'Event_0367z5d' })
        .getAttribute('row-index')) ?? '0';
    await page
      .locator('.ag-pinned-left-cols-container')
      .locator(`.ag-row[row-index="${noRetriesRowIndex}"]`)
      .locator('.ag-selection-checkbox')
      .click();
    await expect(setRetryCountButton).toBeEnabled();

    await setRetryCountButton.click();

    await expect(confirmModal).toBeVisible();
    await confirmModal.locator('button', { hasText: 'Set Count' }).click();
    await expect(confirmModal).toBeHidden();

    await expect(processInstancePage.toastHeader).toHaveText('Success');
  });

  test.describe('Due Date Change', () => {
    let confirmModal: Locator;
    let dueDateButton: Locator;

    test.beforeEach(async ({ page }) => {
      confirmModal = page.locator('fluxnova-confirm-modal');
      dueDateButton = page.locator('button[ngbtooltip="Change Due Date"]');

      await expect(dueDateButton).toBeDisabled();
      await page.locator('.ag-selection-checkbox').first().click();
      await expect(dueDateButton).toBeEnabled();
    });

    test('should recalculate due date on job based on creation date', async () => {
      await dueDateButton.click();

      await expect(confirmModal).toBeVisible();
      await confirmModal.getByLabel('Recalculate from current time').check();
      await confirmModal.locator('button', { hasText: 'Change' }).click();
      await expect(confirmModal).toBeHidden();

      await expect(processInstancePage.toastHeader).toHaveText('Success');
    });

    test('should recalculate due date on job based on current date', async () => {
      await dueDateButton.click();

      await expect(confirmModal).toBeVisible();
      await confirmModal.getByLabel('Recalculate from current time').check();
      await confirmModal.locator('button', { hasText: 'Change' }).click();
      await expect(confirmModal).toBeHidden();

      await expect(processInstancePage.toastHeader).toHaveText('Success');
    });

    test('should set specific due date on job', async ({ page }) => {
      await dueDateButton.click();

      await expect(confirmModal).toBeVisible();
      await expect(confirmModal.locator('fluxnova-date-range-select')).toBeHidden();
      await confirmModal.getByLabel('Set a specific date').check();
      await expect(confirmModal.locator('fluxnova-date-range-select')).toBeVisible();

      // Set date 10 days in future
      const dateString = await confirmModal.locator('fluxnova-date-range-select').locator('input').inputValue();
      const dt = moment.utc(dateString, 'YYYY-MM-DD HH:mm:ss');
      const addTenDays = dt.add(10, 'days');
      await confirmModal
        .locator('fluxnova-date-range-select')
        .locator('input')
        .fill(addTenDays.format('YYYY-MM-DD HH:mm:ss'));
      await page.waitForTimeout(1200); // Wait for debounce

      await confirmModal.locator('button', { hasText: 'Change' }).click();
      await expect(confirmModal).toBeHidden();

      await expect(processInstancePage.toastHeader).toHaveText('Success');
    });
  });
});
