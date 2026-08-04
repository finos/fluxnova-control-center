import { expect, test } from '@playwright/test';
import { CommonElements } from '../../page-objects/common-elements.po';
import { DeploymentDetailsPage } from '../../page-objects/deployment-details-page.po';

/**
 * @group regression
 * @group deployment
 * @group deployment-details
 * @group deployment-details-info-panel
 */

let commonElements: CommonElements;
let deploymentDetailsPage: DeploymentDetailsPage;

test.describe('Deployment Detail Info Panel', () => {
  test.beforeEach(async ({ page }) => {
    deploymentDetailsPage = new DeploymentDetailsPage(page);
    commonElements = new CommonElements(page);
    // Navigate to the Fluxnova Automation - All deployment created during test setup
    await deploymentDetailsPage.navigateToDeploymentDetailsByName('Fluxnova Automation - All');
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('should have back button load deployment list', async ({ page }) => {
    const backButton = page.locator('fluxnova-back-button');
    await expect(backButton).toHaveCount(1);

    // Make sure we're on the detail page
    await expect(page).toHaveURL(/\/deployments\/[^?]+(\?.*)?$/);

    await backButton.locator('a').first().click();
    await page.waitForURL(/\/deployments(\?.*)?$/, { waitUntil: 'load' });

    // Now we should be on the list page
    await expect(page).toHaveURL(/\/deployments(\?.*)?$/);
    await expect(commonElements.headerLabel.first()).toHaveText('Deployments');
  });

  test('should display deployment name', async () => {
    const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
    await expect(infoSection).toBeVisible();

    const deploymentName = infoSection.locator('#deploymentName');
    await expect(deploymentName).toBeVisible();

    const nameText = await deploymentName.innerText();
    expect(nameText.length).toBeGreaterThan(0);
  });

  test('should display deployment ID with data attribute', async () => {
    const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
    await expect(infoSection).toBeVisible();

    const deploymentIdLabel = infoSection.locator('strong').filter({ hasText: 'Deployment ID' });
    await expect(deploymentIdLabel).toBeVisible();

    const deploymentIdValue = infoSection.locator('#deploymentId');
    await expect(deploymentIdValue).toBeVisible();

    const deploymentIdText = await deploymentIdValue.innerText();
    expect(deploymentIdText.length).toBeGreaterThan(0);
  });

  test('should be able to copy deployment ID', async ({ page }) => {
    const ctx = page.context();
    await ctx.grantPermissions(['clipboard-read']);

    const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
    await expect(infoSection).toBeVisible();

    const deploymentId = await infoSection.locator('#deploymentId').innerText();

    // Click the copy icon next to Deployment ID
    const copyIcon = infoSection
      .locator('strong')
      .filter({ hasText: 'Deployment ID' })
      .locator('..')
      .locator('fluxnova-icon[iconname="copy"]')
      .first();
    await copyIcon.click();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(deploymentId);
  });

  test('should display deployment time', async () => {
    const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
    await expect(infoSection).toBeVisible();

    const timeLabel = infoSection.locator('strong').filter({ hasText: 'Time' });
    await expect(timeLabel).toBeVisible();

    const timeValue = infoSection.locator('#deploymentTime');
    await expect(timeValue).toBeVisible();

    const timeText = await timeValue.innerText();
    expect(timeText.length).toBeGreaterThan(0);
    // Verify time format (YYYY-MM-DD HH:MM:SS)
    expect(timeText).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
  });

  test('should display deployment source', async () => {
    const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
    await expect(infoSection).toBeVisible();

    const sourceLabel = infoSection.locator('strong').filter({ hasText: 'Source' });
    await expect(sourceLabel).toBeVisible();

    const sourceValue = infoSection.locator('#deploymentSource');
    // Source field should exist (even if empty)
    await expect(sourceValue).toHaveCount(1);

    const sourceText = (await sourceValue.innerText()).trim();
    // Source can be empty, but the field should be present
    expect(sourceText).toBeDefined();
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
    await expect(resources.first()).toBeVisible();
  });

  test('should be able to click on resources in resource list', async () => {
    const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
    await expect(infoSection).toBeVisible();

    const resourceList = infoSection.locator('.resource-list');
    const firstResource = resourceList.locator('.resource').first();
    await expect(firstResource).toBeVisible();

    // Click the resource
    await firstResource.click();

    // Verify resource becomes selected
    await expect(firstResource).toHaveClass(/selected/);
  });

  test('should have all required info panel sections in correct order', async () => {
    const infoSection = commonElements.leftPanel.locator('fluxnova-deployment-info-section');
    await expect(infoSection).toBeVisible();

    // Check sections exist in order
    const sections = await infoSection.locator('strong').allInnerTexts();
    const trimmedSections = sections.map((s) => s.trim());

    expect(trimmedSections).toContain('Deployment ID');
    expect(trimmedSections).toContain('Time');
    expect(trimmedSections).toContain('Source');

    // Verify Deployment ID comes before Time
    const deploymentIdIndex = trimmedSections.indexOf('Deployment ID');
    const timeIndex = trimmedSections.indexOf('Time');
    const sourceIndex = trimmedSections.indexOf('Source');

    expect(deploymentIdIndex).toBeGreaterThan(-1);
    expect(timeIndex).toBeGreaterThan(-1);
    expect(sourceIndex).toBeGreaterThan(-1);

    expect(deploymentIdIndex).toBeLessThan(timeIndex);
    expect(timeIndex).toBeLessThan(sourceIndex);
  });
});
