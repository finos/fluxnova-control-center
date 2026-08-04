/* eslint-disable max-lines */
import { expect, test } from '@playwright/test';
import { ProcessInstancePage } from '../../page-objects/process-instance-page.po';
import { getProcessDefinitionId, startProcessInstance, terminateProcessInstance } from '../../utils/test-utils';

/**
 * @group regression
 * @group process-instance
 * @group process-instance-details
 * @group process-instance-details-variables-tab
 */

let processInstancePage: ProcessInstancePage;

test.describe('Variables Tab', () => {
  let activeWorkingInstanceId: string;
  let finishedWorkingInstanceId: string;

  // This constant is used to wait for any memoized api calls that need to clear before that call can be made again.
  // This is useful for variables specifically because here we create and edit variables a lot in a short time span.
  // If we don't wait for the memoization to clear, we may get stale data.
  const MEMOIZED_API_CACHE_CLEAR_TIME = 2000;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const basicProcessDefinitionId = await getProcessDefinitionId('fluxnova_automation_basic', page);
    activeWorkingInstanceId = await startProcessInstance(basicProcessDefinitionId, page);
    finishedWorkingInstanceId = await startProcessInstance(basicProcessDefinitionId, page);
    await page.waitForTimeout(500); // wait for processes to stabilize
    await terminateProcessInstance(finishedWorkingInstanceId, page);
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await terminateProcessInstance(activeWorkingInstanceId, page);
  });

  test.beforeEach(async ({ page }) => {
    processInstancePage = new ProcessInstancePage(page);
    await processInstancePage.navigateToInstanceDetailsPage(activeWorkingInstanceId);
    const variablesTab = page.locator('fluxnova-variables-tab');
    await expect(variablesTab).toBeVisible();
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('should filter by name', async ({ page }) => {
    const firstRow = page.locator('.ag-pinned-left-cols-container').first().locator('.ag-row').first();
    const name = (await firstRow.locator('div[col-id="name"]').textContent()) ?? '';

    await page.fill('input#name', name);
    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(1);
    await expect(page.locator('li[data-tab="variables"]').locator('div')).toContainText('(1)');

    await page.waitForTimeout(500);

    await page.fill('input#name', 'NOT_PRESENT_ID');
    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(0);
    await expect(page.locator('li[data-tab="variables"]').locator('div')).toContainText('(0)');
  });

  test('should allow moving unpinned columns', async ({ page }) => {
    const typeColumnHeader = page.locator('div[role="columnheader"]', { hasText: 'Type' });
    const valueColumnHeader = page.locator('div[role="columnheader"]', { hasText: 'Value' });

    await expect(typeColumnHeader).toHaveAttribute('aria-colindex', '2');
    await expect(valueColumnHeader).toHaveAttribute('aria-colindex', '3');

    await typeColumnHeader.dragTo(valueColumnHeader);

    await expect(typeColumnHeader).toHaveAttribute('aria-colindex', '3');
    await expect(valueColumnHeader).toHaveAttribute('aria-colindex', '2');
  });

  test('should not allow moving pinned left column', async ({ page }) => {
    const pinnedNameColumnHeader = page.locator('div[role="columnheader"]', { hasText: 'Name' });
    const typeColumnHeader = page.locator('div[role="columnheader"]', { hasText: 'Type' });

    await expect(pinnedNameColumnHeader).toHaveAttribute('aria-colindex', '1');
    await expect(typeColumnHeader).toHaveAttribute('aria-colindex', '2');

    await pinnedNameColumnHeader.dragTo(typeColumnHeader);

    await expect(pinnedNameColumnHeader).toHaveAttribute('aria-colindex', '1');
    await expect(typeColumnHeader).toHaveAttribute('aria-colindex', '2');
  });

  test.describe('Unfinished Process', () => {
    test('should allow editing string variables', async ({ page }) => {
      const variableModal = page.locator('fluxnova-process-variable-modal');
      await expect(variableModal).toBeHidden();
      const firstStringVarRowIndex = await page
        .locator('.ag-center-cols-container')
        .first()
        .locator('.ag-row', { hasText: 'String' })
        .first()
        .getAttribute('row-index');
      const firstStringVarPinnedRightSection = page
        .locator('.ag-pinned-right-cols-container')
        .first()
        .locator(`.ag-row[row-index="${firstStringVarRowIndex}"]`)
        .first();
      await expect(firstStringVarPinnedRightSection.locator('.edit-variable-button')).toBeHidden();
      await firstStringVarPinnedRightSection.hover();
      await expect(firstStringVarPinnedRightSection.locator('.edit-variable-button')).toBeVisible();
      await firstStringVarPinnedRightSection.locator('.edit-variable-button').click();

      await expect(variableModal).toBeVisible();
      const originalValue = await variableModal.locator('input').inputValue();
      let newValue = 'testAutomationValue';
      if (originalValue === newValue) {
        newValue = 'otherTestAutomationValue';
      }

      await variableModal.locator('input').fill(newValue);
      await variableModal.locator('button', { hasText: 'Save' }).click();

      await expect(variableModal).toBeHidden();
      await processInstancePage.waitForLoad();
      await page.reload();
      await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row').first()).toContainText(
        newValue,
      );

      await page.waitForTimeout(MEMOIZED_API_CACHE_CLEAR_TIME); // Wait for memoized call to clear before replacing original value

      await firstStringVarPinnedRightSection.hover();
      await expect(firstStringVarPinnedRightSection.locator('.edit-variable-button')).toBeVisible();
      await firstStringVarPinnedRightSection.locator('.edit-variable-button').click();
      await expect(variableModal).toBeVisible();
      await variableModal.locator('input').fill(originalValue);
      await variableModal.locator('button', { hasText: 'Save' }).click();

      await expect(variableModal).toBeHidden();

      await processInstancePage.waitForLoad();
      await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row').first()).toContainText(
        originalValue,
      );
    });

    test('should allow creating/deleting string variables', async ({ page }) => {
      await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row').first()).toBeVisible();
      const originalCount = await page.locator('.ag-center-cols-container').first().locator('.ag-row').count();

      const variableModal = page.locator('fluxnova-process-variable-modal');
      await expect(variableModal).toBeHidden();
      await page.locator('.add-variable-button').click();

      await expect(variableModal).toBeVisible();
      await variableModal.locator('input[name="name"]').fill('FLUXNOVA_AUTOMATION_TESTING');
      await variableModal.locator('input[name="value"]').fill('I was created by automated testing');
      await page.waitForTimeout(MEMOIZED_API_CACHE_CLEAR_TIME); // Wait for memoized call to clear
      await variableModal.locator('button', { hasText: 'Save' }).click();

      await expect(variableModal).toBeHidden();
      await processInstancePage.waitForLoad();
      await page.reload();
      await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row').last()).toContainText(
        'I was created by automated testing',
      );
      await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(originalCount + 1);

      await page.waitForTimeout(MEMOIZED_API_CACHE_CLEAR_TIME); // Wait for memoized call to clear before replacing original value

      const firstStringVarRowIndex = await page
        .locator('.ag-center-cols-container')
        .first()
        .locator('.ag-row', { hasText: 'String' })
        .last()
        .getAttribute('row-index');
      const newVariablePinnedRightSection = page
        .locator('.ag-pinned-right-cols-container')
        .first()
        .locator(`.ag-row[row-index="${firstStringVarRowIndex}"]`)
        .first();
      await newVariablePinnedRightSection.hover();
      await expect(newVariablePinnedRightSection.locator('.delete-variable-button')).toBeVisible();
      await newVariablePinnedRightSection.locator('.delete-variable-button').click();
      await expect(page.locator('fluxnova-process-variable-modal')).toBeVisible();
      await variableModal.locator('button', { hasText: 'Delete' }).click();

      await expect(variableModal).toBeHidden();
      await processInstancePage.waitForLoad();
      await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row').last()).not.toContainText(
        'I was created by automated testing',
      );
      await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(originalCount);
    });

    test('should allow creating/editing/deleting XML Variables', async ({ page }) => {
      await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row').first()).toBeVisible();

      const variableModal = page.locator('fluxnova-process-variable-modal');
      const originalNumVariables = await page.locator('.ag-center-cols-container').first().locator('.ag-row').count();
      await expect(variableModal).toBeHidden();
      await page.locator('.add-variable-button').click();

      await expect(variableModal).toBeVisible();
      await variableModal.locator('#type').selectOption('Xml');
      await variableModal.locator('input[name="name"]').fill('FLUXNOVA_AUTOMATION_TESTING_XML');
      await variableModal
        .locator('textarea[name="value"]')
        .fill('<note><to>User</to><from>Automation</from><body>Hello XML</body></note>');
      await expect(variableModal.locator('textarea.error')).toHaveCount(0);
      await page.waitForTimeout(MEMOIZED_API_CACHE_CLEAR_TIME); // Wait for memoized call to clear
      await variableModal.locator('button', { hasText: 'Save' }).click();

      await processInstancePage.waitForLoad();
      await expect(variableModal).toBeHidden();
      const firstXmlVarRowIndex = await page
        .locator('.ag-center-cols-container')
        .first()
        .locator('.ag-row', { hasText: 'Xml' })
        .first()
        .getAttribute('row-index');
      await expect(
        page
          .locator('.ag-center-cols-container')
          .first()
          .locator(`.ag-row[row-index="${firstXmlVarRowIndex}"]`)
          .first(),
      ).toContainText('Xml');
      await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(
        originalNumVariables + 1,
      );

      await page.waitForTimeout(MEMOIZED_API_CACHE_CLEAR_TIME); // Wait for memoized call to clear before doing editing

      const firstXmlVarPinnedRightSection = page
        .locator('.ag-pinned-right-cols-container')
        .first()
        .locator(`.ag-row[row-index="${firstXmlVarRowIndex}"]`)
        .first();

      await expect(firstXmlVarPinnedRightSection.locator('.edit-variable-button')).toBeHidden();
      await firstXmlVarPinnedRightSection.hover();
      await expect(firstXmlVarPinnedRightSection.locator('.edit-variable-button')).toBeVisible();
      await firstXmlVarPinnedRightSection.locator('.edit-variable-button').click();

      await expect(variableModal).toBeVisible();
      await variableModal.locator('textarea').fill('not valid xml');
      await expect(variableModal.locator('textarea.error')).toHaveCount(1);
      await variableModal
        .locator('textarea')
        .fill('<note><to>User</to><from>Automation</from><body>Hello XML Updated</body></note>');
      await expect(variableModal.locator('textarea.error')).toHaveCount(0);
      await variableModal.locator('button', { hasText: 'Save' }).click();

      await processInstancePage.waitForLoad();
      await expect(variableModal).toBeHidden();
      await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row').last()).toContainText(
        'Updated',
      );

      await page.waitForTimeout(MEMOIZED_API_CACHE_CLEAR_TIME); // Wait for memoized call to clear before deleting

      await firstXmlVarPinnedRightSection.hover();
      await expect(firstXmlVarPinnedRightSection.locator('.delete-variable-button')).toBeVisible();
      await firstXmlVarPinnedRightSection.locator('.delete-variable-button').click();
      await expect(page.locator('fluxnova-process-variable-modal')).toBeVisible();
      await variableModal.locator('button', { hasText: 'Delete' }).click();

      await processInstancePage.waitForLoad();
      await expect(variableModal).toBeHidden();
      await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(
        originalNumVariables,
      );
    });

    test('should allow creating/editing/deleting JSON Variables', async ({ page }) => {
      // Wait for grid to be visible and populated with actual data before capturing count
      await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row').first()).toBeVisible();

      // Wait for the variables tab to show a count > 0 to ensure grid is populated
      await expect(page.locator('li[data-tab="variables"]').locator('div')).not.toContainText('(0)');

      const originalVariableCount = await page.locator('.ag-center-cols-container').first().locator('.ag-row').count();

      const variableModal = page.locator('fluxnova-process-variable-modal');
      await expect(variableModal).toBeHidden();
      await page.locator('.add-variable-button').click();

      await expect(variableModal).toBeVisible();
      await variableModal.locator('#type').selectOption('Json');
      await variableModal.locator('input[name="name"]').fill('FLUXNOVA_AUTOMATION_TESTING_JSON');
      await variableModal.locator('textarea[name="value"]').fill('not valid json');
      await expect(variableModal.locator('textarea.error')).toHaveCount(1);
      await variableModal.locator('textarea[name="value"]').fill('{"key": "value", "key2": "value2"}');
      await expect(variableModal.locator('textarea.error')).toHaveCount(0);
      await page.waitForTimeout(MEMOIZED_API_CACHE_CLEAR_TIME); // Wait for memoized call to clear
      await variableModal.locator('button', { hasText: 'Save' }).click();

      await processInstancePage.waitForLoad();
      await expect(variableModal).toBeHidden();
      const firstJsonVarRowIndex = await page
        .locator('.ag-center-cols-container')
        .first()
        .locator('.ag-row', { hasText: 'Json' })
        .first()
        .getAttribute('row-index');
      await expect(
        page
          .locator('.ag-center-cols-container')
          .first()
          .locator(`.ag-row[row-index="${firstJsonVarRowIndex}"]`)
          .first(),
      ).toContainText('Json');
      await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(
        originalVariableCount + 1,
      );

      await page.waitForTimeout(MEMOIZED_API_CACHE_CLEAR_TIME); // Wait for memoized call to clear before doing editing

      const firstJsonVarPinnedRightSection = page
        .locator('.ag-pinned-right-cols-container')
        .first()
        .locator(`.ag-row[row-index="${firstJsonVarRowIndex}"]`)
        .first();

      await expect(firstJsonVarPinnedRightSection.locator('.edit-variable-button')).toBeHidden();
      await firstJsonVarPinnedRightSection.hover();
      await expect(firstJsonVarPinnedRightSection.locator('.edit-variable-button')).toBeVisible();
      await firstJsonVarPinnedRightSection.locator('.edit-variable-button').click();

      await expect(variableModal).toBeVisible();
      await variableModal.locator('textarea').fill('{"key": "value", "key2": "value2", "key3": "value3"}');
      await expect(variableModal.locator('textarea.error')).toHaveCount(0);
      await variableModal.locator('button', { hasText: 'Save' }).click();

      await processInstancePage.waitForLoad();
      await expect(variableModal).toBeHidden();
      await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row').last()).toContainText('value3');

      await page.waitForTimeout(MEMOIZED_API_CACHE_CLEAR_TIME); // Wait for memoized call to clear before deleting

      await firstJsonVarPinnedRightSection.hover();
      await expect(firstJsonVarPinnedRightSection.locator('.delete-variable-button')).toBeVisible();
      await firstJsonVarPinnedRightSection.locator('.delete-variable-button').click();
      await expect(page.locator('fluxnova-process-variable-modal')).toBeVisible();
      await variableModal.locator('button', { hasText: 'Delete' }).click();

      await processInstancePage.waitForLoad();
      await expect(variableModal).toBeHidden();
      await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(
        originalVariableCount,
      );
    });

    test('should allow creating/editing/deleting Date Variables', async ({ page }) => {
      await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row').first()).toBeVisible();

      const variableModal = page.locator('fluxnova-process-variable-modal');
      await expect(variableModal).toBeHidden();
      await page.locator('.add-variable-button').click();

      const startingVariableCount = await page.locator('.ag-center-cols-container').first().locator('.ag-row').count();

      await expect(variableModal).toBeVisible();
      await variableModal.locator('#type').selectOption('Date');
      await variableModal.locator('input[name="name"]').fill('FLUXNOVA_AUTOMATION_TESTING_DATE');
      await variableModal.locator('input[placeholder="YYYY-MM-DD HH:MM:SS"]').fill('2023-11-14 08:32:17');
      await page.waitForTimeout(MEMOIZED_API_CACHE_CLEAR_TIME); // Date input has debounce
      await variableModal.locator('button', { hasText: 'Save' }).click();

      await processInstancePage.waitForLoad();
      await expect(variableModal).toBeHidden();
      const firstDateVarRowIndex = await page
        .locator('.ag-center-cols-container')
        .first()
        .locator('.ag-row', { hasText: 'Date' })
        .first()
        .getAttribute('row-index');
      await expect(
        page
          .locator('.ag-center-cols-container')
          .first()
          .locator(`.ag-row[row-index="${firstDateVarRowIndex}"]`)
          .first(),
      ).toContainText('Date');
      await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(
        startingVariableCount + 1,
      );

      await page.waitForTimeout(MEMOIZED_API_CACHE_CLEAR_TIME); // Wait for memoized call to clear before doing editing

      const firstDateVarPinnedRightSection = page
        .locator('.ag-pinned-right-cols-container')
        .first()
        .locator(`.ag-row[row-index="${firstDateVarRowIndex}"]`)
        .first();

      await expect(firstDateVarPinnedRightSection.locator('.edit-variable-button')).toBeHidden();
      await firstDateVarPinnedRightSection.hover();
      await expect(firstDateVarPinnedRightSection.locator('.edit-variable-button')).toBeVisible();
      await firstDateVarPinnedRightSection.locator('.edit-variable-button').click();

      await expect(variableModal).toBeVisible();
      await variableModal.locator('input[placeholder="YYYY-MM-DD HH:MM:SS"]').fill('2025-11-14 08:32:17');
      await page.waitForTimeout(1200); // Date input has debounce
      await variableModal.locator('button', { hasText: 'Save' }).click();

      await processInstancePage.waitForLoad();
      await expect(variableModal).toBeHidden();
      await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row').last()).toContainText(
        '2025-11-14 08:32:17',
      );

      await page.waitForTimeout(MEMOIZED_API_CACHE_CLEAR_TIME); // Wait for memoized call to clear before deleting

      await firstDateVarPinnedRightSection.hover();
      await expect(firstDateVarPinnedRightSection.locator('.delete-variable-button')).toBeVisible();
      await firstDateVarPinnedRightSection.locator('.delete-variable-button').click();
      await expect(page.locator('fluxnova-process-variable-modal')).toBeVisible();
      await variableModal.locator('button', { hasText: 'Delete' }).click();

      await processInstancePage.waitForLoad();
      await expect(variableModal).toBeHidden();
      await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(
        startingVariableCount,
      );
    });

    test('should allow creating/editing/deleting Object Variables', async ({ page }) => {
      // Wait for grid to be visible and populated with actual data before capturing count
      await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row').first()).toBeVisible();

      // Wait for the variables tab to show a count > 0 to ensure grid is populated
      await expect(page.locator('li[data-tab="variables"]').locator('div')).not.toContainText('(0)');

      const originalVariableCount = await page.locator('.ag-center-cols-container').first().locator('.ag-row').count();

      const variableModal = page.locator('fluxnova-process-variable-modal');
      await expect(variableModal).toBeHidden();
      await page.locator('.add-variable-button').click();

      await expect(variableModal).toBeVisible();
      await variableModal.locator('#type').selectOption('Object');
      await variableModal.locator('input[name="name"]').fill('FLUXNOVA_AUTOMATION_TESTING_OBJECT');
      await variableModal.locator('input[name="objectTypeName"]').fill('String');
      await variableModal.locator('input[name="serializationDataFormat"]').fill('application/json');
      await variableModal
        .locator('textarea[name="value"]')
        .fill('{"objectKey": "objectValue", "nestedObject": {"key": "value"}}');
      await page.waitForTimeout(MEMOIZED_API_CACHE_CLEAR_TIME); // Wait for memoized call to clear
      await variableModal.locator('button', { hasText: 'Save' }).click();

      await processInstancePage.waitForLoad();
      await expect(variableModal).toBeHidden();

      // Reload to ensure the new variable appears in the grid
      await page.reload();
      await processInstancePage.waitForLoad();

      // Wait for the grid to be populated with rows
      await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(
        originalVariableCount + 1,
      );

      // Find the row by searching in the pinned left name column
      const objectVarNameCell = page
        .locator('.ag-pinned-left-cols-container')
        .first()
        .locator('.ag-row')
        .locator('div[col-id="name"]')
        .filter({ hasText: 'FLUXNOVA_AUTOMATION_TESTING_OBJECT' })
        .first();

      await expect(objectVarNameCell).toBeVisible();

      // Get the row index from the parent row element
      const objectVarRow = objectVarNameCell.locator('xpath=ancestor::div[@role="row"]');
      const firstObjectVarRowIndex = await objectVarRow.getAttribute('row-index');

      await page.waitForTimeout(MEMOIZED_API_CACHE_CLEAR_TIME); // Wait for memoized call to clear before doing editing

      const firstObjectVarPinnedRightSection = page
        .locator('.ag-pinned-right-cols-container')
        .first()
        .locator(`.ag-row[row-index="${firstObjectVarRowIndex}"]`)
        .first();

      await expect(firstObjectVarPinnedRightSection.locator('.edit-variable-button')).toBeHidden();
      await firstObjectVarPinnedRightSection.hover();
      await expect(firstObjectVarPinnedRightSection.locator('.edit-variable-button')).toBeVisible();
      await firstObjectVarPinnedRightSection.locator('.edit-variable-button').click();

      await expect(variableModal).toBeVisible();
      await variableModal
        .locator('textarea')
        .fill('{"objectKey": "updatedValue", "nestedObject": {"key": "updatedNestedValue"}, "newKey": "newValue"}');
      await expect(variableModal.locator('textarea.error')).toHaveCount(0);
      await variableModal.locator('button', { hasText: 'Save' }).click();

      await processInstancePage.waitForLoad();
      await expect(variableModal).toBeHidden();
      await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row').last()).toContainText(
        'updatedValue',
      );

      await page.waitForTimeout(MEMOIZED_API_CACHE_CLEAR_TIME); // Wait for memoized call to clear before deleting

      await firstObjectVarPinnedRightSection.hover();
      await expect(firstObjectVarPinnedRightSection.locator('.delete-variable-button')).toBeVisible();
      await firstObjectVarPinnedRightSection.locator('.delete-variable-button').click();
      await expect(page.locator('fluxnova-process-variable-modal')).toBeVisible();
      await variableModal.locator('button', { hasText: 'Delete' }).click();

      await processInstancePage.waitForLoad();
      await expect(variableModal).toBeHidden();
      await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(
        originalVariableCount,
      );
    });
  });

  test.describe('Finished Process', () => {
    test.beforeEach(async () => {
      await processInstancePage.navigateToInstanceDetailsPage(finishedWorkingInstanceId);
      await processInstancePage.waitForLoad();
    });

    test('should not allow editing/creating/deleting variables', async ({ page }) => {
      await expect(page.locator('fluxnova-add-button-floating-filter')).toHaveCount(0);
      await expect(page.locator('fluxnova-edit-controls-cell')).toHaveCount(0);
    });
  });
});
