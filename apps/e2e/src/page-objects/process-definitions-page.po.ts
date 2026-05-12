import { Page } from '@playwright/test';
import { ActivityInstanceHistory } from '@fxn/types';
import mockMigrationTestMultipleVersions from '../fixtures/process-definitions/migration-test-multiple-versions.json';
import mockMigrationTestDiagram from '../fixtures/process-definitions/migration-test-diagram.json';
import mockMigrationTestStartEvent from '../fixtures/process-definitions/migration-test-start-event.json';
import mockMigrationTestJobDefinitions from '../fixtures/jobs/migration-test-job-definitions.json';
import mockMigrationTestStatistics from '../fixtures/process-definitions/migration-test-statistics.json';
import mockStaticCalledProcessInstances from '../fixtures/process-definitions/static-called-process-instances.json';
import mockIncidents from '../fixtures/incidents/default.json';
import OverrideFulfill from '../shared/overrideFulfill';
import decisionInstancesMock from '../fixtures/process-instances/mock-decision-instances.json';
import { getProcessDefinitionId } from '../utils/test-utils';
import { DetailsPage } from './details-page.po';
import { BasePage, FLUXNOVA_PAGES } from './base-page.po';

export class ProcessDefinitionsPage extends DetailsPage {
  constructor(
    protected readonly page: Page,
    processDefinitionID?: string,
    tabSelected?: string,
  ) {
    super(page, FLUXNOVA_PAGES.DEFINITIONS, processDefinitionID, tabSelected);
  }

  get processDefinitionId(): string {
    return this._resourceId || '';
  }

  get processInstanceCheckbox() {
    return this.page.locator('.ag-cell-wrapper input');
  }

  get fluxnovaDiagramLegendTriggerOnPage() {
    return this.page.locator('.diagram-legend-trigger');
  }

  get deleteButton() {
    return this.page.locator('#delete').getByRole('button');
  }

  get startProcessButton() {
    return this.page.locator('#start_process');
  }

  get startProcessConfirmButton() {
    return this.page.getByRole('button', { name: 'Confirm' });
  }

  get startProcessCloseButton() {
    return this.page.getByRole('button', { name: 'Close' }).first();
  }

  get migrateButton() {
    return this.page.locator('fluxnova-tab-actions-floating-container button').getByText('Migrate');
  }

  get setRetryCountButton() {
    return this.page.locator('fluxnova-incidents-tab .action-btn');
  }

  get activateJobDefinitionButton() {
    return this.page.locator('fluxnova-job-definitions-tab .action-btn[ngbtooltip="Activate"]');
  }

  get suspendJobDefinitionButton() {
    return this.page.locator('fluxnova-job-definitions-tab .action-btn[ngbtooltip="Suspend"]');
  }

  get changeJobPriorityButton() {
    return this.page.locator('fluxnova-job-definitions-tab .action-btn[ngbtooltip="Change Overriding Job Priority"]');
  }

  get migrateModal() {
    return this.page.locator('fluxnova-migrate-modal');
  }

  get migrateModalSummaryText() {
    return this.page.locator('fluxnova-migrate-modal [id=summary-text]');
  }

  get migrateModalDiagrams() {
    return this.page.locator('fluxnova-migrate-modal .diagrams');
  }

  get clickableElementShowModels() {
    return this.page.locator('fluxnova-migrate-modal .text-primary');
  }

  get fluxnovaDiagramLegendTriggerOnModalList() {
    //diagram-legend-trigger
    return this.migrateModal.getByTestId('diagram-legend-trigger').all();
  }

  get selectedVersionElement() {
    return this.page.locator(
      'fluxnova-migrate-modal > div.modal-body > div > div > ng-select > div > div > div.ng-value > span.ng-value-label',
    );
  }

  public override async goto(url: string = this.detailsPageUrl) {
    await super.goto(url);
  }

  public async stubApisCalledOnLoad() {
    await super.stubApisCalledOnLoad();
    await this.stubCountEndpoint();
    await this.stubDecisionInstancesEndpoint();
    await this.stubDiagram();
    await this.stubIncidentsEndpoints();
    await this.stubStaticCalledProcessDefinitionsEndpoint();
    await this.stubJobDefinitionsEndpoint();
    await this.stubProcessInstancesEndpoint();
    await this.stubStatistics();
    await this.stubProcessDefinitionsEndpoint();
    await this.stubActivityInstanceHistoryEndpoint();
  }

  public async stubCountEndpoint() {
    await this.page.route('api/process-instances/count', async (routes, request) => {
      const method = request.method();
      const isPOST = method === 'POST';
      const requestBody = isPOST ? await request.postDataJSON() : {};
      const processDefinitionId = String(requestBody?.processDefinitionId ?? '');
      const mapIdsToResponseCount: { [key: string]: number } = {
        '4eabfecb-eeb1-11ed-9b96-0a81d7d98f19': 11,
        '1fc528c2-eeb1-11ed-9b96-0a81d7d98f19': 4,
        'b1ec7854-eeb1-11ed-9b96-0a81d7d98f19': 7,
        'b1ec7855-eeb1-11ed-9b96-0a81d7d98f19': 0,
        '96672f71-eeb1-11ed-9b96-0a81d7d98f19': 3,
        '465cf569-eeb2-11ed-9b96-0a81d7d98f19': 1,
        '23453456-eeb3-22jf-f9f9-aofjehaofeoj': 10,
      };
      const hasExpectedProcessDefinitionId = Object.keys(mapIdsToResponseCount).includes(processDefinitionId);

      if (method === 'POST' && hasExpectedProcessDefinitionId) {
        await routes.fulfill({
          body: `${mapIdsToResponseCount[processDefinitionId]}`,
          contentType: 'text/html; charset=utf-8',
        });
      } else {
        await routes.continue();
      }
    });
  }

  public async stubDecisionInstancesEndpoint(overrideFulfill?: OverrideFulfill) {
    const url = `api/decision-instances?processDefinitionId=${this.processDefinitionId}*`;

    await this.page.unroute(url);

    await this.page.route(url, async (route) => {
      if (overrideFulfill) {
        await route.fulfill(overrideFulfill);
      } else {
        const json = decisionInstancesMock.map((decisionInstanceItem) => ({
          ...decisionInstanceItem,
          processDefinitionId: this.processDefinitionId,
        }));

        await route.fulfill({ status: 200, json });
      }
    });
  }

  public async stubProcessDefinitionsEndpoint(overrideFulfill?: OverrideFulfill) {
    const routeUrl = 'api/process-definitions';

    await this.page.unroute(routeUrl);

    await this.page.route(routeUrl, async (route, request) => {
      if (overrideFulfill) {
        await route.fulfill(overrideFulfill);
      } else {
        const method = request.method();
        const body = method === 'POST' ? await request.postDataJSON() : {};
        const processDefinitionId = body?.filter?.processDefinitionId;

        // If requesting a specific definition by ID, return only that one
        if (processDefinitionId) {
          const allDefinitions = mockMigrationTestMultipleVersions.json;
          const matchingDefinition = allDefinitions.find((def: any) => def.id === processDefinitionId);

          if (matchingDefinition) {
            await route.fulfill({
              status: 201,
              json: [matchingDefinition],
            });
          } else {
            await route.fulfill(mockMigrationTestMultipleVersions);
          }
        } else {
          // For key-based queries or no filter, return all versions
          await route.fulfill(mockMigrationTestMultipleVersions);
        }
      }
    });
  }

  public async stubProcessInstancesEndpoint(overrideFulfill?: OverrideFulfill) {
    const routeUrl = 'api/process-instances?includeIncidentInfo=true';

    await this.page.unroute(routeUrl);

    await this.page.route(routeUrl, async (routes, request) => {
      const method = request.method();
      const body = await request.postDataJSON();

      if (method === 'POST' && overrideFulfill) {
        await routes.fulfill(overrideFulfill);
      } else if (method === 'POST' && body?.filter?.processDefinitionId === this.processDefinitionId) {
        await routes.fulfill(mockMigrationTestStartEvent);
      } else {
        await routes.continue();
      }
    });
  }

  public async stubStaticCalledProcessDefinitionsEndpoint(overrideFulfill?: OverrideFulfill) {
    const routeUrl = `api/process-definitions/called-process-definitions`;

    await this.page.route(routeUrl, async (routes) => {
      if (overrideFulfill) {
        await routes.fulfill(overrideFulfill);
      } else {
        await routes.fulfill({
          status: 200,
          json: [mockStaticCalledProcessInstances, []],
        });
      }
    });
  }

  private async stubDiagram() {
    await this.page.route(`api/process-definitions/${this.processDefinitionId}/diagram`, async (routes, request) => {
      const method = request.method();

      if (method === 'GET') {
        await routes.fulfill(mockMigrationTestDiagram);
      } else {
        await routes.continue();
      }
    });
  }

  public async stubIncidentsEndpoints(override: any = null) {
    await this.page.unroute('api/incidents');
    await this.page.unroute('api/incidents/count');

    const incidentsList = override?.json ?? mockIncidents;

    await this.page.route('api/incidents', async (routes, request) => {
      const method = request.method();

      if (override) {
        await routes.fulfill(override);
      } else if (method === 'POST') {
        await routes.fulfill({
          status: 201,
          json: incidentsList,
        });
      }
    });

    await this.page.route('api/incidents/count', async (routes) => {
      await routes.fulfill({
        status: 200,
        json: incidentsList.length,
      });
    });
  }

  public async stubJobDefinitionsEndpoint(override: any = null) {
    await this.page.route('api/jobs/job-definitions', async (routes, request) => {
      const method = request.method();
      const body = await request.postDataJSON();

      if (override) {
        await routes.fulfill(override);
      } else if (method === 'POST' && body?.processDefinitionId === this.processDefinitionId) {
        await routes.fulfill(mockMigrationTestJobDefinitions);
      }
    });
  }

  private async stubStatistics() {
    await this.page.route(`api/process-definitions/${this.processDefinitionId}/statistics`, async (routes, request) => {
      const method = request.method();

      if (method === 'GET') {
        await routes.fulfill(mockMigrationTestStatistics);
      } else {
        await routes.continue();
      }
    });
  }

  public async stubActivityInstanceHistoryEndpoint(overrideFulfill?: OverrideFulfill) {
    await this.page.unroute(`api/process-definitions/${this.processDefinitionId}/history**`);

    await this.page.route(`api/process-definitions/${this.processDefinitionId}/history**`, async (route, request) => {
      const method = request.method();

      if (overrideFulfill) {
        await route.fulfill(overrideFulfill);
      } else if (method === 'GET') {
        await route.fulfill({
          status: 200,
          json: [] as ActivityInstanceHistory[],
        });
      }
    });
  }

  public async navigateToDefinitionDetailsPage(key: string) {
    const definitionId = await getProcessDefinitionId(key, this.page);
    this._resourceId = definitionId;
    await this.page.goto(`./${BasePage.TENANT}/process-definitions/${definitionId}`);
  }
}
