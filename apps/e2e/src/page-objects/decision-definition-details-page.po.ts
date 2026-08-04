import { Page } from '@playwright/test';
import decisionDefinitionDetailsFixture from '../fixtures/decision-definitions/default-details.json';
import { getDecisionDefinitionId } from '../utils/test-utils';
import { FLUXNOVA_PAGES } from './base-page.po';
import { DetailsPage } from './details-page.po';

export class DecisionDefinitionDetailsPage extends DetailsPage {
  constructor(
    protected readonly page: Page,
    protected resourceId?: string,
  ) {
    super(page, FLUXNOVA_PAGES.DECISION_DEFINITIONS, resourceId);
  }

  get decisionDefinitionId() {
    return this._resourceId || '';
  }

  public override async goto(urlParameter?: string) {
    const url = urlParameter || this.detailsPageUrl;

    await super.goto(url);
  }

  public async stubApisCalledOnLoad() {
    await super.stubApisCalledOnLoad();
    await this.stubDecisionDefinition();
    await this.stubDecisionInstanceCount();
    await this.stubDecisionInstances();
    await this.stubDecisionDefinitionVersions();
  }

  private async stubDecisionDefinition() {
    await this.page.route(`api/decision-definition/${this.resourceId}`, async (route) => {
      await route.fulfill({
        json: decisionDefinitionDetailsFixture,
      });
    });
  }

  private async stubDecisionInstanceCount() {
    await this.page.route('api/decision-instances/count', async (route) => {
      await route.fulfill({
        json: 1,
      });
    });
  }

  private async stubDecisionInstances() {
    await this.page.route('api/decision-instances', async (route) => {
      await route.fulfill({
        json: [],
      });
    });
  }

  private async stubDecisionDefinitionVersions() {
    await this.page.route('api/decision-definition', async (route) => {
      await route.fulfill({
        json: [],
      });
    });
  }

  public async navigateToDefinitionDetailsPage(key: string) {
    const definitionId = await getDecisionDefinitionId(key, this.page);
    this._resourceId = definitionId;
    await this.page.goto(`./${DecisionDefinitionDetailsPage.TENANT}/decision-definitions/${definitionId}`);
  }
}
