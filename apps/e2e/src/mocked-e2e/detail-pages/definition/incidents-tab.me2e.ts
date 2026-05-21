import { expect, test } from '@playwright/test';
import { ProcessDefinitionsPage } from '../../../page-objects/process-definitions-page.po';

const PROCESS_DEFINITION_ID = '465cf569-eeb2-11ed-9b96-0a81d7d98f19';

test.describe('when there are incidents', () => {
  let processDefinitionsPage: ProcessDefinitionsPage;

  test.beforeEach(async ({ page, context }) => {
    processDefinitionsPage = new ProcessDefinitionsPage(page, PROCESS_DEFINITION_ID, 'incidents');
    await processDefinitionsPage.initialize(context);

    await processDefinitionsPage.goto();
  });

  test('it should show incidents tab title as Incidents (4)', async ({ page }) => {
    await page.route('incidents/count', async (route) => {
      await route.fulfill({
        status: 201,
        body: JSON.stringify(4),
      });
    });
    await processDefinitionsPage.goto();

    await expect(page.getByText('Incidents (4)')).toBeVisible();
  });

  test('it should show incidents tab title as Incidents (0)', async ({ page }) => {
    await processDefinitionsPage.stubIncidentsEndpoints({ status: 200, json: [] });
    await processDefinitionsPage.goto();

    await expect(page.getByText('Incidents (0)')).toBeVisible();
  });

  test('it should show rows of incidents', async ({ page }) => {
    await processDefinitionsPage.goto();

    for (let i = 1; i <= 4; i++) {
      await expect(page.getByText(`anIncidentMessage${i}`)).toBeVisible();
    }
  });

  test('it should filter incidents tab when an activity is clicked on the diagram', async ({ page }) => {
    await page.waitForSelector('fluxnova-generic-diagram-viewer', { timeout: 5000 });

    const targetActivityId = 'Activity_0xd3o73';
    const activitySelector = `[data-element-id="${targetActivityId}"]`;
    await page.waitForSelector(activitySelector, { timeout: 5000 });

    await page.click(activitySelector);

    await page.waitForTimeout(500);

    await expect(page).toHaveURL(
      new RegExp(`[?&]activityId=${targetActivityId}&filteredActivityId=${targetActivityId}(&|$)`),
    );
  });
});

test.describe('when there are no incidents', () => {
  let processDefinitionsPage: ProcessDefinitionsPage;

  test.beforeEach(async ({ page, context }) => {
    processDefinitionsPage = new ProcessDefinitionsPage(page, PROCESS_DEFINITION_ID, 'incidents');

    await processDefinitionsPage.initialize(context);

    await processDefinitionsPage.stubIncidentsEndpoints({
      json: [],
      status: 201,
    });

    await processDefinitionsPage.goto();
  });

  test('it should show incidents tab title as Incidents (0)', async ({ page }) => {
    await expect(page.getByText('Incidents (0)', { exact: true })).toBeVisible();
  });

  test('it should have message "No incidents were found"', async ({ page }) => {
    await expect(page.getByText('No incidents were found')).toBeVisible();
  });
});
