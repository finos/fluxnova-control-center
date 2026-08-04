import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Tenant } from '@fxn/types';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockUserService } from '@fxn/test-support';
import { UserService } from '../services/user.service';
import { SelectTenantComponent } from './select-tenant.component';

describe('SelectTenantComponent', () => {
  let component: SelectTenantComponent;
  let fixture: ComponentFixture<SelectTenantComponent>;

  const mockTenants: Tenant[] = [
    { id: 'tenant1', displayName: 'Tenant 1', group: 'realm1', groupDisplayName: 'Realm 1' },
    { id: 'tenant2', displayName: 'Tenant 2', group: 'realm2', groupDisplayName: 'Realm 2' },
    { id: 'tenant3', displayName: 'Tenant 3', group: 'realm3', groupDisplayName: 'Realm 3' },
  ];

  const mockRouter = {
    navigate: vi.fn(),
    url: '/test-tenant/process-instances',
    parseUrl: vi.fn().mockReturnValue({ queryParams: {} }),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SelectTenantComponent],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: Router, useValue: mockRouter },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectTenantComponent);
    component = fixture.componentInstance;
    component.ngOnInit();
  });

  it('gets and sets the tenant information', () => {
    expect(component.currentTenant).toEqual(mockTenants[0]);
  });

  it('does not include tenants that are not part of the tenant map', () => {
    // mockTenants[2] is not in the tenant map
    expect(component.tenants).toEqual([mockTenants[0], mockTenants[1]]);
  });

  it('toggles choices only if not in compact mode', () => {
    component.isCompact = true;
    component.isMenuOpen = false;
    component.toggle(new Event('click'));
    expect(component.isMenuOpen).toBe(false);
    component.isCompact = false;
    component.toggle(new Event('click'));
    expect(component.isMenuOpen).toBe(true);
  });

  it('updates the URL to include the newly selected tenant', async () => {
    await component.apply({ id: 'test-tenant' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['test-tenant', 'process-instances'], {
      queryParams: {},
    });
  });

  it('should remove detail page queryParams', () => {
    mockRouter.parseUrl.mockReturnValue({ queryParams: { filters: 'filter1', tab: 'variables' } });
    const expected = { filters: 'filter1' };
    const actual = component.getQueryParamsToKeep();
    expect(actual).toEqual(expected);
  });

  it('should keep filters, sorting, and toggleFilter params', () => {
    mockRouter.parseUrl.mockReturnValue({
      queryParams: {
        filters: '%7B"state":%7B"type":"equals","filter":"active","filterType":"select"%7D%7D',
        sorting: '%5B%7B"colId":"startTime","sort":"desc"%7D%5D',
        toggleFilters: 'withIncidents',
        tab: 'variables',
      },
    });
    const expected = {
      filters: '%7B"state":%7B"type":"equals","filter":"active","filterType":"select"%7D%7D',
      sorting: '%5B%7B"colId":"startTime","sort":"desc"%7D%5D',
      toggleFilters: 'withIncidents',
    };
    const actual = component.getQueryParamsToKeep();
    expect(actual).toEqual(expected);
  });

  it('returns unique tenant groups', () => {
    component.tenants = [
      { id: 'tenant1', displayName: 'Tenant 1', group: 'group1', groupDisplayName: 'Group 1' },
      { id: 'tenant2', displayName: 'Tenant 2', group: 'group1', groupDisplayName: 'Group 1' },
      { id: 'tenant3', displayName: 'Tenant 3', group: 'group2', groupDisplayName: 'Group 2' },
    ];
    expect(component.tenantGroups).toEqual(['group1', 'group2']);
  });

  it('returns group display name if group exists', () => {
    component.tenants = [
      { id: 'tenant1', displayName: 'Tenant 1', group: 'group1', groupDisplayName: 'Group 1' },
      { id: 'tenant2', displayName: 'Tenant 2', group: 'group2', groupDisplayName: 'Group 2' },
    ];
    expect(component.getGroupDisplayName('group1')).toEqual('Group 1');
  });

  it('returns group name if group display name does not exist', () => {
    component.tenants = [{ id: 'tenant1', displayName: 'Tenant 1', group: 'group1' }];
    expect(component.getGroupDisplayName('group1')).toEqual('group1');
  });

  it('returns generic string if no group is available', () => {
    component.tenants = [{ id: 'tenant1' }];
    expect(component.getGroupDisplayName(undefined)).toEqual('(No Group)');
  });

  it('handles tenant group calculation if any tenant(s) have group info', () => {
    component.tenants = [
      { id: 'tenant1', displayName: 'Tenant 1', group: 'group1', groupDisplayName: 'Group 1' },
      { id: 'tenant2', displayName: 'Tenant 2', group: 'group1', groupDisplayName: 'Group 1' },
      { id: 'tenant3', displayName: 'Tenant 3', group: 'group2', groupDisplayName: 'Group 2' },
    ];

    expect(component.hasTenantGroups).toBe(true);
    expect(component.tenantGroups).toEqual(['group1', 'group2']);
  });

  it('returns correct value if no group is specified for any of the retrieved groups', () => {
    component.tenants = [{ id: 'tenant1' }, { id: 'tenant2' }, { id: 'tenant3' }];

    expect(component.hasTenantGroups).toBe(false);
    expect(component.tenantGroups).toEqual([undefined]);
  });

  it('returns tenants in the specified group', () => {
    component.tenants = [
      { id: 'tenant1', displayName: 'Tenant 1', group: 'group1', groupDisplayName: 'Group 1' },
      { id: 'tenant2', displayName: 'Tenant 2', group: 'group1', groupDisplayName: 'Group 1' },
      { id: 'tenant3', displayName: 'Tenant 3', group: 'group2', groupDisplayName: 'Group 2' },
    ];
    expect(component.getTenantsInGroup('group1')).toEqual([
      { id: 'tenant1', displayName: 'Tenant 1', group: 'group1', groupDisplayName: 'Group 1' },
      { id: 'tenant2', displayName: 'Tenant 2', group: 'group1', groupDisplayName: 'Group 1' },
    ]);
  });

  it('returns an empty array if no tenants exist in the specified group', () => {
    component.tenants = [{ id: 'tenant1', displayName: 'Tenant 1', group: 'group1', groupDisplayName: 'Group 1' }];
    expect(component.getTenantsInGroup('group2')).toEqual([]);
  });

  it('returns tenants with no group if group is undefined', () => {
    component.tenants = [
      { id: 'tenant1', displayName: 'Tenant 1' },
      { id: 'tenant2', displayName: 'Tenant 2' },
      { id: 'tenant3', displayName: 'Tenant 3' },
    ];
    expect(component.getTenantsInGroup()).toEqual([
      { id: 'tenant1', displayName: 'Tenant 1' },
      { id: 'tenant2', displayName: 'Tenant 2' },
      { id: 'tenant3', displayName: 'Tenant 3' },
    ]);
  });

  it('should return correct tooltip string from getTenantTooltip', () => {
    const tenant = {
      displayName: 'tenant name',
      id: 'tenant id',
    };
    expect(component.getTenantTooltip(tenant)).toEqual('tenant name (tenant id)');
  });
});
