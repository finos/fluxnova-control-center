import { expect, Page, test } from '@playwright/test';
import { FXN_SUPPORT_STORAGE_STATE } from '../../playwright.config';
import { ListPage } from '../page-objects/list-page.po';
import { ProcessInstancePage } from '../page-objects/process-instance-page.po';
import { DetailsPage } from '../page-objects/details-page.po';

const INSTANCE_ID = '0002adb8-a28c-11ed-a978-0ec9965d7f47';

let listPage: ListPage;

test.beforeEach(async ({ page, context }) => {
  listPage = new ListPage(page);

  await listPage.stubAuth(context);
  await listPage.stubApisCalledOnLoad();
  await listPage.gotoInstances();
});

test.describe('The quick search component', () => {
  test.use({ storageState: FXN_SUPPORT_STORAGE_STATE });

  test('should only show the search icon when the sidenav is collapsed', async () => {
    await expect(listPage.searchIcon).toBeVisible();
    await expect(listPage.searchComponent).toBeHidden();
  });

  test('should expand to fullsize when the sidenav is expanded', async () => {
    await listPage.searchIcon.click();

    await expect(listPage.searchIcon).toBeVisible();
    await expect(listPage.searchComponent).toBeVisible();
  });

  test('should search each entity type for the id specified', async ({ page }) => {
    const instancesResponseP = stubApi(page, 'api/process-instances', 'processInstanceId');
    const definitionsResponseP = stubApi(page, 'api/process-definitions', 'processDefinitionId');
    const incidentsResponseP = stubApi(page, 'api/incidents', 'incidentId');
    const jobsResponseP = stubApi(page, 'api/jobs', 'jobId');
    const batchResponseP = stubApi(page, 'api/batch**', 'batchId');
    const deploymentResponseP = stubApi(page, 'api/deployment**', 'id');
    const decisionResponseP = stubApi(page, 'api/decision-definition**', 'decisionDefinitionId');

    await listPage.searchIcon.click();
    await listPage.searchInput.fill(INSTANCE_ID);

    // wait for debounce time on search component
    await page.waitForTimeout(500);

    const instancesResponse = await instancesResponseP;
    const definitionsResponse = await definitionsResponseP;
    const incidentsResponse = await incidentsResponseP;
    const jobsResponse = await jobsResponseP;
    const batchResponse = await batchResponseP;
    const deploymentResponse = await deploymentResponseP;
    const decisionResponse = await decisionResponseP;

    expect(instancesResponse.apiCalled).toBeTruthy();
    expect(definitionsResponse.apiCalled).toBeTruthy();
    expect(incidentsResponse.apiCalled).toBeTruthy();
    expect(jobsResponse.apiCalled).toBeTruthy();
    expect(batchResponse.apiCalled).toBeTruthy();
    expect(deploymentResponse.apiCalled).toBeTruthy();
    expect(decisionResponse.apiCalled).toBeTruthy();
    expect(instancesResponse.filter).toBe(INSTANCE_ID);
    expect(definitionsResponse.filter).toBe(INSTANCE_ID);
    expect(incidentsResponse.filter).toBe(INSTANCE_ID);
    expect(jobsResponse.filter).toBe(INSTANCE_ID);
    expect(batchResponse.filter).toBe(INSTANCE_ID);
    expect(deploymentResponse.filter).toBe(INSTANCE_ID);
    expect(decisionResponse.filter).toBe(INSTANCE_ID);
  });

  test('should display "No items found" when there are no results', async ({ page }) => {
    await stubApi(page, 'api/process-instances', 'processInstanceId');
    await stubApi(page, 'api/process-definitions', 'processDefinitionId');
    await stubApi(page, 'api/incidents', 'incidentId');
    await stubApi(page, 'api/jobs', 'jobId');
    await stubApi(page, 'api/batch', 'batchId');
    await stubApi(page, 'api/deployment', 'deploymentId');
    await stubApi(page, 'api/decision-definition', 'decisionDefinitionId');

    await listPage.searchIcon.click();
    await listPage.searchInput.fill(INSTANCE_ID);

    // wait for debounce time on search component
    await page.waitForTimeout(500);

    await expect(listPage.searchComponent.getByText('No items found').first()).toBeVisible();
  });

  test('should display results when there are results and navigate to the details page when selected', async ({
    page,
  }) => {
    const detailsPage: DetailsPage = new ProcessInstancePage(page);

    await page.route('api/authorization/check?**', async (route) => route.fulfill({ status: 200, json: {} }));
    await page.route('api/batch?**', async (route) => route.fulfill({ status: 200, json: {} }));
    await page.route('api/deployment?**', async (route) => route.fulfill({ status: 200, json: {} }));
    await page.route('api/decision-definition?**', async (route) => route.fulfill({ status: 200, json: {} }));
    await page.route('api/process-instances', async (route) =>
      route.fulfill({ status: 200, json: [{ id: INSTANCE_ID, processDefinitionName: 'TEST-DEFINITION' }] }),
    );
    await page.route('api/process-instances/count', async (route) => route.fulfill({ status: 200, body: '50' }));
    await page.route('api/jobs', async (route) => route.fulfill({ status: 200, json: {} }));
    await page.route('api/incidents', async (route) => route.fulfill({ status: 200, json: {} }));
    await page.route('api/process-definitions', async (route) => route.fulfill({ status: 200, json: [] }));
    await page.route('api/version', async (route) =>
      route.fulfill({ status: 200, json: { version: '25.2.0-rc.4-723' } }),
    );

    await listPage.searchIcon.click();
    await listPage.searchInput.fill(INSTANCE_ID);

    // wait for debounce time on search component
    await page.waitForTimeout(500);

    await expect(listPage.searchComponent.getByText('Instance: TEST-DEFINITION')).toBeVisible();

    await listPage.searchComponent.getByText('Instance: TEST-DEFINITION').click();

    await expect(detailsPage.backButton.getByText('Process Instances')).toBeVisible();
    await expect(page).toHaveURL(new RegExp(String.raw`/process-instances/${INSTANCE_ID}`));
  });
});

async function stubApi(page: Page, api: string, filter: string, response: any = []) {
  const result = { apiCalled: false, filter: '' };

  await page.route(api, async (route) => {
    const request = route.request();

    if (request.method() === 'POST' && request.postDataJSON()?.filter?.[filter]) {
      result.apiCalled = true;
      result.filter = request.postDataJSON().filter[filter];
      return route.fulfill({ status: 200, json: response });
    }

    if (request.method() === 'GET') {
      const url = new URL(request.url());
      const params = url.searchParams;

      if (params.get(filter)) {
        result.apiCalled = true;
        result.filter = params.get(filter) as string;
        return route.fulfill({ status: 200, json: response });
      }
    }

    await route.continue();
  });

  return result;
}
