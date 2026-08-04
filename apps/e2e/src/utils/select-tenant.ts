import { expect, Page } from '@playwright/test';
import { cloneDeep } from 'lodash-es';

export async function getSelectedTenantName(page: Page): Promise<string> {
  return (await page.locator('#dashboard_side_color fluxnova-select-tenant > a').first().textContent()) ?? '';
}

export async function getSelectedTenantId(page: Page): Promise<string> {
  return (
    (await page
      .locator('#dashboard_side_color fluxnova-select-tenant > a span')
      .first()
      .getAttribute('data-current-tenant-id')) ?? ''
  );
}

export function getExpectedTenantNames(tenantNames: string[], selectedTenantName?: string): string[] {
  let names = cloneDeep(tenantNames);
  names = names.sort((a, b) => a.localeCompare(b));
  if (selectedTenantName) {
    names = names.filter((name) => name.trim() !== selectedTenantName.trim());
  }
  return names;
}

export async function openTenantSelection(page: Page) {
  const sidebar = page.locator('#dashboard_side_color');
  const tenantSelect = page.locator('#dashboard_side_color fluxnova-select-tenant > a');

  await expect(tenantSelect).toBeVisible();

  const tenantsMenuContainer = sidebar.locator('fluxnova-select-tenant');

  // The first click expands the sidebar, the second opens the tenant selection dropdown
  await tenantsMenuContainer.locator('> a').first().click();
  await tenantsMenuContainer.locator('> a').first().click();

  const tenantsMenu = tenantsMenuContainer.locator('.menu');

  await expect(tenantsMenu).toBeVisible();
}
