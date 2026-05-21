import { expect, test } from '@playwright/test';
import { ProcessInstancePage } from '../../page-objects/process-instance-page.po';
import { getProcessDefinitionId, startProcessInstance, terminateProcessInstance } from '../../utils/test-utils';

/**
 * @group regression
 * @group process-instance
 * @group process-instance-details
 * @group process-instance-details-user-tasks-tab
 */

let processInstancePage: ProcessInstancePage;

test.describe('User Tasks Tab', () => {
  let workingInstanceId: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const processDefinitionId = await getProcessDefinitionId('fluxnova_automation_basic', page);
    workingInstanceId = await startProcessInstance(processDefinitionId, page);
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await terminateProcessInstance(workingInstanceId, page);
  });

  test.beforeEach(async ({ page }) => {
    processInstancePage = new ProcessInstancePage(page);
    await processInstancePage.navigateToInstanceDetailsPage(workingInstanceId);

    const userTasksTab = page.locator('fluxnova-user-tasks-tab');
    await expect(userTasksTab).not.toBeVisible();
    await page.locator('li[data-tab="user-tasks"]').click();
    await expect(userTasksTab).toBeVisible();
    await processInstancePage.waitForLoad();

    // Wait for grid to load
    await page.waitForFunction(() => {
      const agRoot = document.querySelector('.ag-root');
      const rowCount = agRoot?.getAttribute('aria-rowcount');
      return rowCount && parseInt(rowCount, 10) > 1;
    });
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('should filter by id', async ({ page }) => {
    const firstUserTask = page.locator('.ag-pinned-left-cols-container').first().locator('.ag-row').first();
    const taskId = (await firstUserTask.locator('div[col-id="id"]').textContent()) ?? '';

    await page.fill('input#id', taskId);
    await page.locator('ng-dropdown-panel').click();
    await expect(firstUserTask).toContainText(taskId);
    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(1);
    await expect(page.locator('li[data-tab="user-tasks"]').locator('div')).toContainText('(1)');

    await page.locator('ng-dropdown-panel').click(); // Close dropdown

    await page.fill('input#id', 'fake-task-id');
    await page.locator('ng-dropdown-panel').click();
    await expect(firstUserTask).toHaveCount(0);
    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(0);
    await expect(page.locator('li[data-tab="user-tasks"]').locator('div')).toContainText('(0)');
  });

  test('should filter by task name', async ({ page }) => {
    const firstUserTask = page.locator('.ag-center-cols-container').first().locator('.ag-row').first();
    const taskName = (await firstUserTask.locator('div[col-id="name"]').textContent()) ?? '';

    await page.fill('input#name', taskName);
    await expect(firstUserTask).toContainText(taskName);

    const taskWithNameCount = await page
      .locator('.ag-center-cols-container')
      .first()
      .locator('.ag-row', { hasText: taskName })
      .count();

    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(taskWithNameCount);
    await expect(page.locator('li[data-tab="user-tasks"]').locator('div')).toContainText(`(${taskWithNameCount})`);

    await page.fill('input#name', 'Fake Task Name');
    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(0);
    await expect(page.locator('li[data-tab="user-tasks"]').locator('div')).toContainText('(0)');
  });

  test('should filter by assignee', async ({ page }) => {
    const firstUserTask = page.locator('.ag-center-cols-container').first().locator('.ag-row').first();
    const assignee = (await firstUserTask.locator('div[col-id="assignee"]').textContent()) ?? '';

    if (assignee && assignee.trim() !== '') {
      await page.fill('input#assignee', assignee);
      await expect(firstUserTask).toContainText(assignee);

      const taskWithAssigneeCount = await page
        .locator('.ag-center-cols-container')
        .first()
        .locator('.ag-row', { hasText: assignee })
        .count();

      await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(
        taskWithAssigneeCount,
      );
      await expect(page.locator('li[data-tab="user-tasks"]').locator('div')).toContainText(
        `(${taskWithAssigneeCount})`,
      );

      await page.fill('input#assignee', 'fake-assignee');
      await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(0);
      await expect(page.locator('li[data-tab="user-tasks"]').locator('div')).toContainText('(0)');
    }
  });

  test('should filter by activity id', async ({ page }) => {
    const firstUserTask = page.locator('.ag-center-cols-container').first().locator('.ag-row').first();
    const activityId = (await firstUserTask.locator('div[col-id="taskDefinitionKey"]').textContent()) ?? '';

    await page.fill('input#taskDefinitionKey', activityId);
    await expect(firstUserTask).toContainText(activityId);

    const taskWithActivityIdCount = await page
      .locator('.ag-center-cols-container')
      .first()
      .locator('.ag-row', { hasText: activityId })
      .count();

    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(
      taskWithActivityIdCount,
    );
    await expect(page.locator('li[data-tab="user-tasks"]').locator('div')).toContainText(
      `(${taskWithActivityIdCount})`,
    );

    await page.fill('input#taskDefinitionKey', 'Fake_Activity_ID');
    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(0);
    await expect(page.locator('li[data-tab="user-tasks"]').locator('div')).toContainText('(0)');
  });

  test('should filter by delegation state', async ({ page }) => {
    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row').first()).toBeVisible();

    const pendingCount = await page
      .locator('.ag-center-cols-container')
      .first()
      .locator('.ag-cell[col-id="delegationState"]')
      .filter({ hasText: 'PENDING' })
      .count();
    const resolvedCount = await page
      .locator('.ag-center-cols-container')
      .first()
      .locator('.ag-cell[col-id="delegationState"]')
      .filter({ hasText: 'RESOLVED' })
      .count();

    // Filter by Pending
    await page.locator('ng-select.delegationState').click();
    await expect(page.locator('ng-dropdown-panel')).toBeVisible();
    await page.locator('ng-dropdown-panel').locator('div[role="option"]', { hasText: 'Pending' }).click();
    await expect(page.locator('ng-dropdown-panel')).toBeHidden();

    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(pendingCount);
    await expect(page.locator('li[data-tab="user-tasks"]').locator('div')).toContainText(`(${pendingCount})`);

    // Filter by Resolved
    await page.locator('ng-select.delegationState').click();
    await expect(page.locator('ng-dropdown-panel')).toBeVisible();
    await page.locator('ng-dropdown-panel').locator('div[role="option"]', { hasText: 'Resolved' }).click();
    await expect(page.locator('ng-dropdown-panel')).toBeHidden();

    await expect(page.locator('.ag-center-cols-container').first().locator('.ag-row')).toHaveCount(resolvedCount);
    await expect(page.locator('li[data-tab="user-tasks"]').locator('div')).toContainText(`(${resolvedCount})`);
  });

  test('should allow moving unpinned columns', async ({ page }) => {
    const activityNameColumnHeader = page.locator('div[role="columnheader"]', { hasText: 'Activity Name' });
    const assigneeColumnHeader = page.locator('div[role="columnheader"]', { hasText: 'Assignee' });

    const initialActivityNameIndex = await activityNameColumnHeader.getAttribute('aria-colindex');
    const initialAssigneeIndex = await assigneeColumnHeader.getAttribute('aria-colindex');

    await activityNameColumnHeader.dragTo(assigneeColumnHeader);

    const newActivityNameIndex = await activityNameColumnHeader.getAttribute('aria-colindex');
    const newAssigneeIndex = await assigneeColumnHeader.getAttribute('aria-colindex');

    expect(newActivityNameIndex).not.toBe(initialActivityNameIndex);
    expect(newAssigneeIndex).not.toBe(initialAssigneeIndex);
  });

  test('should not allow moving pinned left column', async ({ page }) => {
    const pinnedIdColumnHeader = page.locator('div[role="columnheader"]', { hasText: 'ID' }).first();
    const priorityColumnHeader = page.locator('div[role="columnheader"]', { hasText: 'Priority' });

    await expect(pinnedIdColumnHeader).toHaveAttribute('aria-colindex', '1');
    await expect(priorityColumnHeader).toHaveAttribute('aria-colindex', '9');

    await pinnedIdColumnHeader.dragTo(priorityColumnHeader);

    await expect(pinnedIdColumnHeader).toHaveAttribute('aria-colindex', '1');
    await expect(priorityColumnHeader).toHaveAttribute('aria-colindex', '9');
  });

  test('should display all default column headers', async ({ page }) => {
    const expectedHeaders = [
      'ID',
      'Activity Name',
      'Activity ID',
      'Assignee',
      'Owner',
      'Creation Date',
      'Due Date',
      'Follow Up Date',
      'Priority',
      'Delegation State',
    ];

    for (const header of expectedHeaders) {
      const headerElement = page.locator('div[role="columnheader"]', { hasText: header });
      await expect(headerElement.first()).toBeVisible();
    }
  });

  test('should display user task count in tab header', async ({ page }) => {
    const tabHeader = page.locator('li[data-tab="user-tasks"]').locator('div');
    const tabText = await tabHeader.textContent();

    // Verify tab header contains "User Tasks" and a count in parentheses
    expect(tabText).toContain('User Tasks');
    expect(tabText).toMatch(/\(\d+\)/);
  });

  test('should sort columns when clicking header', async ({ page }) => {
    const activityNameColumnHeader = page.locator('div[role="columnheader"]', { hasText: 'Activity Name' });

    // Initially unsorted or default sort
    await activityNameColumnHeader.click();
    await expect(activityNameColumnHeader).toHaveAttribute('aria-sort', /(ascending)/);

    // Click again to toggle sort
    await activityNameColumnHeader.click();
    await expect(activityNameColumnHeader).toHaveAttribute('aria-sort', /(descending)/);

    // Click again to toggle sort
    await activityNameColumnHeader.click();
    await expect(activityNameColumnHeader).toHaveAttribute('aria-sort', /(none)/);
  });
});
