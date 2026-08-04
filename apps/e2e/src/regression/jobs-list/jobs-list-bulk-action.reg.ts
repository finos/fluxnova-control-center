/* eslint-disable max-lines */
import { expect, test } from '@playwright/test';
import {
  getProcessDefinitionId,
  startProcessInstance,
  suspendProcessInstance,
  terminateProcessInstance,
} from '../../utils/test-utils';
import { CommonElements } from '../../page-objects/common-elements.po';
import { BasePage } from '../../page-objects/base-page.po';

/**
 * @group regression
 * @group jobs
 * @group jobs-list
 * @group jobs-list-bulk-action
 */

let commonElements: CommonElements;

test.describe('Jobs List - Bulk Actions', () => {
  test.describe('Activate and Suspend Actions', () => {
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
      commonElements = new CommonElements(page);
    });

    test('should suspend an active job', async ({ page }) => {
      // Navigate to jobs list with active jobs filter
      await page.goto(
        `./${BasePage.TENANT}/jobs?filters=%7B"suspended":%7B"filterType":"select","filter":"active","type":"equals"%7D,"processDefinitionKey":%7B"filter":"fluxnova_automation_basic","type":"equals"%7D%7D&toggleFilters=withRetriesLeft`,
      );

      // Wait for grid to load
      await page.waitForSelector('.ag-row[row-id="0"]');

      // Get the first job and capture its ID
      const firstRow = page.locator('.ag-row[row-id="0"]');
      const jobIdCell = firstRow.locator('.ag-cell[col-id="id"]');
      const jobId = await jobIdCell.textContent();

      const suspendedCell = firstRow.locator('.ag-cell[col-id="suspended"]');
      await expect(suspendedCell).toHaveText('false');

      // Select the job
      const checkbox = firstRow.locator('.ag-selection-checkbox input[type="checkbox"]');
      await checkbox.click();

      // Click Suspend button
      const suspendButton = page.locator('#suspend');
      await expect(suspendButton).toBeEnabled();
      await suspendButton.click();

      // Confirm suspension in modal
      await expect(page.getByRole('heading', { name: 'Suspend Job' })).toBeVisible();
      await page.getByRole('button', { name: 'Suspend' }).click();

      // Wait for modal to close (indicates action submitted)
      await expect(page.getByRole('heading', { name: 'Suspend Job' })).not.toBeVisible();

      // Verify success toast
      await expect(commonElements.toastMessage.first()).toContainText('Success');

      // Navigate to suspended jobs to verify the specific job
      await page.goto(
        `./${BasePage.TENANT}/jobs?filters=%7B"suspended":%7B"filterType":"select","filter":"suspended","type":"equals"%7D,"processDefinitionKey":%7B"filter":"fluxnova_automation_basic","type":"equals"%7D%7D&toggleFilters=withRetriesLeft`,
      );

      // Wait for grid to load
      await page.waitForSelector('.ag-row');

      // Make sure captured job id is a non-empty string
      if (typeof jobId !== 'string' || jobId.trim() === '') {
        throw new Error('Expected captured job ID to be a non-empty string before filtering rows.');
      }
      const normalizedTargetJobId = jobId.trim();

      // Find the specific job by ID - find the cell with exact text match, then get parent row
      const targetJobIdCell = page.locator('.ag-cell[col-id="id"]').filter({ hasText: normalizedTargetJobId });
      await expect(targetJobIdCell).toBeVisible();

      // Get the parent row (use first() to handle multiple containers)
      const targetRow = targetJobIdCell.locator('xpath=ancestor::div[contains(@class, "ag-row")]').first();
      const targetSuspendedCell = targetRow.locator('.ag-cell[col-id="suspended"]').first();

      // Verify the job is now suspended
      await expect(targetSuspendedCell).toHaveText('true');

      // Cleanup: Reactivate the job
      const targetCheckbox = targetRow.locator('.ag-selection-checkbox input[type="checkbox"]').first();
      await targetCheckbox.click();
      const activateButton = page.locator('#activate');
      await expect(activateButton).toBeEnabled();
      await activateButton.click();
      await page.getByRole('button', { name: 'Activate' }).click();
      await expect(page.getByRole('heading', { name: 'Activate Job' })).not.toBeVisible();

      // Navigate back to active jobs and verify it's active
      await page.goto(
        `./${BasePage.TENANT}/jobs?filters=%7B"suspended":%7B"filterType":"select","filter":"active","type":"equals"%7D,"processDefinitionKey":%7B"filter":"fluxnova_automation_basic","type":"equals"%7D%7D&toggleFilters=withRetriesLeft`,
      );
      await page.waitForSelector('.ag-row');

      if (typeof jobId !== 'string' || jobId.trim() === '') {
        throw new Error('Expected captured job ID to be a non-empty string before filtering rows.');
      }
      const normalizedJobId = jobId.trim();

      // Find the specific job by ID in active jobs
      const reactivatedJobIdCell = page.locator('.ag-cell[col-id="id"]').filter({ hasText: normalizedJobId });
      await expect(reactivatedJobIdCell).toBeVisible();
      const reactivatedRow = reactivatedJobIdCell.locator('xpath=ancestor::div[contains(@class, "ag-row")]').first();
      const reactivatedSuspendedCell = reactivatedRow.locator('.ag-cell[col-id="suspended"]').first();
      await expect(reactivatedSuspendedCell).toHaveText('false');
    });

    test('should activate a suspended job', async ({ page }) => {
      // First suspend the instance to have a suspended job
      await suspendProcessInstance(workingInstanceId, page);

      // Navigate to jobs list with suspended jobs filter
      await page.goto(
        `./${BasePage.TENANT}/jobs?filters=%7B"suspended":%7B"filterType":"select","filter":"suspended","type":"equals"%7D,"processDefinitionKey":%7B"filter":"fluxnova_automation_basic","type":"equals"%7D%7D&toggleFilters=withRetriesLeft`,
      );

      // Wait for grid to load
      await page.waitForSelector('.ag-row[row-id="0"]');

      // Get the first job and capture its ID
      const firstRow = page.locator('.ag-row[row-id="0"]');
      const jobIdCell = firstRow.locator('.ag-cell[col-id="id"]');
      const jobId = await jobIdCell.textContent();

      const suspendedCell = firstRow.locator('.ag-cell[col-id="suspended"]');
      await expect(suspendedCell).toHaveText('true');

      // Select the job
      const checkbox = firstRow.locator('.ag-selection-checkbox input[type="checkbox"]');
      await checkbox.click();

      // Click Activate button
      const activateButton = page.locator('#activate');
      await expect(activateButton).toBeEnabled();
      await activateButton.click();

      // Confirm activation in modal
      await expect(page.getByRole('heading', { name: 'Activate Job' })).toBeVisible();
      await page.getByRole('button', { name: 'Activate' }).click();

      // Wait for modal to close (indicates action submitted)
      await expect(page.getByRole('heading', { name: 'Activate Job' })).not.toBeVisible();

      // Verify success toast
      await expect(commonElements.toastMessage.first()).toContainText('Success');

      // Navigate to active jobs to verify the specific job
      await page.goto(
        `./${BasePage.TENANT}/jobs?filters=%7B"suspended":%7B"filterType":"select","filter":"active","type":"equals"%7D,"processDefinitionKey":%7B"filter":"fluxnova_automation_basic","type":"equals"%7D%7D&toggleFilters=withRetriesLeft`,
      );

      // Wait for grid to load
      await page.waitForSelector('.ag-row');

      if (typeof jobId !== 'string' || jobId.trim() === '') {
        throw new Error('Expected captured job ID to be a non-empty string before filtering rows.');
      }
      const normalizedJobId = jobId.trim();

      // Find the specific job by ID - find the cell with exact text match, then get parent row
      const targetJobIdCell = page.locator('.ag-cell[col-id="id"]').filter({ hasText: normalizedJobId });
      await expect(targetJobIdCell).toBeVisible();

      // Get the parent row (use first() to handle multiple containers)
      const targetRow = targetJobIdCell.locator('xpath=ancestor::div[contains(@class, "ag-row")]').first();
      const targetSuspendedCell = targetRow.locator('.ag-cell[col-id="suspended"]').first();

      // Verify the job is now active
      await expect(targetSuspendedCell).toHaveText('false');
    });

    test('should disable activate button when selecting active job', async ({ page }) => {
      await page.goto(
        `./${BasePage.TENANT}/jobs?filters=%7B"suspended":%7B"filterType":"select","filter":"active","type":"equals"%7D,"processDefinitionKey":%7B"filter":"fluxnova_automation_basic","type":"equals"%7D%7D&toggleFilters=withRetriesLeft`,
      );

      await page.waitForSelector('.ag-row[row-id="0"]');

      const activateButton = page.locator('#activate');
      await expect(activateButton).toBeDisabled();

      // Select an active job
      const checkbox = page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]');
      await checkbox.click();

      // Activate button should remain disabled for active jobs
      await expect(activateButton).toBeDisabled();
    });

    test('should disable suspend button when selecting suspended job', async ({ page }) => {
      // First suspend the instance to have a suspended job
      await suspendProcessInstance(workingInstanceId, page);

      await page.goto(
        `./${BasePage.TENANT}/jobs?filters=%7B"suspended":%7B"filterType":"select","filter":"suspended","type":"equals"%7D,"processDefinitionKey":%7B"filter":"fluxnova_automation_basic","type":"equals"%7D%7D&toggleFilters=withRetriesLeft`,
      );

      await page.waitForSelector('.ag-row[row-id="0"]');

      const suspendButton = page.locator('#suspend');
      await expect(suspendButton).toBeDisabled();

      // Select a suspended job
      const checkbox = page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]');
      await checkbox.click();

      // Suspend button should remain disabled for suspended jobs
      await expect(suspendButton).toBeDisabled();
    });
  });

  test.describe('Set Retry Count Action', () => {
    let workingInstanceId: string;

    test.beforeAll(async ({ browser }) => {
      const page = await browser.newPage();
      const incidentProcessDefinitionId = await getProcessDefinitionId('fluxnova_automation_incident', page);
      workingInstanceId = await startProcessInstance(incidentProcessDefinitionId, page);
    });

    test.afterAll(async ({ browser }) => {
      const page = await browser.newPage();
      await terminateProcessInstance(workingInstanceId, page);
    });

    test.beforeEach(async ({ page }) => {
      commonElements = new CommonElements(page);
    });

    test('should set retry count for job with no retries left', async ({ page }) => {
      // Navigate to jobs list with no retries left filter
      await page.goto(
        `./${BasePage.TENANT}/jobs?filters=%7B"processDefinitionKey":%7B"filter":"fluxnova_automation_incident","type":"equals"%7D,"retries":%7B"filterType":"select","filter":"noRetriesLeft","type":"equals"%7D%7D&toggleFilters=`,
      );

      // Wait for grid to load
      await page.waitForSelector('.ag-row[row-id="0"]');

      // Get the first job, capture its ID, and verify it has no retries
      const firstRow = page.locator('.ag-row[row-id="0"]');
      const jobIdCell = firstRow.locator('.ag-cell[col-id="id"]');
      const jobId = await jobIdCell.textContent();

      const retriesCell = firstRow.locator('.ag-cell[col-id="retries"]');
      await expect(retriesCell).toHaveText('0');

      // Select the job
      const checkbox = firstRow.locator('.ag-selection-checkbox input[type="checkbox"]');
      await checkbox.click();

      // Click Set Retry Count button
      const retryButton = page.locator('#retry');
      await expect(retryButton).toBeEnabled();
      await retryButton.click();

      // Wait for modal to appear and verify heading
      await expect(page.getByRole('heading', { name: 'Set Retry Count' })).toBeVisible();

      // Fill in retry count - clear first then type to ensure Angular ngModel picks up the change
      const retryInput = page.getByRole('spinbutton');
      await retryInput.click();
      await retryInput.clear();
      await retryInput.pressSequentially('3');

      // Confirm retry count change
      await page.getByRole('button', { name: 'Set Count' }).click();

      // Verify success toast
      await expect(commonElements.toastMessage.first()).toContainText('Success');

      // Navigate to jobs with retries (job moved from noRetriesLeft filter)
      await page.goto(
        `./${BasePage.TENANT}/jobs?filters=%7B"processDefinitionKey":%7B"filter":"fluxnova_automation_incident","type":"equals"%7D%7D&toggleFilters=withRetriesLeft`,
      );

      // Wait for grid to load
      await page.waitForSelector('.ag-row');

      if (typeof jobId !== 'string' || jobId.trim() === '') {
        throw new Error('Expected captured job ID to be a non-empty string before filtering rows.');
      }
      const normalizedJobId = jobId.trim();

      // Find the specific job by ID
      const targetJobIdCell = page.locator('.ag-cell[col-id="id"]').filter({ hasText: normalizedJobId });
      await expect(targetJobIdCell).toBeVisible();

      // Get the parent row and retries cell
      const targetRow = targetJobIdCell.locator('xpath=ancestor::div[contains(@class, "ag-row")]').first();
      const targetRetriesCell = targetRow.locator('.ag-cell[col-id="retries"]').first();

      // Verify the retry count was updated
      await expect(targetRetriesCell).toHaveText('3');
    });

    test('should disable retry button when selecting job with retries left', async ({ page }) => {
      await page.goto(
        `./${BasePage.TENANT}/jobs?filters=%7B"processDefinitionKey":%7B"filter":"fluxnova_automation_basic","type":"equals"%7D%7D&toggleFilters=withRetriesLeft`,
      );

      await page.waitForSelector('.ag-row[row-id="0"]');

      const retryButton = page.locator('#retry');
      await expect(retryButton).toBeDisabled();

      // Select a job with retries left
      const checkbox = page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]');
      await checkbox.click();

      // Retry button should remain disabled for jobs with retries left
      await expect(retryButton).toBeDisabled();
    });

    test('should enable retry button when selecting multiple jobs with no retries', async ({ page }) => {
      await page.goto(
        `./${BasePage.TENANT}/jobs?filters=%7B"processDefinitionKey":%7B"filter":"fluxnova_automation_incident","type":"equals"%7D,"retries":%7B"filterType":"select","filter":"noRetriesLeft","type":"equals"%7D%7D&toggleFilters=`,
      );

      await page.waitForSelector('.ag-row[row-id="0"]');

      const retryButton = page.locator('#retry');

      // Select first job
      const firstCheckbox = page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]');
      await firstCheckbox.click();
      await expect(retryButton).toBeEnabled();

      // Check if second row exists
      const secondRowCount = await page.locator('.ag-row[row-id="1"]').count();
      if (secondRowCount > 0) {
        // Select second job
        const secondCheckbox = page.locator('.ag-row[row-id="1"] .ag-selection-checkbox input[type="checkbox"]');
        await secondCheckbox.click();

        // Retry button should still be enabled for multiple jobs with no retries
        await expect(retryButton).toBeEnabled();
      }
    });
  });

  test.describe('Change Due Date Action', () => {
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
      commonElements = new CommonElements(page);
    });

    test('should change due date by recalculating from creation time', async ({ page }) => {
      // Navigate to the specific job created by our process instance
      const encodedFilters = encodeURIComponent(
        JSON.stringify({ processInstanceId: { filter: workingInstanceId, type: 'equals' } }),
      );
      await page.goto(`./${BasePage.TENANT}/jobs?filters=${encodedFilters}&toggleFilters=withRetriesLeft`);
      await page.waitForSelector('.ag-row[row-id="0"]');

      // Select the job
      const checkbox = page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]');
      await checkbox.click();

      // Click Change Due Date button
      const dueDateButton = page.locator('#due-date');
      await expect(dueDateButton).toBeEnabled();
      await dueDateButton.click();

      // Verify modal opened with correct heading
      await expect(page.getByRole('heading', { name: 'Change Job Due Date' })).toBeVisible();

      // Select "Recalculate from creation time" (default option)
      await page.getByRole('radio', { name: 'Recalculate from creation time' }).check();

      // Confirm the change
      await page.getByRole('button', { name: 'Change' }).click();

      // Wait for modal to close
      await expect(page.getByRole('heading', { name: 'Change Job Due Date' })).not.toBeVisible();

      // Verify success toast
      await expect(commonElements.toastMessage.first()).toContainText('Success');
    });

    test('should change due date by recalculating from current time', async ({ page }) => {
      // Navigate to the specific job created by our process instance
      const encodedFilters = encodeURIComponent(
        JSON.stringify({ processInstanceId: { filter: workingInstanceId, type: 'equals' } }),
      );
      await page.goto(`./${BasePage.TENANT}/jobs?filters=${encodedFilters}&toggleFilters=withRetriesLeft`);
      await page.waitForSelector('.ag-row[row-id="0"]');

      // Select the job
      const checkbox = page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]');
      await checkbox.click();

      // Click Change Due Date button
      const dueDateButton = page.locator('#due-date');
      await expect(dueDateButton).toBeEnabled();
      await dueDateButton.click();

      // Verify modal opened with correct heading
      await expect(page.getByRole('heading', { name: 'Change Job Due Date' })).toBeVisible();

      // Select "Recalculate from current time"
      await page.getByRole('radio', { name: 'Recalculate from current time' }).check();

      // Confirm the change
      await page.getByRole('button', { name: 'Change' }).click();

      // Wait for modal to close
      await expect(page.getByRole('heading', { name: 'Change Job Due Date' })).not.toBeVisible();

      // Verify success toast
      await expect(commonElements.toastMessage.first()).toContainText('Success');
    });

    test('should change due date by setting a specific date', async ({ page }) => {
      // Navigate to the specific job created by our process instance
      const encodedFilters = encodeURIComponent(
        JSON.stringify({ processInstanceId: { filter: workingInstanceId, type: 'equals' } }),
      );
      await page.goto(`./${BasePage.TENANT}/jobs?filters=${encodedFilters}&toggleFilters=withRetriesLeft`);
      await page.waitForSelector('.ag-row[row-id="0"]');

      // Capture original due date
      const firstRow = page.locator('.ag-row[row-id="0"]');
      const dueDateCell = firstRow.locator('.ag-cell[col-id="dueDate"]').first();
      const originalDueDate = await dueDateCell.textContent();

      // Select the job
      const checkbox = page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]');
      await checkbox.click();

      // Click Change Due Date button
      const dueDateButton = page.locator('#due-date');
      await expect(dueDateButton).toBeEnabled();
      await dueDateButton.click();

      // Verify modal opened with correct heading
      await expect(page.getByRole('heading', { name: 'Change Job Due Date' })).toBeVisible();

      // Select "Set a specific date" - this reveals the date picker
      const confirmModal = page.locator('fluxnova-confirm-modal');
      const dateRangeSelect = confirmModal.locator('fluxnova-date-range-select');
      await expect(dateRangeSelect).toBeHidden();
      await page.getByRole('radio', { name: 'Set a specific date' }).check();
      await expect(dateRangeSelect).toBeVisible();

      // Set a date 7 days in the future
      const dateInput = dateRangeSelect.locator('input');
      const currentValue = await dateInput.inputValue();
      const futureDate = new Date(currentValue || Date.now());
      futureDate.setDate(futureDate.getDate() + 7);
      await dateInput.fill(futureDate.toISOString().slice(0, 16));

      // Confirm the change
      await page.getByRole('button', { name: 'Change' }).click();

      // Wait for modal to close
      await expect(page.getByRole('heading', { name: 'Change Job Due Date' })).not.toBeVisible();

      // Verify success toast
      await expect(commonElements.toastMessage.first()).toContainText('Success');

      // Verify the due date was updated
      const updatedDueDate = await dueDateCell.textContent();
      expect(updatedDueDate).not.toBe(originalDueDate);
    });

    test('should disable due date button when selecting job without due date', async ({ page }) => {
      await page.goto(
        `./${BasePage.TENANT}/jobs?sorting=%5B%7B"colId":"dueDate","sort":"desc"%7D%5D&toggleFilters=withRetriesLeft`,
      );

      await page.waitForSelector('.ag-row[row-id="0"]');

      const dueDateButton = page.locator('#due-date');
      await expect(dueDateButton).toBeDisabled();

      // Select a job without due date
      const checkbox = page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]');
      await checkbox.click();

      // Due date button should remain disabled for jobs without due date
      await expect(dueDateButton).toBeDisabled();
    });

    test('should disable due date button when selecting multiple jobs', async ({ page }) => {
      await page.goto(
        `./${BasePage.TENANT}/jobs?toggleFilters=withRetriesLeft&sorting=%5B%7B"colId":"dueDate","sort":"asc"%7D%5D`,
      );

      await page.waitForSelector('.ag-row[row-id="0"]');

      const dueDateButton = page.locator('#due-date');

      // Select first job
      const firstCheckbox = page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]');
      await firstCheckbox.click();

      // Button should be enabled for single job with due date
      await expect(dueDateButton).toBeEnabled();

      // Check if second row exists
      const secondRowCount = await page.locator('.ag-row[row-id="1"]').count();
      if (secondRowCount > 0) {
        // Select second job
        const secondCheckbox = page.locator('.ag-row[row-id="1"] .ag-selection-checkbox input[type="checkbox"]');
        await secondCheckbox.click();

        // Due date button should be disabled when multiple jobs are selected
        await expect(dueDateButton).toBeDisabled();
      }
    });
  });

  test.describe('Delete Action', () => {
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
      commonElements = new CommonElements(page);
    });

    test('should delete a job', async ({ page }) => {
      // Navigate to jobs list
      await page.goto(
        `./${BasePage.TENANT}/jobs?filters=%7B"processDefinitionKey":%7B"filter":"fluxnova_automation_basic","type":"equals"%7D%7D&toggleFilters=withRetriesLeft`,
      );

      // Wait for grid to load
      await page.waitForSelector('.ag-row[row-id="0"]');

      // Get the job ID before deletion
      const firstRow = page.locator('.ag-row[row-id="0"]');
      const jobIdCell = firstRow.locator('.ag-cell[col-id="id"]');
      const jobIdToDelete = await jobIdCell.textContent();

      // Select the job
      const checkbox = firstRow.locator('.ag-selection-checkbox input[type="checkbox"]');
      await checkbox.click();

      // Click Delete button
      const deleteButton = page.locator('#delete');
      await expect(deleteButton).toBeEnabled();
      await deleteButton.click();

      // Wait for modal to appear and verify heading
      await expect(page.getByRole('heading', { name: 'Delete Job' })).toBeVisible();
      await page.getByRole('button', { name: 'Delete' }).click();

      // Verify success toast
      await expect(commonElements.toastMessage.first()).toContainText('Success');

      // Verify the job is no longer in the list
      const deletedJobCell = page.locator('.ag-cell[col-id="id"]').filter({ hasText: jobIdToDelete || '' });
      const deletedJobCount = await deletedJobCell.count();
      expect(deletedJobCount).toBe(0);
    });

    test('should disable delete button when no job is selected', async ({ page }) => {
      await page.goto(
        `./${BasePage.TENANT}/jobs?filters=%7B"processDefinitionKey":%7B"filter":"fluxnova_automation_basic","type":"equals"%7D%7D&toggleFilters=withRetriesLeft`,
      );

      await page.waitForSelector('.ag-row[row-id="0"]');

      const deleteButton = page.locator('#delete');

      // Delete button should be disabled when nothing is selected
      await expect(deleteButton).toBeDisabled();
    });

    test('should only allow deleting one job at a time', async ({ page }) => {
      await page.goto(
        `./${BasePage.TENANT}/jobs?filters=%7B"processDefinitionKey":%7B"filter":"fluxnova_automation_basic","type":"equals"%7D%7D&toggleFilters=withRetriesLeft`,
      );

      await page.waitForSelector('.ag-row[row-id="0"]');

      const deleteButton = page.locator('#delete');

      // Select first job
      const firstCheckbox = page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]');
      await firstCheckbox.click();
      await expect(deleteButton).toBeEnabled();

      // Check if second row exists
      const secondRowCount = await page.locator('.ag-row[row-id="1"]').count();
      if (secondRowCount > 0) {
        // Select second job
        const secondCheckbox = page.locator('.ag-row[row-id="1"] .ag-selection-checkbox input[type="checkbox"]');
        await secondCheckbox.click();

        // Delete button should be disabled when multiple jobs are selected
        await expect(deleteButton).toBeDisabled();
      }
    });
  });

  test.describe('Bulk Action Button States', () => {
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

    test('should have all bulk action buttons visible', async ({ page }) => {
      await page.goto(`./${BasePage.TENANT}/jobs?toggleFilters=withRetriesLeft`);

      await page.waitForSelector('.ag-row[row-id="0"]');

      // Verify all bulk action buttons are present
      await expect(page.locator('#activate')).toBeVisible();
      await expect(page.locator('#suspend')).toBeVisible();
      await expect(page.locator('#retry')).toBeVisible();
      await expect(page.locator('#delete')).toBeVisible();
      await expect(page.locator('#due-date')).toBeVisible();
    });

    test('should have all bulk action buttons disabled when no job is selected', async ({ page }) => {
      await page.goto(`./${BasePage.TENANT}/jobs?toggleFilters=withRetriesLeft`);

      await page.waitForSelector('.ag-row[row-id="0"]');

      // Verify all bulk action buttons are disabled when nothing is selected
      await expect(page.locator('#activate')).toBeDisabled();
      await expect(page.locator('#suspend')).toBeDisabled();
      await expect(page.locator('#retry')).toBeDisabled();
      await expect(page.locator('#delete')).toBeDisabled();
      await expect(page.locator('#due-date')).toBeDisabled();
    });
  });
});
