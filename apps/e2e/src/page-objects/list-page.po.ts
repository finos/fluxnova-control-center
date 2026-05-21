import { BasePage, FLUXNOVA_PAGES } from './base-page.po';

export class ListPage extends BasePage {
  readonly header = this.page.locator('items-list-view-header');
  readonly sideNav = this.page.locator('fluxnova-side-drawer');
  readonly searchIcon = this.sideNav.locator('fluxnova-icon').and(this.page.locator('[iconname="search"]'));
  readonly searchComponent = this.sideNav.locator('fluxnova-search-navigation');
  readonly searchInput = this.searchComponent.locator('input');

  public override async goto(list: FLUXNOVA_PAGES = FLUXNOVA_PAGES.INSTANCES) {
    await super.goto(`./${BasePage.TENANT}/${list}`);
  }

  public async gotoInstances() {
    await this.goto();
  }

  public async gotoDefinitions() {
    await this.goto(FLUXNOVA_PAGES.DEFINITIONS);
  }

  public async gotoIncidents() {
    await this.goto(FLUXNOVA_PAGES.INCIDENTS);
  }

  public async gotoJobs() {
    await this.goto(FLUXNOVA_PAGES.JOBS);
  }

  public async gotoDeployments() {
    await this.goto(FLUXNOVA_PAGES.DEPLOYMENTS);
  }

  public async gotoBatches() {
    await this.goto(FLUXNOVA_PAGES.BATCHES);

    await this.page.waitForSelector('fluxnova-batch-list');
  }

  public async stubApisCalledOnLoad() {
    await super.stubApisCalledOnLoad();

    await this.page.route('api/process-instances', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          path: `${this.PATH_TO_FIXTURES}/process-instances/default.json`,
        });
      } else {
        await route.continue();
      }
    });

    await this.page.route('api/process-instances/history/count', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 201, body: '669' });
      } else {
        await route.continue();
      }
    });

    await this.page.route('api/process-definitions', async (route) => {
      await route.fulfill({ status: 200, path: `${this.PATH_TO_FIXTURES}/process-definitions/default.json` });
    });

    await this.page.route('api/process-definitions/count', async (route) => {
      await route.fulfill({ status: 201, body: '669' });
    });
  }
}
