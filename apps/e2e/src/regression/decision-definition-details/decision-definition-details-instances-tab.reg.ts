import { expect, test } from '@playwright/test';
import { DecisionDefinitionDetailsPage } from '../../page-objects/decision-definition-details-page.po';
import { CommonElements } from '../../page-objects/common-elements.po';

/**
 * @group regression
 * @group decision-definition
 * @group decision-definition-details
 * @group decision-definition-details-instances-tab
 */

let decisionDefinitionPage: DecisionDefinitionDetailsPage;
let commonElements: CommonElements;

test.describe('Decision Definition Details - Decision Instances Tab', () => {
  const decisionDefinitionKey = 'fluxnova_automation_beverage_dmn_simple';

  test.beforeEach(async ({ page }) => {
    decisionDefinitionPage = new DecisionDefinitionDetailsPage(page);
    commonElements = new CommonElements(page);
    await decisionDefinitionPage.navigateToDefinitionDetailsPage(decisionDefinitionKey);
    // Wait for the left panel to be visible before running tests
    await expect(commonElements.leftPanel).toBeVisible();

    // Navigate to the decision instances tab
    const decisionInstancesTab = page.locator('fluxnova-decision-instance-list');
    await expect(decisionInstancesTab).toBeVisible();
    await page.waitForFunction(() => {
      const agRoot = document.querySelector('.ag-root');
      const rowCount = agRoot?.getAttribute('aria-rowcount');
      return rowCount && parseInt(rowCount, 10) > 2;
    });
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('should display all default column headers', async () => {
    const grid = commonElements.grid;
    await expect(grid).toContainText('ID');
    await expect(grid).toContainText('Evaluation Time');
    await expect(grid).toContainText('Activity ID');
    await expect(grid).toContainText('Calling Instance ID');
    await expect(grid).toContainText('Process Definition ID');
    await expect(grid).toContainText('Process Definition Key');
  });

  test('should filter by id', async ({ page }) => {
    const firstDecisionInstance = page.locator('.ag-pinned-left-cols-container').first().locator('.ag-row').first();
    const instanceId = (await firstDecisionInstance.locator('div[col-id="id"]').textContent()) ?? '';

    await page.fill('input#id', instanceId);
    await page.locator('ng-dropdown-panel').click();
    await expect(firstDecisionInstance).toContainText(instanceId);
    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(1);
    await expect(page.locator('li[data-tab="decision-instances"]').locator('div')).toContainText('(1)');

    await page.locator('ng-dropdown-panel').click();

    await page.waitForTimeout(500);

    await page.fill('input#id', 'fake-id');
    await page.locator('ng-dropdown-panel').click();
    await expect(firstDecisionInstance).toHaveCount(0);
    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(0);
    await expect(page.locator('li[data-tab="decision-instances"]').locator('div')).toContainText('(0)');
  });

  test('should filter by activity id', async ({ page }) => {
    const firstDecisionInstance = page.locator('.ag-center-cols-container').first().locator('.ag-row').first();
    const activityId = (await firstDecisionInstance.locator('div[col-id="activityId"]').textContent()) ?? '';

    await page.fill('input#activityId', activityId);

    await expect(firstDecisionInstance).toContainText(activityId);

    // Verify grid has updated
    await expect(page.locator('.ag-root')).toHaveAttribute('aria-rowcount', /.+/);

    await page.fill('input#activityId', '');

    await page.fill('input#activityId', 'fake_activity_id');

    await expect(firstDecisionInstance).toHaveCount(0);
    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(0);
    await expect(page.locator('li[data-tab="decision-instances"]').locator('div')).toContainText('(0)');

    // Cleanup: Clear the filter
    await page.fill('input#activityId', '');
  });

  test('should sort by evaluation time', async ({ page }) => {
    const evaluationTimeColumnHeader = page.locator('div[role="columnheader"]', { hasText: 'Evaluation Time' });

    // Initial sort should be descending (most recent first)
    await expect(evaluationTimeColumnHeader).toHaveAttribute('aria-sort', 'descending');

    // Click to change to ascending
    await evaluationTimeColumnHeader.click();
    await expect(evaluationTimeColumnHeader).toHaveAttribute('aria-sort', 'none');

    // Click to remove sort
    await evaluationTimeColumnHeader.click();
    await expect(evaluationTimeColumnHeader).toHaveAttribute('aria-sort', 'ascending');

    // Click to go back to descending
    await evaluationTimeColumnHeader.click();
    await expect(evaluationTimeColumnHeader).toHaveAttribute('aria-sort', 'descending');
  });

  test('should allow moving unpinned columns', async ({ page }) => {
    const evaluationTimeColumnHeader = page.locator('div[role="columnheader"]', { hasText: 'Evaluation Time' });
    const activityIdColumnHeader = page.locator('div[role="columnheader"]', { hasText: 'Activity ID' });

    await expect(evaluationTimeColumnHeader).toHaveAttribute('aria-colindex', '2');
    await expect(activityIdColumnHeader).toHaveAttribute('aria-colindex', '3');

    await evaluationTimeColumnHeader.dragTo(activityIdColumnHeader);

    await expect(evaluationTimeColumnHeader).toHaveAttribute('aria-colindex', '3');
    await expect(activityIdColumnHeader).toHaveAttribute('aria-colindex', '2');

    // Cleanup: Reset the grid
    const resetViewButton = page.getByRole('button', { name: 'Reset Grid' });
    await expect(resetViewButton).toBeVisible();
    await resetViewButton.click();
    await expect(resetViewButton).toBeHidden();
  });

  test('should not allow moving pinned left column', async ({ page }) => {
    const pinnedIdColumnHeader = page.locator('div[role="columnheader"]', { hasText: 'ID' }).first();
    const evaluationTimeColumnHeader = page.locator('div[role="columnheader"]', { hasText: 'Evaluation Time' });

    await expect(pinnedIdColumnHeader).toHaveAttribute('aria-colindex', '1');
    await expect(evaluationTimeColumnHeader).toHaveAttribute('aria-colindex', '2');

    await pinnedIdColumnHeader.dragTo(evaluationTimeColumnHeader);

    await expect(pinnedIdColumnHeader).toHaveAttribute('aria-colindex', '1');
    await expect(evaluationTimeColumnHeader).toHaveAttribute('aria-colindex', '2');
  });

  test('should allow adjusting column width', async ({ page }) => {
    const evaluationTimeColumnHeader = page.locator('div[role="columnheader"]', { hasText: 'Evaluation Time' });
    const initialWidth = await evaluationTimeColumnHeader.boundingBox();

    // Get the resize handle (right edge of the column header)
    const resizeHandle = evaluationTimeColumnHeader.locator('.ag-header-cell-resize');

    // Drag to increase width
    await resizeHandle.hover();
    await page.mouse.down();
    await page.mouse.move((initialWidth?.x ?? 0) + (initialWidth?.width ?? 0) + 100, initialWidth?.y ?? 0);
    await page.mouse.up();

    const newWidth = await evaluationTimeColumnHeader.boundingBox();
    expect(newWidth?.width).toBeGreaterThan(initialWidth?.width ?? 0);

    // Cleanup: Reset the grid
    const resetViewButton = page.getByRole('button', { name: 'Reset Grid' });
    await expect(resetViewButton).toBeVisible();
    await resetViewButton.click();
    await expect(resetViewButton).toBeHidden();
  });

  test('should reset grid after adjusting sorting, filters, and columns', async ({ page }) => {
    const resetViewButton = page.getByRole('button', { name: 'Reset Grid' });
    const activityIdColumnHeader = page.locator('div[role="columnheader"]', { hasText: 'Activity ID' });

    // Initially, reset button should be hidden
    await expect(resetViewButton).toBeHidden();

    // Move columns
    const evaluationTimeColumnHeader = page.locator('div[role="columnheader"]', { hasText: 'Evaluation Time' });
    await expect(evaluationTimeColumnHeader).toHaveAttribute('aria-colindex', '2');
    await expect(activityIdColumnHeader).toHaveAttribute('aria-colindex', '3');

    await evaluationTimeColumnHeader.dragTo(activityIdColumnHeader);
    await page.waitForTimeout(300);
    await expect(resetViewButton).toBeVisible();

    // Reset
    await resetViewButton.click();
    await expect(resetViewButton).toBeHidden();
    await expect(evaluationTimeColumnHeader).toHaveAttribute('aria-colindex', '2');
    await expect(activityIdColumnHeader).toHaveAttribute('aria-colindex', '3');
  });

  test('should have valid link to decision instance details', async ({ page }) => {
    const firstDecisionInstanceLink = page
      .locator('.ag-pinned-left-cols-container')
      .first()
      .locator('.ag-row')
      .first()
      .locator('fluxnova-link-cell a');
    const instanceId = (await firstDecisionInstanceLink.textContent()) ?? '';

    await firstDecisionInstanceLink.click();

    // Wait for navigation to decision instance details page
    await page.waitForURL(/.*decision-definitions\/.*\/instances\/.*/);

    // Verify we're on the decision instance details page
    await expect(page.locator('fluxnova-decision-instance-details-page')).toBeVisible();
    await expect(page.url()).toContain(instanceId);
  });

  test('should have valid link to calling process instance', async ({ page }) => {
    const firstRow = page.locator('.ag-center-cols-container').first().locator('.ag-row').first();
    const callingInstanceIdCell = firstRow.locator('div[col-id="rootProcessInstanceId"]');

    // Check if there's a link (some decision instances may not have a calling instance)
    const linkElement = callingInstanceIdCell.locator('fluxnova-link-cell a');
    const linkCount = await linkElement.count();

    if (linkCount > 0) {
      const callingInstanceId = (await linkElement.textContent()) ?? '';

      await linkElement.click();

      // Wait for navigation to process instance details page
      await page.waitForURL(/.*process-instances\/.*/);

      // Verify we're on the process instance details page
      await expect(page.locator('fluxnova-process-instance-details-page')).toBeVisible();
      await expect(page.url()).toContain(callingInstanceId);
    } else {
      // If no link, just verify the cell exists
      const grid = commonElements.grid;
      await expect(grid).toContainText('Calling Instance ID');
    }
  });
});
