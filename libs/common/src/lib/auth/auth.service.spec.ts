import { afterEach, beforeEach, describe, expect, it, type Mocked, vi } from 'vitest';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TENANT_HEADER_KEY, User } from '@fxn/types';
import { firstValueFrom, of, throwError } from 'rxjs';
import { WINDOW } from 'ngx-window-token';
import { mockUserService } from '@fxn/test-support';
import { ToastService } from '../services/toast.service';
import { UserService } from '../services/user.service';
import { AuthService } from './auth.service';

vi.mock('../selectors');
describe('AuthService', () => {
  let service: AuthService;
  const mockHttp = {
    get: vi.fn(),
  };

  const mockInjector = {
    get: vi.fn(),
  };

  const mockEngine = {
    displayName: 'Important Tenant',
    name: 'Tenant1',
    group: 'Group1',
    groupDisplayName: 'Important Group',
  };
  const mockTenant = {
    displayName: 'Important Tenant',
    id: 'Tenant1',
    group: 'Group1',
    groupDisplayName: 'Important Group',
  };

  const mockUser: User = {
    id: 'user1',
    engines: [mockEngine],
  };

  const mockModal = {
    open: vi.fn(),
  } as unknown as Mocked<NgbModal>;

  const mockModalRef = {
    componentInstance: {
      init: vi.fn(),
    },
    result: Promise.resolve(mockTenant),
  } as unknown as Mocked<NgbModalRef>;

  const mockRoute = {
    params: of({ tenant: 'tenant1' }),
  };

  const mockToast = {
    error: vi.fn(),
    info: vi.fn(),
  };

  let mockWindow: any;

  beforeEach(() => {
    mockWindow = getMockWindow(`https://url.com/${mockTenant.id}/process-instances`);
    mockModal.open.mockReturnValue(mockModalRef);
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: NgbModal, useValue: mockModal },
        { provide: HttpClient, useValue: mockHttp },
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: Router, useValue: mockRoute },
        { provide: WINDOW, useValue: mockWindow },
        { provide: ToastService, useValue: mockToast },
      ],
    });
    service = TestBed.inject(AuthService);

    mockInjector.get.mockReturnValue(mockModal);
    mockHttp.get.mockReturnValue(
      of({
        user: mockUser,
        preferences: undefined,
      }),
    );
  });

  afterEach(() => vi.resetAllMocks());

  it('prefers the tenant specified in the path', async () => {
    const testEngine = {
      name: 'test-tenant',
      displayName: 'Test Tenant',
      group: 'test-group',
      groupDisplayName: 'Test Group',
    };
    mockWindow.location.pathname = `/${testEngine.name}/process-instances`;
    service.init();
    mockUser?.engines?.push(testEngine);
    const info = await service.chooseTenantIfNeeded({
      user: mockUser,
    });
    expect(info.tenant?.id).toEqual(testEngine.name);
  });

  it('warns user if they do not have access to a specified tenant', async () => {
    const testEngine = {
      name: 'test-tenant',
      displayName: 'Test Tenant',
      group: 'test-group',
      groupDisplayName: 'Test Group',
    };
    mockWindow.location.pathname = `/no-access/process-instances`;
    service.init();
    mockUser?.engines?.push(testEngine);
    const info = await service.chooseTenantIfNeeded({
      user: mockUser,
    });
    expect(mockToast.error).toHaveBeenCalledWith(
      `You do not have access to tenant "no-access" which was specified in the URL".  Redirecting to available tenant.`,
    );
    expect(info.tenant?.id).toEqual(mockTenant.id);
  });

  it('should open a modal to allow user to choose tenant when they only have access to one', async () => {
    await service.chooseTenantIfNeeded({
      user: mockUser,
    });
    expect(mockModal.open).toHaveBeenCalled();
  });

  it('should open a modal to allow user to choose tenant', async () => {
    // We need at least 2 tenants, and no preferences stored
    const testEngine = {
      name: 'test-tenant',
      displayName: 'Test Tenant',
      group: 'test-group',
      groupDisplayName: 'Test Group',
    };
    mockUser.engines?.push(testEngine);

    await service.chooseTenantIfNeeded({
      user: mockUser,
    });
    expect(mockModal.open).toHaveBeenCalled();
  });

  it('should set the user and selectedTenant on the userService', async () => {
    await firstValueFrom(service.init());

    expect(mockUserService.user).toEqual(mockUser);
    expect(mockUserService.selectedTenant).toEqual(mockTenant);
  });

  it('redirect to login page with error parameter on authentication failure', () => {
    mockHttp.get.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

    service.init().subscribe();

    expect(mockWindow.location.href).toBe(`${mockWindow.location.origin}/login?error=no-engine-access`);
  });

  it('should return user if valid user', async () => {
    const result = await firstValueFrom(service.init());
    expect(result).toEqual(mockUser);
  });

  it('should throw an error if not valid user', () => {
    mockHttp.get.mockReturnValue(
      of({
        user: { id: null },
      }),
    );

    let err;

    service.init().subscribe({
      error: (error) => {
        err = error;
      },
    });

    expect(err).toEqual(new Error('auth failed, no user found'));
  });

  it('should get tenant header', () => {
    mockUserService.selectedTenantId = '123';

    expect(service.getCurrentContextHeaders()).toEqual({
      [TENANT_HEADER_KEY]: '123',
    });
  });
});

function getMockWindow(url: string) {
  const mockWindow = Object.create(window);
  const urlObj = new URL(url);
  Object.defineProperty(mockWindow, 'location', {
    value: {
      href: url,
      pathname: urlObj.pathname,
      origin: urlObj.origin,
    },
    writable: true,
  });
  Object.defineProperty(mockWindow, 'fluxnovaConfig', {
    value: {
      fxnPublicUrl: '',
    },
    writable: true,
  });
  return mockWindow;
}
