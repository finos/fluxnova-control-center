import { expect, test } from '@playwright/test';
import { BasePage } from '../page-objects/base-page.po';

let idElement: any;
let id: string;

test.beforeEach(async ({ page }) => {
  await page.goto(`./${BasePage.TENANT}/deployments?sorting=%5B%7B"colId":"deploymentTime","sort":"desc"%7D%5D`);
  idElement = page.locator('.ag-row-first').first().locator('.text-primary');
  id = await idElement.innerHTML();
});

test('Shows information in the side bar that shows in the list', async ({ page }) => {
  const firstRow = page.locator('.ag-center-cols-container').getByRole('row').first();
  const time = await firstRow.locator('.contents').nth(1).innerHTML();
  const source = await firstRow.locator('.contents').nth(2).innerHTML();
  const name = await firstRow.locator('.contents').nth(0).innerHTML();

  await idElement.click();

  await expect(page.locator('fluxnova-deployment-info-section')).toBeVisible();

  await expect(page.locator('#deploymentName')).toContainText(name);
  await expect(page.locator('#deploymentId')).toContainText(id);
  await expect(page.locator('#deploymentTime')).toContainText(time);
  await expect(page.locator('#deploymentSource')).toContainText(source);
});

test('Diagram should be visible if a .bpmn file is selected', async ({ page }) => {
  // TODO: This needs to be converted to an me2e test where it can check correct states for .groovy, .js, and other files
  idElement.click();
  const resourceEl = page.locator('.resource').first();
  const resourceName = await resourceEl.innerHTML();
  const extension = resourceName.split('.').slice(-1)[0];
  if (extension === '.bpmn') {
    await resourceEl.click();
    await expect(page.locator('.bpmn-canvas')).toBeVisible();
  }
});
