import { expect, test } from '@playwright/test';
import { ProcessInstancePage } from '../page-objects/process-instance-page.po';
import {
  activateProcessDefinition,
  getProcessDefinitionId,
  startProcessInstance,
  terminateProcessInstances,
} from '../utils/test-utils';

let processInstancePage: ProcessInstancePage;
const workingInstanceIds: { [key: string]: string } = {};

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  await activateProcessDefinition('fluxnova_automation_basic', page);
  const basicProcessDefinitionId = await getProcessDefinitionId('fluxnova_automation_basic', page);
  workingInstanceIds['fluxnova_automation_basic'] = await startProcessInstance(basicProcessDefinitionId, page);
  await activateProcessDefinition('fluxnova_automation_incident', page);
  const incidentsProcessDefinitionId = await getProcessDefinitionId('fluxnova_automation_incident', page);
  workingInstanceIds['fluxnova_automation_incident'] = await startProcessInstance(incidentsProcessDefinitionId, page);
  await activateProcessDefinition('fluxnova_automation_call_activity', page);
  const callActivityProcessDefinitionId = await getProcessDefinitionId('fluxnova_automation_call_activity', page);
  workingInstanceIds['fluxnova_automation_call_activity'] = await startProcessInstance(
    callActivityProcessDefinitionId,
    page,
  );
});

test.afterAll(async ({ browser }) => {
  const page = await browser.newPage();
  await terminateProcessInstances(Object.values(workingInstanceIds), page);
});

test.beforeEach(async ({ page }) => {
  processInstancePage = new ProcessInstancePage(page);
});

test.afterEach(async ({ page }) => {
  await page.close();
});

test('suspend and activate the instance', async ({ page }) => {
  await processInstancePage.navigateToInstanceDetailsPage(workingInstanceIds['fluxnova_automation_basic']);
  await processInstancePage.suspendButton.click();
  await page.getByRole('button', { name: 'Suspend' }).click();

  expect(await processInstancePage.toastHeader.innerText()).toContain('Success');

  await page.reload();

  await processInstancePage.activateButton.click();
  await page.getByRole('button', { name: 'Activate' }).click();

  expect(await processInstancePage.toastHeader.innerText()).toContain('Success');
});

test.describe('variables tab', () => {
  test.beforeEach(async () => {
    await processInstancePage.navigateToInstanceDetailsPage(workingInstanceIds['fluxnova_automation_basic']);
  });

  test('should sort by variable name', async ({ page }) => {
    const nameHeader = page.locator('div[role="columnheader"][col-id="name"]');
    await expect(nameHeader).toBeVisible();

    // Click header and verify the request is sending sortOrder as desc
    await Promise.all([
      page.waitForRequest(
        (request) =>
          request.url().includes('variables') &&
          request.method() === 'POST' &&
          request.postDataJSON()?.filter?.sortOrder === 'desc',
      ),
      nameHeader.click(),
    ]);

    // Click header and verify the request isn't sending sortOrder
    await Promise.all([
      page.waitForRequest(
        (request) =>
          request.url().includes('variables') &&
          request.method() === 'POST' &&
          !request.postDataJSON()?.filter?.sortOrder,
      ),
      nameHeader.click(),
    ]);

    // wait for memoization
    await page.waitForTimeout(2000);

    // Click header and verify the request is sending sortOrder as asc
    await Promise.all([
      page.waitForRequest(
        (request) =>
          request.url().includes('variables') &&
          request.method() === 'POST' &&
          request.postDataJSON()?.filter?.sortOrder === 'asc',
      ),
      nameHeader.click(),
    ]);
  });

  test('should filter tab by variable name', async ({ page }) => {
    await page.locator('#name').click();

    // Click header and verify the request is sending sortOrder as asc
    await Promise.all([
      page.waitForRequest(
        (request) =>
          request.url().includes('variables') &&
          request.method() === 'POST' &&
          request.postDataJSON()?.filter?.variableNameLike === '%myTestVariable%',
      ),
      page.locator('#name').fill('myTestVariable'),
    ]);
  });
});

test.describe('instance canvas/tab interactivity', () => {
  test('should filter incidents tab when an activity is clicked on the diagram', async ({ page }) => {
    await processInstancePage.navigateToInstanceDetailsPage(workingInstanceIds['fluxnova_automation_incident']);
    const targetActivityWithIncidentsId = 'Event_0367z5d';
    const targetActivityWithoutIncidentsId = 'Activity_133vuf6';

    const incidentTabSelector = '[data-tab="incidents"]';
    await page.waitForSelector(incidentTabSelector, { timeout: 5000 });
    await page.click(incidentTabSelector);

    await page.getByText(targetActivityWithIncidentsId, { exact: true }).first().waitFor({ state: 'visible' });

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

    await expect(page.getByText(targetActivityWithIncidentsId, { exact: true }).first()).toBeVisible();

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

  test('should filter called process instances tab when an activity is clicked on the diagram', async ({ page }) => {
    await processInstancePage.navigateToInstanceDetailsPage(workingInstanceIds['fluxnova_automation_call_activity']);
    const targetActivityWithCalledProcessInstancesId = 'Activity_0rab2zo';
    const targetActivityWithoutCalledProcessInstancesId = 'StartEvent_1';

    const calledProcessInstancesTabSelector = '[data-tab="called-process-instances"]';
    await page.waitForSelector(calledProcessInstancesTabSelector, { timeout: 5000 });
    await page.click(calledProcessInstancesTabSelector);

    await page
      .getByText(targetActivityWithCalledProcessInstancesId, { exact: true })
      .first()
      .waitFor({ state: 'visible' });

    await page.waitForSelector('fluxnova-generic-diagram-viewer', { timeout: 5000 });

    const activitySelector = `[data-element-id="${targetActivityWithCalledProcessInstancesId}"]`;
    await page.waitForSelector(activitySelector, { timeout: 5000 });

    await page.click(activitySelector);

    await page.waitForTimeout(500);

    await expect(page).toHaveURL(
      new RegExp(
        `[?&]activityId=${targetActivityWithCalledProcessInstancesId}&filteredActivityId=${targetActivityWithCalledProcessInstancesId}(&|$)`,
      ),
    );

    await expect(page.getByText(targetActivityWithCalledProcessInstancesId, { exact: true }).first()).toBeVisible();

    const activityWithoutCalledProcessInstancesSelector = `[data-element-id="${targetActivityWithoutCalledProcessInstancesId}"]`;
    await page.waitForSelector(activityWithoutCalledProcessInstancesSelector, { timeout: 5000 });
    await page.click(activityWithoutCalledProcessInstancesSelector);

    await page.waitForTimeout(500);

    await expect(page).toHaveURL(
      new RegExp(
        `[?&]activityId=${targetActivityWithoutCalledProcessInstancesId}&filteredActivityId=${targetActivityWithoutCalledProcessInstancesId}(&|$)`,
      ),
    );

    await expect(page.getByText(targetActivityWithCalledProcessInstancesId, { exact: true }).first()).not.toBeVisible();
  });

  test('should filter jobs tab when an activity is clicked on the diagram', async ({ page }) => {
    await processInstancePage.navigateToInstanceDetailsPage(workingInstanceIds['fluxnova_automation_basic']);
    const targetActivityWithJobId = 'Event_0ukhwx0';
    const targetActivityWithoutJobId = 'Empty_Task';

    const jobsTabSelector = '[data-tab="jobs"]';
    await page.waitForSelector(jobsTabSelector, { timeout: 5000 });
    await page.click(jobsTabSelector);

    await page.getByText(targetActivityWithJobId, { exact: true }).first().waitFor({ state: 'visible' });

    await page.waitForSelector('fluxnova-generic-diagram-viewer', { timeout: 5000 });

    const activitySelector = `[data-element-id="${targetActivityWithJobId}"]`;
    await page.waitForSelector(activitySelector, { timeout: 5000 });

    const box = await page.locator(activitySelector).boundingBox();
    if (box) {
      const offsetX = box.width / 2 + 10;
      const offsetY = box.height / 2 - 10;
      await page.click(activitySelector, { position: { x: offsetX, y: offsetY } });
    }

    await page.waitForTimeout(500);

    await expect(page).toHaveURL(
      new RegExp(`[?&]activityId=${targetActivityWithJobId}&filteredActivityId=${targetActivityWithJobId}(&|$)`),
    );

    await expect(page.getByText(targetActivityWithJobId, { exact: true }).first()).toBeVisible();

    const activityWithoutJobSelector = `[data-element-id="${targetActivityWithoutJobId}"]`;
    await page.waitForSelector(activityWithoutJobSelector, { timeout: 5000 });
    await page.click(activityWithoutJobSelector);

    await page.waitForTimeout(500);

    await expect(page).toHaveURL(
      new RegExp(`[?&]activityId=${targetActivityWithoutJobId}&filteredActivityId=${targetActivityWithoutJobId}(&|$)`),
    );

    await expect(page.getByText(targetActivityWithJobId, { exact: true }).first()).not.toBeVisible();
  });

  test('should filter decision instances tab when an activity is clicked on the diagram', async ({ page }) => {
    await processInstancePage.navigateToInstanceDetailsPage(workingInstanceIds['fluxnova_automation_basic']);
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
