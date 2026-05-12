import { expect, Page } from '@playwright/test';

interface VerificationConfig {
  headerLabelSelector: string;
  tabSelector: string;
  idSelector: string;
  idSelectorIndex: number;
  urlPattern: (urlPathOrParam: string, theId: string) => string;
  requiresGridResize?: boolean;
  useHighlightedRow?: boolean;
  checkResourceType?: boolean;
}

const COMMON_SELECTORS = {
  headerLabel: '.content .global-header .header-label',
  firstTab: '.tabs .tab.tab-border-bottom.first-tab',
  regularTab: '.tabs .tab.tab-border-bottom',
  contentId: '.content .pb-3',
  highlightedRow: '.tab-content .ag-pinned-left-cols-container .ag-row.row-highlighted',
};

const COMMON_URL_PATTERNS = {
  path: (urlPathOrParam: string, theId: string) => `${urlPathOrParam}/${theId}`,
  query: (urlPathOrParam: string, theId: string) => `${urlPathOrParam}=${theId}`,
};

const BASE_CONFIGS = {
  simple: {
    headerLabelSelector: COMMON_SELECTORS.headerLabel,
    tabSelector: COMMON_SELECTORS.firstTab,
    idSelector: COMMON_SELECTORS.contentId,
    idSelectorIndex: 1,
    urlPattern: COMMON_URL_PATTERNS.path,
  },
  grid: {
    headerLabelSelector: COMMON_SELECTORS.headerLabel,
    tabSelector: COMMON_SELECTORS.regularTab,
    idSelector: COMMON_SELECTORS.highlightedRow,
    idSelectorIndex: 1,
    urlPattern: COMMON_URL_PATTERNS.query,
    requiresGridResize: true,
    useHighlightedRow: true,
  },
};

const VERIFICATION_CONFIGS: Record<string, VerificationConfig> = {
  Variables: BASE_CONFIGS.simple,
  Instances: BASE_CONFIGS.simple,
  Jobs: BASE_CONFIGS.grid,
  Incidents: BASE_CONFIGS.grid,
  'Job Definitions': BASE_CONFIGS.grid,
  Definitions: {
    ...BASE_CONFIGS.simple,
    idSelectorIndex: 0,
    checkResourceType: true,
  },
  'Decision Instances': BASE_CONFIGS.simple,
  'Job Logs': {
    ...BASE_CONFIGS.simple,
    idSelectorIndex: 0,
  },
};

export async function clickIdLinkVerifyPageAndData(
  isLeftPinnedColumn: boolean,
  columnIndex: number,
  pageToLoad: string,
  activeTab: string,
  urlPathOrParam: string,
  page: Page,
): Promise<void> {
  /*
  1. Loop through each row for a usable ID in the specified column
  2. Make sure the row has an ID, if not then there will be nothing to click
  3. Check to see if the ID is clickable
  4. Click the ID
  5. Verify the correct data is displayed and highlighted
      - verify that the correct Details page is displayed
      - verify that the correct tab is active
      - verify that the correct ID is displayed in the info area
        OR verify that the correct row (ID) is highlighted in the active tab
      - verify that the URL has the correct ID in the correct location
  Note: In some columns, IDs can be non-clickable or not exist. Thus, the extra work to verify steps 2 and 3.
 */
  const columnGroup = isLeftPinnedColumn
    ? '.ag-pinned-left-cols-container .ag-row'
    : '.ag-center-cols-container .ag-row';
  await page.waitForSelector(columnGroup);

  const numRows = Number(await page.locator('.page-size-select .ng-value .ng-value-label').innerText());

  for (let currentRowIndex = 0; currentRowIndex < numRows; currentRowIndex++) {
    const cellLocator = page.locator(columnGroup).nth(currentRowIndex).getByRole('gridcell').nth(columnIndex);

    const theId = (await cellLocator.innerText()).trim();

    if (theId !== '') {
      const aTagClassAttribute = await cellLocator.locator('a').getAttribute('class');

      if (aTagClassAttribute && !aTagClassAttribute.includes('text-dark')) {
        await cellLocator.click();
        await verifyPageAndData(page, activeTab, pageToLoad, urlPathOrParam, theId);
        break;
      }
    }
  }
}

async function verifyPageAndData(
  page: Page,
  activeTab: string,
  pageToLoad: string,
  urlPathOrParam: string,
  theId: string,
): Promise<void> {
  const config = VERIFICATION_CONFIGS[activeTab];
  if (!config) {
    throw new Error(`Unknown active tab: ${activeTab}`);
  }

  const pageURL = page.url();

  // Resize grid for better visibility if required
  if (config.requiresGridResize) {
    await page.evaluate(() => {
      const el = document.querySelector(
        '.item-detail-vertical-split.item-detail-view.detail-item-type-process-instance.as-percent.as-transition.as-vertical',
      );
      if (el) el.setAttribute('style', 'grid-template: 15fr 8px 85fr / 1fr;');
    });
  }

  // Verify page header matches expected text
  await expect(page.locator(config.headerLabelSelector)).toHaveText(pageToLoad);

  // For Definitions, verify resource type before checking tab
  if (config.checkResourceType) {
    await expect(page.locator('.resource-list .resource').first()).toHaveClass(/selected/);
    const resourceType =
      (await page.locator('.resource-list .resource').first().innerText()).split('.').pop()?.toUpperCase() ?? '';
    // Only verify tab for BPMN or DMN resources
    if (resourceType === 'BPMN' || resourceType === 'DMN') {
      await expect(page.locator(config.tabSelector)).toContainText(activeTab);
    }
  } else {
    // Verify active tab matches expected tab
    await expect(page.locator(config.tabSelector)).toContainText(activeTab);
  }

  // Verify the ID is displayed correctly based on page type
  if (config.useHighlightedRow) {
    // For grid pages, check the highlighted row
    const selectedRow = page.locator(config.idSelector);
    await expect(selectedRow.getByRole('gridcell').nth(config.idSelectorIndex)).toHaveText(theId);
  } else {
    // For simple pages, check the content area
    await expect(page.locator(config.idSelector).nth(config.idSelectorIndex)).toHaveText(theId);
  }

  // Verify URL contains the expected ID
  expect(pageURL).toContain(config.urlPattern(urlPathOrParam, theId));
}
