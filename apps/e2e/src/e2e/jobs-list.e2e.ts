import { expect, test } from '@playwright/test';
import { activateProcessDefinition, startProcessInstances, terminateProcessInstances } from '../utils/test-utils';
import { BasePage } from '../page-objects/base-page.po';

let workingInstanceIds: string[] = [];

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  await activateProcessDefinition('fluxnova_automation_incident', page);
  workingInstanceIds = await startProcessInstances('fluxnova_automation_basic', 3, page);
});

test.afterAll(async ({ browser }) => {
  const page = await browser.newPage();
  await terminateProcessInstances(workingInstanceIds, page);
});

test.beforeEach(async ({ page }) => {
  await page.goto(
    `./${BasePage.TENANT}/jobs?toggleFilters=withRetriesLeft&filters=%7B"processDefinitionKey":%7B"filter":"fluxnova_automation_basic","type":"equals"%7D%7D&sorting=`,
  );
});

test('display jobs in list', async ({ page }) => {
  await expect(page.locator('.items-list-view .items-list-view-header .header-label')).toHaveText('Jobs');
});

test('display a reset view link when filters, sorting, or column prefs are applied to job list', async ({ page }) => {
  // sort a column
  await page
    .locator('.ag-header-row[aria-rowindex="1"]')
    .first()
    .locator('.ag-cell-label-container', { hasText: 'Job ID' })
    .click();

  await expect(page.getByRole('button', { name: 'Reset View' })).toBeVisible();
  // check for ascending sort order
  expect(
    page
      .locator('.ag-header-row[aria-rowindex="1"]')
      .first()
      .locator('.ag-cell-label-container', { hasText: 'Job ID' })
      .locator('fluxnova-icon')
      .getByTitle('Ascending Sort'),
  ).toBeTruthy();

  await page.getByRole('button', { name: 'Reset View' }).click();

  // check for default unsorted sort order
  expect(
    page
      .locator('.ag-header-row[aria-rowindex="1"]')
      .first()
      .locator('.ag-cell-label-container', { hasText: 'Job ID' })
      .locator('fluxnova-icon')
      .getByTitle('Unsorted Sort'),
  ).toBeTruthy();

  await expect(page.getByRole('button', { name: 'Reset View' })).toBeHidden();
});

test('contains exception message column, when exception message exist, onclick opens tooltipInfo modal', async ({
  page,
}) => {
  await page
    .locator('.ag-center-cols-viewport .ag-row')
    .nth(3)
    .locator('.ag-cell')
    .nth(4)
    .innerText()
    .then(async (value) => {
      if (value.trim() !== '') {
        await page.locator('.ag-center-cols-viewport .ag-row').nth(3).locator('.ag-cell').nth(4).click();
        return await expect(page.locator('.modal-content')).toBeVisible();
      }
    });
});

test("contains exception message column, when exception message doesn't exist, onclick doesn't opens tooltipInfo modal", async ({
  page,
}) => {
  await page
    .locator('.ag-center-cols-viewport .ag-row')
    .nth(0)
    .locator('.ag-cell')
    .nth(4)
    .innerText()
    .then(async (value) => {
      if (value.trim() === '') {
        await page.locator('.ag-center-cols-viewport .ag-row').nth(0).locator('.ag-cell').nth(4).click();
        return await expect(page.locator('.modal-content')).toBeHidden();
      }
    });
});

test('contains job definition id link that opens process definition detail page with job selected', async ({
  page,
}) => {
  // TO DO: Take all these locator('.ag-pinned-left-cols-container a:visible') and loop through until you find one without .text-dark

  await page
    .locator('.ag-pinned-left-cols-container a:visible') // a:visible:not(.text-dark) fails due to timeout when all Job Definition Ids are links (when no non-clickable batch Ids, ie. .text-dark, are listed)
    .nth(1)
    .innerText()
    .then(async (value) => {
      // value should be the Job Definition ID

      await page
        .locator('.ag-pinned-left-cols-container a:visible') // :not(.text-dark)
        .nth(1)
        .first()
        .click({ force: true }); // not sure why, but .first() is required inside this function to avoid an error on .click(), but not outside the function

      return await expect(page.locator('.ag-row.row-highlighted').first().locator('.contents')).toHaveText(value);
    });
});

test('contain job id link that opens process instance detail page with job selected', async ({ page }) => {
  let jobId = '';

  const firstElement = page
    .locator('.ag-pinned-left-cols-container a:visible') // a:visible:not(.text-dark) fails due to timeout when all Job Definition Ids are links (no non-clickable batch Ids, ie. .text-dark, are listed)
    .nth(0);

  firstElement.innerText().then((value) => {
    // value should be the Job Definition ID
    jobId = value;
  });

  const link = await firstElement.getAttribute('href');
  const linkParts = link?.split('/');
  // this is to get the processInstanceId so we can stub the correct call
  // before we arrive at the processInstanceDetails page
  const processInstanceId = linkParts?.[linkParts.indexOf('process-instances') + 1].split('?')[0];

  await page.route(`jobs/processInstanceId/${processInstanceId}`, async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify([{ id: jobId }]),
    });
  });

  await page.route('jobs/job-definitions', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await firstElement.first().click({ force: true }); // not sure why, but .first() may not be required outside an anonymous function

  const pageURL = page.url();
  expect(pageURL).toContain('process-instances/');
  expect(pageURL).toContain('jobId=' + jobId);

  await page.waitForTimeout(2000);

  const numOfElems = await page.locator('.ag-cell').getByText(jobId).count();
  expect(numOfElems).toBe(1);
});
