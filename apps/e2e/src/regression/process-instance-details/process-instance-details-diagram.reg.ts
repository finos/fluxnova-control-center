import { expect, test } from '@playwright/test';
import {
  getProcessDefinitionId,
  parseTransformMatrix,
  startProcessInstance,
  terminateProcessInstance,
} from '../../utils/test-utils';
import { ProcessInstancePage } from '../../page-objects/process-instance-page.po';
import { CommonElements, ProcessInstanceTabs } from '../../page-objects/common-elements.po';

/**
 * @group regression
 * @group process-instance
 * @group process-instance-details
 * @group process-instance-details-diagram
 */

let processInstancePage: ProcessInstancePage;
let commonElements: CommonElements;
let tabs: ProcessInstanceTabs;

test.describe('Process Instance Detail Diagram Section', () => {
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
    commonElements = new CommonElements(page);
    tabs = new ProcessInstanceTabs(page);
    await processInstancePage.navigateToInstanceDetailsPage(workingInstanceId);
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('should load diagram', async ({ page }) => {
    await expect(page.locator('svg[data-element-id="fluxnova_automation_basic"]')).toBeVisible();
    await expect(page.locator('g[data-element-id="Empty_Task"]')).toBeVisible();
  });

  test.describe('Diagram Control Buttons', () => {
    test('should hide/show info panel', async () => {
      await expect(commonElements.leftPanel).toBeVisible();

      await commonElements.infoPanelToggleButton.click();

      await expect(commonElements.leftPanel).toBeHidden();

      await commonElements.infoPanelToggleButton.click();

      await expect(commonElements.leftPanel).toBeVisible();
    });

    test('should expand/shrink diagram', async () => {
      await expect(commonElements.leftPanel).toBeVisible();
      await expect(commonElements.bottomPanel).toBeVisible();

      await commonElements.expandDiagramButton.click();

      await expect(commonElements.leftPanel).toBeHidden();
      await expect(commonElements.bottomPanel).toBeHidden();

      await commonElements.expandDiagramButton.click();

      await expect(commonElements.leftPanel).toBeVisible();
      await expect(commonElements.bottomPanel).toBeVisible();
    });

    test('should hide/show tab panel', async () => {
      await expect(commonElements.bottomPanel).toBeVisible();

      await commonElements.lowerPanelButton.click();

      await expect(commonElements.bottomPanel).toBeHidden();

      await commonElements.lowerPanelButton.click();

      await expect(commonElements.bottomPanel).toBeVisible();
    });

    test('should show/hide legend', async ({ page }) => {
      await expect(commonElements.diagramLegendPanel).toBeHidden();

      await commonElements.diagramLegend.click();

      await expect(commonElements.diagramLegendPanel).toBeVisible();

      // Click the x
      const legendExitButton = commonElements.diagramLegendPanel.locator('button');
      await legendExitButton.click();

      await expect(commonElements.diagramLegendPanel).toBeHidden();

      await commonElements.diagramLegend.click();

      await expect(commonElements.diagramLegendPanel).toBeVisible();

      // Click outside legend
      const randomShape = page.locator('g[data-element-id="Empty_Task"]');
      await randomShape.click();

      await expect(commonElements.diagramLegendPanel).toBeHidden();
    });

    test('should zoom in', async () => {
      await expect(commonElements.diagramViewport).toBeVisible();

      const initialTransform = await commonElements.diagramViewport.getAttribute('transform');
      const initialXScale = parseTransformMatrix(initialTransform).scaleX;
      const initialYScale = parseTransformMatrix(initialTransform).scaleY;

      await commonElements.zoomInButton.click();

      const updatedTransform = await commonElements.diagramViewport.getAttribute('transform');
      const updatedXScale = parseTransformMatrix(updatedTransform).scaleX;
      const updatedYScale = parseTransformMatrix(updatedTransform).scaleY;

      expect(updatedXScale).toBeGreaterThan(initialXScale);
      expect(updatedYScale).toBeGreaterThan(initialYScale);
    });

    test('should zoom out', async () => {
      await expect(commonElements.diagramViewport).toBeVisible();

      const initialTransform = await commonElements.diagramViewport.getAttribute('transform');
      const initialXScale = parseTransformMatrix(initialTransform).scaleX;
      const initialYScale = parseTransformMatrix(initialTransform).scaleY;

      await commonElements.zoomOutButton.click();

      const updatedTransform = await commonElements.diagramViewport.getAttribute('transform');
      const updatedXScale = parseTransformMatrix(updatedTransform).scaleX;
      const updatedYScale = parseTransformMatrix(updatedTransform).scaleY;

      expect(updatedXScale).toBeLessThan(initialXScale);
      expect(updatedYScale).toBeLessThan(initialYScale);
    });

    test('should recenter view', async ({ page }) => {
      await expect(commonElements.diagramViewport).toBeInViewport();

      // Move the diagram out of view
      await page.evaluate(() => {
        const el = document.querySelector('.bjs-container .viewport');
        if (el) el.setAttribute('transform', 'matrix(1 0 0 1 -1000 -1000)');
      });

      await expect(commonElements.diagramViewport).not.toBeInViewport();

      await commonElements.resetZoomButton.click();

      await expect(commonElements.diagramViewport).toBeInViewport();
    });

    test('should toggle diagram flow', async ({ page }) => {
      const toggleFlowButton = page.locator('button:has(fluxnova-icon[iconname="toggle-flow"])');
      await expect(toggleFlowButton).toHaveClass(/toggled/);

      const completedGateway = page.locator('g[data-element-id="Gateway_0w1ywln"]');
      await expect(completedGateway).toHaveClass(/completedSuccess/);

      const inProgressUserTask = page.locator('g[data-element-id="Empty_Task"]');
      await expect(inProgressUserTask).toHaveClass(/inProgress/);

      await toggleFlowButton.click();

      await expect(toggleFlowButton).not.toHaveClass(/toggled/);

      await expect(completedGateway).not.toHaveClass(/completedSuccess/);

      await expect(inProgressUserTask).not.toHaveClass(/inProgress/);
    });

    test('should select diagram shape and dim other shapes', async ({ page }) => {
      // Get multiple diagram shapes
      const selectedShape = page.locator('g[data-element-id="Empty_Task"]');
      const otherShape = page.locator('g[data-element-id="Gateway_0w1ywln"]');

      // Initially, no shapes should be dimmed
      await expect(selectedShape).not.toHaveClass(/dimmed/);
      await expect(otherShape).not.toHaveClass(/dimmed/);

      // Click on a specific shape to select it
      await selectedShape.click();

      // The selected shape should NOT be dimmed
      await expect(selectedShape).not.toHaveClass(/dimmed/);

      // Verify that multiple non-selected shapes are dimmed
      const dimmedShapes = page.locator('.djs-element.dimmed');
      await expect(dimmedShapes).not.toHaveCount(0);

      // Click somewhere else on the diagram (the SVG canvas) to deselect
      const canvas = page.locator('svg[data-element-id="fluxnova_automation_basic"]');
      await canvas.click({ position: { x: 10, y: 10 } });

      // After deselection, shapes should no longer be dimmed
      await expect(selectedShape).not.toHaveClass(/dimmed/);
      await expect(otherShape).not.toHaveClass(/dimmed/);
    });

    test('should highlight diagram shape when job is selected in jobs tab', async ({ page }) => {
      // Navigate to the jobs tab using the tabs object
      await tabs.jobsTab.click();
      await processInstancePage.waitForLoad();

      const jobsTab = page.locator('fluxnova-jobs-tab');
      await expect(jobsTab).toBeVisible();

      // Wait for jobs grid to load
      await expect(commonElements.grid).toBeVisible();

      const rowCount = await page.locator('.ag-center-cols-viewport .ag-row').count();

      // Only proceed if there are jobs to test
      if (rowCount > 0) {
        // Get the first job row
        const firstJobRow = page.locator('.ag-center-cols-viewport .ag-row').first();

        // Get the activity ID cell first to capture the activity ID
        const activityIdCell = firstJobRow.locator('[col-id="activityId"]');
        await expect(activityIdCell).toBeVisible();
        const activityId = (await activityIdCell.textContent())?.trim() || '';

        expect(activityId).not.toBe('');

        // Click on the activity ID cell to trigger the row selection (this is what triggers the diagram highlight)
        await activityIdCell.click();

        // Verify the corresponding diagram shape is highlighted/selected
        const highlightedShape = page.locator(`g[data-element-id="${activityId}"]`);
        await expect(highlightedShape).toHaveClass(/selected/, { timeout: 5000 });

        // Verify the shape has the outlined appearance
        const outlineElement = highlightedShape.locator('.djs-outline');
        await expect(outlineElement).toBeVisible();

        // Click on a different row or area to deselect
        const canvas = page.locator('svg[data-element-id="fluxnova_automation_basic"]');
        await canvas.click({ position: { x: 10, y: 10 } });

        // Verify the shape is no longer selected
        await expect(highlightedShape).not.toHaveClass(/selected/);
      }
    });
  });

  test.describe('Move Tokens', () => {
    test('should activate/cancel token movement mode via button click', async ({ page }) => {
      const moveTokensButton = page.locator('#move_tokens');
      const saveChangesButton = page.locator('#save_changes');
      const cancelButton = page.locator('#cancel');

      await expect(moveTokensButton).toBeVisible();
      await expect(moveTokensButton).toBeEnabled();
      await expect(saveChangesButton).toBeHidden();
      await expect(cancelButton).toBeHidden();
      await expect(page.locator('.edit-bg-color')).toHaveCount(0);

      await moveTokensButton.click();

      await expect(page.locator('.edit-bg-color')).toHaveCount(1);
      await expect(moveTokensButton).toBeHidden();
      await expect(saveChangesButton).toBeVisible();
      await expect(saveChangesButton).toBeDisabled();
      await expect(cancelButton).toBeVisible();
      await expect(cancelButton).toBeEnabled();

      await cancelButton.click();

      await expect(moveTokensButton).toBeVisible();
      await expect(moveTokensButton).toBeEnabled();
      await expect(saveChangesButton).toBeHidden();
      await expect(cancelButton).toBeHidden();
      await expect(page.locator('.edit-bg-color')).toHaveCount(0);
    });

    test('should activate token movement mode via context menu', async ({ page }) => {
      const moveTokensButton = page.locator('#move_tokens');
      const saveChangesButton = page.locator('#save_changes');
      const cancelButton = page.locator('#cancel');
      const contextMenu = page.locator('#context-menu');

      await expect(moveTokensButton).toBeVisible();
      await expect(moveTokensButton).toBeEnabled();
      await expect(saveChangesButton).toBeHidden();
      await expect(cancelButton).toBeHidden();
      await expect(page.locator('.edit-bg-color')).toHaveCount(0);

      await expect(contextMenu).toBeHidden();
      await page.locator('g.inProgress').first().click({ button: 'right' });
      await expect(contextMenu).toBeVisible();
      await expect(contextMenu.locator('div:has-text("Remove Token")')).toBeEnabled();
      await contextMenu.locator('div:has-text("Remove Token")').click();

      await expect(page.locator('.edit-bg-color')).toHaveCount(1);
      await expect(moveTokensButton).toBeHidden();
      await expect(saveChangesButton).toBeVisible();
      await expect(saveChangesButton).toBeEnabled();
      await expect(cancelButton).toBeVisible();
      await expect(cancelButton).toBeEnabled();
    });

    test('should remove/add token', async ({ page }) => {
      const saveChangesButton = page.locator('#save_changes');
      const contextMenu = page.locator('#context-menu');
      const inProgressShapeDataId = await page.locator('g.inProgress').first().getAttribute('data-element-id');
      const removeTokenButton = contextMenu.locator('div:has-text("Remove Token")');
      const addTokenButton = contextMenu.locator('div:has-text("Add Token")');

      // Remove the token
      await expect(page.locator('.remove-token')).toHaveCount(0);
      await expect(contextMenu).toBeHidden();
      await page.locator(`g[data-element-id="${inProgressShapeDataId}"]`).click({ button: 'right' });
      await expect(contextMenu).toBeVisible();
      await expect(removeTokenButton).toBeEnabled();
      await removeTokenButton.click();
      await expect(page.locator('.remove-token')).toHaveCount(1);
      await expect(saveChangesButton).toBeEnabled();
      await saveChangesButton.click();
      await expect(page.locator('fluxnova-apply-changes-confirm-modal')).toBeVisible();
      await page.locator('fluxnova-apply-changes-confirm-modal').locator('button:has-text("Continue")').click();
      await expect(page.locator('.remove-token')).toHaveCount(0);
      await page.reload();
      await expect(page.locator(`g[data-element-id="${inProgressShapeDataId}"]`)).toBeVisible();
      await expect(page.locator(`g[data-element-id="${inProgressShapeDataId}"]`)).not.toHaveClass(/inProgress/);

      // Add it back
      await expect(page.locator('.add-token')).toHaveCount(0);
      await expect(contextMenu).toBeHidden();
      await page.locator(`g[data-element-id="${inProgressShapeDataId}"]`).click({ button: 'right' });
      await expect(contextMenu).toBeVisible();
      await expect(addTokenButton).toBeEnabled();
      await addTokenButton.click();
      await expect(page.locator('.add-token')).toHaveCount(1);
      await expect(saveChangesButton).toBeEnabled();
      await saveChangesButton.click();
      await expect(page.locator('fluxnova-apply-changes-confirm-modal')).toBeVisible();
      await page.locator('fluxnova-apply-changes-confirm-modal').locator('button:has-text("Continue")').click();
      await page.reload();
      await expect(page.locator(`g[data-element-id="${inProgressShapeDataId}"]`)).toBeVisible();
      await expect(page.locator('.add-token')).toHaveCount(0);
      await expect(page.locator(`g[data-element-id="${inProgressShapeDataId}"]`)).toHaveClass(/inProgress/);
    });

    test('should undo/redo', async ({ page }) => {
      const contextMenu = page.locator('#context-menu');
      const inProgressShapeDataId = await page.locator('g.inProgress').first().getAttribute('data-element-id');

      // Remove the token
      await expect(page.locator('.remove-token')).toHaveCount(0);
      await expect(contextMenu).toBeHidden();
      await page.locator(`g[data-element-id="${inProgressShapeDataId}"]`).click({ button: 'right' });
      await expect(contextMenu).toBeVisible();
      await expect(contextMenu.locator('div:has-text("Remove Token")')).toBeEnabled();
      await contextMenu.locator('div:has-text("Remove Token")').click();

      await expect(page.locator('.remove-token')).toHaveCount(1);
      await page.locator(`g[data-element-id="${inProgressShapeDataId}"]`).click({ button: 'right' });
      await expect(contextMenu).toBeVisible();
      await contextMenu.locator('div:has-text("Undo")').click();

      await expect(page.locator('.remove-token')).toHaveCount(0);
      await page.locator(`g[data-element-id="${inProgressShapeDataId}"]`).click({ button: 'right' });
      await expect(contextMenu).toBeVisible();
      await contextMenu.locator('div:has-text("Redo")').click();

      await expect(page.locator('.remove-token')).toHaveCount(1);
    });
  });
});
