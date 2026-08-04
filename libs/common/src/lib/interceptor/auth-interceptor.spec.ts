import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../auth/auth.service';
import {
  SESSION_EXPIRED_MODAL_DEFAULT_OPTIONS,
  SessionExpiredModalComponent,
} from '../auth/session-expired-modal/session-expired-modal.component';
import { ToastService } from '../services/toast.service';
import { windowReload } from '../window-actions';
import { AuthInterceptor } from './auth-interceptor';

interface Data {
  name: string;
}

vi.mock('../window-actions');

describe('AuthInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  const mockReload = windowReload as Mock;

  const mockToastService = {
    disable: vi.fn(),
    clear: vi.fn(),
  };

  const mockModalService = {
    open: vi.fn(),
  };

  const mockAuthService = {
    reloading: false,
    getCurrentContextHeaders: vi.fn(),
  };

  beforeEach(() => {
    vi.useFakeTimers();

    TestBed.configureTestingModule({
      imports: [],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true,
        },
        {
          provide: ToastService,
          useValue: mockToastService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: NgbModal,
          useValue: mockModalService,
        },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    vi.runAllTimers();
    vi.clearAllMocks();
    mockAuthService.reloading = false;
  });

  it('should show specific message when intercepting 401 errors', () =>
    new Promise<void>((res, reject) => {
      httpClient.get<Data>('/test').subscribe({
        next: () => expect.fail('should have thrown 401 exception'),
        error: () => {
          try {
            expect(mockToastService.clear).toHaveBeenCalled();
            expect(mockToastService.disable).toHaveBeenCalled();
            expect(mockModalService.open).toHaveBeenCalledWith(
              SessionExpiredModalComponent,
              SESSION_EXPIRED_MODAL_DEFAULT_OPTIONS,
            );
            expect(mockReload).not.toHaveBeenCalled();
            vi.runAllTimers();
            expect(mockReload).toHaveBeenCalled();
            res();
          } catch (e) {
            reject(e);
          }
        },
      });

      const req = httpMock.expectOne('/test');

      req.flush('error 401', { status: 401, statusText: 'Unauthorized' });
    }));

  it('bypasses interceptor logic for excluded URLs', () =>
    new Promise<void>((res, reject) => {
      httpClient.get('/api/auth').subscribe({
        next: () => expect.fail('should have thrown 403 exception'),
        error: (error) => {
          try {
            expect(error.status).toBe(403);
            expect(mockModalService.open).not.toHaveBeenCalled();
            res();
          } catch (e) {
            reject(e);
          }
        },
      });

      const req = httpMock.expectOne('/api/auth');
      req.flush('error 403', { status: 403, statusText: 'Forbidden' });
    }));
});
