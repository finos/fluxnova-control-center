import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { memoize } from '@fxn/common/src/lib/services/memoize';
import { DecisionInstance, DecisionInstanceDiagram } from '@fxn/types';
import { Observable } from 'rxjs';

import { PaginatedDataRequest } from './types/paginated-data-request';

@Injectable({
  providedIn: 'root',
})
export class DecisionInstanceService {
  private http = inject(HttpClient);

  constructor() {
    this.getInstance = memoize(this._getInstance, 10000);
    this.getInstancesCount = memoize(this._getInstancesCount, 10000);
    this.getDiagram = memoize(this._getDiagram, 10000);
  }

  public getDecisionInstanceList = (request: PaginatedDataRequest) =>
    this.http.get<DecisionInstance[]>('api/decision-instances', { params: request.asQueryParams() });

  public getInstancesCount: (filter: { [i: string]: any }) => Observable<number>;

  private _getInstancesCount = (params: { [i: string]: any }): Observable<number> =>
    this.http.get<number>(`api/decision-instances/count`, { params });

  public getInstance: (id: string) => Observable<DecisionInstance>;

  private _getInstance = (id: string): Observable<DecisionInstance> =>
    this.http.get<DecisionInstance>(`api/decision-instances/${id}?includeInputs=true&includeOutputs=true`);

  public getDiagram: (id: string) => Observable<DecisionInstanceDiagram>;

  private _getDiagram = (id: string): Observable<DecisionInstanceDiagram> =>
    this.http.get<DecisionInstanceDiagram>(`api/decision-instances/${id}/diagram`);
}
