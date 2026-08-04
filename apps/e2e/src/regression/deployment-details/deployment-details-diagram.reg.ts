import { expect, test } from '@playwright/test';
import { CommonElements } from '../../page-objects/common-elements.po';
import { DeploymentDetailsPage } from '../../page-objects/deployment-details-page.po';
import { parseTransformMatrix } from '../../utils/test-utils';

/**
 * @group regression
 * @group deployment
 * @group deployment-details
 * @group deployment-details-diagram
 */

let commonElements: CommonElements;
let deploymentDetailsPage: DeploymentDetailsPage;

test.describe('Deployment Detail Diagram Section', () => {
  test.beforeEach(async ({ page }) => {
    commonElements = new CommonElements(page);
    deploymentDetailsPage = new DeploymentDetailsPage(page);
    // Navigate to the Fluxnova Automation - All deployment created during test setup
    await deploymentDetailsPage.navigateToDeploymentDetailsByName('Fluxnova Automation - All');
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('should load diagram when BPMN resource is selected', async ({ page }) => {
    const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
    const resourceList = infoSection.locator('.resource-list');

    // Find and click on a BPMN resource
    const bpmnResource = resourceList
      .locator('.resource')
      .filter({ hasText: /\.bpmn$/i })
      .first();

    // Only run test if BPMN resource exists
    const bpmnCount = await bpmnResource.count();
    if (bpmnCount > 0) {
      await bpmnResource.click();

      // Wait for diagram to load
      await expect(page.locator('fluxnova-generic-diagram-viewer')).toBeVisible();
      await expect(page.locator('.bjs-container')).toBeVisible();
    }
  });

  test('should load diagram when DMN resource is selected', async ({ page }) => {
    const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
    const resourceList = infoSection.locator('.resource-list');

    // Find and click on a DMN resource
    const dmnResource = resourceList
      .locator('.resource')
      .filter({ hasText: /\.dmn$/i })
      .first();

    // Only run test if DMN resource exists
    const dmnCount = await dmnResource.count();
    if (dmnCount > 0) {
      await dmnResource.click();

      // Wait for diagram to load
      await expect(page.locator('fluxnova-generic-diagram-viewer')).toBeVisible();
      await expect(page.locator('.canvas')).toBeVisible();
    }
  });

  test.describe('Diagram Control Buttons', () => {
    test.beforeEach(async ({ page }) => {
      // Select a BPMN resource to display diagram
      const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
      const resourceList = infoSection.locator('.resource-list');
      const bpmnResource = resourceList
        .locator('.resource')
        .filter({ hasText: /\.bpmn$/i })
        .first();

      const bpmnCount = await bpmnResource.count();
      if (bpmnCount > 0) {
        await bpmnResource.click();
        await expect(page.locator('.bjs-container')).toBeVisible();
      }
    });

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

    test('should zoom in on BPMN diagram', async ({ page }) => {
      const bpmnContainer = page.locator('.bjs-container');
      const bpmnCount = await bpmnContainer.count();

      if (bpmnCount > 0) {
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
      }
    });

    test('should zoom out on BPMN diagram', async ({ page }) => {
      const bpmnContainer = page.locator('.bjs-container');
      const bpmnCount = await bpmnContainer.count();

      if (bpmnCount > 0) {
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
      }
    });

    test('should recenter view on BPMN diagram', async ({ page }) => {
      const bpmnContainer = page.locator('.bjs-container');
      const bpmnCount = await bpmnContainer.count();

      if (bpmnCount > 0) {
        await expect(commonElements.diagramViewport).toBeInViewport();

        // Move the diagram out of view
        await page.evaluate(() => {
          const el = document.querySelector('.bjs-container .viewport');
          if (el) el.setAttribute('transform', 'matrix(1 0 0 1 -1000 -1000)');
        });

        await expect(commonElements.diagramViewport).not.toBeInViewport();

        await commonElements.resetZoomButton.click();

        await expect(commonElements.diagramViewport).toBeInViewport();
      }
    });

    test('should display zoom controls only for diagram resources', async ({ page }) => {
      const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
      const resourceList = infoSection.locator('.resource-list');

      // Click on a non-diagram resource (e.g., .js file)
      const nonDiagramResource = resourceList
        .locator('.resource')
        .filter({ hasText: /\.(js|json|txt)$/i })
        .first();

      const nonDiagramCount = await nonDiagramResource.count();
      if (nonDiagramCount > 0) {
        await nonDiagramResource.click();

        // Zoom controls should not be visible for non-diagram resources
        const toolbar = page.locator('fluxnova-toolbar');
        await expect(toolbar.locator('fluxnova-diagram-toolbar')).toBeHidden();
      }

      // Click on a BPMN resource
      const bpmnResource = resourceList
        .locator('.resource')
        .filter({ hasText: /\.bpmn$/i })
        .first();
      const bpmnCount = await bpmnResource.count();

      if (bpmnCount > 0) {
        await bpmnResource.click();
        await expect(page.locator('.bjs-container')).toBeVisible();

        // Zoom controls should be visible for diagram resources
        const toolbar = page.locator('fluxnova-toolbar');
        await expect(toolbar.locator('fluxnova-diagram-toolbar')).toBeVisible();
        await expect(commonElements.resetZoomButton).toBeVisible();
        await expect(commonElements.zoomInButton).toBeVisible();
        await expect(commonElements.zoomOutButton).toBeVisible();
      }
    });

    test('should select diagram shape and dim other shapes', async ({ page }) => {
      const bpmnContainer = page.locator('.bjs-container');
      const bpmnCount = await bpmnContainer.count();

      if (bpmnCount > 0) {
        // Get diagram shapes
        const allShapes = page.locator('.djs-element[data-element-id]');
        const shapeCount = await allShapes.count();

        if (shapeCount > 1) {
          const firstShape = allShapes.first();
          const secondShape = allShapes.nth(1);

          // Initially, no shapes should be dimmed
          await expect(firstShape).not.toHaveClass(/dimmed/);
          await expect(secondShape).not.toHaveClass(/dimmed/);

          // Click on a specific shape to select it
          await firstShape.click();

          // The selected shape should NOT be dimmed
          await expect(firstShape).not.toHaveClass(/dimmed/);

          // Verify that multiple non-selected shapes are dimmed
          const dimmedShapes = page.locator('.djs-element.dimmed');
          const dimmedCount = await dimmedShapes.count();
          expect(dimmedCount).toBeGreaterThan(0);

          // Get the root SVG element to click on canvas
          const canvas = page.locator('.bjs-container svg').first();
          await canvas.click({ position: { x: 10, y: 10 } });

          // After deselection, shapes should no longer be dimmed
          await expect(firstShape).not.toHaveClass(/dimmed/);
          await expect(secondShape).not.toHaveClass(/dimmed/);
          expect(dimmedCount).toBe(0);
        }
      }
    });
  });

  test.describe('Resource Switching', () => {
    test('should switch between different resources', async () => {
      const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
      const resourceList = infoSection.locator('.resource-list');
      const resources = resourceList.locator('.resource');

      const resourceCount = await resources.count();

      if (resourceCount > 1) {
        // Click first resource
        const firstResource = resources.first();
        const firstResourceName = (await firstResource.innerText()).trim();
        await firstResource.click();

        // Verify first resource is selected
        await expect(firstResource).toHaveClass(/selected/);

        // Click second resource
        const secondResource = resources.nth(1);
        const secondResourceName = (await secondResource.innerText()).trim();
        await secondResource.click();

        // Verify second resource is selected and first is not
        await expect(secondResource).toHaveClass(/selected/);
        await expect(firstResource).not.toHaveClass(/selected/);

        // Verify names are different
        expect(firstResourceName).not.toBe(secondResourceName);
      }
    });

    test('should maintain selected resource highlight', async ({ page }) => {
      const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
      const resourceList = infoSection.locator('.resource-list');
      const firstResource = resourceList.locator('.resource').first();

      await firstResource.click();

      // Verify resource is selected
      await expect(firstResource).toHaveClass(/selected/);

      // Click on diagram area (if BPMN exists)
      const bpmnContainer = page.locator('.bjs-container');
      const bpmnCount = await bpmnContainer.count();

      if (bpmnCount > 0) {
        const canvas = page.locator('.bjs-container svg').first();
        await canvas.click({ position: { x: 100, y: 100 } });

        // Resource should still be selected
        await expect(firstResource).toHaveClass(/selected/);
      }
    });
  });
});
