import { expect, Page } from '@playwright/test';

export async function checkFluxnovaIcon(page: Page): Promise<void> {
  const fluxnovaIcon = page.locator('fluxnova-icon[iconname="fluxnova-icon"]');
  await expect(fluxnovaIcon).toBeVisible();
}

export async function checkLeftNavBar(page: Page): Promise<void> {
  // First, locate the left nav bar container to scope all selectors within it
  const leftNav = page.locator('#dashboard_side_color');

  // Click on the sidebar's navigation menu container at a specific position in the padding to avoid links
  const sidebarToggle = leftNav.locator('.navigation-menu');

  // Use text-based selectors scoped to the left nav bar - more robust than href-based selectors
  const processDefinitionsMenuText = leftNav.locator('.navigation-menu a span.text-white', {
    hasText: 'Process Definitions',
  });
  const processInstancesMenuText = leftNav.locator('.navigation-menu a span.text-white', {
    hasText: 'Process Instances',
  });
  const jobsMenuText = leftNav.locator('.navigation-menu a span.text-white', { hasText: 'Jobs' });
  const incidentsMenuText = leftNav.locator('.navigation-menu a span.text-white', { hasText: 'Incidents' });
  const batchesMenuText = leftNav.locator('.navigation-menu a span.text-white', { hasText: 'Batches' });
  const deploymentsMenuText = leftNav.locator('.navigation-menu a span.text-white', { hasText: 'Deployments' });
  const decisionsMenuText = leftNav.locator('.navigation-menu a span.text-white', { hasText: 'Decision Definitions' });

  // Check if sidebar is currently closed (menu text should not be visible)
  const isProcessDefsVisible = await processDefinitionsMenuText.isVisible();

  if (!isProcessDefsVisible) {
    // Sidebar is closed, verify other menu items are also not visible
    await expect(processDefinitionsMenuText).not.toBeVisible();
    await expect(processInstancesMenuText).not.toBeVisible();
    await expect(jobsMenuText).not.toBeVisible();
    await expect(incidentsMenuText).not.toBeVisible();
    await expect(batchesMenuText).not.toBeVisible();
    await expect(deploymentsMenuText).not.toBeVisible();
    await expect(decisionsMenuText).not.toBeVisible();

    // Click on empty space in the left nav bar to expand
    // Click at position (5, 5) relative to the navigation menu to hit the padding area, not any links
    await sidebarToggle.click({ position: { x: 5, y: 5 } });

    // Wait for animation/state change
    await page.waitForTimeout(300);
  }

  // Verify all menu items are now visible
  await expect(processDefinitionsMenuText).toBeVisible();
  await expect(processInstancesMenuText).toBeVisible();
  await expect(jobsMenuText).toBeVisible();
  await expect(incidentsMenuText).toBeVisible();
  await expect(batchesMenuText).toBeVisible();
  await expect(deploymentsMenuText).toBeVisible();
  await expect(decisionsMenuText).toBeVisible();
}

export async function checkFooterBarElements(page: Page): Promise<void> {
  const userImage = page.locator('#dashboard_side_color > div.profile-menu > div > a > img');
  const paginationSize = page.locator('div.limit-selection.d-flex > ng-select > div');
  const totalItems = page.locator('div.displayed-count-wrapper');
  const pageNav = page.locator('div.page-selection > ngb-pagination > ul');
  await expect(userImage).toBeVisible();
  await expect(paginationSize).toContainText('50');
  await expect(totalItems).toBeVisible();
  await expect(pageNav).toBeVisible();
}
