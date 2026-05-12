import { ActionPermissionsSpec, ItemTypeAction, ResourcePermissionPair } from '@fxn/types';
import { BrowserContext, expect, Page, test } from '@playwright/test';

type PageInitializer = (page: Page, context: BrowserContext, permissions?: ResourcePermissionPair[]) => Promise<void>;

export function buttonVisibleWithAllPermissions(
  selector: string,
  itemTypeAction: ItemTypeAction,
  pageInitializer: PageInitializer,
) {
  if (!ActionPermissionsSpec[itemTypeAction].AllOf) throw new Error('AllOf permissions not defined for this action');

  const permissions: ResourcePermissionPair[] = ActionPermissionsSpec[itemTypeAction].AllOf as ResourcePermissionPair[];

  test(`should be visible when user has all of the required permissions for ${itemTypeAction}`, async ({
    page,
    context,
  }) => {
    await pageInitializer(page, context, permissions);
    await expect(page.locator(selector)).toBeVisible();
  });
}

export function buttonVisibleWithAtLeastOnePermission(
  selector: string,
  itemTypeAction: ItemTypeAction,
  pageInitializer: PageInitializer,
) {
  if (!ActionPermissionsSpec[itemTypeAction].OneOf) throw new Error('OneOf permissions not defined for this action');

  const permissions: ResourcePermissionPair[] = ActionPermissionsSpec[itemTypeAction].OneOf as ResourcePermissionPair[];

  for (const permission of permissions) {
    test(`should be visible when user has minimum required permission ${permission.resourceName}: ${permission.permissionName}`, async ({
      page,
      context,
    }) => {
      await pageInitializer(page, context, [permission]);
      await expect(page.locator(selector)).toBeVisible();
    });
  }
}

export function buttonHiddenWithNoPermissions(selector: string, pageInitializer: PageInitializer) {
  test('should be hidden when user does not have the required permissions', async ({ page, context }) => {
    await pageInitializer(page, context, []);

    await expect(page.locator(selector)).toBeHidden();
  });
}

export function buttonNotHiddenWhenAuthIsNone(selector: string, pageInitializer: PageInitializer) {
  test('should not be hidden when AuthStrategy is NONE', async ({ page, context }) => {
    await pageInitializer(page, context);

    await expect(page.locator(selector)).not.toBeHidden();
  });
}
