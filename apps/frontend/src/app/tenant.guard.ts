import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { UserService } from '@fxn/common';

@Injectable({ providedIn: 'root' })
export class TenantGuard {
  private router = inject(Router);
  private userService = inject(UserService);

  tenant?: string;

  constructor() {
    // The source of truth for the selected tenant. We can't use the URL because users can put in whatever they want.
    // The app initialization and auth service checks that the user has access and sets it accordingly.
    this.userService.$selectedTenant.subscribe((tenant) => {
      this.tenant = tenant?.id;
    });
  }

  canActivate(route: ActivatedRouteSnapshot) {
    if (!route.params.tenant || route.params.tenant !== this.tenant) {
      if (this.tenant) {
        this.router.navigate([this.tenant]);
      }
      return false;
    }
    return true;
  }
}
