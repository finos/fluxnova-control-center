import { expect, test } from '@playwright/test';
import { activateProcessDefinition } from '../utils/test-utils';
import { ProcessDefinitionsPage } from '../page-objects/process-definitions-page.po';

let processDefinitionsPage: ProcessDefinitionsPage;

test.beforeEach(async ({ page }) => {
  processDefinitionsPage = new ProcessDefinitionsPage(page);
});

test.afterEach(async ({ page }) => {
  await page.close();
});

test('navigates to new process definition detail page on version selection', async ({ page }) => {
  await processDefinitionsPage.navigateToDefinitionDetailsPage('fluxnova_automation_versioned_process');

  await expect(page.locator('fluxnova-process-definition-info-section')).toContainText(
    processDefinitionsPage.processDefinitionId,
  );
  await page.locator('fluxnova-process-definition-info-section span').nth(2).click();
  await page.getByRole('option').first().click();
  await expect(page.locator('fluxnova-process-definition-info-section')).not.toContainText(
    processDefinitionsPage.processDefinitionId,
  );
});

test('suspend and activate the definition', async ({ page }) => {
  // Ensure the definition is active at the beginning of the test
  await activateProcessDefinition('fluxnova_automation_terminate_test', page);

  await processDefinitionsPage.navigateToDefinitionDetailsPage('fluxnova_automation_terminate_test');

  try {
    // Click the action button
    await processDefinitionsPage.suspendButton.click();
    //Click the modal "confirm" button
    await page.getByRole('button', { name: 'Suspend' }).click();

    expect(await processDefinitionsPage.toastHeader.innerText()).toContain('Success');

    await page.reload();

    // Click the action button
    await processDefinitionsPage.activateButton.click();
    //Click the modal "confirm" button
    await page.getByRole('button', { name: 'Activate' }).click();

    expect(await processDefinitionsPage.toastHeader.innerText()).toContain('Success');
  } finally {
    // Ensure the definition is active at the end of the test
    await activateProcessDefinition('fluxnova_automation_terminate_test', page);
  }
});

test.describe('definition canvas/tab interactivity', () => {
  test('should filter incidents tab when an activity is clicked on the diagram', async ({ page }) => {
    await processDefinitionsPage.navigateToDefinitionDetailsPage('fluxnova_automation_incident');
    const targetActivityWithIncidentsId = 'Event_0367z5d';
    const targetActivityWithoutIncidentsId = 'Activity_133vuf6';

    const incidentTabSelector = '[data-tab="incidents"]';
    await page.waitForSelector(incidentTabSelector, { timeout: 5000 });
    await page.click(incidentTabSelector);

    await page
      .locator(`[data-element-id="${targetActivityWithIncidentsId}"]`, { exact: true })
      .first()
      .waitFor({ state: 'visible' });

    await page.waitForSelector('fluxnova-generic-diagram-viewer', { timeout: 5000 });

    const activitySelector = `[data-element-id="${targetActivityWithIncidentsId}"]`;
    await page.waitForSelector(activitySelector, { timeout: 5000 });

    const box = await page.locator(activitySelector).boundingBox();
    if (box) {
      const offsetX = box.width / 2 + 10;
      const offsetY = box.height / 2 - 10;
      await page.click(activitySelector, { position: { x: offsetX, y: offsetY } });
    }

    await page.waitForTimeout(500);

    await expect(page).toHaveURL(
      new RegExp(
        `[?&]activityId=${targetActivityWithIncidentsId}&filteredActivityId=${targetActivityWithIncidentsId}(&|$)`,
      ),
    );

    await page
      .locator(`[data-element-id="${targetActivityWithIncidentsId}"]`, { exact: true })
      .first()
      .waitFor({ state: 'visible' });

    const activityWithoutIncidentsSelector = `[data-element-id="${targetActivityWithoutIncidentsId}"]`;
    await page.waitForSelector(activityWithoutIncidentsSelector, { timeout: 5000 });
    await page.click(activityWithoutIncidentsSelector);

    await page.waitForTimeout(500);

    await expect(page).toHaveURL(
      new RegExp(
        `[?&]activityId=${targetActivityWithoutIncidentsId}&filteredActivityId=${targetActivityWithoutIncidentsId}(&|$)`,
      ),
    );

    await expect(page.getByText(targetActivityWithIncidentsId, { exact: true }).first()).not.toBeVisible();
  });

  test('should filter called process definitions tab when an activity is clicked on the diagram', async ({ page }) => {
    await processDefinitionsPage.navigateToDefinitionDetailsPage('fluxnova_automation_call_activity');
    const targetActivityWithCalledProcessDefinitionsId = 'Activity_0rab2zo';
    const targetActivityWithoutCalledProcessDefinitionsId = 'StartEvent_1';

    const calledProcessDefinitionsTabSelector = '[data-tab="called-process-definitions"]';
    await page.waitForSelector(calledProcessDefinitionsTabSelector, { timeout: 5000 });
    await page.click(calledProcessDefinitionsTabSelector);

    await page
      .getByText(targetActivityWithCalledProcessDefinitionsId, { exact: true })
      .first()
      .waitFor({ state: 'visible' });

    await page.waitForSelector('fluxnova-generic-diagram-viewer', { timeout: 5000 });

    await page.locator(`[data-element-id="${targetActivityWithCalledProcessDefinitionsId}"]`).click();

    await page.waitForTimeout(500);

    await expect(page).toHaveURL(
      new RegExp(
        `[?&]activityId=${targetActivityWithCalledProcessDefinitionsId}&filteredActivityId=${targetActivityWithCalledProcessDefinitionsId}(&|$)`,
      ),
    );

    await expect(page.getByText(targetActivityWithCalledProcessDefinitionsId, { exact: true }).first()).toBeVisible();

    const activityWithoutCalledProcessDefinitionsSelector = `[data-element-id="${targetActivityWithoutCalledProcessDefinitionsId}"]`;
    await page.waitForSelector(activityWithoutCalledProcessDefinitionsSelector, { timeout: 5000 });
    await page.click(activityWithoutCalledProcessDefinitionsSelector);

    await page.waitForTimeout(500);

    await expect(page).toHaveURL(
      new RegExp(
        `[?&]activityId=${targetActivityWithoutCalledProcessDefinitionsId}&filteredActivityId=${targetActivityWithoutCalledProcessDefinitionsId}(&|$)`,
      ),
    );

    await expect(
      page.getByText(targetActivityWithCalledProcessDefinitionsId, { exact: true }).first(),
    ).not.toBeVisible();
  });

  test('should filter job definitions tab when an activity is clicked on the diagram', async ({ page }) => {
    await processDefinitionsPage.navigateToDefinitionDetailsPage('fluxnova_automation_basic');
    const targetActivityWithJobDefinitionId = 'Event_0ukhwx0';
    const targetActivityWithoutJobDefinitionId = 'Empty_Task';

    const jobDefinitionsTabSelector = '[data-tab="job-definitions"]';
    await page.waitForSelector(jobDefinitionsTabSelector, { timeout: 5000 });
    await page.click(jobDefinitionsTabSelector);

    await page.getByText(targetActivityWithJobDefinitionId, { exact: true }).first().waitFor({ state: 'visible' });

    await page.waitForSelector('fluxnova-generic-diagram-viewer', { timeout: 5000 });

    const activitySelector = `[data-element-id="${targetActivityWithJobDefinitionId}"]`;
    await page.waitForSelector(activitySelector, { timeout: 5000 });

    const box = await page.locator(activitySelector).boundingBox();
    if (box) {
      const offsetX = box.width / 2 + 10;
      const offsetY = box.height / 2 - 10;
      await page.click(activitySelector, { position: { x: offsetX, y: offsetY } });
    }

    await page.waitForTimeout(500);

    await expect(page).toHaveURL(
      new RegExp(
        `[?&]activityId=${targetActivityWithJobDefinitionId}&filteredActivityId=${targetActivityWithJobDefinitionId}(&|$)`,
      ),
    );

    await expect(page.getByText(targetActivityWithJobDefinitionId, { exact: true }).first()).toBeVisible();

    const activityWithoutJobDefinitionSelector = `[data-element-id="${targetActivityWithoutJobDefinitionId}"]`;
    await page.waitForSelector(activityWithoutJobDefinitionSelector, { timeout: 5000 });
    await page.click(activityWithoutJobDefinitionSelector);

    await page.waitForTimeout(500);

    await expect(page).toHaveURL(
      new RegExp(
        `[?&]activityId=${targetActivityWithoutJobDefinitionId}&filteredActivityId=${targetActivityWithoutJobDefinitionId}(&|$)`,
      ),
    );

    await expect(page.getByText(targetActivityWithJobDefinitionId, { exact: true }).first()).not.toBeVisible();
  });

  test('should filter decision instances tab when an activity is clicked on the diagram', async ({ page }) => {
    await processDefinitionsPage.navigateToDefinitionDetailsPage('fluxnova_automation_basic');
    const targetActivity = 'Empty_Task';

    const decisionInstancesTabSelector = '[data-tab="decision-instances"]';
    await page.waitForSelector(decisionInstancesTabSelector, { timeout: 5000 });
    await page.click(decisionInstancesTabSelector);

    await page.waitForTimeout(500);
    await page.waitForSelector('fluxnova-generic-diagram-viewer', { timeout: 5000 });

    const activitySelector = `[data-element-id="${targetActivity}"]`;
    await page.waitForSelector(activitySelector, { timeout: 5000 });
    await page.click(activitySelector);

    await page.waitForTimeout(500);

    await expect(page).toHaveURL(
      new RegExp(`[?&]activityId=${targetActivity}&filteredActivityId=${targetActivity}(&|$)`),
    );

    await expect(page.getByText(targetActivity, { exact: true }).first()).not.toBeVisible();
  });
});
