import { BrowserContext, Page } from '@playwright/test';
import mockIncidents from '../fixtures/incidents/default.json';
import mockProcessInstances from '../fixtures/process-instances/default.json';
import { BasePage } from './base-page.po';

export class DashboardPage extends BasePage {
  constructor(protected readonly page: Page) {
    super(page);
  }

  public async initialPageLoad(context: BrowserContext | Page, responseFixture: any = 'default') {
    await super.stubAuth(context, responseFixture);
    await this.stubApisCalledOnLoad();
    await this.goto();
  }

  public async goto(path: string = '') {
    await super.goto(`./${BasePage.TENANT}/${path}`);
  }

  public override async stubApisCalledOnLoad() {
    await super.stubApisCalledOnLoad();

    await this.stubIncidents();
    await this.stubProcessInstances();
  }

  public async stubIncidents() {
    await this.page.route('api/incidents', async (route) => {
      await route.fulfill({
        status: 201,
        json: mockIncidents,
      });
    });
  }

  public async stubProcessInstances() {
    await this.page.route('api/process-instances', async (route) => {
      await route.fulfill({
        status: 201,
        json: mockProcessInstances,
      });
    });
  }
}
