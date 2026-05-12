import { Page } from '@playwright/test';
import { ListPage } from './list-page.po';

export class IncidentsListPage extends ListPage {
  constructor(protected readonly page: Page) {
    super(page);
  }

  public async navigateToIncidentsList() {
    await this.page.goto(`./${IncidentsListPage.TENANT}/incidents`);
    // Wait for the incidents list component to be visible
    await this.page.waitForSelector('fluxnova-incident-list', { timeout: 10000 });
    // Wait for the grid to be visible
    await this.page.waitForSelector('[role="grid"]', { timeout: 10000 });
  }
}
