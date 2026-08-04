import { expect, test } from '@playwright/test';
import { checkFluxnovaIcon, checkLeftNavBar } from '../../shared/layout';
import { ProcessDefinitionsPage } from '../../page-objects/process-definitions-page.po';
import { ActionButtons, CommonElements, ProcessDefinitionTabs } from '../../page-objects/common-elements.po';

test.describe('Process Definitions Details Page Layout', () => {
  let processDefinitionsPage: ProcessDefinitionsPage;
  let commonElements: CommonElements;
  let actionButtons: ActionButtons;
  let tabs: ProcessDefinitionTabs;

  test.beforeEach(async ({ page }) => {
    processDefinitionsPage = new ProcessDefinitionsPage(page);
    commonElements = new CommonElements(page);
    actionButtons = new ActionButtons(page);
    tabs = new ProcessDefinitionTabs(page);
    await processDefinitionsPage.navigateToDefinitionDetailsPage('fluxnova_automation_basic');
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('should display Fluxnova Icon in top left', async ({ page }) => {
    await checkFluxnovaIcon(page);
  });

  test('should display process definitions page title', async ({ page }) => {
    await expect(page.getByText('PROCESS DEFINITION', { exact: true })).toBeVisible();
  });

  test('should display diagram', async ({ page }) => {
    await expect(page.getByRole('img').filter({ hasText: 'Fluxnova UI Automation - User' })).toBeVisible();
  });

  test('should display proper headers in info section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Fluxnova UI Automation - Basic' })).toBeVisible();
    await expect(page.getByText('Definition ID')).toBeVisible();
    await expect(page.getByText('Version', { exact: true })).toBeVisible();
    await expect(page.getByText('Status', { exact: true })).toBeVisible();
    await expect(page.getByText('Definition Key')).toBeVisible();
    await expect(page.getByText('Definition Resource')).toBeVisible();
    await expect(page.getByText('Category')).toBeVisible();
    await expect(page.getByText('Deployment ID')).toBeVisible();
    await expect(page.getByText('History Time to Live')).toBeVisible();
  });

  test('should display bulk action buttons', async () => {
    await expect(actionButtons.suspend.getByRole('button')).toBeVisible();
    await expect(actionButtons.delete.getByRole('button')).toBeVisible();
    await expect(actionButtons.download.getByRole('button')).toBeVisible();
  });

  test('should display canvas zoom controls', async () => {
    await expect(commonElements.resetZoomButton).toBeVisible();
    await expect(commonElements.zoomOutButton).toBeVisible();
    await expect(commonElements.zoomInButton).toBeVisible();
  });

  test('should display heat map button and menu upon click', async ({ page }) => {
    await expect(commonElements.heatMapButton).toBeVisible();
    await commonElements.heatMapButton.click();
    await expect(page.getByRole('button', { name: 'Heatmap Settings' })).toBeVisible();
    await page.getByRole('button', { name: 'Heatmap Settings' }).click();
    await expect(page.locator('div').filter({ hasText: 'Time Spent' }).first()).toBeVisible();
    await expect(page.locator('div').filter({ hasText: 'Past month' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Update' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Heatmap Settings' })).toBeVisible();
  });

  test('should display token toggle button', async () => {
    await expect(commonElements.tokenToggleButton).toBeVisible();
  });

  test('should display start process button', async () => {
    await expect(actionButtons.startProcess).toBeVisible();
  });

  test('should expand left side bar on click in non-link area', async ({ page }) => {
    await checkLeftNavBar(page);
  });

  test('should display correct tab names', async ({ page }) => {
    await expect(page.locator('nav')).toContainText('Instances');
    await expect(page.locator('nav')).toContainText('Incidents');
    await expect(page.locator('nav')).toContainText('Job Definitions');
    await expect(page.locator('nav')).toContainText('Called Process Definitions');
    await expect(page.locator('nav')).toContainText('Decision Instances');
  });

  test('should display all default column headers (Instances Tab)', async ({ page }) => {
    await tabs.instances.click();
    await expect(page.getByRole('columnheader', { name: 'Instance ID' }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'State' }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Start Time' }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'End Time' }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Start User ID' }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Duration' }).first()).toBeVisible();
  });

  test('should display all default column headers (Incidents Tab)', async ({ page }) => {
    await tabs.incidents.click();
    await expect(page.getByRole('columnheader', { name: 'Incident ID' }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Create Time' }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Incident Type' }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Activity ID' }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Activity Name' }).first()).toBeVisible();
  });

  test('should display all default column headers (Job Definitions Tab)', async ({ page }) => {
    await tabs.jobDefinitions.click();
    await expect(page.getByRole('columnheader', { name: 'Job Definition ID' }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Job Type' }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Job Configuration' }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Activity ID' }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Activity Name' }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Suspended' }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Overriding Job Priority' }).first()).toBeVisible();
  });

  test('should display all default column headers (Called Process Definitions Tab)', async ({ page }) => {
    await tabs.calledProcessDefinitions.click();
    await expect(page.getByRole('columnheader', { name: 'Called Process Definition' }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'State' }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Activity ID' }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Activity Name' }).first()).toBeVisible();
  });

  test('should display all default column headers (Decisions Instances Tab)', async ({ page }) => {
    await tabs.decisionInstances.click();
    await expect(page.getByRole('columnheader', { name: 'ID', exact: true }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Evaluation Time' }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Activity ID' }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Calling Instance ID' }).first()).toBeVisible();
  });

  test('should display footer bar elements', async () => {
    await expect(commonElements.userImage).toBeVisible();
    await expect(commonElements.paginationSize).toContainText('50');
    await expect(commonElements.totalItems).toBeVisible();
    await expect(commonElements.pageNav).toBeVisible();
  });
});
