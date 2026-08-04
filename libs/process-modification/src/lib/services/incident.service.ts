import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Incident, IncidentsFilter } from '@fxn/types';
import { from, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastService } from '@fxn/common';

import { PaginatedDataRequest } from './types/paginated-data-request';

@Injectable({
  providedIn: 'root',
})
export class IncidentService {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);

  public getIncidentsByFilterAndPagination(request: PaginatedDataRequest): Observable<Incident[]> {
    return this.http.post<Incident[]>('api/incidents', request).pipe(
      catchError((error) => {
        this.toastService?.error(error.message);
        return from([]);
      }),
    );
  }

  public getIncidentCountByFilter(filters: IncidentsFilter): Observable<number> {
    return this.http.post<number>(`api/incidents/count`, filters).pipe(
      catchError((error) => {
        this.toastService?.error(error.message);
        return from([]);
      }),
    );
  }
}
