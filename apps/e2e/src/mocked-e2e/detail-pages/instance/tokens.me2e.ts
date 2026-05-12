import { expect, test } from '@playwright/test';
import mockProcessInstances from '../../../fixtures/process-instances/sub-process-with-incident.json';
import mockHistory from '../../../fixtures/process-instances/sub-process-with-incident-history.json';
import mockActivityInstances from '../../../fixtures/process-instances/activity-instances-sub-process-with-incident.json';
import mockDiagram from '../../../fixtures/process-definitions/sub-process-with-incident-diagram.json';
import { ProcessInstancePage } from '../../../page-objects/process-instance-page.po';

let processInstancePage: ProcessInstancePage;

const PROCESS_INSTANCE_ID = '2e75d495-476f-11ee-a2d5-0e8c5913822b';

test.beforeEach(async ({ context, page }) => {
  processInstancePage = new ProcessInstancePage(page, PROCESS_INSTANCE_ID, 'history');

  await processInstancePage.stubAuth(context);
  await processInstancePage.stubApisCalledOnLoad();
  await processInstancePage.stubConfig(false);

  await processInstancePage.stubProcessInstances({
    status: 200,
    json: mockProcessInstances,
  });

  await processInstancePage.stubHistoryEndpoint({
    status: 200,
    json: mockHistory,
  });

  await processInstancePage.stubActivityInstancesEndpoint({
    status: 200,
    json: mockActivityInstances,
  });

  await processInstancePage.stubDiagramEndpoint({
    status: 200,
    json: mockDiagram,
  });

  await processInstancePage.goto();
});

test.describe('Tokens', () => {
  test.describe('Instance', () => {
    test('should display active, incident, and terminated icons on activity with correct count', async ({ page }) => {
      const bpmnCanvas = page.locator('.canvas');

      expect(
        (await page.locator('[data-container-id="Activity_17olxgq"] .terminated-token').textContent())?.trim(),
      ).toBeTruthy();
      expect(
        (await page.locator('[data-container-id="Activity_17olxgq"] .active-token').textContent())?.trim(),
      ).toBeTruthy();
      expect(
        (await page.locator('[data-container-id="Activity_17olxgq"] .incident-diagram-icon').textContent())?.trim(),
      ).toBeTruthy();

      await expect(bpmnCanvas).toBeVisible();
    });

    test('should display completed token icon with correct count', async ({ page }) => {
      expect(await page.locator('[data-container-id="Gateway_085fw7d"] .completed-token').textContent()).toBeTruthy();
    });

    test('should show remove token icon on diagram', async ({ page }) => {
      const elementToRightClick = page.locator('[data-element-id="Activity_0ntu1ef"]');
      await processInstancePage.moveTokensButton.click();

      await elementToRightClick.click({ button: 'right' });

      const removeTokenElement = page.locator('[data-action="remove_token"]');

      await removeTokenElement.click();

      const elementToBeVisible = page.locator('.remove-token');

      await expect(elementToBeVisible).toBeVisible();
    });

    test('should show add token icon on diagram', async ({ page }) => {
      const elementToRightClick = page.locator('[data-element-id="Activity_14l3kgh"]');

      await processInstancePage.moveTokensButton.click();

      await elementToRightClick.click({ button: 'right' });

      const addTokenElement = page.locator('[data-action="add_token"]');

      await addTokenElement.click();

      const elementToBeVisible = page.locator('.add-token');

      await expect(elementToBeVisible).toBeVisible();
    });

    test('should close add token context menu if click outside of diagram', async ({ page }) => {
      const elementToRightClick = page.locator('[data-element-id="Activity_14l3kgh"]');

      await elementToRightClick.click({ button: 'right' });

      await page.mouse.click(0, 0);

      const elementToNOTBeVisible = page.locator('#context-menu');

      await expect(elementToNOTBeVisible).not.toBeVisible();
    });
  });
});
