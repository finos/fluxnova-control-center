import { Page } from '@playwright/test';
import historyMock from '../fixtures/history/historyMock.json';
import jobsMock from '../fixtures/jobs/jobs-list.json';
import jobDefinitionsMock from '../fixtures/jobs/job-definitions-list.json';
import incidentsMock from '../fixtures/incidents/default.json';
import variablesMock from '../fixtures/variables/default.json';
import decisionInstancesMock from '../fixtures/process-instances/mock-decision-instances.json';
import mockMigrationTestActivityInstance from '../fixtures/process-instances/migration-test-activity-instance.json';
import mockMigrationTestStartEvent from '../fixtures/process-definitions/migration-test-start-event.json';
import mockMigrationTestDiagram from '../fixtures/process-definitions/migration-test-diagram.json';
import mockMigrationTestVariablesUpdate from '../fixtures/variables/migration-test-variables-update.json';
import mockMigrationTestVariablesDelete from '../fixtures/variables/migration-test-variables-delete.json';
import processInstancesDefault from '../fixtures/process-instances/default.json';
import OverrideFulfill from '../shared/overrideFulfill';
import { DetailsPage } from './details-page.po';
import { BasePage, FLUXNOVA_PAGES } from './base-page.po';

export class ProcessInstancePage extends DetailsPage {
  private _jobsMockedUsed: any;

  constructor(
    protected readonly page: Page,
    processInstanceId?: string,
    tabSelected?: string,
  ) {
    super(page, FLUXNOVA_PAGES.INSTANCES, processInstanceId, tabSelected);
  }

  get jobsMockedUsed() {
    return this._jobsMockedUsed ?? [];
  }

  get processInstanceId(): string {
    return this._resourceId || '';
  }

  get terminateButton() {
    return this.page.locator('#terminate').getByRole('button');
  }

  get moveTokensButton() {
    return this.page.locator('#move_tokens');
  }

  get setIncidentsRetryCountButton() {
    return this.page.locator('fluxnova-incidents-tab .action-btn');
  }

  get activateJobButton() {
    return this.page.locator('fluxnova-jobs-tab .action-btn[ngbtooltip="Activate"]');
  }

  get suspendJobButton() {
    return this.page.locator('fluxnova-jobs-tab .action-btn[ngbtooltip="Suspend"]');
  }

  get setJobRetryCountButton() {
    return this.page.locator('fluxnova-jobs-tab .action-btn[ngbtooltip="Set Retry Count"]');
  }

  get changeJobDueDateButton() {
    return this.page.locator('fluxnova-jobs-tab .action-btn[ngbtooltip="Change Due Date"]');
  }

  public override async goto(urlParameter?: string) {
    const url = urlParameter || this.detailsPageUrl;

    await super.goto(url);
  }

  public async gotoInActiveInstance() {
    await this.page.route('api/process-instances', async (route) => {
      await route.fulfill({
        status: 201,
        json: [
          {
            ...processInstancesDefault[1],
            id: this.processInstanceId,
          },
        ],
      });
    });
    await this.goto();
  }

  public override async stubApisCalledOnLoad() {
    await super.stubApisCalledOnLoad();
    await this.page.setViewportSize({ width: 2000, height: 2000 });
    await this.stubActivityInstancesEndpoint();
    await this.stubDiagramEndpoint();
    await this.stubHistoryEndpoint();
    await this.stubIncidents();
    await this.stubJobsForProcessInstance();
    await this.stubJobDefinitionsForProcessInstance();
    await this.stubModificationEndpoint();
    await this.stubProcessInstances();
    await this.stubVariablesEndpoint();
    await this.stubDecisionInstancesEndpoint();
  }

  public async stubActivityInstancesEndpoint(overrideFulfill?: OverrideFulfill) {
    await this.page.unroute(`api/process-instances/${this.processInstanceId}/activity-instances**`);

    await this.page.route(
      `api/process-instances/${this.processInstanceId}/activity-instances**`,
      async (route, request) => {
        const method = request.method();

        if (overrideFulfill) {
          await route.fulfill(overrideFulfill);
        } else if (method === 'GET') {
          await route.fulfill(mockMigrationTestActivityInstance);
        }
      },
    );
  }

  public async stubDiagramEndpoint(overrideFulfill?: OverrideFulfill) {
    await this.page.route('api/process-definitions/**/diagram', async (route, request) => {
      const method = request.method();

      if (overrideFulfill) {
        await route.fulfill(overrideFulfill);
      } else if (method === 'GET') {
        await route.fulfill(mockMigrationTestDiagram);
      }
    });
  }

  public async stubHistoryEndpoint(overrideFulfill?: OverrideFulfill) {
    // need the regex * to handle query parameters
    const url = `api/process-instances/${this.processInstanceId}/history*`;

    await this.page.unroute(url);

    await this.page.route(url, async (route, request) => {
      const method = request.method();

      if (method === 'GET') {
        const fulfillObject = overrideFulfill ?? {
          status: 201,
          json: historyMock,
        };

        await route.fulfill(fulfillObject);
      } else {
        await route.continue();
      }
    });
  }

  public async stubIncidents(overrideFulfill?: OverrideFulfill) {
    const fulfillObject = overrideFulfill ?? { status: 200, json: incidentsMock };

    await this.page.unroute('api/incidents');
    await this.page.unroute('api/incidents/count');

    await this.page.route('api/incidents', async (route) => {
      await route.fulfill(fulfillObject);
    });

    await this.page.route('api/incidents/count', async (route) => {
      await route.fulfill({
        status: 200,
        json: fulfillObject.json.length,
      });
    });
  }

  public async stubJobsForProcessInstance(overrideFulfill?: OverrideFulfill) {
    const fulfillObject = overrideFulfill ?? { status: 200, json: this.getJobsMockFormatted() };
    this._jobsMockedUsed = this.getJobsMockFormatted();
    await this.page.unroute(`api/jobs`);
    await this.page.unroute('api/jobs/count');

    await this.page.route(`api/jobs`, async (route) => {
      await route.fulfill(fulfillObject);
    });

    await this.page.route('api/jobs/count', async (route) => {
      await route.fulfill({
        body: JSON.stringify(fulfillObject.json.length),
      });
    });
  }

  public async stubJobDefinitionsForProcessInstance(overrideFulfill?: OverrideFulfill) {
    await this.page.unroute(`api/jobs/job-definitions`);

    await this.page.route(`api/jobs/job-definitions`, async (route, request) => {
      const method = request.method();

      if (overrideFulfill) {
        await route.fulfill(overrideFulfill);
      } else if (method === 'POST') {
        await route.fulfill({
          status: 200,
          json: jobDefinitionsMock,
        });
      } else {
        await route.continue();
      }
    });
  }

  public async stubModificationEndpoint(overrideFulfill?: OverrideFulfill) {
    await this.page.unroute(`api/process-instances/${this.processInstanceId}/modification`);

    await this.page.route(`api/process-instances/${this.processInstanceId}/modification`, async (route, request) => {
      const method = request.method();

      if (method === 'POST' && overrideFulfill) {
        await route.fulfill(overrideFulfill);
      } else {
        await route.continue();
      }
    });
  }

  public async stubProcessInstances(overrideFulfill?: OverrideFulfill) {
    await this.page.unroute('api/process-instances');

    await this.page.route('api/process-instances*', async (route, request) => {
      const method = request.method();
      const requestBody = request.postDataJSON();

      if (overrideFulfill) {
        await route.fulfill(overrideFulfill);
      } else if (method === 'POST' && requestBody?.filter?.processInstanceId === this.processInstanceId) {
        await route.fulfill(mockMigrationTestStartEvent);
      } else {
        await route.continue();
      }
    });
  }

  public async stubVariablesEndpoint(overrideFulfill?: OverrideFulfill) {
    await this.page.route('api/variables', async (route, request) => {
      const method = request.method();
      const requestBody = request.postDataJSON();

      if (overrideFulfill) {
        await route.fulfill(overrideFulfill);
      } else if (
        method === 'POST' &&
        typeof requestBody?.filter.variableNameLike === 'string' &&
        requestBody?.filter.processInstanceIdIn?.[0] === this.processInstanceId
      ) {
        await route.fulfill({
          status: 200,
          json: variablesMock.filter((variableMockItem) =>
            variableMockItem.name.includes(
              requestBody?.filter.variableNameLike.slice(1, requestBody?.filter.variableNameLike.length - 1),
            ),
          ),
        });
      } else if (
        method === 'POST' &&
        requestBody?.filter.processInstanceIdIn?.[0] === this.processInstanceId &&
        requestBody?.filter.sortBy === 'variableName' &&
        requestBody?.filter.sortOrder === 'asc'
      ) {
        await route.fulfill({
          status: 200,
          json: [...variablesMock].sort((a, b) => (a.name.toLocaleLowerCase() < b.name.toLocaleLowerCase() ? -1 : 1)),
        });
      } else if (method === 'POST' && requestBody?.filter.processInstanceIdIn?.[0] === this.processInstanceId) {
        await route.fulfill({
          status: 200,
          json: variablesMock,
        });
      } else {
        await route.continue();
      }
    });

    await this.page.route('api/variables/update-execution', async (route) => {
      await route.fulfill(mockMigrationTestVariablesUpdate);
    });

    await this.page.route('api/variables/delete-execution', async (route) => {
      await route.fulfill(mockMigrationTestVariablesDelete);
    });
  }

  public async stubDecisionInstancesEndpoint(overrideFulfill?: OverrideFulfill) {
    const url = `api/decision-instances?processInstanceId=${this.processInstanceId}`;

    await this.page.unroute(url);

    await this.page.route(url, async (route) => {
      if (overrideFulfill) {
        await route.fulfill(overrideFulfill);
      } else {
        await route.fulfill({ status: 200, json: decisionInstancesMock });
      }
    });
  }

  private getJobsMockFormatted() {
    return jobsMock.map((jobItem) => ({
      ...jobItem,
      processInstanceId: this.processInstanceId,
    }));
  }

  public async navigateToInstanceDetailsPage(instanceId: string) {
    this._resourceId = instanceId;
    await this.page.goto(`./${BasePage.TENANT}/process-instances/${instanceId}`);
  }
}
