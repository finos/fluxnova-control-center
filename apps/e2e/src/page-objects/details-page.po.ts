import { Page } from '@playwright/test';
import { stackTrace } from '../fixtures/incidents/stacktrace';
import instance from '../fixtures/process-instances/sub-process-with-incident.json';
import incidents from '../fixtures/incidents/default.json';
import variables from '../fixtures/variables/default.json';
import diagram from '../fixtures/process-definitions/diagram.json';
import history from '../fixtures/process-definitions/history.json';
import jobs from '../fixtures/jobs/default.json';
import { BasePage, FLUXNOVA_PAGES } from './base-page.po';

export class DetailsPage extends BasePage {
  constructor(
    protected readonly page: Page,
    protected readonly _fluxnovaPage: FLUXNOVA_PAGES,
    protected _resourceId?: string,
    protected _tabSelected?: string,
  ) {
    super(page);
  }

  get backButton() {
    return this.page.locator('fluxnova-back-button');
  }

  public async stubApisCalledOnLoad() {
    await super.stubApisCalledOnLoad();

    await this.page.route('**/process-instances', async (route) => {
      await route.fulfill({ json: instance });
    });

    await this.page.route('**/incidents', async (route) => {
      await route.fulfill({ json: incidents });
    });

    await this.page.route('**/stacktrace', async (route) => {
      await route.fulfill({ body: stackTrace });
    });

    await this.page.route('**/variable-history', async (route) => {
      await route.fulfill({ json: variables });
    });

    await this.page.route('**/diagram', async (route) => {
      await route.fulfill({ json: diagram });
    });

    await this.page.route('**/process-instances/2e75d495-476f-11ee-a2d5-0e8c5913822b/history**', async (route) => {
      await route.fulfill({ json: history });
    });

    await this.page.route('**/jobs/processInstanceId/2e75d495-476f-11ee-a2d5-0e8c5913822b', async (route) => {
      await route.fulfill({ json: jobs });
    });
  }

  get activateButton() {
    return this.page.locator('#activate').getByRole('button');
  }

  get suspendButton() {
    return this.page.locator('#suspend').getByRole('button');
  }

  get terminateButton() {
    return this.page.locator('#terminate').getByRole('button');
  }

  get downloadResourceButton() {
    return this.page.locator('#download_resource').getByRole('button');
  }

  public getIdFromUrl(): string {
    return this.page.url().split('/').pop()?.split('?').shift() || '';
  }

  get tabSelected(): string | undefined {
    return this._tabSelected;
  }

  get fluxnovaPage() {
    return this._fluxnovaPage;
  }

  get detailsPageUrl(): string {
    return `./${BasePage.TENANT}/${this.fluxnovaPage}/${this._resourceId}?tab=${this.tabSelected}`;
  }
}
