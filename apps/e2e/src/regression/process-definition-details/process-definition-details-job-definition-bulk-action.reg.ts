import { expect, test } from '@playwright/test';
import { ProcessDefinitionsPage } from '../../page-objects/process-definitions-page.po';
import { CommonElements, ProcessDefinitionTabs } from '../../page-objects/common-elements.po';

test.describe('Process Definition Details - Job Definitions Tab Bulk Actions', () => {
  let processDefinitionsPage: ProcessDefinitionsPage;
  let commonElements: CommonElements;
  let tabs: ProcessDefinitionTabs;

  test.beforeEach(async ({ page }) => {
    processDefinitionsPage = new ProcessDefinitionsPage(page);
    commonElements = new CommonElements(page);
    tabs = new ProcessDefinitionTabs(page);
    await processDefinitionsPage.navigateToDefinitionDetailsPage('fluxnova_automation_basic');
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('should activate job definition when activate button is clicked', async ({ page }) => {
    // Navigate to Job Definitions tab
    await tabs.jobDefinitions.click();
    await expect(commonElements.grid).toBeVisible();

    // Wait for rows to load
    const firstCheckbox = page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]');
    await expect(firstCheckbox).toBeVisible();

    // Get the job definition row and its suspended cell to check current state
    const firstRow = page.locator('.ag-row[row-id="0"]');
    const suspendedCell = firstRow.locator('.ag-cell[col-id="suspended"]');

    await firstCheckbox.click();

    // Check current state and take appropriate action
    const suspendedText = await suspendedCell.innerText();
    const isSuspended = suspendedText.trim() === 'true';

    if (!isSuspended) {
      // Job definition is active, suspend it first
      await expect(processDefinitionsPage.suspendJobDefinitionButton).toBeEnabled();
      await processDefinitionsPage.suspendJobDefinitionButton.click();

      // Click confirm
      await page.getByRole('button', { name: 'Suspend' }).click();

      // Verify the row now shows suspended = true
      await expect(suspendedCell).toHaveText('true');

      // Re-select the checkbox
      await firstCheckbox.click();
    }

    // Now activate the suspended job definition
    await expect(processDefinitionsPage.activateJobDefinitionButton).toBeEnabled();
    await processDefinitionsPage.activateJobDefinitionButton.click();

    // Click confirm
    await page.getByRole('button', { name: 'Activate' }).click();

    // Verify success toast
    await expect(commonElements.toastMessage.first()).toContainText('Success');

    // Wait for grid to update and verify the suspended state changed to false
    await expect(suspendedCell).toHaveText('false');
  });

  test('should suspend job definition when suspend button is clicked', async ({ page }) => {
    // Navigate to Job Definitions tab
    await tabs.jobDefinitions.click();
    await expect(commonElements.grid).toBeVisible();

    // Wait for rows
    const firstCheckbox = page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]');
    await expect(firstCheckbox).toBeVisible();

    // Get the job definition row and its suspended cell to check current state
    const firstRow = page.locator('.ag-row[row-id="0"]');
    const suspendedCell = firstRow.locator('.ag-cell[col-id="suspended"]');

    await firstCheckbox.click();

    // Check current state and take appropriate action
    const suspendedText = await suspendedCell.innerText();
    const isSuspended = suspendedText.trim() === 'true';

    if (isSuspended) {
      // Job definition is suspended, activate it first
      await expect(processDefinitionsPage.activateJobDefinitionButton).toBeEnabled();
      await processDefinitionsPage.activateJobDefinitionButton.click();

      // Click confirm
      await page.getByRole('button', { name: 'Activate' }).click();

      // Verify the row now shows suspended = false
      await expect(suspendedCell).toHaveText('false');

      // Re-select the checkbox
      await firstCheckbox.click();
    }

    // Now suspend the active job definition
    await expect(processDefinitionsPage.suspendJobDefinitionButton).toBeEnabled();
    await processDefinitionsPage.suspendJobDefinitionButton.click();

    // Click confirm
    await page.getByRole('button', { name: 'Suspend' }).click();

    // Verify success toast message
    await expect(commonElements.toastMessage.first()).toContainText('Success');

    // Wait for grid to update and verify the suspended state changed to true
    await expect(suspendedCell).toHaveText('true');

    // Cleanup: Reactivate the job definition to restore it to active state
    await firstCheckbox.click();
    await expect(processDefinitionsPage.activateJobDefinitionButton).toBeEnabled();
    await processDefinitionsPage.activateJobDefinitionButton.click();

    // Click confirm
    await page.getByRole('button', { name: 'Activate' }).click();

    // Verify job definition is now active
    await expect(suspendedCell).toHaveText('false');
  });

  test('should change overriding job priority when priority button is clicked', async ({ page }) => {
    // Navigate to Job Definitions tab
    await tabs.jobDefinitions.click();
    await expect(commonElements.grid).toBeVisible();

    // Select first job definition row
    const firstCheckbox = page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]');
    await expect(firstCheckbox).toBeVisible();
    await firstCheckbox.click();

    // Get the priority cell to check before and after
    const firstRow = page.locator('.ag-row[row-id="0"]');
    const priorityCell = firstRow.locator('.ag-cell[col-id="overridingJobPriority"]');
    let initialPriority = await priorityCell.innerText();

    // Initial cleanup: Clear any existing priority from previous test runs to ensure clean state
    if (initialPriority.trim() !== '') {
      await expect(processDefinitionsPage.changeJobPriorityButton).toBeEnabled();
      await processDefinitionsPage.changeJobPriorityButton.click();

      // Wait for modal to appear
      await page.locator('.modal-content').waitFor({ state: 'visible' });

      // Check if "Clear Overriding Job Priority" radio button exists and click it if present
      const initialClearJobPriorityRadio = page.locator(
        'label:has-text("Clear Overriding Job Priority") input[type="radio"]',
      );
      const initialClearRadioCount = await initialClearJobPriorityRadio.count();
      if (initialClearRadioCount > 0) {
        await initialClearJobPriorityRadio.click();
      }

      // Click confirm to clear
      await page.getByRole('button', { name: 'Change' }).click();

      // Wait for modal to close
      await page.locator('.modal-content').waitFor({ state: 'hidden' });

      // Wait for grid to update
      await expect(commonElements.toastMessage.first()).toContainText('Success');

      // Wait for toast to disappear to ensure action is complete
      await commonElements.toastMessage.first().waitFor({ state: 'hidden' });

      // Wait for the priority cell to update and show empty value
      await expect(priorityCell).toHaveText('');

      // Re-read the initial priority after cleanup to ensure we have the correct cleared value
      initialPriority = await priorityCell.innerText();

      // Re-select the checkbox for the actual test (ensure it is checked rather than toggled)
      await firstCheckbox.check();
    }

    // Click change priority button using the correct page object method
    await expect(processDefinitionsPage.changeJobPriorityButton).toBeEnabled();
    await processDefinitionsPage.changeJobPriorityButton.click();

    // Wait for modal to appear
    await page.locator('.modal-content').waitFor({ state: 'visible' });

    // Check if "Set Overriding Job Priority" radio button exists and click it if present
    const setJobPriorityRadio = page.locator('label:has-text("Set Overriding Job Priority") input[type="radio"]');
    const radioCount = await setJobPriorityRadio.count();
    if (radioCount > 0) {
      await setJobPriorityRadio.click();
      // Wait for dynamic content to appear
    }

    // Wait for and enter priority value
    const priorityInput = page
      .locator('input[name="Priority"], input.number-input[type="number"], input.retry-input[type="number"]')
      .first();
    await priorityInput.waitFor({ state: 'visible' });
    await priorityInput.fill('15');

    // Click confirm
    await page.getByRole('button', { name: 'Change' }).click();

    // Wait for modal to close
    await page.locator('.modal-content').waitFor({ state: 'hidden' });

    // Verify success toast
    await expect(commonElements.toastMessage.first()).toContainText('Success');

    // Wait for grid to update and verify the priority changed
    await expect(priorityCell).toHaveText('15');

    // Cleanup: Clear the overriding job priority to restore original state
    await firstCheckbox.click();
    await expect(processDefinitionsPage.changeJobPriorityButton).toBeEnabled();
    await processDefinitionsPage.changeJobPriorityButton.click();

    // Wait for modal to appear
    await page.locator('.modal-content').waitFor({ state: 'visible' });

    // Select "Clear Overriding Job Priority" radio button if it exists
    const clearJobPriorityRadio = page.locator('label:has-text("Clear Overriding Job Priority") input[type="radio"]');
    const clearRadioCount = await clearJobPriorityRadio.count();
    if (clearRadioCount > 0) {
      await clearJobPriorityRadio.click();
    }

    // Click confirm
    await page.getByRole('button', { name: 'Change' }).click();

    // Wait for modal to close
    await page.locator('.modal-content').waitFor({ state: 'hidden' });

    // Wait for success toast to confirm the action completed
    await expect(commonElements.toastMessage.first()).toContainText('Success');

    // Wait for grid to update and verify priority was cleared
    await expect(priorityCell).toHaveText('');
  });

  test('should enable buttons only when job definitions are selected', async ({ page }) => {
    // Navigate to Job Definitions tab
    await tabs.jobDefinitions.click();
    await expect(commonElements.grid).toBeVisible();

    // Verify buttons are not visible when nothing is selected
    await expect(processDefinitionsPage.activateJobDefinitionButton).not.toBeVisible();
    await expect(processDefinitionsPage.suspendJobDefinitionButton).not.toBeVisible();

    // Select a row
    const firstCheckbox = page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]');
    await expect(firstCheckbox).toBeVisible();
    await firstCheckbox.click();

    // Get the suspended state to know which button should be enabled
    const firstRow = page.locator('.ag-row[row-id="0"]');
    const suspendedCell = firstRow.locator('.ag-cell[col-id="suspended"]');
    const suspendedText = await suspendedCell.innerText();
    const isSuspended = suspendedText.trim() === 'true';

    // Only one button should be enabled based on the current suspended state
    if (isSuspended) {
      // If suspended, only activate button should be enabled
      await expect(processDefinitionsPage.activateJobDefinitionButton).toBeEnabled();
      await expect(processDefinitionsPage.suspendJobDefinitionButton).toBeDisabled();
    } else {
      // If active, only suspend button should be enabled
      await expect(processDefinitionsPage.suspendJobDefinitionButton).toBeEnabled();
      await expect(processDefinitionsPage.activateJobDefinitionButton).toBeDisabled();
    }
  });

  test('should perform bulk actions on multiple selected job definitions', async ({ page }) => {
    // Navigate to Job Definitions tab
    await tabs.jobDefinitions.click();
    await expect(commonElements.grid).toBeVisible();

    // Select multiple rows
    const firstCheckbox = page.locator('.ag-row[row-id="0"] .ag-selection-checkbox input[type="checkbox"]');
    const secondCheckbox = page.locator('.ag-row[row-id="1"] .ag-selection-checkbox input[type="checkbox"]');

    // Ensure both checkboxes exist
    await expect(firstCheckbox).toBeVisible();
    await expect(secondCheckbox).toBeVisible();

    // Get the suspended cells to verify state changes
    const firstRow = page.locator('.ag-row[row-id="0"]');
    const secondRow = page.locator('.ag-row[row-id="1"]');
    const firstSuspendedCell = firstRow.locator('.ag-cell[col-id="suspended"]');
    const secondSuspendedCell = secondRow.locator('.ag-cell[col-id="suspended"]');

    await firstCheckbox.click();
    await secondCheckbox.click();

    // Check if the job definitions need to be activated first
    const firstSuspended = (await firstSuspendedCell.innerText()).trim() === 'true';
    const secondSuspended = (await secondSuspendedCell.innerText()).trim() === 'true';

    // If both are suspended, activate them first
    if (firstSuspended && secondSuspended) {
      await expect(processDefinitionsPage.activateJobDefinitionButton).toBeEnabled();
      await processDefinitionsPage.activateJobDefinitionButton.click();

      // Click confirm activation
      await page.getByRole('button', { name: 'Activate' }).click();

      // Wait and verify both are now active
      await expect(firstSuspendedCell).toHaveText('false');
      await expect(secondSuspendedCell).toHaveText('false');

      // Re-select both checkboxes
      await firstCheckbox.click();
      await secondCheckbox.click();
    }

    // Now suspend both job definitions
    await expect(processDefinitionsPage.suspendJobDefinitionButton).toBeEnabled();
    await processDefinitionsPage.suspendJobDefinitionButton.click();

    // Click Confirm suspension
    await page.getByRole('button', { name: 'Suspend' }).click();

    // Verify bulk action success with toast
    await expect(commonElements.toastMessage.first()).toContainText('Success');

    // Wait for grid to update and verify both are now suspended
    await expect(firstSuspendedCell).toHaveText('true');
    await expect(secondSuspendedCell).toHaveText('true');

    // Cleanup: Reactivate both job definitions to restore them to active state
    await firstCheckbox.click();
    await secondCheckbox.click();

    await expect(processDefinitionsPage.activateJobDefinitionButton).toBeEnabled();
    await processDefinitionsPage.activateJobDefinitionButton.click();

    // Click Confirm activation
    await page.getByRole('button', { name: 'Activate' }).click();

    // Verify both job definitions are now active
    await expect(firstSuspendedCell).toHaveText('false');
    await expect(secondSuspendedCell).toHaveText('false');
  });
});
