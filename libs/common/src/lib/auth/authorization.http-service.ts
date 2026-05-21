import { firstValueFrom, map, Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ResourcePermissionPair } from '@fxn/types/src/permissions';
import { createSessionCache } from '../utils/cache-utils';
import { memoize } from '../services/memoize';
import { UserService } from '../services/user.service';

@Injectable({
  providedIn: 'root',
})
export class AuthorizationHttpService {
  private http: HttpClient = inject(HttpClient);
  private userService = inject(UserService);
  private permissionCache = createSessionCache({
    keyPrefix: 'auth_permission_',
  });

  constructor() {
    this.check = memoize(this._check, 2000);
  }

  private getCacheKey(permission: ResourcePermissionPair, userId?: string | null, tenantId?: string | null): string {
    return JSON.stringify({
      permissionName: permission.permissionName,
      resourceName: permission.resourceName,
      resourceType: permission.resourceType,
      resourceId: permission.resourceId ?? null,
      userId: userId ?? null,
      tenantId: tenantId ?? null,
    });
  }

  private _check = (permission: ResourcePermissionPair) => {
    let url = `./api/authorization/check?permissionName=${permission.permissionName}&resourceName=${permission.resourceName}&resourceType=${permission.resourceType}`;

    if (permission.resourceId) {
      url += `&resourceId=${permission.resourceId}`;
    }

    return this.http.get<{ authorized: boolean }>(url);
  };

  public check: (permission: ResourcePermissionPair) => Observable<{ authorized: boolean }>;

  public async checkSync(permission: ResourcePermissionPair): Promise<boolean> {
    const userId = this.userService.user?.id;
    const tenantId = this.userService.selectedTenantId;
    const cacheKey = this.getCacheKey(permission, userId, tenantId);

    const cachedResult: boolean | null = this.permissionCache.get(cacheKey);

    if (cachedResult != null) {
      return cachedResult;
    }

    return firstValueFrom(
      this.check(permission).pipe(
        map((res: { authorized: boolean }) => res.authorized),
        tap((authorized) => this.permissionCache.set(cacheKey, authorized)),
      ),
    );
  }
}
