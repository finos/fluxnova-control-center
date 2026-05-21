import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { isEmpty } from 'lodash-es';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import {
  SESSION_EXPIRED_MODAL_DEFAULT_OPTIONS,
  SessionExpiredModalComponent,
} from '../auth/session-expired-modal/session-expired-modal.component';
import { ToastService } from '../services/toast.service';
import { windowReload } from '../window-actions';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private modalService = inject(NgbModal);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const modifiedReq = this.addContextHeaders(req);
    const excludedUrls = [/\/api\/auth$/];

    if (excludedUrls.some((re) => re.test(modifiedReq.url))) {
      return next.handle(modifiedReq); // Bypass the interceptor logic
    }
    return next.handle(modifiedReq).pipe(catchError((err) => this.handleError(err)));
  }

  private handleError(err: HttpErrorResponse): Observable<any> {
    if (!this.authService.reloading && (err.status === 401 || err.status === 403)) {
      this.toastService.clear();
      this.toastService.disable();
      this.modalService.open(SessionExpiredModalComponent, SESSION_EXPIRED_MODAL_DEFAULT_OPTIONS);
      this.authService.reloading = true;

      setTimeout(() => windowReload(), 2000);
    }
    return throwError(() => err);
  }

  private addContextHeaders(req: HttpRequest<any>): HttpRequest<any> {
    const contextHeaders = this.authService.getCurrentContextHeaders();
    if (!isEmpty(contextHeaders)) {
      return req.clone({
        setHeaders: contextHeaders,
      });
    }
    return req;
  }
}
