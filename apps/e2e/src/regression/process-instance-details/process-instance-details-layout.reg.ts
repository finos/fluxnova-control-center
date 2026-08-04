import { expect, test } from '@playwright/test';
import { getProcessDefinitionId, startProcessInstance, terminateProcessInstance } from '../../utils/test-utils';
import { ActionButtons, CommonElements } from '../../page-objects/common-elements.po';
import { checkFluxnovaIcon, checkLeftNavBar } from '../../shared/layout';
import { ProcessInstancePage } from '../../page-objects/process-instance-page.po';

/**
 * @group regression
 * @group process-instance
 * @group process-instance-details
 * @group process-instance-details-layout
 */

let processInstancePage: ProcessInstancePage;

test.describe('Process Instance Detail Layout', () => {
  let commonElements: CommonElements;
  let actionButtons: ActionButtons;

  let workingInstanceId: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const basicProcessDefinitionId = await getProcessDefinitionId('fluxnova_automation_basic', page);
    workingInstanceId = await startProcessInstance(basicProcessDefinitionId, page);
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await terminateProcessInstance(workingInstanceId, page);
  });

  test.beforeEach(async ({ page }) => {
    processInstancePage = new ProcessInstancePage(page);
    commonElements = new CommonElements(page);
    actionButtons = new ActionButtons(page);
    await processInstancePage.navigateToInstanceDetailsPage(workingInstanceId);
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('should display sidenav header correctly', async () => {
    await expect(commonElements.sidenavHeader).toHaveCount(1);
    await expect(commonElements.sidenavHeader.locator('a[href="/"]')).toHaveCount(1);
    await expect(commonElements.fluxnovaIcon).toHaveCount(1);
  });

  test('should display Fluxnova Icon in top left', async ({ page }) => {
    await checkFluxnovaIcon(page);
  });

  test('should expand left side bar on click in non-link area', async ({ page }) => {
    await checkLeftNavBar(page);
  });

  test('should display sidenav footer correctly', async () => {
    await expect(commonElements.sidenavFooter).toHaveCount(1);

    await expect(commonElements.sidenavFooter.locator('> *').nth(0)).toHaveJSProperty(
      'tagName',
      'FLUXNOVA-SELECT-TENANT',
    );
    await expect(commonElements.sidenavFooter.locator('> *').nth(1)).toHaveText('About');
    await expect(commonElements.profileIcon).toHaveCount(1);
  });

  test('should display bulk action buttons', async () => {
    await expect(actionButtons.suspend.getByRole('button')).toBeVisible();
    await expect(actionButtons.terminate.getByRole('button')).toBeVisible();
    await expect(actionButtons.download.getByRole('button')).toBeVisible();
  });

  test('should display canvas zoom controls', async () => {
    await expect(commonElements.resetZoomButton).toBeVisible();
    await expect(commonElements.zoomOutButton).toBeVisible();
    await expect(commonElements.zoomInButton).toBeVisible();
  });

  test('should display canvas diagram flow toggle', async () => {
    await expect(commonElements.diagramFlowButton).toBeVisible();
  });

  test('should display move tokens button', async () => {
    await expect(actionButtons.moveTokens).toBeVisible();
  });

  test('should display info panel correctly', async () => {
    await expect(commonElements.leftPanel).toHaveCount(1);

    // Back button should be first
    await expect(commonElements.leftPanel.locator('> *').nth(0).locator('a').first()).toHaveAttribute(
      'href',
      /process-instances/,
    );

    // Then actual info section
    const infoSection = commonElements.leftPanel.locator('fluxnova-process-instance-info-section').locator('.content');
    await expect(infoSection).toHaveCount(1);

    // Verify the order of info in the info section
    await expect(infoSection.locator('> *').nth(0)).toHaveText('Fluxnova UI Automation - Basic');
    await expect(infoSection.locator('> *').nth(1)).toHaveText(/Instance ID/);
    await expect(infoSection.locator('> *').nth(2)).toHaveText('State');
    await expect(infoSection.locator('> *').nth(3)).toHaveText('Active');
    await expect(infoSection.locator('> *').nth(4)).toHaveText('Definition ID');
    await expect(infoSection.locator('> *').nth(7)).toHaveText('Business Key');
    await expect(infoSection.locator('> *').nth(9)).toHaveText('Definition Version');
    await expect(infoSection.locator('> *').nth(11)).toHaveText('Definition Key');
    await expect(infoSection.locator('> *').nth(14)).toHaveText('Root Process Instance ID');
    await expect(infoSection.locator('> *').nth(17)).toHaveText('Super Process Instance ID');
    if (await infoSection.locator('fluxnova-icon[copytextlabel="Super Process Instance ID"]').isVisible()) {
      await expect(infoSection.locator('> *').nth(20)).toHaveClass(/border-bottom/); // should have border
    } else {
      await expect(infoSection.locator('> *').nth(19)).toHaveClass(/border-bottom/); // should have border
    }
  });

  test('should display diagram overlay buttons correctly', async ({ page }) => {
    await expect(page.locator('fluxnova-diagram-legend')).toHaveCount(1);
    await expect(page.locator('fluxnova-diagram-legend')).toBeVisible();

    await expect(commonElements.lowerPanelButton).toHaveCount(1);
    await expect(commonElements.lowerPanelButton).toBeVisible();
  });

  test('should display tab panel correctly', async () => {
    await expect(commonElements.tabPanel).toHaveCount(1);

    const tabsList = commonElements.tabPanel.locator('.tab');
    await expect(tabsList).toHaveCount(7);

    await expect(tabsList.nth(0)).toContainText('Variables');
    await expect(tabsList.nth(1)).toContainText('Incidents');
    await expect(tabsList.nth(2)).toContainText('Called Process Instances');
    await expect(tabsList.nth(3)).toContainText('Jobs');
    await expect(tabsList.nth(4)).toContainText('History');
    await expect(tabsList.nth(5)).toContainText('Decision Instances');
    await expect(tabsList.nth(6)).toContainText('User Tasks');

    // Pagination should be present
    await expect(commonElements.agPagination).toHaveCount(1);
    await expect(commonElements.agPagination).toBeVisible();
  });
});
