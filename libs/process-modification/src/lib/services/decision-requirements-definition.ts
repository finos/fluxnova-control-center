import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { memoize } from '@fxn/common/src/lib/services/memoize';
import { DecisionRequirementsDefinition } from '@fxn/types';
import { PaginatedDataRequest } from './types/paginated-data-request';

@Injectable({
  providedIn: 'root',
})
export class DecisionRequirementsDefinitionService {
  private http = inject(HttpClient);

  constructor() {
    this.getDecisionRequirementsDefinitionList = memoize(this._getDecisionRequirementsDefinitionList, 10000);
  }

  public getDecisionRequirementsDefinitionList: (
    request: PaginatedDataRequest,
  ) => Observable<DecisionRequirementsDefinition[]>;

  private _getDecisionRequirementsDefinitionList = (request: PaginatedDataRequest) =>
    this.http.get<DecisionRequirementsDefinition[]>(`api/decision-requirements-definition`, {
      params: request.asQueryParams(),
    });
}
