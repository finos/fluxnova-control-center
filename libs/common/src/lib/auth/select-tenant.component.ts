import { Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ProcessEngineDto, Tenant } from '@fxn/types';
import { filter, find, map, sortBy, uniqBy } from 'lodash-es';
import { SubSink } from 'subsink';
import { Params, Router } from '@angular/router';
import { windowRedirect } from '../window-actions';
import { getUrlSegments } from '../utils';
import { UserService } from '../services/user.service';

@Component({
  selector: 'fluxnova-select-tenant',
  templateUrl: './select-tenant.component.html',
  styleUrls: ['./select-tenant.component.scss'],
  standalone: false,
})
export class SelectTenantComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private subs = new SubSink();
  private userService = inject(UserService);

  currentTenant?: Tenant;
  tenants: Tenant[] = [];
  isLoading = false;
  isMenuOpen = false;

  @Input() reloadPageOnSelect = false;
  @Input() isCompact = false;
  @Input() icon = true;
  @Input() tooltipPlacement = 'auto';
  @Output() tenantSelect = new EventEmitter<Tenant>();

  ngOnInit() {
    this.subs.add(
      this.userService.$user.subscribe((user) => {
        this.tenants =
          user?.engines.map((engine: ProcessEngineDto) => ({
            id: engine.name,
            displayName: engine.displayName,
            group: engine.group,
            groupDisplayName: engine.groupDisplayName,
          })) ?? [];
        this.reset();
      }),
      this.userService.$selectedTenant.subscribe((tenant) => {
        this.currentTenant = tenant;
      }),
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  reset() {
    this.currentTenant = find(this.tenants, (tenant) => tenant.id === this.currentTenant?.id);
  }

  toggle(event: Event) {
    if (!this.isCompact) {
      this.isMenuOpen = !this.isMenuOpen;
      event.stopPropagation();
    }
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  selectTenant(event: MouseEvent, tenant: Tenant) {
    event.stopPropagation();
    this.isMenuOpen = false;
    this.apply(tenant);
  }

  async apply(tenant: Tenant) {
    this.currentTenant = tenant;
    this.isLoading = true;
    this.isLoading = false;
    this.userService.selectedTenant = tenant;

    // Navigate after updating currentTenant otherwise the guard will redirect back to current tenant
    if (tenant?.id) {
      // IDs will be consistent across tenant, redirect to chosen list page.  URL example: /:tenant/process-instances
      const { page } = getUrlSegments(this.router.url);
      await this.router.navigate([tenant.id, page?.split('?')[0] || ''], {
        queryParams: this.getQueryParamsToKeep(),
      });
      // comment out next line to skip refresh app on tenant change
      if (this.reloadPageOnSelect) {
        return windowRedirect(window.location.pathname);
      }
    }
    this.tenantSelect.emit(this.currentTenant);
  }

  getQueryParamsToKeep() {
    const queryParamsToKeep = ['filters', 'sorting', 'toggleFilters'];
    const currentQueryParams = this.router.parseUrl(this.router.url).queryParams;
    const newParams: Params = {};
    queryParamsToKeep.forEach((queryParam) => {
      if (currentQueryParams[queryParam]) {
        newParams[queryParam] = currentQueryParams[queryParam];
      }
    });
    return newParams;
  }

  get hasTenantGroups() {
    const tenantGroups = this.tenantGroups;
    return tenantGroups && (tenantGroups.length > 1 || tenantGroups[0] !== undefined);
  }

  get tenantGroups() {
    return map(uniqBy(this.tenants, 'group'), 'group');
  }

  getGroupDisplayName(group?: string) {
    if (!group) {
      return '(No Group)';
    }

    const tnt = find(this.tenants, (tenant) => tenant.group === group);
    return tnt?.groupDisplayName || group;
  }

  getTenantsInGroup(group?: string) {
    if (!group) {
      return sortBy(
        filter(this.tenants, (tenant) => !tenant.group),
        ['id'],
      );
    }

    return filter(this.tenants, (tenant) => tenant.group === group);
  }

  public getTenantTooltip(tenant: Tenant) {
    if (tenant.displayName) {
      return `${tenant.displayName} (${tenant.id})`;
    }

    return tenant.id;
  }
}
