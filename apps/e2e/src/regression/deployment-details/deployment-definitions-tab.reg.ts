import { expect, Page, test } from '@playwright/test';
import { DeploymentDetailsPage } from '../../page-objects/deployment-details-page.po';
import { CommonElements } from '../../page-objects/common-elements.po';

/**
 * @group regression
 * @group deployment
 * @group deployment-details
 * @group deployment-details-definitions-tab
 */

let deploymentDetailsPage: DeploymentDetailsPage;
let commonElements: CommonElements;

async function resetGridIfAvailable(page: Page, waitAfterReset: boolean = true): Promise<void> {
  const resetButton = page.locator('fluxnova-column-options').getByRole('button', { name: 'Reset Grid' });
  const resetCount = await resetButton.count();
  if (resetCount > 0) {
    await resetButton.click();
    if (waitAfterReset) {
      await page.waitForTimeout(500);
    }
  }
}

test.describe('Deployment Details - Definitions Tab', () => {
  test.beforeEach(async ({ page }) => {
    deploymentDetailsPage = new DeploymentDetailsPage(page);
    commonElements = new CommonElements(page);
    // Navigate to the Fluxnova Automation - All deployment created during test setup
    await deploymentDetailsPage.navigateToDeploymentDetailsByName('Fluxnova Automation - All');
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test.describe('BPMN Definitions', () => {
    test.beforeEach(async ({ page }) => {
      // Select a BPMN resource to display definitions tab
      const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
      await expect(infoSection).toBeVisible();

      const resourceList = infoSection.locator('.resource-list');
      await expect(resourceList).toBeVisible();

      // Wait for resources to load
      const firstResource = resourceList.locator('.resource').first();
      await expect(firstResource).toBeVisible();

      // Reset grid to ensure clean state for each test
      await resetGridIfAvailable(page);
    });

    test('should display Definitions tab for BPMN resources', async ({ page }) => {
      const definitionsTab = page.locator('li[data-tab="definitions"]');
      await expect(definitionsTab).toBeVisible();
      await expect(definitionsTab).toContainText('Definitions');
    });

    test('should display all default column headers for BPMN', async ({ page }) => {
      await expect(page.getByRole('columnheader', { name: 'Name' }).first()).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Key' }).first()).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Instance Count' }).first()).toBeVisible();
    });

    test('should display data in the definitions grid', async ({ page }) => {
      // Verify grid has data
      await expect(page.locator('.ag-root')).toHaveAttribute('aria-rowcount', /.+/);

      // Verify at least the grid structure exists
      await expect(page.locator('.ag-center-cols-container')).toBeVisible();
    });

    test('should allow moving columns', async ({ page }) => {
      const nameColumnHeader = page.locator('.ag-header-cell[col-id="processDefinitionName"][role="columnheader"]');
      const keyColumnHeader = page.locator('.ag-header-cell[col-id="key"][role="columnheader"]');

      const nameInitialIndex = await nameColumnHeader.getAttribute('aria-colindex');
      const keyInitialIndex = await keyColumnHeader.getAttribute('aria-colindex');

      // Drag Name column to Key column position
      await nameColumnHeader.dragTo(keyColumnHeader);

      const nameNewIndex = await nameColumnHeader.getAttribute('aria-colindex');
      const keyNewIndex = await keyColumnHeader.getAttribute('aria-colindex');

      // Verify columns have swapped positions
      expect(nameNewIndex).not.toBe(nameInitialIndex);
      expect(keyNewIndex).not.toBe(keyInitialIndex);

      // Cleanup: Reset grid to default
      await resetGridIfAvailable(page, false);
    });

    test('should allow adjusting column width', async ({ page }) => {
      const instanceCountColumnHeader = page.locator('div[role="columnheader"]', { hasText: 'Instance Count' });
      const initialWidth = await instanceCountColumnHeader.boundingBox();

      // Get the resize handle (right edge of the column header)
      const resizeHandle = instanceCountColumnHeader.locator('.ag-header-cell-resize');

      // Drag to increase width
      await resizeHandle.hover();
      await page.mouse.down();
      await page.mouse.move((initialWidth?.x ?? 0) + (initialWidth?.width ?? 0) + 100, initialWidth?.y ?? 0);
      await page.mouse.up();

      const newBox = await instanceCountColumnHeader.boundingBox();
      expect(newBox?.width).toBeGreaterThan(initialWidth?.width ?? 0);

      // Cleanup: Reset the grid
      const resetViewButton = page.getByRole('button', { name: 'Reset Grid' });
      await expect(resetViewButton).toBeVisible();
      await resetViewButton.click();
      await expect(resetViewButton).toBeHidden();
    });

    test('should reset grid after column modifications', async ({ page }) => {
      // Move a column first
      const nameColumnHeader = page.locator('.ag-header-cell[col-id="processDefinitionName"][role="columnheader"]');
      const keyColumnHeader = page.locator('.ag-header-cell[col-id="key"][role="columnheader"]');

      const nameInitialIndex = await nameColumnHeader.getAttribute('aria-colindex');

      await nameColumnHeader.dragTo(keyColumnHeader);

      const nameMovedIndex = await nameColumnHeader.getAttribute('aria-colindex');
      expect(nameMovedIndex).not.toBe(nameInitialIndex);

      // Now reset the grid
      const resetButton = page.getByRole('button').filter({ hasText: 'Reset Grid' });
      await expect(resetButton).toBeVisible();
      await resetButton.click();

      // Wait for grid to reset
      await page.waitForTimeout(500);

      // Verify column is back to original position
      const nameResetIndex = await nameColumnHeader.getAttribute('aria-colindex');
      expect(nameResetIndex).toBe(nameInitialIndex);
    });

    test('should navigate to process definition details when clicking definition name', async ({ page }) => {
      // Wait for grid rows to load
      const firstRow = page.locator('.ag-center-cols-container .ag-row').first();
      await expect(firstRow).toBeVisible();

      // Find and click a definition name link
      const definitionLink = firstRow.locator('a.text-primary').first();

      await definitionLink.click();

      // Verify navigation to process definition details
      await expect(page).toHaveURL(/\/process-definitions\/.+/);
      await expect(commonElements.headerLabel.first()).toHaveText('PROCESS DEFINITION');
    });
  });

  test.describe('DMN Definitions', () => {
    test.beforeEach(async ({ page }) => {
      // Select a DMN resource to display definitions tab
      const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
      const resourceList = infoSection.locator('.resource-list');
      const dmnResource = resourceList.locator('.resource').filter({ hasText: '.dmn' }).first();

      const dmnCount = await dmnResource.count();
      if (dmnCount > 0) {
        await dmnResource.click();
        await page.waitForSelector('fluxnova-decision-definition', { state: 'visible' });
        await expect(page.locator('.ag-root')).toBeVisible();
      }
    });

    test('should display Definitions tab for DMN resources', async ({ page }) => {
      const dmnResource = commonElements.leftPanel
        .locator('.resource-list')
        .locator('.resource')
        .filter({ hasText: '.dmn' })
        .first();

      await dmnResource.click();
      const definitionsTab = page.locator('li[data-tab="definitions"]');
      await expect(definitionsTab).toBeVisible();
      await expect(definitionsTab).toContainText('Definitions');
    });

    test('should display all default column headers for DMN', async ({ page }) => {
      const dmnResource = commonElements.leftPanel
        .locator('.resource-list')
        .locator('.resource')
        .filter({ hasText: '.dmn' })
        .first();

      await dmnResource.click();
      await expect(page.getByRole('columnheader', { name: 'Name' }).first()).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Key' }).first()).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Version' }).first()).toBeVisible();
    });

    test('should display data in the definitions grid', async ({ page }) => {
      const dmnResource = commonElements.leftPanel
        .locator('.resource-list')
        .locator('.resource')
        .filter({ hasText: '.dmn' })
        .first();

      await dmnResource.click();
      await page.waitForTimeout(500);
      // Verify grid has data
      await expect(page.locator('.ag-root')).toHaveAttribute('aria-rowcount', /.+/);
      const rowCount = Number((await page.locator('.ag-root').getAttribute('aria-rowcount')) ?? 0) - 2;
      expect(rowCount).toBeGreaterThanOrEqual(0);

      // Verify at least the grid structure exists
      await expect(page.locator('.ag-center-cols-container')).toBeVisible();
    });

    test('should navigate to decision definition details when clicking definition name', async ({ page }) => {
      const dmnResource = commonElements.leftPanel
        .locator('.resource-list')
        .locator('.resource')
        .filter({ hasText: '.dmn' })
        .first();

      await dmnResource.click();
      // Wait for grid rows to load
      const firstRow = page.locator('.ag-center-cols-container .ag-row').first();
      await expect(firstRow).toBeVisible();

      // Find and click a definition name link
      const definitionLink = firstRow.locator('a.text-primary').first();
      const linkCount = await definitionLink.count();

      if (linkCount > 0) {
        await definitionLink.click();

        // Verify navigation to decision definition details
        await expect(page).toHaveURL(/\/decision-definitions\/.+/);
        await expect(commonElements.headerLabel.first()).toHaveText('DECISION DEFINITION');
      }
    });

    test('should display Decision Requirements Definitions tab for DMN', async ({ page }) => {
      const dmnResource = commonElements.leftPanel
        .locator('.resource-list')
        .locator('.resource')
        .filter({ hasText: '.dmn' })
        .first();

      await dmnResource.click({ force: true });
      const drdTab = page.locator('li[data-tab="decision-requirements-definitions"]');
      await expect(drdTab).toBeVisible();
    });
  });

  test.describe('Tab Switching', () => {
    test('should switch between Definitions and Decision Requirements Definitions tabs for DMN', async ({ page }) => {
      const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
      const resourceList = infoSection.locator('.resource-list');
      const dmnResource = resourceList.locator('.resource').filter({ hasText: '.dmn' }).first();

      await dmnResource.click();
      await page.waitForSelector('fluxnova-decision-definition', { state: 'visible' });

      // Verify Definitions tab is active by default
      const definitionsTab = page.locator('li[data-tab="definitions"]');
      await expect(definitionsTab).toBeVisible();

      // Switch to Decision Requirements Definitions tab
      const drdTab = page.locator('li[data-tab="decision-requirements-definitions"]');
      await expect(drdTab).toBeVisible();
      await drdTab.click();

      // Verify DRD tab content is displayed
      await expect(page.locator('fluxnova-decision-requirements-definitions')).toBeVisible();

      // Switch back to Definitions tab
      await definitionsTab.click();
      await expect(page.locator('fluxnova-decision-definition')).toBeVisible();
    });

    test('should maintain definitions tab when switching between BPMN resources', async ({ page }) => {
      const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
      const resourceList = infoSection.locator('.resource-list');
      const bpmnResources = resourceList.locator('.resource').filter({ hasText: '.bpmn' });

      // Click first BPMN resource
      await bpmnResources.first().click();
      await page.waitForSelector('fluxnova-process-definition-info-tab', { state: 'visible' });

      const definitionsTab = page.locator('li[data-tab="definitions"]');
      await expect(definitionsTab).toBeVisible();

      // Click second BPMN resource
      await bpmnResources.nth(1).click();
      await page.waitForSelector('fluxnova-process-definition-info-tab', { state: 'visible' });

      // Definitions tab should still be visible
      await expect(definitionsTab).toBeVisible();
    });
  });
});
