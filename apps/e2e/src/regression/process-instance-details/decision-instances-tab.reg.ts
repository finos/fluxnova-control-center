import { expect, test } from '@playwright/test';
import { ProcessInstancePage } from '../../page-objects/process-instance-page.po';
import { getProcessDefinitionId, startProcessInstance, terminateProcessInstance } from '../../utils/test-utils';

let processInstancePage: ProcessInstancePage;

test.describe('Decision Instances Tab', () => {
  let workingInstanceId: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const dmnProcessDefinitionId = await getProcessDefinitionId('fluxnova_automation_bpmn_with_dmn_simple', page);
    const variables = {
      alcoholAcceptable: {
        value: true,
        type: 'Boolean',
      },
      season: {
        value: 'Fall',
        type: 'String',
      },
      guestCount: {
        value: 6,
        type: 'Long',
      },
    };
    workingInstanceId = await startProcessInstance(dmnProcessDefinitionId, page, variables);
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await terminateProcessInstance(workingInstanceId, page);
  });

  test.beforeEach(async ({ page }) => {
    processInstancePage = new ProcessInstancePage(page);
    await processInstancePage.navigateToInstanceDetailsPage(workingInstanceId);

    const decisionInstancesTab = page.locator('fluxnova-decision-instance-list');
    await expect(decisionInstancesTab).not.toBeVisible();
    await page.locator('li[data-tab="decision-instances"]').click();
    await expect(decisionInstancesTab).toBeVisible();
    await processInstancePage.waitForLoad();
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('should filter by id', async ({ page }) => {
    const firstDecisionInstance = page.locator('.ag-pinned-left-cols-container').first().locator('.ag-row').first();
    const instanceId = (await firstDecisionInstance.locator('div[col-id="id"]').textContent()) ?? '';

    await page.fill('input#id', instanceId);
    await page.locator('ng-dropdown-panel').click();
    await expect(firstDecisionInstance).toContainText(instanceId);
    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(1);
    await expect(page.locator('li[data-tab="decision-instances"]').locator('div')).toContainText('(1)');

    await page.locator('ng-dropdown-panel').click();

    await page.waitForTimeout(500);

    await page.fill('input#id', 'fake-id');
    await page.locator('ng-dropdown-panel').click();
    await expect(firstDecisionInstance).toHaveCount(0);
    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(0);
    await expect(page.locator('li[data-tab="decision-instances"]').locator('div')).toContainText('(0)');
  });

  test('should filter by activity id', async ({ page }) => {
    const firstDecisionInstance = page.locator('.ag-center-cols-container').first().locator('.ag-row').first();
    const activityId = (await firstDecisionInstance.locator('div[col-id="activityId"]').textContent()) ?? '';
    const decisionInstanceWithActivityIdCount = await page
      .locator('.ag-center-cols-container')
      .first()
      .locator('.ag-row', { hasText: activityId })
      .count();

    await page.fill('input#activityId', activityId);
    await expect(firstDecisionInstance).toContainText(activityId);
    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(
      decisionInstanceWithActivityIdCount,
    );
    await expect(page.locator('li[data-tab="decision-instances"]').locator('div')).toContainText(
      `(${decisionInstanceWithActivityIdCount})`,
    );

    await page.fill('input#activityId', '');

    await page.waitForTimeout(500);

    await page.fill('input#activityId', 'fake_activity_id');
    await expect(firstDecisionInstance).toHaveCount(0);
    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(0);
    await expect(page.locator('li[data-tab="decision-instances"]').locator('div')).toContainText('(0)');
  });

  test('should allow moving unpinned columns', async ({ page }) => {
    const evaluationTimeColumnHeader = page.locator('div[role="columnheader"]', { hasText: 'Evaluation Time' });
    const activityIdColumnHeader = page.locator('div[role="columnheader"]', { hasText: 'Activity ID' });

    await expect(evaluationTimeColumnHeader).toHaveAttribute('aria-colindex', '2');
    await expect(activityIdColumnHeader).toHaveAttribute('aria-colindex', '3');

    await evaluationTimeColumnHeader.dragTo(activityIdColumnHeader);

    await expect(evaluationTimeColumnHeader).toHaveAttribute('aria-colindex', '3');
    await expect(activityIdColumnHeader).toHaveAttribute('aria-colindex', '2');
  });

  test('should not allow moving pinned left column', async ({ page }) => {
    const pinnedIdColumnHeader = page.locator('div[role="columnheader"]', { hasText: 'ID' }).first();
    const evaluationTimeColumnHeader = page.locator('div[role="columnheader"]', { hasText: 'Evaluation Time' });

    await expect(pinnedIdColumnHeader).toHaveAttribute('aria-colindex', '1');
    await expect(evaluationTimeColumnHeader).toHaveAttribute('aria-colindex', '2');

    await pinnedIdColumnHeader.dragTo(evaluationTimeColumnHeader);

    await expect(pinnedIdColumnHeader).toHaveAttribute('aria-colindex', '1');
    await expect(evaluationTimeColumnHeader).toHaveAttribute('aria-colindex', '2');
  });
});
