import { expect, test } from '@playwright/test';
import { BasePage } from '../page-objects/base-page.po';
import {
  getExpectedTenantNames,
  getSelectedTenantId,
  getSelectedTenantName,
  openTenantSelection,
} from '../utils/select-tenant';
import { getTestFixtureData } from '../utils/test-utils';

let basePage: BasePage;

test.beforeEach(async ({ page, context }) => {
  // abort requests that we don't need for the tests in order to speed them up
  await context.route(/profile-images/, (route) => route.abort());
  await context.route(/styles.css/, (route) => route.abort());
  await context.route(/styles.js/, (route) => route.abort());

  basePage = new BasePage(page);
});

test.describe('When a user with no access attempts to log in', () => {
  test('the user should be redirected to the login page with an error message displayed', async ({ page }) => {
    await basePage.stubConfig();
    await basePage.stubAuth(page, 'no-permissions');
    await basePage.stubAuthorizationChecks(page);
    await basePage.goto(`./default`);
    await page.waitForURL('/login?error=no-engine-access');

    await expect(page.getByText('You do not have access to any engines.')).toBeVisible();
  });
});

test.describe('When a user with access logs in', () => {
  test('the Dashboard page should be displayed', async ({ page }) => {
    await basePage.stubAuth(page);
    await basePage.stubAuthorizationChecks(page);
    await basePage.goto(`./default`);

    await expect(page.getByText('Dashboard', { exact: true })).toBeVisible();
  });
});

test.describe('The tenant selection component', () => {
  let defaultFixtureData: any;
  let srDisplayName: string;

  test.beforeEach(async () => {
    defaultFixtureData = await getTestFixtureData('auth/default');
    srDisplayName = defaultFixtureData.user.engines[0].groupDisplayName;
  });

  test.describe('should display tenants grouped together by groupDisplayName', async () => {
    let tenantDisplayNames: string[];

    test.beforeEach(async () => {
      // Load tenant names from the fixture data for the default test user
      tenantDisplayNames = defaultFixtureData.user.engines.map(
        (engine: { displayName?: string }) => engine.displayName,
      );
    });

    test.describe('when there is no tenant selected', () => {
      test.beforeEach(async ({ page }) => {
        await basePage.stubAuth(page);
        await basePage.stubAuthorizationChecks(page);
        await basePage.goto('.');
      });

      test('the heading should show "Choose a group"', async ({ page }) => {
        const dropdownTrigger = page.getByText('Choose a group');
        await expect(dropdownTrigger).toBeVisible();
      });

      test('the full list of tenants should be displayed for the user to choose from', async ({ page }) => {
        const dropdownTrigger = page.getByText('Choose a group');
        await dropdownTrigger.click();

        await expect(page.getByText(srDisplayName)).toBeVisible();

        for (const displayName of tenantDisplayNames) {
          await expect(page.getByText(displayName)).toBeVisible();
        }
      });
    });

    test.describe('when there is a tenant selected', () => {
      test.beforeEach(async ({ page }) => {
        await basePage.stubAuth(page);
        await basePage.stubAuthorizationChecks(page);
        await basePage.goto(`./default`);
      });

      test('the heading should show the name/display name of the current tenant', async ({ page }) => {
        await openTenantSelection(page);
        const selectedTenantName = await getSelectedTenantName(page);
        expect(tenantDisplayNames).toContain(selectedTenantName.trim());
      });

      test('the current tenant should not appear in the list that the user can choose from', async ({ page }) => {
        await openTenantSelection(page);

        const selectedTenantName = await getSelectedTenantName(page);
        const menuItems = page.locator('fluxnova-select-tenant .menu a');

        await expect(menuItems.filter({ hasText: selectedTenantName.trim() })).not.toBeVisible();
      });

      test('the other tenants should appear in the list', async ({ page }) => {
        await openTenantSelection(page);

        const selectedTenantName = await getSelectedTenantName(page);
        const menuItems = page.locator('fluxnova-select-tenant .menu a');
        const tenantsToCheck = getExpectedTenantNames(tenantDisplayNames, selectedTenantName);

        for (const displayName of tenantsToCheck) {
          await expect(menuItems.filter({ hasText: displayName })).toBeVisible();
        }
      });
    });
  });

  test.describe('should display a flat list of tenant IDs when no group info is available', () => {
    let fixtureData: any;
    let tenantNames: string[];

    test.beforeEach(async () => {
      fixtureData = await getTestFixtureData('auth/ungrouped-tenants');

      // Load tenant names from the fixture data
      tenantNames = fixtureData.user.engines.map((engine: { name: string }) => engine.name);
    });

    test.describe('when there is no tenant selected', () => {
      test.beforeEach(async ({ page }) => {
        await basePage.stubAuth(page, 'ungrouped-tenants');
        await basePage.stubAuthorizationChecks(page);
        await basePage.goto('.');
      });

      test('the heading should show "Choose a group"', async ({ page }) => {
        const dropdownTrigger = page.getByText('Choose a group');
        await expect(dropdownTrigger).toBeVisible();
      });

      test('the full list of tenants should be displayed for the user to choose from', async ({ page }) => {
        const dropdownTrigger = page.getByText('Choose a group');
        await dropdownTrigger.click();

        await expect(page.getByText(srDisplayName)).not.toBeVisible();

        const menuContainer = page.locator('fluxnova-select-tenant-modal div.menu');
        const menuItems = menuContainer.locator('span a');

        const tenantsToCheck = getExpectedTenantNames(tenantNames);
        for (let i = 0; i < tenantsToCheck.length; i++) {
          const displayName = tenantsToCheck[i];
          await expect(menuItems.nth(i)).toBeVisible();
          await expect(menuItems.nth(i)).toHaveText(displayName);
        }
      });
    });

    test.describe('when there is a tenant selected', () => {
      test.beforeEach(async ({ page }) => {
        await basePage.stubAuth(page, 'ungrouped-tenants');
        await basePage.stubAuthorizationChecks(page);
        await basePage.goto(`./default`);
      });

      test('the heading should show the name/display name of the current tenant', async ({ page }) => {
        await openTenantSelection(page);
        const selectedTenantName = await getSelectedTenantName(page);
        expect(tenantNames).toContain(selectedTenantName.trim());
      });

      test('the current tenant should not appear in the list that the user can choose from', async ({ page }) => {
        await openTenantSelection(page);

        const selectedTenantId = await getSelectedTenantId(page);

        const menuItems = page.locator('fluxnova-select-tenant .menu a');

        await expect(menuItems.filter({ hasText: selectedTenantId })).not.toBeVisible();
      });

      test('the other tenants should appear in the list', async ({ page }) => {
        await openTenantSelection(page);

        const selectedTenantId = await getSelectedTenantId(page);

        const menuItems = page.locator('fluxnova-select-tenant .menu a');
        const tenantsToCheck = getExpectedTenantNames(tenantNames, selectedTenantId);
        for (let i = 0; i < tenantsToCheck.length; i++) {
          const displayName = tenantsToCheck[i];
          await expect(menuItems.nth(i)).toBeVisible();
          await expect(menuItems.nth(i)).toHaveText(displayName);
        }
      });
    });
  });
});
