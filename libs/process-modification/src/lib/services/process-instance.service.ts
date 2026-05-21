import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  CompleteActivityInstanceInfo,
  ProcessInstance,
  ProcessInstanceFullHistory,
  ProcessInstanceTerminateRequest,
} from '@fxn/types';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ToastService } from '@fxn/common';
import { memoize } from '@fxn/common/src/lib/services/memoize';
import { isEmpty } from 'lodash-es';
import { HistoryTabService } from '../detail-pages/tabs/history/history-tab.service';
import { PaginatedDataRequest } from './types/paginated-data-request';

@Injectable({
  providedIn: 'root',
})
export class ProcessInstanceService {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  historyTabService = inject(HistoryTabService);

  constructor() {
    this.getActivityInstances = memoize(this._getActivityInstances, 2000);
    this.getProcessInstance = memoize(this._getProcessInstance, 2000);
    this.getProcessInstanceCountByFilter = memoize(this._getProcessInstanceCountByFilter, 30000);
    this.getFullHistoryCount = memoize(this._getFullHistoryCount, 2000);
    this.getFullHistory = memoize(this._getFullHistory, 2000);
  }

  private _getActivityInstances = (pid: string, activityId?: string) => {
    let params = new HttpParams().set('includeHistoricalInfo', true);
    if (activityId !== undefined) {
      params = params.set('activityId', activityId);
    }
    return this.http.get<CompleteActivityInstanceInfo>(`api/process-instances/${pid}/activity-instances`, { params });
  };

  public getActivityInstances: (pid: string, activityId?: string) => Observable<CompleteActivityInstanceInfo>;

  public getProcessInstance: (id: string) => Observable<ProcessInstance>;

  private _getProcessInstance = (id: string) =>
    this.getProcessInstancesByFilter(new PaginatedDataRequest({ processInstanceId: id }, 1, 0)).pipe(
      map((instances) => instances[0]),
    );

  public getProcessInstancesByFilter(request: PaginatedDataRequest): Observable<ProcessInstance[]> {
    return this.http.post<ProcessInstance[]>(`api/process-instances`, request);
  }

  public getProcessInstancesWithIncidentInfo(request: PaginatedDataRequest): Observable<ProcessInstance[]> {
    return this.http.post<ProcessInstance[]>(`api/process-instances?includeIncidentInfo=true`, request);
  }

  public getFullHistory: (
    pid: string,
    typeFilters?: string[],
    getAllResults?: boolean,
  ) => Observable<ProcessInstanceFullHistory>;

  public _getFullHistory = (pid: string, typeFilters?: string[], getAllResults?: boolean) => {
    const params = {
      typeFilters: typeFilters || [],
      getAllResults: getAllResults || false,
    };
    return this.http.get<ProcessInstanceFullHistory>(`api/process-instances/${pid}/history`, { params });
  };

  public getFullHistoryCount: (pid: string, typeFilters?: string[], getAllResults?: boolean) => Observable<number>;

  private _getFullHistoryCount = (pid: string, typeFilters?: string[], getAllResults?: boolean) =>
    this._getFullHistory(pid, typeFilters, getAllResults).pipe(
      map((resp) =>
        this.historyTabService.combineAndOrderHistoryData(
          resp?.userOperation,
          resp?.detail,
          resp?.activityInstance,
          resp?.incident,
        ),
      ),
      map((list) => list?.length ?? 0),
    );

  public getProcessInstanceHistoryCountByFilter(filters: { [key: string]: any } = {}): Observable<number> {
    return this.http.post<number>(`api/process-instances/history/count`, filters);
  }

  private _getProcessInstanceCountByFilter = (filters: any) =>
    this.http.post<number>(`api/process-instances/count`, filters);

  public getProcessInstanceCountByFilter: (filters: any) => Observable<number>;

  public postProcessModification(processInstanceId: string, params: any) {
    return this.http.post(`api/process-instances/${processInstanceId}/modification`, params);
  }

  public suspendOrActivate(tenantId: string, ids: string[], suspended: boolean = false) {
    let errorMsg = `Error ${suspended ? 'suspending' : 'activating'} instance: ${ids[0]}`;

    if (ids.length === 1) {
      return this.http.put(`api/process-instances/${ids[0]}/suspended`, { suspended }).pipe(
        tap((result: any) => {
          if (isEmpty(result?.error)) {
            this.toastService.success(`Successfully ${suspended ? 'suspended' : 'activated'} instance: ${ids[0]}`);
          }
        }),
        catchError((err) => this.handleError(err.message, errorMsg)),
      );
    } else {
      errorMsg = `Error ${suspended ? 'suspending' : 'activating'} ${ids.length} instances`;
      return this.http
        .post(`api/process-instances/suspended-async`, {
          processInstanceIds: ids,
          suspended: suspended,
        })
        .pipe(
          tap((result: any) => {
            this.toastService.success(
              `Request to ${suspended ? 'suspend' : 'activate'} ${ids.length} instances submitted successfully.
                Click <a href="${tenantId}/batches/${result.id}">here</a> to view the status of the request.`,
              { delay: 10000 },
            );
          }),
          catchError((err) => this.handleError(err.message, errorMsg)),
        );
    }
  }

  public terminate(tenantId: string, params: ProcessInstanceTerminateRequest) {
    const errorMsg = `Error terminating instances: ${params.processInstanceIds}`;

    if (params.processInstanceIds?.length === 1) {
      return this.http.delete(`api/process-instances/${params.processInstanceIds[0]}/terminate`, { body: params }).pipe(
        tap((result: any) => {
          if (isEmpty(result?.error)) {
            this.toastService.success(`Successfully terminated instance: ${params.processInstanceIds?.[0]}`);
          }
        }),
        catchError((err) => this.handleError(err.message, errorMsg)),
      );
    }
    return this.http.post(`api/process-instances/delete`, params).pipe(
      tap((result: any) => {
        this.toastService.success(
          `Request to terminate ${params.processInstanceIds?.length} instances submitted successfully.
                Click <a href="${tenantId}/batches/${result.id}">here</a> to view the status of the request.`,
          { delay: 10000 },
        );
      }),
      catchError((err) => this.handleError(err.message, errorMsg)),
    );
  }

  public handleError(error: any, errorMessage: string) {
    this.toastService.error(`${errorMessage}: ${error}`);
    return of({
      error: `${errorMessage}: ${error}`,
    });
  }
}
