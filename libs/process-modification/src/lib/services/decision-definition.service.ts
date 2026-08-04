import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { memoize } from '@fxn/common/src/lib/services/memoize';
import { DecisionDefinition, DecisionDefinitionParams, GridFilter } from '@fxn/types';
import { PaginatedDataRequest } from './types/paginated-data-request';

export interface DecisionDefinitionFilter {
  name: GridFilter;
  version: GridFilter;
  key: GridFilter;
  deploymentId: GridFilter;
}

const CACHE_TIMEOUT = 10000;

@Injectable({
  providedIn: 'root',
})
export class DecisionDefinitionService {
  private http = inject(HttpClient);

  constructor() {
    this.getDecisionDefinitionList = memoize(this._getDecisionDefinitionList, CACHE_TIMEOUT);
    this.getDecisionDefinitionListCount = memoize(this._getDecisionDefinitionListCount, CACHE_TIMEOUT);
    this.getDecisionDefinitionDetail = memoize(this._getDecisionDefinitionDetail, CACHE_TIMEOUT);
    this.getDecisionDefinitionVersionList = memoize(this._getRelatedDecisionDefinitionVersionList, CACHE_TIMEOUT);
  }

  public getDecisionDefinitions(request: PaginatedDataRequest) {
    return forkJoin([this.getDecisionDefinitionList(request), this.getDecisionDefinitionListCount(request)]).pipe(
      map(([items, countResponse]) => ({
        count: countResponse.count,
        items,
      })),
    );
  }

  public getDecisionDefinitionVersionList: (id: string, maxResults?: number) => Observable<DecisionDefinition[]>;

  private _getRelatedDecisionDefinitionVersionList = (
    id: string,
    maxResults?: number,
  ): Observable<DecisionDefinition[]> =>
    this.getDecisionDefinitionDetail(id).pipe(
      switchMap((decisionDefinition) => {
        const key = decisionDefinition?.key ?? '';

        return key ? this.getDecisionDefinitionList(new PaginatedDataRequest({ key }, maxResults)) : of([]);
      }),
    );

  public getDecisionDefinitionList: (params: DecisionDefinitionParams) => Observable<DecisionDefinition[]>;

  private _getDecisionDefinitionList = (request: PaginatedDataRequest) =>
    this.http.get<DecisionDefinition[]>('api/decision-definition', { params: request.asQueryParams() });

  public getDecisionDefinitionListCount: (request: PaginatedDataRequest) => Observable<{ count: number }>;

  private _getDecisionDefinitionListCount = (request: PaginatedDataRequest) =>
    this.http.get<{ count: number }>('api/decision-definition/count', { params: request.asQueryParams() });

  public getDecisionDefinitionDetail: (id: string) => Observable<DecisionDefinition>;

  private _getDecisionDefinitionDetail = (id: string) =>
    this.http.get<DecisionDefinition>(`api/decision-definition/${id}`);

  public evaluateDecision = (id: string, body: string) =>
    this.http.post(`api/decision-definition/${id}/evaluate`, body);
}
