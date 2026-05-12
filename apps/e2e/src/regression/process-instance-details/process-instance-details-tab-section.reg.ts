import { expect, test } from '@playwright/test';
import {
  extractNumber,
  getProcessDefinitionId,
  startProcessInstance,
  terminateProcessInstance,
  terminateProcessInstances,
} from '../../utils/test-utils';
import { ProcessInstancePage } from '../../page-objects/process-instance-page.po';

/**
 * @group regression
 * @group process-instance
 * @group process-instance-details
 * @group process-instance-details-tab-section
 */

let processInstancePage: ProcessInstancePage;

test.describe('Process Instance Detail Tab Section', () => {
  const workingInstanceIds: { [key: string]: string } = {};
  const processKeys = [
    'fluxnova_automation_basic',
    'fluxnova_automation_incident',
    'fluxnova_automation_call_activity',
  ];

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const basicProcessDefinitionId = await getProcessDefinitionId('fluxnova_automation_basic', page);
    workingInstanceIds['fluxnova_automation_basic'] = await startProcessInstance(basicProcessDefinitionId, page);
    const incidentsProcessDefinitionId = await getProcessDefinitionId('fluxnova_automation_incident', page);
    workingInstanceIds['fluxnova_automation_incident'] = await startProcessInstance(incidentsProcessDefinitionId, page);
    const callActivityProcessDefinitionId = await getProcessDefinitionId('fluxnova_automation_call_activity', page);
    workingInstanceIds['fluxnova_automation_call_activity'] = await startProcessInstance(
      callActivityProcessDefinitionId,
      page,
    );

    // Wait for the call activity process to stabilize before terminating
    await page.waitForTimeout(1000);
    await terminateProcessInstance(workingInstanceIds['fluxnova_automation_call_activity'], page);
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    delete workingInstanceIds['fluxnova_automation_call_activity'];
    await terminateProcessInstances(Object.values(workingInstanceIds), page);
  });

  for (const processKey of processKeys) {
    test.describe(`Counts for ${processKey}`, () => {
      test.beforeEach(async ({ page }) => {
        processInstancePage = new ProcessInstancePage(page);
        await processInstancePage.navigateToInstanceDetailsPage(workingInstanceIds[processKey]);
      });

      test.afterEach(async ({ page }) => {
        await page.close();
      });

      test(`should have correct variables tab count for ${processKey}`, async ({ page }) => {
        await page.waitForResponse(
          (response) =>
            (response.url().includes('/variables/count') ||
              response.url().includes('/variables/variable-history/count')) &&
            response.status() === 201,
        );
        const variablesTab = page.locator('fluxnova-variables-tab');
        await processInstancePage.waitForLoad();
        await expect(variablesTab).toBeVisible();
        await expect(page.locator('.ag-root')).toHaveAttribute('aria-rowcount', /.+/);
        const variablesTabCount = extractNumber(
          await page.locator('li[data-tab="variables"]').locator('div').innerText(),
        );
        const variablesRowCount = Number((await page.locator('.ag-root').getAttribute('aria-rowcount')) ?? 0) - 2;
        expect(variablesTabCount).toEqual(variablesRowCount);
      });

      test(`should have correct incidents tab count for ${processKey}`, async ({ page }) => {
        await page.waitForResponse(
          (response) => response.url().includes('/incidents/count') && response.status() === 201,
        );
        const incidentsTab = page.locator('fluxnova-incidents-tab');
        await expect(incidentsTab).not.toBeVisible();
        await page.locator('li[data-tab="incidents"]').click();
        await processInstancePage.waitForLoad();
        await expect(incidentsTab).toBeVisible();
        await expect(page.locator('.ag-root')).toHaveAttribute('aria-rowcount', /.+/);
        const incidentsTabCount = extractNumber(
          await page.locator('li[data-tab="incidents"]').locator('div').innerText(),
        );
        const incidentsRowCount = Number((await page.locator('.ag-root').getAttribute('aria-rowcount')) ?? 0) - 2;
        expect(incidentsTabCount).toEqual(incidentsRowCount);
      });

      test(`should have correct called process instances tab count for ${processKey}`, async ({ page }) => {
        await page.waitForResponse(
          (response) => response.url().includes('/activity-instances') && response.status() === 200,
        );
        const calledProcessInstancesTab = page.locator('fluxnova-static-called-process-instances');
        await expect(calledProcessInstancesTab).not.toBeVisible();
        await page.locator('li[data-tab="called-process-instances"]').click();
        await processInstancePage.waitForLoad();
        await expect(calledProcessInstancesTab).toBeVisible();
        await expect(page.locator('.ag-root')).toHaveAttribute('aria-rowcount', /.+/);
        const calledProcessInstancesTabCount = extractNumber(
          await page.locator('li[data-tab="called-process-instances"]').locator('div').innerText(),
        );
        const calledProcessInstancesRowCount =
          Number((await page.locator('.ag-root').getAttribute('aria-rowcount')) ?? 0) - 2;
        expect(calledProcessInstancesTabCount).toEqual(calledProcessInstancesRowCount);
      });

      if (processKey !== 'fluxnova_automation_call_activity') {
        test(`should have correct jobs tab count for ${processKey}`, async ({ page }) => {
          await page.waitForResponse((response) => response.url().includes('/jobs/count') && response.status() === 201);
          const jobsTab = page.locator('fluxnova-jobs-tab');
          await expect(jobsTab).not.toBeVisible();
          await page.locator('li[data-tab="jobs"]').click();
          await processInstancePage.waitForLoad();
          await expect(jobsTab).toBeVisible();
          await expect(page.locator('.ag-root')).toHaveAttribute('aria-rowcount', /.+/);
          const jobsTabCount = extractNumber(await page.locator('li[data-tab="jobs"]').locator('div').innerText());
          const jobsRowCount = Number((await page.locator('.ag-root').getAttribute('aria-rowcount')) ?? 0) - 2;
          expect(jobsTabCount).toEqual(jobsRowCount);
        });
      }

      test(`should have correct history tab count for ${processKey}`, async ({ page }) => {
        await page.waitForResponse((response) => response.url().includes('/history') && response.status() === 200);
        const historyTab = page.locator('fluxnova-history-tab');
        await expect(historyTab).not.toBeVisible();
        await page.locator('li[data-tab="history"]').click();
        await processInstancePage.waitForLoad();
        await expect(historyTab).toBeVisible();
        await expect(page.locator('.ag-root')).toHaveAttribute('aria-rowcount', /.+/);
        const historyTabCount = extractNumber(await page.locator('li[data-tab="history"]').locator('div').innerText());
        const historyRowCount = Number((await page.locator('.ag-root').getAttribute('aria-rowcount')) ?? 0) - 1;
        expect(historyTabCount).toEqual(historyRowCount);
      });

      test(`should have correct decision instances tab count for ${processKey}`, async ({ page }) => {
        await page.waitForResponse(
          (response) => response.url().includes('/decision-instances/count') && response.status() === 200,
        );
        const decisionInstancesTab = page.locator('fluxnova-decision-instance-list');
        await expect(decisionInstancesTab).not.toBeVisible();
        await page.locator('li[data-tab="decision-instances"]').click();
        await processInstancePage.waitForLoad();
        await expect(decisionInstancesTab).toBeVisible();
        await expect(page.locator('.ag-root')).toHaveAttribute('aria-rowcount', /.+/);
        const decisionInstancesTabCount = extractNumber(
          await page.locator('li[data-tab="decision-instances"]').locator('div').innerText(),
        );
        const decisionInstancesRowCount =
          Number((await page.locator('.ag-root').getAttribute('aria-rowcount')) ?? 0) - 2;
        expect(decisionInstancesTabCount).toEqual(decisionInstancesRowCount);
      });
    });
  }
});
