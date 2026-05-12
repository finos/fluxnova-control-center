import { expect, test } from '@playwright/test';
import { DecisionDefinitionDetailsPage } from '../../page-objects/decision-definition-details-page.po';
import { CommonElements } from '../../page-objects/common-elements.po';

let decisionDefinitionPage: DecisionDefinitionDetailsPage;
let commonElements: CommonElements;

test.describe('Decision Definition Detail Diagram Section', () => {
  test.beforeEach(async ({ page }) => {
    decisionDefinitionPage = new DecisionDefinitionDetailsPage(page);
    commonElements = new CommonElements(page);
    await decisionDefinitionPage.navigateToDefinitionDetailsPage('fluxnova_automation_beverage_dmn_simple');
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('should load DMN diagram', async ({ page }) => {
    // DMN diagrams use a different container structure than BPMN
    await expect(page.locator('.canvas')).toBeVisible();
    await expect(page.locator('.dmn-drd-container, .dmn-decision-table-container')).toBeVisible();
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
  });
});
