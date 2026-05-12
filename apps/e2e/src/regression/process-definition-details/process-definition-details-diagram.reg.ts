import { expect, test } from '@playwright/test';
import {
  getProcessDefinitionId,
  parseTransformMatrix,
  startProcessInstance,
  terminateProcessInstance,
} from '../../utils/test-utils';
import { ProcessDefinitionsPage } from '../../page-objects/process-definitions-page.po';
import { CommonElements, ProcessDefinitionTabs } from '../../page-objects/common-elements.po';

let processDefinitionsPage: ProcessDefinitionsPage;
let commonElements: CommonElements;
let tabs: ProcessDefinitionTabs;

test.describe('Process Definition Detail Diagram Section', () => {
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
    processDefinitionsPage = new ProcessDefinitionsPage(page);
    commonElements = new CommonElements(page);
    tabs = new ProcessDefinitionTabs(page);
    await processDefinitionsPage.navigateToDefinitionDetailsPage('fluxnova_automation_basic');
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

    test('should display heat map button and menu upon click', async ({ page }) => {
      await expect(commonElements.heatMapButton).toBeVisible();
      await commonElements.heatMapButton.click();
      await expect(commonElements.heatMapSettingsButton).toBeVisible();
      await commonElements.heatMapSettingsButton.click();
      await expect(page.locator('div').filter({ hasText: 'Time Spent' }).first()).toBeVisible();
      await expect(page.locator('div').filter({ hasText: 'Past month' }).first()).toBeVisible();
      await expect(commonElements.heatMapUpdateButton).toBeVisible();
      await expect(commonElements.heatMapSettingsButton).toBeVisible();
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

    test('should highlight diagram shape when job definition is selected in job definitions tab', async ({ page }) => {
      // Navigate to the job definitions tab using the tabs object
      await tabs.jobDefinitions.click();
      await processDefinitionsPage.waitForLoad();

      const jobDefinitionsTab = page.locator('fluxnova-job-definitions-tab');
      await expect(jobDefinitionsTab).toBeVisible();

      // Wait for job definitions grid to load
      await expect(commonElements.grid).toBeVisible();
      const rowCount = await page.locator('.ag-center-cols-viewport .ag-row').count();

      // Only proceed if there are job definitions to test
      if (rowCount > 0) {
        // Get the first job definition row
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
});
