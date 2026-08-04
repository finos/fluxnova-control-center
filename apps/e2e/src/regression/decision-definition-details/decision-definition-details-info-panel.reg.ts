import { expect, test } from '@playwright/test';
import { DecisionDefinitionDetailsPage } from '../../page-objects/decision-definition-details-page.po';
import { CommonElements } from '../../page-objects/common-elements.po';

/**
 * @group regression
 * @group decision-definition
 * @group decision-definition-details
 * @group decision-definition-details-info-panel
 */

let decisionDefinitionPage: DecisionDefinitionDetailsPage;
let commonElements: CommonElements;

test.describe('Decision Definition Detail Info Panel', () => {
  test.beforeEach(async ({ page }) => {
    decisionDefinitionPage = new DecisionDefinitionDetailsPage(page);
    commonElements = new CommonElements(page);
    await decisionDefinitionPage.navigateToDefinitionDetailsPage('fluxnova_automation_beverage_dmn_simple');
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('should display decision definition name as header', async () => {
    const infoSection = commonElements.leftPanel.locator('fluxnova-decision-definition-info-section');
    await expect(infoSection).toBeVisible();

    const nameHeader = infoSection.locator('h4');
    await expect(nameHeader).toBeVisible();

    const nameText = await nameHeader.innerText();
    expect(nameText).toContain('Fluxnova UI Automation - Beverage - Simple');
  });

  test('should display definition ID with data attribute', async () => {
    const infoSection = commonElements.leftPanel.locator('fluxnova-decision-definition-info-section');
    await expect(infoSection).toBeVisible();

    const definitionIdLabel = infoSection.locator('strong').filter({ hasText: 'Definition ID' });
    await expect(definitionIdLabel).toBeVisible();

    const definitionIdValue = infoSection.locator('[data-info-section-definition-id]');
    await expect(definitionIdValue).toBeVisible();

    // Wait for the text content to be populated
    await expect(definitionIdValue).not.toBeEmpty();

    const definitionId = (await definitionIdValue.innerText()).trim();
    expect(definitionId.length).toBeGreaterThan(0);
  });

  test('should be able to copy definition ID', async ({ page }) => {
    const ctx = page.context();
    await ctx.grantPermissions(['clipboard-read']);

    const infoSection = commonElements.leftPanel.locator('fluxnova-decision-definition-info-section');
    await expect(infoSection).toBeVisible();

    // Get the definition ID text content
    const definitionIdElement = infoSection.locator('[data-info-section-definition-id]');
    await expect(definitionIdElement).toBeVisible();
    const definitionIdValue = (await definitionIdElement.innerText()).trim();

    // Ensure we actually got a value
    expect(definitionIdValue.length).toBeGreaterThan(0);

    // Click the copy icon
    const copyIcon = infoSection.locator('fluxnova-icon[iconname="copy"]').first();
    await copyIcon.click();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(definitionIdValue);
  });

  test('should display version selector', async () => {
    const infoSection = commonElements.leftPanel.locator('fluxnova-decision-definition-info-section');
    await expect(infoSection).toBeVisible();

    const versionLabel = infoSection.getByText('Version', { exact: true }).filter({ hasText: 'Version' });
    await expect(versionLabel).toBeVisible();

    const versionSelector = infoSection.locator('ng-select');
    await expect(versionSelector).toBeVisible();
  });

  test('should display version tag', async () => {
    const infoSection = commonElements.leftPanel.locator('fluxnova-decision-definition-info-section');
    await expect(infoSection).toBeVisible();

    const versionTagLabel = infoSection.locator('strong').filter({ hasText: 'Version Tag' });
    await expect(versionTagLabel).toBeVisible();

    // Version tag value should be visible (even if it's empty/null)
    const versionTagValue = versionTagLabel.locator('..').locator('div').first();
    await expect(versionTagValue).toBeVisible();
  });

  test('should display definition key', async () => {
    const infoSection = commonElements.leftPanel.locator('fluxnova-decision-definition-info-section');
    await expect(infoSection).toBeVisible();

    const definitionKeyLabel = infoSection.locator('strong').filter({ hasText: 'Definition Key' });
    await expect(definitionKeyLabel).toBeVisible();

    const definitionKeyValue = definitionKeyLabel.locator('..').locator('div').first();
    await expect(definitionKeyValue).toBeVisible();

    const keyText = await definitionKeyValue.innerText();
    expect(keyText.length).toBeGreaterThan(0);
  });

  test('should be able to copy definition key', async ({ page }) => {
    const ctx = page.context();
    await ctx.grantPermissions(['clipboard-read']);

    const infoSection = commonElements.leftPanel.locator('fluxnova-decision-definition-info-section');
    await expect(infoSection).toBeVisible();

    // Get the copy icon for definition key and find the next sibling div which contains the value
    const definitionKeyCopyIcon = page
      .locator('fluxnova-decision-definition-info-section fluxnova-icon[iconname="copy"]')
      .nth(1);
    const definitionKeyValue = (
      await definitionKeyCopyIcon.locator('xpath=following-sibling::div[1]').innerText()
    ).trim();

    // Click the copy icon
    await definitionKeyCopyIcon.click();

    // Wait a moment for clipboard to update
    await page.waitForTimeout(100);

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(definitionKeyValue);
  });

  test('should display definition name', async () => {
    const infoSection = commonElements.leftPanel.locator('fluxnova-decision-definition-info-section');
    await expect(infoSection).toBeVisible();

    const definitionNameLabel = infoSection.locator('strong').filter({ hasText: 'Definition Name' });
    await expect(definitionNameLabel).toBeVisible();

    const definitionNameValue = definitionNameLabel.locator('..').locator('div').first();
    await expect(definitionNameValue).toBeVisible();

    const nameText = await definitionNameValue.innerText();
    expect(nameText.length).toBeGreaterThan(0);
  });

  test('should display history time to live', async () => {
    const infoSection = commonElements.leftPanel.locator('fluxnova-decision-definition-info-section');
    await expect(infoSection).toBeVisible();

    const historyTTLLabel = infoSection.locator('strong').filter({ hasText: 'History Time to Live' });
    await expect(historyTTLLabel).toBeVisible();

    // Get the fluxnova-value-with-units component directly
    const valueWithUnits = infoSection.locator('fluxnova-value-with-units');
    await expect(valueWithUnits).toBeVisible();

    // Verify the actual value
    const historyTTLText = await valueWithUnits.innerText();
    expect(historyTTLText).toBe('30 days');
  });

  test('should display deployment ID with link', async () => {
    const infoSection = commonElements.leftPanel.locator('fluxnova-decision-definition-info-section');
    await expect(infoSection).toBeVisible();

    const deploymentIdLabel = infoSection.locator('strong').filter({ hasText: 'Deployment ID' });
    await expect(deploymentIdLabel).toBeVisible();

    // Find the deployment link directly - it's the link that contains 'deployments' in its href
    const deploymentLink = infoSection.locator('a[href*="deployments"]');

    // Deployment link should be visible and clickable
    await expect(deploymentLink).toBeVisible();

    const href = await deploymentLink.getAttribute('href');
    expect(href).toContain('deployments');

    // Verify the link text is not empty
    const deploymentId = (await deploymentLink.innerText()).trim();
    expect(deploymentId.length).toBeGreaterThan(0);
  });

  test('should be able to copy deployment ID', async ({ page }) => {
    const ctx = page.context();
    await ctx.grantPermissions(['clipboard-read']);

    const infoSection = commonElements.leftPanel.locator('fluxnova-decision-definition-info-section');
    await expect(infoSection).toBeVisible();

    // Get the copy icon for definition key and find the next sibling div which contains the value
    const deploymentIdCopyIcon = page
      .locator('fluxnova-decision-definition-info-section fluxnova-icon[iconname="copy"]')
      .nth(2);
    const deploymentIdValue = (
      await deploymentIdCopyIcon.locator('xpath=following-sibling::div[1]').innerText()
    ).trim();

    // Ensure we got a value before clicking
    expect(deploymentIdValue.length).toBeGreaterThan(0);

    // Click the copy icon
    await deploymentIdCopyIcon.click();

    // Wait a moment for clipboard to update
    await page.waitForTimeout(100);

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(deploymentIdValue);
  });

  test('should navigate to deployment details when deployment ID link is clicked', async ({ page }) => {
    const infoSection = commonElements.leftPanel.locator('fluxnova-decision-definition-info-section');
    await expect(infoSection).toBeVisible();

    // Find the deployment link directly
    const deploymentLink = infoSection.locator('a[href*="deployments"]');
    await expect(deploymentLink).toBeVisible();

    const deploymentId = (await deploymentLink.innerText()).trim();

    // Click the deployment link
    await deploymentLink.click();

    // Wait for navigation to deployment details
    await page.waitForURL(new RegExp(`.*deployments/${deploymentId}.*`));

    // Verify we're on the deployment details page
    await expect(commonElements.headerLabel.first()).toHaveText('DEPLOYMENT');
  });

  test('should display decision requirement definition', async () => {
    const infoSection = commonElements.leftPanel.locator('fluxnova-decision-definition-info-section');
    await expect(infoSection).toBeVisible();

    const drdLabel = infoSection.locator('strong').filter({ hasText: 'Decision Requirement Definition' });
    await expect(drdLabel).toBeVisible();

    const drdValue = drdLabel.locator('..').locator('div').first();
    await expect(drdValue).toBeVisible();
  });

  test('should have all required info panel sections in correct order', async () => {
    const infoSection = commonElements.leftPanel.locator('fluxnova-decision-definition-info-section');
    await expect(infoSection).toBeVisible();

    // Get all strong labels in order and trim whitespace
    const labelsRaw = await infoSection.locator('strong').allInnerTexts();
    const labels = labelsRaw.map((label) => label.trim());

    // Verify all expected labels are present
    expect(labels).toContain('Definition ID');
    expect(labels).toContain('Version');
    expect(labels).toContain('Version Tag');
    expect(labels).toContain('Definition Key');
    expect(labels).toContain('Definition Name');
    expect(labels).toContain('History Time to Live');
    expect(labels).toContain('Deployment ID');
    expect(labels).toContain('Decision Requirement Definition');

    // Verify minimum number of fields
    expect(labels.length).toBeGreaterThanOrEqual(8);
  });
});
