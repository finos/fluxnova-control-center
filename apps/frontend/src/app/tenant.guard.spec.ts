import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { mockUserService } from '@fxn/test-support';
import { UserService } from '@fxn/common';
import { TenantGuard } from './tenant.guard';

describe('Tenant Guard', () => {
  let component: TenantGuard;

  const mockRouter = {
    navigate: vi.fn(),
    location: {},
  } as any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TenantGuard,
        { provide: Router, useValue: mockRouter },
        { provide: UserService, useValue: mockUserService },
      ],
    });

    mockRouter.navigate.mockReturnValue(Promise.resolve({}));

    component = TestBed.inject(TenantGuard);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('checks that a tenant is provided', () => {
    expect(component.canActivate({ params: { tenant: 'tenant1' } } as any)).toBe(true);
    expect(component.canActivate({ params: { tenant: 'restricted-tenant' } } as any)).toBe(false);
  });

  it('navigates to the current tenant if it is not in the route params', () => {
    component.canActivate({ params: { tenant: 'new-tenant' } } as any);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['tenant1']);
  });
});
