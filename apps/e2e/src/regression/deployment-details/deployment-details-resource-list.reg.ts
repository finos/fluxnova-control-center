import { expect, test } from '@playwright/test';
import { DeploymentDetailsPage } from '../../page-objects/deployment-details-page.po';
import { CommonElements } from '../../page-objects/common-elements.po';

/**
 * @group regression
 * @group deployment
 * @group deployment-details
 * @group deployment-details-resource-list
 */

let deploymentDetailsPage: DeploymentDetailsPage;
let commonElements: CommonElements;

/**
 * Helper to assert a resource type exists in the deployment.
 * Provides clear error messages when resources are missing.
 */

test.describe('Deployment Detail Resource List', () => {
  test.beforeEach(async ({ page }) => {
    deploymentDetailsPage = new DeploymentDetailsPage(page);
    commonElements = new CommonElements(page);

    // Navigate to the specific deployment by name: 'Fluxnova Automation - All'
    await deploymentDetailsPage.navigateToDeploymentDetailsByName('Fluxnova Automation - All');

    // Ensure the left panel and info section are visible
    await expect(commonElements.leftPanel).toBeVisible();
    const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
    await expect(infoSection).toBeVisible();

    // Verify resource list is visible
    const resourceList = infoSection.locator('.resource-list');
    await expect(resourceList).toBeVisible();

    // Log resource count for debugging
    const resourceCount = await resourceList.locator('.resource').count();
    console.log(`[DEBUG] Found ${resourceCount} resources in deployment 'Fluxnova Automation - All'`);

    // Ensure at least one resource exists
    const firstResource = resourceList.locator('.resource').first();
    await expect(firstResource).toBeVisible();
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('should display resource list section', async () => {
    const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
    await expect(infoSection).toBeVisible();

    const resourceListTitle = infoSection.getByText('Resource List');
    await expect(resourceListTitle).toBeVisible();

    const resourceList = infoSection.locator('.resource-list');
    await expect(resourceList).toBeVisible();

    // Verify at least one resource exists
    const resources = resourceList.locator('.resource');
    const resourceCount = await resources.count();

    // Log all found resources for debugging
    console.log(`\n======= DEPLOYMENT RESOURCES =======`);
    for (let i = 0; i < resourceCount; i++) {
      const resourceText = await resources.nth(i).textContent();
      console.log(`  ${i + 1}. ${resourceText?.trim()}`);
    }
    console.log(`====================================\n`);

    expect(resourceCount, 'Expected at least one resource in the deployment').toBeGreaterThan(0);
    await expect(resources.first()).toBeVisible();
  });

  test.describe('BPMN File Type', () => {
    test('should display BPMN diagram viewer when BPMN resource is selected', async ({ page }) => {
      const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
      const resourceList = infoSection.locator('.resource-list');

      // Find BPMN resource
      const bpmnResource = resourceList.locator('.resource').filter({ hasText: 'automation_basic.bpmn' }).first();

      // Verify resource is selected
      await expect(bpmnResource).toHaveClass(/selected/);

      // Verify BPMN diagram viewer is displayed
      await expect(page.locator('fluxnova-generic-diagram-viewer')).toBeVisible();
      await expect(page.locator('.bjs-container')).toBeVisible();

      // Verify code editor is NOT displayed for BPMN
      await expect(page.locator('#code-editor')).not.toBeVisible();

      // Verify download message is NOT displayed
      await expect(page.locator('#download')).not.toBeVisible();
    });

    test('should show diagram toolbar for BPMN files', async ({ page }) => {
      const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
      const resourceList = infoSection.locator('.resource-list');
      const bpmnResource = resourceList.locator('.resource').filter({ hasText: 'automation_basic.bpmn' }).first();

      await bpmnResource.click();

      // Wait for diagram to load
      await expect(page.locator('.bjs-container')).toBeVisible();

      // Verify diagram toolbar is visible
      await expect(page.locator('fluxnova-diagram-toolbar')).toBeVisible();
      await expect(commonElements.resetZoomButton).toBeVisible();
      await expect(commonElements.zoomInButton).toBeVisible();
      await expect(commonElements.zoomOutButton).toBeVisible();
    });
  });

  test.describe('Groovy File Type', () => {
    test('should display code editor when Groovy resource is selected', async ({ page }) => {
      const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
      const resourceList = infoSection.locator('.resource-list');

      // Find and click on a Groovy resource
      const groovyResource = resourceList.locator('.resource').filter({ hasText: 'myGroovyFile.groovy' }).first();

      await groovyResource.click();

      // Verify resource is selected
      await expect(groovyResource).toHaveClass(/selected/);

      // Verify code editor is displayed
      await expect(page.locator('#code-editor')).toBeVisible();

      // Verify the Monaco editor container is loaded
      await expect(page.locator('.monaco-editor')).toBeVisible();

      // Verify diagram viewer is NOT displayed for Groovy
      await expect(page.locator('fluxnova-generic-diagram-viewer')).not.toBeVisible();

      // Verify download message is NOT displayed
      await expect(page.locator('#download')).not.toBeVisible();
    });

    test('should not show diagram toolbar for Groovy files', async ({ page }) => {
      const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
      const resourceList = infoSection.locator('.resource-list');
      const groovyResource = resourceList.locator('.resource').filter({ hasText: 'myGroovyFile.groovy' }).first();

      await groovyResource.click();

      // Wait for code editor to load
      await expect(page.locator('#code-editor')).toBeVisible();

      // Verify diagram toolbar is NOT visible
      const toolbar = page.locator('fluxnova-toolbar');
      await expect(toolbar.locator('fluxnova-diagram-toolbar')).toBeHidden();
    });
  });

  test.describe('JavaScript File Type', () => {
    test('should display code editor when JS resource is selected', async ({ page }) => {
      const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
      const resourceList = infoSection.locator('.resource-list');

      // Find and click on a JS resource
      const jsResource = resourceList.locator('.resource').filter({ hasText: 'myJsFile.js' }).first();

      await jsResource.click();

      // Verify resource is selected
      await expect(jsResource).toHaveClass(/selected/);

      // Verify code editor is displayed
      await expect(page.locator('#code-editor')).toBeVisible();

      // Verify the Monaco editor container is loaded
      await expect(page.locator('.monaco-editor')).toBeVisible();

      // Verify diagram viewer is NOT displayed for JS
      await expect(page.locator('fluxnova-generic-diagram-viewer')).not.toBeVisible();

      // Verify download message is NOT displayed
      await expect(page.locator('#download')).not.toBeVisible();
    });

    test('should not show diagram toolbar for JS files', async ({ page }) => {
      const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
      const resourceList = infoSection.locator('.resource-list');
      const jsResource = resourceList.locator('.resource').filter({ hasText: 'myJsFile.js' }).first();

      await jsResource.click();

      // Wait for code editor to load
      await expect(page.locator('#code-editor')).toBeVisible();

      // Verify diagram toolbar is NOT visible
      const toolbar = page.locator('fluxnova-toolbar');
      await expect(toolbar.locator('fluxnova-diagram-toolbar')).toBeHidden();
    });
  });

  test.describe('XML File Type', () => {
    test('should display code editor when XML resource is selected', async ({ page }) => {
      const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
      const resourceList = infoSection.locator('.resource-list');

      // Find and click on an XML resource (not .bpmn or .dmn)
      const xmlResource = resourceList.locator('.resource').filter({ hasText: 'myxml.xml' }).first();

      await xmlResource.click();

      // Verify resource is selected
      await expect(xmlResource).toHaveClass(/selected/);

      // Verify code editor is displayed
      await expect(page.locator('#code-editor')).toBeVisible();

      // Verify the Monaco editor container is loaded
      await expect(page.locator('.monaco-editor')).toBeVisible();

      // Verify diagram viewer is NOT displayed
      await expect(page.locator('fluxnova-generic-diagram-viewer')).not.toBeVisible();

      // Verify download message is NOT displayed
      await expect(page.locator('#download')).not.toBeVisible();
    });

    test('should not show diagram toolbar for XML files', async ({ page }) => {
      const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
      const resourceList = infoSection.locator('.resource-list');
      const xmlResource = resourceList.locator('.resource').filter({ hasText: 'myxml.xml' }).first();

      await xmlResource.click();

      // Wait for code editor to load
      await expect(page.locator('#code-editor')).toBeVisible();

      // Verify diagram toolbar is NOT visible
      const toolbar = page.locator('fluxnova-toolbar');
      await expect(toolbar.locator('fluxnova-diagram-toolbar')).toBeHidden();
    });
  });

  test.describe('Image File Type (JPEG)', () => {
    test('should display download message when JPEG resource is selected', async ({ page }) => {
      const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
      const resourceList = infoSection.locator('.resource-list');

      // Find and click on a JPEG/JPG resource
      const jpegResource = resourceList.locator('.resource').filter({ hasText: 'stockUp.jpeg' }).first();

      await jpegResource.click();

      // Verify resource is selected
      await expect(jpegResource).toHaveClass(/selected/);

      // Verify download message is displayed
      await expect(page.locator('#download')).toBeVisible();
      await expect(page.locator('.download-text')).toContainText('has an unsupported file type');
      await expect(page.locator('.download-text')).toContainText('Download file to view');

      // Verify code editor is NOT displayed for JPEG
      await expect(page.locator('#code-editor')).not.toBeVisible();

      // Verify diagram viewer is NOT displayed for JPEG
      await expect(page.locator('fluxnova-generic-diagram-viewer')).not.toBeVisible();
    });

    test('should not show diagram toolbar for JPEG files', async ({ page }) => {
      const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
      const resourceList = infoSection.locator('.resource-list');
      const jpegResource = resourceList.locator('.resource').filter({ hasText: 'stockUp.jpeg' }).first();

      await jpegResource.click();

      // Wait for download message to load
      await expect(page.locator('#download')).toBeVisible();

      // Verify diagram toolbar is NOT visible
      const toolbar = page.locator('fluxnova-toolbar');
      await expect(toolbar.locator('fluxnova-diagram-toolbar')).toBeHidden();
    });
  });

  test.describe('Resource Switching', () => {
    test('should switch between different file types correctly', async ({ page }) => {
      const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
      const resourceList = infoSection.locator('.resource-list');

      // Get different file types
      const bpmnResource = resourceList.locator('.resource').filter({ hasText: 'automation_basic.bpmn' }).first();
      const jsResource = resourceList.locator('.resource').filter({ hasText: 'myJsFile.js' }).first();
      const jpegResource = resourceList.locator('.resource').filter({ hasText: 'stockUp.jpeg' }).first();

      // Test switching from BPMN to JS
      await bpmnResource.click();
      await expect(page.locator('.bjs-container')).toBeVisible();
      await expect(bpmnResource).toHaveClass(/selected/);

      // Switch to JS
      await jsResource.click();
      await expect(page.locator('#code-editor')).toBeVisible();
      await expect(jsResource).toHaveClass(/selected/);
      await expect(bpmnResource).not.toHaveClass(/selected/);

      // Verify BPMN diagram is no longer visible
      await expect(page.locator('.bjs-container')).not.toBeVisible();

      // Test switching from JS to JPEG
      await jpegResource.click();
      await expect(page.locator('#download')).toBeVisible();
      await expect(jpegResource).toHaveClass(/selected/);
      await expect(jsResource).not.toHaveClass(/selected/);

      // Verify code editor is no longer visible
      await expect(page.locator('#code-editor')).not.toBeVisible();
    });

    test('should maintain correct viewer when switching back to previously selected resource', async ({ page }) => {
      const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
      const resourceList = infoSection.locator('.resource-list');

      const bpmnResource = resourceList.locator('.resource').filter({ hasText: 'automation_basic.bpmn' }).first();
      const jsResource = resourceList.locator('.resource').filter({ hasText: 'myJsFile.js' }).first();

      // Start with BPMN
      await bpmnResource.click();
      await expect(page.locator('.bjs-container')).toBeVisible();

      // Switch to JS
      await jsResource.click();
      await expect(page.locator('#code-editor')).toBeVisible();

      // Switch back to BPMN
      await bpmnResource.click();
      await expect(page.locator('.bjs-container')).toBeVisible();
      await expect(page.locator('#code-editor')).not.toBeVisible();
      await expect(bpmnResource).toHaveClass(/selected/);
    });
  });

  test.describe('Download Resource Button', () => {
    test('should enable download resource button when any resource is selected', async ({ page }) => {
      const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
      const resourceList = infoSection.locator('.resource-list');
      const firstResource = resourceList.locator('.resource').first();

      await firstResource.click();

      // Verify download resource button is enabled
      const downloadButton = page.locator('#download_resource').getByRole('button');
      await expect(downloadButton).toBeVisible();
      await expect(downloadButton).toBeEnabled();
    });
  });
});
