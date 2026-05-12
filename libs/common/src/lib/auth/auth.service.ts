import { HttpClient } from '@angular/common/http';
import { inject, Injectable, Injector } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Auth, Dictionary, ProcessEngineDto, Tenant, TENANT_HEADER_KEY, User } from '@fxn/types';
import { find, isEmpty, omitBy } from 'lodash-es';
import { catchError, map, switchMap } from 'rxjs/operators';
import { WINDOW } from 'ngx-window-token';
import { NEVER, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { UserService } from '../services/user.service';
import { SelectTenantModalComponent } from './select-tenant-modal.component';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private userService = inject(UserService);
  private toast = inject(ToastService);
  private injector = inject(Injector);
  private window = inject<Window>(WINDOW);

  private reload = false;
  private pathTenant = '';

  public get modalService() {
    return this.injector.get(NgbModal);
  }

  init() {
    this.pathTenant = this.extractTenantFromPath();

    return this.http.get<Auth>('./api/auth').pipe(
      switchMap((response) => {
        if (!response?.user.id) {
          throw new Error('auth failed, no user found');
        }

        // Set user so the tenant selection modal can use it if necessary
        this.userService.user = response?.user;

        return this.chooseTenantIfNeeded({
          user: response?.user as User,
        });
      }),

      map(({ user, tenant }) => {
        this.userService.user = user;
        this.userService.selectedTenant = tenant;

        return user;
      }),

      catchError((err) => {
        if (err.status === 403) {
          this.window.location.href = this.window.location.origin + '/login?error=no-engine-access';

          return NEVER;
        }

        return throwError(() => err);
      }),
    );
  }

  public get reloading(): boolean {
    return this.reload;
  }

  public set reloading(val: boolean) {
    this.reload = val;
  }

  private async checkNeedTenantSelection(user: User): Promise<Tenant> {
    const engines = user.engines ?? [];
    const matchedEngine: ProcessEngineDto | undefined = find(
      engines,
      (engine: ProcessEngineDto) => engine.name === this.pathTenant,
    );

    if (matchedEngine) {
      // Convert ProcessEngineDto to Tenant
      return {
        id: matchedEngine.name,
        displayName: matchedEngine.displayName,
        group: matchedEngine.group,
        groupDisplayName: matchedEngine.groupDisplayName,
      };
    }

    if (this.pathTenant) {
      // Throw error because we're in the "no matched tenant" block,
      // which means the specified tenant isn't in the users permissions.
      this.toast.error(
        `You do not have access to tenant "${this.pathTenant}" which was specified in the URL".  Redirecting to available tenant.`,
      );

      // Convert ProcessEngineDto to Tenant
      return {
        id: engines[0].name,
        displayName: engines[0].displayName,
        group: engines[0].group,
        groupDisplayName: engines[0].groupDisplayName,
      };
    }

    const modal = this.modalService.open(SelectTenantModalComponent, {
      backdrop: 'static',
      size: 'l',
      backdropClass: 'opaque',
      windowClass: 'welcome-modal',
    });
    (modal.componentInstance as SelectTenantModalComponent).init(modal, user);
    return modal.result;
  }

  async chooseTenantIfNeeded(data: { user: User }) {
    const { user } = data;
    const tenant = await this.checkNeedTenantSelection(user);

    return {
      user,
      tenant,
    };
  }

  getCurrentContextHeaders(): Dictionary<string> {
    const headers = {
      [TENANT_HEADER_KEY]: this.userService.selectedTenantId || '',
    };
    return omitBy(headers, isEmpty);
  }

  extractTenantFromPath(): string {
    const baseUrl = this.window.fluxnovaConfig.fxnPublicUrl;
    const currentPath = this.window.location.pathname;

    // This part is needed to handle cases where the base url contains a path (e.g. branch deployments)
    let remainingPath = currentPath;
    if (baseUrl) {
      const baseUrlPath = new URL(baseUrl).pathname;
      remainingPath = currentPath.replace(baseUrlPath, '');
    }

    const pathSegments = remainingPath.split('/').filter((segment) => segment);
    return pathSegments[0] || '';
  }
}
