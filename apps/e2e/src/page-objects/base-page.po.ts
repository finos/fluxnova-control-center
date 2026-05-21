import { BrowserContext, expect, Page } from '@playwright/test';
import { isEmpty } from 'lodash-es';
import { join } from 'path';
import { DEFAULT_ENGINE } from '@fxn/test-support';
import { ResourcePermissionPair } from '@fxn/types';

export class BasePage {
  public readonly PATH_TO_FIXTURES: string = join(__dirname, '../fixtures');
  public static readonly TENANT: string =
    process.env.FXN_TEST_TENANT && !isEmpty(process.env.FXN_TEST_TENANT) ? process.env.FXN_TEST_TENANT : DEFAULT_ENGINE;

  constructor(protected readonly page: Page) {}

  get toastHeader() {
    return this.page.locator('.toast-body > .header');
  }

  public async goto(path: string = './') {
    await this.page.goto(path, { waitUntil: 'load' });
  }

  public async stubAuth(context: BrowserContext | Page, responseFixture: string | object = 'default') {
    await context.route('**/auth', async (route) => {
      if (typeof responseFixture === 'string') {
        if (responseFixture === 'no-permissions') {
          await route.fulfill({ status: 403 });
        } else await route.fulfill({ status: 200, path: `${this.PATH_TO_FIXTURES}/auth/${responseFixture}.json` });
      } else {
        await route.fulfill({ status: 200, json: responseFixture });
      }
    });
  }

  /**
   * Stubs authorization checks for the specified permissions.
   *
   * This can be used to mock permissions for use in the following scenarios:
   * - Granting specific permissions to the user (by providing a list of `permissionsGrantedToUser`)
   * - Denying ALL permissions to the user (by setting `permissionsGrantedToUser` to `[]`)
   *
   * @param context
   * @param permissionsGrantedToUser
   */
  public async stubAuthorizationChecks(
    context: BrowserContext | Page,
    permissionsGrantedToUser: ResourcePermissionPair[] = [],
  ) {
    await context.route('**/authorization/check?**', async (route) => {
      const isAuthorized = permissionsGrantedToUser.some(
        (permission) =>
          route.request().url().includes(`resourceName=${permission.resourceName}`) &&
          route.request().url().includes(`resourceType=${permission.resourceType}`) &&
          (!permission.resourceId || route.request().url().includes(`resourceId=${permission.resourceId}`)) &&
          route.request().url().includes(`permissionName=${permission.permissionName}`),
      );

      return route.fulfill({ status: 200, json: { authorized: isAuthorized } });
    });
  }

  public async stubApisCalledOnLoad() {
    await this.page.unrouteAll();

    await this.stubConfig();
    await this.stubVersion();
    await this.stubProfileImages();
  }

  public async stubProfileImages() {
    await this.page.route(/profile-images/, (route) => route.fulfill({ status: 201, body: '' }));
  }

  public async stubConfig(authRequired: boolean = true) {
    // Unroute any existing handlers for config.js to ensure the latest stub is the only one in effect,
    // otherwise we may have multiple handlers attempting to fulfill the same request which can lead to unpredictable results
    await this.page.unroute(/config.js/);

    await this.page.route(/config.js/, async (route) => {
      const response = await route.fetch();
      const body = await response.text();
      const parts = body.split('window.fluxnovaConfig = ');
      const config = JSON.parse(parts[1]);

      config.authRequired = authRequired;

      const newBody = `window.fluxnovaConfig = ${JSON.stringify(config)}`;

      await route.fulfill({
        response, // Carry over headers/status from original
        body: newBody, // Use modified body
      });
    });
  }

  public async stubVersion() {
    await this.page.route('**/version', (route) => route.fulfill({ status: 200, json: { version: '2.0.0' } }));
  }

  /**
   *
   * @param context
   * @param permissions If permissions are undefined, enter into a AuthStrategy.NONE scenario where the user should have
   *                    access to all features regardless of permissions. If permissions are an empty array, the user is
   *                    authenticated but does not have any permissions, so features should be hidden/disabled
   *                    accordingly.
   */
  public async initialize(context: BrowserContext | Page, permissions?: ResourcePermissionPair[]) {
    await this.stubAuth(context);

    // Only stub authorization checks if auth is required - if auth is not required,
    // the user should have access to all features regardless of the permissions provided
    if (permissions) await this.stubAuthorizationChecks(context, permissions);

    await this.stubApisCalledOnLoad();
    await this.stubConfig(!!permissions);
    await this.setWindowSize();
  }

  public async setWindowSize() {
    await this.page.setViewportSize({ width: 2560, height: 1440 });
  }

  public async waitForLoad() {
    await expect(this.page.locator('fluxnova-loading').locator('svg').first()).not.toBeVisible();
  }
}

export const enum FLUXNOVA_PAGES {
  BATCHES = 'batches',
  DEFINITIONS = 'process-definitions',
  DEPLOYMENTS = 'deployments',
  INCIDENTS = 'incidents',
  INSTANCES = 'process-instances',
  JOBS = 'jobs',
  DECISION_DEFINITIONS = 'decision-definitions',
}
