import { expect, test } from '@playwright/test';
import { DecisionDefinitionDetailsPage } from '../../page-objects/decision-definition-details-page.po';
import { CommonElements } from '../../page-objects/common-elements.po';

/**
 * @group regression
 * @group decision-definition
 * @group decision-definition-details
 * @group decision-definition-details-evaluate-decision
 */

let decisionDefinitionPage: DecisionDefinitionDetailsPage;
let commonElements: CommonElements;

/**
 * Decision Rules for 'fluxnova_automation_dish_dmn_simple':
 * - Fall, <= 8 guests: Spareribs
 * - Winter, <= 8 guests: Roastbeef
 * - Spring, <= 4 guests: Dry Aged Gourmet Steak
 * - Spring, 5-8 guests: Steak
 * - Fall/Winter/Spring, > 8 guests: Stew
 * - Summer, any guests: Light Salad and a nice Steak
 */
interface TestCase {
  season: string;
  guestCount: number;
  expectedDish: string;
}

const testCases: TestCase[] = [
  { season: 'Fall', guestCount: 5, expectedDish: 'Spareribs' },
  { season: 'Fall', guestCount: 8, expectedDish: 'Spareribs' },
  { season: 'Winter', guestCount: 3, expectedDish: 'Roastbeef' },
  { season: 'Winter', guestCount: 8, expectedDish: 'Roastbeef' },
  { season: 'Spring', guestCount: 2, expectedDish: 'Dry Aged Gourmet Steak' },
  { season: 'Spring', guestCount: 4, expectedDish: 'Dry Aged Gourmet Steak' },
  { season: 'Spring', guestCount: 6, expectedDish: 'Steak' },
  { season: 'Spring', guestCount: 8, expectedDish: 'Steak' },
  { season: 'Fall', guestCount: 10, expectedDish: 'Stew' },
  { season: 'Winter', guestCount: 12, expectedDish: 'Stew' },
  { season: 'Spring', guestCount: 15, expectedDish: 'Stew' },
  { season: 'Summer', guestCount: 5, expectedDish: 'Light Salad and a nice Steak' },
  { season: 'Summer', guestCount: 20, expectedDish: 'Light Salad and a nice Steak' },
];

/**
 * Helper function to generate random test case
 */
function getRandomTestCase(): TestCase {
  return testCases[Math.floor(Math.random() * testCases.length)];
}

/**
 * Helper function to evaluate a decision with given inputs
 */
test.describe('Decision Definition Details - Evaluate Decision', () => {
  const decisionDefinitionKey = 'fluxnova_automation_dish_dmn_simple';

  test.beforeEach(async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    decisionDefinitionPage = new DecisionDefinitionDetailsPage(page);
    commonElements = new CommonElements(page);
    await decisionDefinitionPage.navigateToDefinitionDetailsPage(decisionDefinitionKey);
    // Wait for the left panel to be visible before running tests
    await expect(commonElements.leftPanel).toBeVisible();
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('should show error with invalid JSON', async ({ page }) => {
    await page.getByRole('button', { name: 'Evaluate Decision' }).click();
    await expect(page.locator('fluxnova-evaluate-decision-modal')).toBeVisible();

    // Enter invalid JSON
    const inputEditor = page.locator('fluxnova-evaluate-decision-modal .monaco-editor').first();
    await inputEditor.click();
    await page.keyboard.type('{ invalid json }');

    // Try to evaluate
    await page.locator('fluxnova-evaluate-decision-modal').getByRole('button', { name: 'Evaluate' }).click();

    // Should show error message
    await expect(page.locator('#failure-message')).toContainText('Errors found in JSON');
  });

  test('should evaluate decision with valid input (random test case)', async ({ page }) => {
    const testCase = getRandomTestCase();

    await page.getByRole('button', { name: 'Evaluate Decision' }).click();
    await expect(page.locator('fluxnova-evaluate-decision-modal')).toBeVisible();

    // Prepare input JSON with correct format
    const inputJson = JSON.stringify({
      variables: {
        season: { value: testCase.season, type: 'String' },
        guestCount: { value: testCase.guestCount, type: 'Long' },
      },
    });

    // Wait for modal to be fully loaded
    await page.waitForTimeout(2000);

    // Set value in Monaco editor by directly accessing the editor instance
    await page.evaluate((json) => {
      const editors = (window as any).monaco?.editor?.getEditors();
      if (editors && editors.length > 0) {
        const editor = editors[0];
        editor.setValue(json);
        editor.trigger('keyboard', 'type', { text: '' }); // Trigger change detection
      }
    }, inputJson);

    // Wait for editor to update
    await page.waitForTimeout(2000);

    // Format JSON before evaluation
    await page.locator('fluxnova-evaluate-decision-modal').getByRole('button', { name: 'Format JSON' }).click();
    await page.waitForTimeout(1000);

    // Click Evaluate button
    await page.locator('fluxnova-evaluate-decision-modal').getByRole('button', { name: 'Evaluate' }).click();

    // Wait for evaluation to complete
    await page.waitForTimeout(3000);

    // Verify no error message is shown
    await expect(page.locator('#failure-message')).not.toBeVisible();

    // Get result directly from Monaco editor's model value
    const resultJson = await page.evaluate(() => {
      const editors = (window as any).monaco?.editor?.getEditors();
      if (editors && editors.length > 1) {
        const resultEditor = editors[1]; // Second editor is the result editor
        const value = resultEditor.getValue();
        if (value) {
          return JSON.parse(value);
        }
      }
      return null;
    });

    expect(resultJson).not.toBeNull();
    expect(resultJson).toBeDefined();
    expect(Array.isArray(resultJson)).toBeTruthy();
    expect(resultJson.length).toBeGreaterThan(0);
    expect(resultJson[0]).toBeDefined();
    expect(resultJson[0].desiredDish).toBeDefined();
    expect(resultJson[0].desiredDish.value).toBe(testCase.expectedDish);
  });
});
