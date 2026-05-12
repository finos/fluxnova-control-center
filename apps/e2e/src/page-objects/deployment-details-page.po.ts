import { Page } from '@playwright/test';
import {
  getDecisionDefinitionList,
  getDecisionRequirementsDefinitionList,
  getDetails,
  getDmnDiagramResource,
  getProcessDefinitions,
  getResourceDataBpmn,
  getResourceDataDmn,
  getResourceDataJs,
  getResources,
} from '../fixtures/deployments/deployment-details';
import { getDeploymentId } from '../utils/test-utils';
import { FLUXNOVA_PAGES } from './base-page.po';
import { DetailsPage } from './details-page.po';

export class DeploymentDetailsPage extends DetailsPage {
  constructor(
    protected readonly page: Page,
    protected resourceId?: string,
  ) {
    super(page, FLUXNOVA_PAGES.DEPLOYMENTS, resourceId);
  }

  get deploymentId() {
    return this._resourceId || '';
  }

  public override async goto(urlParameter?: string) {
    const url = urlParameter || this.detailsPageUrl;

    await super.goto(url);
  }

  public async navigateToDeploymentDetailsByName(name: string) {
    this._resourceId = await getDeploymentId(name, this.page);
    await this.page.goto(`./${DeploymentDetailsPage.TENANT}/deployments/${this._resourceId}`);
  }

  public async stubApisCalledOnLoad() {
    await super.stubApisCalledOnLoad();

    await this.stubDeployment();
    await this.stubDeploymentResource();
    await this.stubDeploymentResourceData1();
    await this.stubDeploymentResourceData2();
    await this.stubDeploymentResourceData3();
    await this.stubDecisionDefinitions();
    await this.stubProcessDefinitions();
    await this.stubDecisionRequirementsDefinition();
  }

  private async stubProcessDefinitions() {
    await this.page.route('/api/process-definitions', async (route) => {
      await route.fulfill({
        json: getProcessDefinitions(this.deploymentId),
      });
    });
  }

  private async stubDeploymentResourceData3() {
    await this.page.route(`**/api/deployment/${this.deploymentId}/resource/456/data`, async (route) => {
      await route.fulfill({ body: getResourceDataDmn() });
    });
  }

  private async stubDeploymentResourceData2() {
    await this.page.route(`**/api/deployment/${this.deploymentId}/resource/234/data`, async (route) => {
      await route.fulfill({ json: getResourceDataBpmn() });
    });
  }

  private async stubDeploymentResourceData1() {
    await this.page.route(`**/api/deployment/${this.deploymentId}/resource/123/data`, async (route) => {
      await route.fulfill({ json: getResourceDataJs() });
    });
  }

  public async stubDeployment() {
    await this.page.route(`**/api/deployment/${this.deploymentId}`, async (route) => {
      await route.fulfill({ json: getDetails(this.deploymentId) });
    });
  }

  public async stubDeploymentResource() {
    await this.page.route(`**/api/deployment/${this.deploymentId}/resource`, async (route) => {
      await route.fulfill({ json: getResources(this.deploymentId) });
    });
  }

  private async stubDecisionRequirementsDefinition() {
    const resourceName = getDmnDiagramResource(this.deploymentId).name;
    await this.page.route(
      `**/api/decision-requirements-definition?deploymentId=${this.deploymentId}&resourceName=${resourceName}&maxResults=50&firstResult=0`,
      async (route) => {
        await route.fulfill({ json: getDecisionRequirementsDefinitionList() });
      },
    );
  }

  private async stubDecisionDefinitions() {
    await this.page.route(`**/api/decision-definition?deploymentId=**&resourceName=**`, async (route) => {
      await route.fulfill({ json: getDecisionDefinitionList() });
    });
  }
}
