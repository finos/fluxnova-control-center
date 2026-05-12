import { inject, Injectable } from '@angular/core';
import { WINDOW } from 'ngx-window-token';
import { ActionPermissionsSpec, ItemTypeAction, PermissionSpecification, ResourcePermissionPair } from '@fxn/types';
import { AuthorizationHttpService } from '../auth/authorization.http-service';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private authHttpService = inject(AuthorizationHttpService);
  private window = inject<Window>(WINDOW);

  async meetsPermissionSpecification(requiredPermissions: PermissionSpecification): Promise<boolean> {
    if (!requiredPermissions.AllOf && !requiredPermissions.OneOf) {
      return false;
    }

    const hasAllOfPermissions = requiredPermissions.AllOf
      ? await this.hasAllOfPermissions(requiredPermissions.AllOf)
      : true;
    const hasOneOfPermissions = requiredPermissions.OneOf
      ? await this.hasOneOfPermissions(requiredPermissions.OneOf)
      : true;

    return hasAllOfPermissions && hasOneOfPermissions;
  }

  private async hasAllOfPermissions(
    allOfPermissions: (ResourcePermissionPair | PermissionSpecification)[],
  ): Promise<boolean> {
    for (const permissionOrSpecification of allOfPermissions) {
      if ('resourceName' in permissionOrSpecification) {
        if (!(await this.hasPermission(permissionOrSpecification))) {
          return false;
        }
      } else if (!(await this.meetsPermissionSpecification(permissionOrSpecification))) {
        return false;
      }
    }
    return true;
  }

  private async hasOneOfPermissions(
    oneOfPermissions: (ResourcePermissionPair | PermissionSpecification)[],
  ): Promise<boolean> {
    for (const permissionOrSpecification of oneOfPermissions) {
      if ('resourceName' in permissionOrSpecification) {
        if (await this.hasPermission(permissionOrSpecification)) {
          return true;
        }
      } else if (await this.meetsPermissionSpecification(permissionOrSpecification)) {
        return true;
      }
    }
    return false;
  }

  private async hasPermission(permissionPair: ResourcePermissionPair): Promise<boolean> {
    let isPermitted: boolean;

    try {
      isPermitted = this.window.fluxnovaConfig.authRequired
        ? await this.authHttpService.checkSync(permissionPair)
        : true;
    } catch (err) {
      console.error('Error during permission check:', err);
      isPermitted = false;
    }

    // User may have "ALL" permission that would fulfill this - check for that before returning a negative result
    if (!isPermitted && permissionPair.permissionName !== 'ALL') {
      isPermitted = await this.hasPermission({ ...permissionPair, permissionName: 'ALL' });
    }

    return isPermitted;
  }

  public async hasAnyPermission(permissions: ItemTypeAction[]): Promise<boolean> {
    const requiredPermissions: PermissionSpecification[] = permissions.map(
      (permission) => ActionPermissionsSpec[permission],
    );
    for (const permission of requiredPermissions) {
      if (await this.meetsPermissionSpecification(permission)) {
        return true;
      }
    }
    return false;
  }
}
