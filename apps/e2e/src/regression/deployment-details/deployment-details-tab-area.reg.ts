import { expect, test } from '@playwright/test';
import { DeploymentDetailsPage } from '../../page-objects/deployment-details-page.po';
import { CommonElements } from '../../page-objects/common-elements.po';
import { extractNumber } from '../../utils/test-utils';

/**
 * @group regression
 * @group deployment
 * @group deployment-details
 * @group deployment-details-tab-area
 */

let deploymentDetailsPage: DeploymentDetailsPage;
let commonElements: CommonElements;

test.describe('Deployment Detail Tab Area', () => {
  test.beforeEach(async ({ page }) => {
    deploymentDetailsPage = new DeploymentDetailsPage(page);
    commonElements = new CommonElements(page);
    // Navigate to the Fluxnova Automation - All deployment created during test setup
    await deploymentDetailsPage.navigateToDeploymentDetailsByName('Fluxnova Automation - All');
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('should display Definitions tab', async ({ page }) => {
    const definitionsTab = page.locator('li[data-tab="definitions"]');
    await expect(definitionsTab).toBeVisible();

    const tabText = await definitionsTab.innerText();
    expect(tabText).toContain('Definitions');
  });

  test('should have correct definitions tab count when BPMN resource is selected', async ({ page }) => {
    const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
    const resourceList = infoSection.locator('.resource-list');

    // Find and click on a BPMN resource
    const bpmnResource = resourceList
      .locator('.resource')
      .filter({ hasText: /\.bpmn$/i })
      .first();

    const bpmnCount = await bpmnResource.count();
    if (bpmnCount > 0) {
      await bpmnResource.click();

      // Wait for the definitions tab to load
      await page.waitForSelector('fluxnova-process-definition-info-tab', { state: 'visible' });

      // Wait for grid to load
      await expect(page.locator('.ag-root')).toHaveAttribute('aria-rowcount', /.+/);

      const definitionsTabCount = extractNumber(
        await page.locator('li[data-tab="definitions"]').locator('div').innerText(),
      );
      const definitionsRowCount = Number((await page.locator('.ag-root').getAttribute('aria-rowcount')) ?? 0) - 2;

      expect(definitionsTabCount).toEqual(definitionsRowCount);
    }
  });

  test('should have correct definitions tab count when DMN resource is selected', async ({ page }) => {
    const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
    const resourceList = infoSection.locator('.resource-list');

    // Find and click on a DMN resource
    const dmnResource = resourceList
      .locator('.resource')
      .filter({ hasText: /\.dmn$/i })
      .first();

    const dmnCount = await dmnResource.count();
    if (dmnCount > 0) {
      await dmnResource.click();

      // Wait for the definitions tab to load
      await page.waitForSelector('fluxnova-decision-definition', { state: 'visible' });

      // Wait for grid to load
      await expect(page.locator('.ag-root')).toHaveAttribute('aria-rowcount', /.+/);

      const definitionsTabCount = extractNumber(
        await page.locator('li[data-tab="definitions"]').locator('div').innerText(),
      );
      const definitionsRowCount = Number((await page.locator('.ag-root').getAttribute('aria-rowcount')) ?? 0) - 2;

      expect(definitionsTabCount).toEqual(definitionsRowCount);
    }
  });

  test('should display Decision Requirements Definitions tab only for DMN resources', async ({ page }) => {
    const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
    const resourceList = infoSection.locator('.resource-list');

    // Check BPMN resource - should not have DRD tab
    const bpmnResource = resourceList
      .locator('.resource')
      .filter({ hasText: /\.bpmn$/i })
      .first();
    const bpmnCount = await bpmnResource.count();

    if (bpmnCount > 0) {
      await bpmnResource.click();

      // Wait for diagram to load
      await page.waitForSelector('fluxnova-process-definition-info-tab', { state: 'visible' });

      // DRD tab should not exist for BPMN
      const drdTab = page.locator('li[data-tab="decision-requirements-definitions"]');
      await expect(drdTab).not.toBeVisible();
    }

    // Check DMN resource - should have DRD tab
    const dmnResource = resourceList
      .locator('.resource')
      .filter({ hasText: /\.dmn$/i })
      .first();
    const dmnCount = await dmnResource.count();

    if (dmnCount > 0) {
      await dmnResource.click();

      // Wait for DMN diagram to load
      await page.waitForSelector('fluxnova-decision-definition', { state: 'visible' });

      // DRD tab should exist for DMN
      const drdTab = page.locator('li[data-tab="decision-requirements-definitions"]');
      await expect(drdTab).toBeVisible();
    }
  });

  test('should display correct column headers for BPMN definitions', async ({ page }) => {
    const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
    const resourceList = infoSection.locator('.resource-list');

    // Find and click on a BPMN resource
    const bpmnResource = resourceList
      .locator('.resource')
      .filter({ hasText: /\.bpmn$/i })
      .first();

    const bpmnCount = await bpmnResource.count();
    if (bpmnCount > 0) {
      await bpmnResource.click();

      // Wait for the definitions tab to load
      await page.waitForSelector('fluxnova-process-definition-info-tab', { state: 'visible' });

      // Verify column headers
      await expect(page.getByRole('columnheader', { name: 'Name' }).first()).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Key' }).first()).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Instance Count' }).first()).toBeVisible();
    }
  });

  test('should display correct column headers for DMN definitions', async ({ page }) => {
    const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
    const resourceList = infoSection.locator('.resource-list');

    // Find and click on a DMN resource
    const dmnResource = resourceList
      .locator('.resource')
      .filter({ hasText: /\.dmn$/i })
      .first();

    const dmnCount = await dmnResource.count();
    if (dmnCount > 0) {
      await dmnResource.click();

      // Wait for the definitions tab to load
      await page.waitForSelector('fluxnova-decision-definition', { state: 'visible' });

      // Verify column headers
      await expect(page.getByRole('columnheader', { name: 'Name' }).first()).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Key' }).first()).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Version' }).first()).toBeVisible();
    }
  });

  test('should switch between different resource types and update tabs accordingly', async ({ page }) => {
    const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
    const resourceList = infoSection.locator('.resource-list');

    // Click BPMN resource first
    const bpmnResource = resourceList
      .locator('.resource')
      .filter({ hasText: /\.bpmn$/i })
      .first();
    const bpmnCount = await bpmnResource.count();

    if (bpmnCount > 0) {
      await bpmnResource.click();
      await page.waitForSelector('fluxnova-process-definition-info-tab', { state: 'visible' });

      // Verify Definitions tab is visible
      const definitionsTab = page.locator('li[data-tab="definitions"]');
      await expect(definitionsTab).toBeVisible();

      // Verify DRD tab is not visible
      const drdTab = page.locator('li[data-tab="decision-requirements-definitions"]');
      await expect(drdTab).not.toBeVisible();
    }

    // Now click DMN resource
    const dmnResource = resourceList
      .locator('.resource')
      .filter({ hasText: /\.dmn$/i })
      .first();
    const dmnCount = await dmnResource.count();

    if (dmnCount > 0) {
      await dmnResource.click();
      await page.waitForSelector('fluxnova-decision-definition', { state: 'visible' });

      // Verify Definitions tab is still visible
      const definitionsTab = page.locator('li[data-tab="definitions"]');
      await expect(definitionsTab).toBeVisible();

      // Verify DRD tab is now visible
      const drdTab = page.locator('li[data-tab="decision-requirements-definitions"]');
      await expect(drdTab).toBeVisible();
    }
  });

  test('should navigate to definition details when clicking definition name', async ({ page }) => {
    const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
    const resourceList = infoSection.locator('.resource-list');

    // Find and click on a BPMN resource
    const bpmnResource = resourceList
      .locator('.resource')
      .filter({ hasText: /\.bpmn$/i })
      .first();

    const bpmnCount = await bpmnResource.count();
    if (bpmnCount > 0) {
      await bpmnResource.click();

      // Wait for the definitions tab to load
      await page.waitForSelector('fluxnova-process-definition-info-tab', { state: 'visible' });

      // Wait for grid rows to load
      await expect(page.locator('.ag-center-cols-container .ag-row').first()).toBeVisible();

      // Find a clickable definition name link
      const definitionLink = page
        .locator('.ag-center-cols-container .ag-row')
        .first()
        .locator('a.text-primary')
        .first();

      const linkCount = await definitionLink.count();
      if (linkCount > 0) {
        await definitionLink.click();

        // Verify navigation to process definition details
        await expect(page).toHaveURL(/\/process-definitions\/.+/);
        await expect(commonElements.headerLabel.first()).toHaveText('PROCESS DEFINITION');
      }
    }
  });
});
