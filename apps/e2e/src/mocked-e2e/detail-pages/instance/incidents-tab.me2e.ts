import { expect, test } from '@playwright/test';
import { ProcessInstancePage } from '../../../page-objects/process-instance-page.po';
import { FXN_SUPPORT_STORAGE_STATE } from '../../../../playwright.config';

test.use({ storageState: FXN_SUPPORT_STORAGE_STATE });

const PROCESS_INSTANCE_ID = '2f0f49b6-ef70-11ed-b7c8-0a8ebe9048cf';

test.describe('Process instance incidents tab', () => {
  let processInstancePage: ProcessInstancePage;

  test.beforeEach(async ({ page, context }) => {
    processInstancePage = new ProcessInstancePage(page, PROCESS_INSTANCE_ID, 'incidents');

    await processInstancePage.initialize(context);
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('shows a grid containing columns related to each incident in this process instance', async ({ page }) => {
    await processInstancePage.goto();

    await expect(page.getByText('Incident Message')).toBeVisible();
    await expect(page.getByText('Create Time', { exact: true })).toBeVisible();
  });

  test('should show the total number of incidents using this incidents within the tab name', async ({ page }) => {
    await processInstancePage.stubIncidents({
      status: 201,
      json: [],
    });

    await processInstancePage.goto();

    const incidentsTab = page.getByText('Incidents (0)').first();

    await expect(incidentsTab).toBeVisible();
  });

  test('should show a row that links to the selected process definition page', async ({ page }) => {
    await processInstancePage.goto();

    const anchorLinks = await page.locator(`[href*="default/process-definitions"]`).all();
    expect(anchorLinks.length).toBeGreaterThan(0);
  });

  test('should open stack trace modal when clicking on incident message', async ({ page }) => {
    await processInstancePage.goto();

    await expect(page.locator('#open-stack-trace').first()).toContainText('anIncidentMessage');
    await page.locator('#open-stack-trace').first().click();
    await expect(page.locator('#modal-basic-title')).toContainText('Stack Trace');
    await expect(page.locator('.monaco-editor')).toContainText(
      'java.lang.ClassCastException: java.lang.Boolean cannot be cast to java.lang.String',
    );
  });
});
