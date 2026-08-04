import { inject, provideAppInitializer } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi, withXsrfConfiguration } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth/auth.service';

export function defaultAppProviders() {
  return [
    provideHttpClient(
      withInterceptorsFromDi(),
      withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }),
    ),
    provideAppInitializer(() => {
      const initializerFn = appPreInit(inject(AuthService));
      return initializerFn();
    }),
  ];
}

export function appPreInit(authService: AuthService): () => Observable<any> {
  return () => authService.init();
}
