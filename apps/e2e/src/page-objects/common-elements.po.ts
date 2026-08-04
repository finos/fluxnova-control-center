/* eslint-disable max-lines */
import { Page } from '@playwright/test';

/**
 * Common Elements Page Object
 * Contains reusable selectors for elements that appear across multiple pages
 */
export class CommonElements {
  constructor(protected readonly page: Page) {}

  // ==========================================
  // HEADER ELEMENTS
  // ==========================================

  get fluxnovaIcon() {
    return this.page.locator('fluxnova-icon[iconname="fluxnova-icon"]');
  }

  get sidenavHeader() {
    return this.page.locator('.sidenav-header');
  }

  get globalHeader() {
    return this.page.locator('.global-header');
  }

  get headerLabel() {
    return this.page.locator('.header-label');
  }

  // ==========================================
  // FOOTER BAR ELEMENTS
  // ==========================================

  get userImage() {
    return this.page.locator('img.profile-menu-img[alt="profile image"]');
  }

  get paginationSize() {
    return this.page.locator('.limit-selection.d-flex > ng-select > div.ng-select-container.ng-has-value');
  }

  get totalItems() {
    return this.page.locator('.displayed-count-wrapper');
  }

  get pageNav() {
    return this.page.locator('.page-selection > ngb-pagination > ul');
  }

  get sidenavFooter() {
    return this.page.locator('fluxnova-footer');
  }

  get profileIcon() {
    return this.page.locator('.profile-icon');
  }

  // ==========================================
  // NAVIGATION MENU
  // ==========================================

  get navigationMenu() {
    return this.page.locator('.navigation-menu');
  }

  get searchIcon() {
    return this.page.locator('fluxnova-icon[iconname="search"]');
  }

  getNavigationLink(text: string) {
    return this.page.locator('a').filter({ hasText: text });
  }

  // ==========================================
  // CANVAS/DIAGRAM CONTROLS
  // ==========================================

  get resetZoomButton() {
    return this.page.locator('#recenter-diagram');
  }

  get zoomOutButton() {
    return this.page.locator('#zoom-out');
  }

  get zoomInButton() {
    return this.page.locator('#zoom-in');
  }

  get diagramLegend() {
    return this.page.getByTestId('diagram-legend-trigger');
  }

  get diagramLegendPanel() {
    return this.page.locator('#diagram-legend');
  }

  get diagramViewport() {
    return this.page.locator('.bjs-container .viewport');
  }

  get lowerPanelButton() {
    return this.page.locator('.lower-panel-btn');
  }

  get heatMapButton() {
    return this.page.locator('#toggle-heatmap');
  }

  get heatMapSettingsButton() {
    return this.page.getByRole('button', { name: 'Heatmap Settings' });
  }

  get heatMapUpdateButton() {
    return this.page.getByRole('button', { name: 'Update' });
  }

  get tokenToggleButton() {
    return this.page.locator('#instance-statistics');
  }

  get diagramFlowButton() {
    return this.page.locator('#toggle-diagram-flow');
  }

  // Panel control buttons (info panel toggle, expand/shrink diagram)
  get panelButtonContainer() {
    return this.page.locator('.panel-btn-container');
  }

  get infoPanelToggleButton() {
    return this.page.locator('.panel-btn-container button').first();
  }

  get expandDiagramButton() {
    return this.page.locator('.panel-btn-container button').nth(1);
  }

  // ==========================================
  // TOAST MESSAGES
  // ==========================================

  get toastMessage() {
    return this.page.locator('.toast-body > .header');
  }

  // ==========================================
  // GRID/TABLE ELEMENTS
  // ==========================================

  get grid() {
    return this.page.getByRole('grid');
  }

  getColumnHeader(headerName: string) {
    return this.page.getByRole('columnheader', { name: headerName });
  }

  get agPagination() {
    return this.page.locator('fluxnova-ag-pagination');
  }

  // ==========================================
  // PANELS
  // ==========================================

  get leftPanel() {
    return this.page.locator('#leftPanel');
  }

  get bottomPanel() {
    return this.page.locator('#bottomPanel');
  }

  get tabPanel() {
    return this.page.locator('.tab-panel');
  }
}

export class ActionButtons {
  constructor(protected readonly page: Page) {}

  get activate() {
    return this.page.locator('#activate');
  }

  get suspend() {
    return this.page.locator('#suspend');
  }

  get terminate() {
    return this.page.locator('#terminate');
  }

  get delete() {
    return this.page.locator('#delete');
  }

  get retry() {
    return this.page.locator('#retry');
  }

  get dueDate() {
    return this.page.locator('#due-date');
  }

  get download() {
    return this.page.locator('#download_resource');
  }

  get moveTokens() {
    return this.page.locator('#move_tokens');
  }

  get startProcess() {
    return this.page.getByRole('button', { name: 'Start Process' });
  }

  get changePriority() {
    return this.page.locator('#tab-priority');
  }
}

/**
 * Bulk Action Buttons Page Object
 * Contains selectors for bulk action buttons in list views
 */
export class BulkActionButtons {
  constructor(protected readonly page: Page) {}

  // Process Instances bulk actions
  get play() {
    return this.page.locator('fluxnova-icon[iconname="play"]');
  }

  get pause() {
    return this.page.locator('fluxnova-icon[iconname="pause"]');
  }

  get terminate() {
    return this.page.locator('fluxnova-icon[iconname="terminate"]');
  }

  // Batches bulk actions
  get batchSuspendButton() {
    return this.page.locator('button[data-action="suspend"]');
  }

  get batchRetryButton() {
    return this.page.locator('fluxnova-icon[iconname="retry"]');
  }

  get batchDeleteButton() {
    return this.page.locator('fluxnova-icon[iconname="trash-filled"]');
  }
}

/**
 * Common Column Headers
 * Helper methods for accessing common column headers across different grids
 */
export class ColumnHeaders {
  constructor(protected readonly page: Page) {}

  // Process Instance columns
  get processInstanceTab() {
    const headers = [
      'Instance ID',
      'Definition Name',
      'Version',
      'Start Time',
      'State',
      'Instance Business Key',
      'Start User ID',
      'End Time',
      'Definition ID',
      'Definition Key',
      'Root Process Instance ID',
      'Super Process Instance ID',
    ];
    return headers;
  }

  // Process Definition Instance Tab columns
  get processDefinitionInstanceTab() {
    const headers = ['Instance ID', 'State', 'Start Time', 'End Time', 'Start User ID'];
    return headers;
  }

  // Incidents columns
  get incidentsTab() {
    const headers = ['Incident ID', 'Create Time', 'Incident Type', 'Activity ID', 'Activity Name'];
    return headers;
  }

  // Job Definitions columns
  get jobDefinitionsTab() {
    const headers = [
      'Job Definition ID',
      'Job Type',
      'Job Configuration',
      'Activity ID',
      'Activity Name',
      'Suspended',
      'Overriding Job Priority',
    ];
    return headers;
  }

  // Called Process Definitions columns
  get calledProcessDefinitionsTab() {
    const headers = ['Called Process Definition', 'State', 'Activity ID', 'Activity Name'];
    return headers;
  }

  // Decision Instances columns
  get decisionInstancesTab() {
    const headers = ['ID', 'Evaluation Time', 'Activity ID', 'Calling Instance ID'];
    return headers;
  }

  // Batch columns
  get batchTab() {
    const headers = ['Batch ID', 'Create User', 'Start Time', 'Failed Jobs', 'Progress', 'Suspended', 'Type'];
    return headers;
  }

  // Job Logs columns
  get jobLogsTab() {
    const headers = [
      'Job ID',
      'Job Definition Type',
      'Timestamp',
      'Log Type',
      'Message',
      'Job Definition ID',
      'Hostname',
      'Retries',
    ];
    return headers;
  }

  // Failed Jobs columns
  get failedJobsTab() {
    const headers = ['Job ID', 'Job Definition ID', 'Create Time', 'Exception Message'];
    return headers;
  }

  // Remaining Jobs columns
  get remainingJobsTab() {
    const headers = ['Job ID', 'Job Definition ID', 'Create Time', 'Suspended'];
    return headers;
  }
}

/**
 * Common Checkboxes and Toggles
 */
export class CommonToggles {
  constructor(protected readonly page: Page) {}

  get withIncidentsCheckbox() {
    return this.page.locator('input[class="withIncidents pointer"]');
  }

  get showCompletedBatchesToggle() {
    return this.page.getByLabel('Show Completed Batches');
  }

  get latestVersionCheckbox() {
    return this.page.locator('input[class="latestVersion pointer"]');
  }
}

/**
 * Process Instance Detail Page Tabs
 */
export class ProcessInstanceTabs {
  constructor(protected readonly page: Page) {}

  getTabs() {
    return this.page.locator('nav.tabs');
  }

  /**
   * Get a tab by its name
   * @param tabName The name of the tab to retrieve (case-sensitive, matches data-tab attribute)
   * @returns A locator for the tab with the specified name
   */
  getTabByName(tabName: string) {
    return this.page.locator(`li.tab[data-tab="${tabName}"]`);
  }

  get variablesTab() {
    return this.getTabByName('variables');
  }

  get incidentsTab() {
    return this.getTabByName('incidents');
  }

  get calledProcessInstancesTab() {
    return this.getTabByName('called-process-instances');
  }

  get jobsTab() {
    return this.getTabByName('jobs');
  }

  get historyTab() {
    return this.getTabByName('history');
  }

  get decisionInstancesTab() {
    return this.getTabByName('decision-instances');
  }
}

/**
 * Process Definition Detail Page Tabs
 */
export class ProcessDefinitionTabs {
  constructor(protected readonly page: Page) {}

  getTabs() {
    return this.page.locator('nav.tabs');
  }

  /**
   * Get a tab by its name
   * @param tabName The name of the tab to retrieve (case-sensitive, matches data-tab attribute)
   * @returns A locator for the tab with the specified name
   */
  getTabByName(tabName: string) {
    return this.page.locator(`li.tab[data-tab="${tabName}"]`);
  }

  get instances() {
    return this.getTabByName('instances');
  }

  get incidents() {
    return this.getTabByName('incidents');
  }

  get jobDefinitions() {
    return this.getTabByName('job-definitions');
  }

  get calledProcessDefinitions() {
    return this.getTabByName('called-process-definitions');
  }

  get decisionInstances() {
    return this.getTabByName('decision-instances');
  }
}
