import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Variable, VariableHistoryFilter, VariableScopeType, VariableSearchFilter } from '@fxn/types';
import { forkJoin, map, Observable, throwError } from 'rxjs';
import { find } from 'lodash-es';
import { memoize } from '@fxn/common/src/lib/services/memoize';
import { downloadDataBuffer } from '@fxn/common/src';
import { ProcessInstanceService } from './process-instance.service';
import { PaginatedDataRequest } from './types/paginated-data-request';

@Injectable({
  providedIn: 'root',
})
export class VariableService {
  private http = inject(HttpClient);
  private piService = inject(ProcessInstanceService);
  private readonly CACHE_TIMEOUT = 2000;

  constructor() {
    this.getProcessVariablesByFilter = memoize(this._getProcessVariablesByFilter, this.CACHE_TIMEOUT);
    this.getProcessVariableCountByFilter = memoize(this._getProcessVariableCountByFilter, this.CACHE_TIMEOUT);
    this.getHistoricalVariables = memoize(this._getHistoricalVariables, this.CACHE_TIMEOUT);
    this.getHistoricalVariableCount = memoize(this._getHistoricalVariableCount, this.CACHE_TIMEOUT);
  }

  protected getProcessVariableHistoryByFilter(request: VariableHistoryFilter): Observable<Variable[]> {
    return this.http.post<Variable[]>(`api/variables/variable-history`, request);
  }

  public updateProcessVariables(variable: Variable): Observable<Variable> {
    return this.http.post<Variable>(`api/variables/update-process`, variable);
  }

  public updateTaskVariables(variable: Variable): Observable<Variable> {
    return this.http.post<Variable>(`api/variables/update-task`, variable);
  }

  public updateExecutionVariables(variable: Variable): Observable<Variable> {
    return this.http.post<Variable>(`api/variables/update-execution`, variable);
  }

  public deleteProcessVariable(variable: Variable): Observable<Variable> {
    return this.http.post<Variable>(`api/variables/delete-process`, variable);
  }

  public deleteTaskVariable(variable: Variable): Observable<Variable> {
    return this.http.post<Variable>(`api/variables/delete-task`, variable);
  }

  public deleteExecutionVariable(variable: Variable): Observable<Variable> {
    return this.http.post<Variable>(`api/variables/delete-execution`, variable);
  }

  public getDeserializedVariableValue(id: string) {
    return this.http.get<Variable>(`api/variables/variable-history/${id}`);
  }

  public getProcessVariablesByFilter: (
    request: PaginatedDataRequest,
    isActive: boolean | undefined,
  ) => Observable<Variable[]>;
  protected _getProcessVariablesByFilter = (request: PaginatedDataRequest, isActive: boolean = true) => {
    const pid: string = request.filter.processInstanceIdIn ? request.filter.processInstanceIdIn[0] : '';

    if (!isActive) {
      return this.getHistoricalVariables(request, pid);
    }

    return this.addScope(this.http.post<Variable[]>(`api/variables`, request), pid);
  };

  public getProcessVariableCountByFilter: (
    filter: VariableSearchFilter,
    isActive: boolean | undefined,
  ) => Observable<number>;

  protected _getProcessVariableCountByFilter = (filter: VariableSearchFilter, isActive: boolean = true) => {
    if (!isActive) {
      return this.getHistoricalVariableCount(filter);
    }
    return this.http.post<number>('api/variables/count', filter);
  };

  public getHistoricalVariables: (filter: VariableHistoryFilter, pid: string) => Observable<Variable[]>;

  protected _getHistoricalVariables = (filter: VariableHistoryFilter, pid: string) =>
    this.addScope(this.getProcessVariableHistoryByFilter(filter), pid);

  public getHistoricalVariableCount: (filter: VariableSearchFilter) => Observable<Variable[]>;

  protected _getHistoricalVariableCount = (filter: VariableSearchFilter) =>
    this.http.post<number>('api/variables/variable-history/count', filter);

  private getVariableDataBuffer(variable: Variable) {
    return this.http.get<any>(`api/variables/${variable.id}/data`, {
      responseType: 'arraybuffer' as 'json',
    });
  }

  private getHistoricalVariableDataBuffer(variable: Variable) {
    return this.http.get<any>(`api/variables/history/${variable.id}/data`, {
      responseType: 'arraybuffer' as 'json',
    });
  }

  public downloadVariableValue(variable: Variable, isActive: boolean = true) {
    const service = isActive ? this.getVariableDataBuffer.bind(this) : this.getHistoricalVariableDataBuffer.bind(this);

    service(variable).subscribe(
      (arrayBuffer) => this.downloadArrayBuffer(arrayBuffer, variable.valueInfo?.filename || variable.name),
      (err) => throwError(err),
    );
  }

  protected downloadArrayBuffer(arrayBuffer: ArrayBuffer, fileName: string) {
    downloadDataBuffer(arrayBuffer, fileName);
  }

  protected addScope(variable$: Observable<Variable[]>, pid: string): Observable<Variable[]> {
    return forkJoin([variable$, this.piService.getActivityInstances(pid), this.piService.getProcessInstance(pid)]).pipe(
      map(([variables, actInstances, process]) =>
        variables.map((variable: Variable) => {
          const actInstance = find(actInstances.historical, { id: variable.activityInstanceId })?.activityName;
          const processId = process?.id;
          const processName = process?.processDefinitionName;
          let scopeType: VariableScopeType | undefined;
          if (actInstance) {
            scopeType = VariableScopeType.Activity;
          } else if (variable.activityInstanceId === processId) {
            scopeType = VariableScopeType.Process;
          } else {
            scopeType = undefined;
          }
          return {
            ...variable,
            value: this.formatVariableValue(variable),
            scope:
              actInstance || (variable.activityInstanceId === processId ? processName : variable.activityInstanceId),
            scopeType,
          };
        }),
      ),
    );
  }

  public formatVariableValue(v: Variable) {
    try {
      return JSON.stringify(JSON.parse(v.value as string), null, '\t');
    } catch {
      return v.value;
    }
  }
}
