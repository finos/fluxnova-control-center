import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  ActivityInstance,
  ActivityInstanceHistory,
  CalledProcessDefinitionFilter,
  ProcessDefinition,
  ProcessDefinitionFilter,
  ProcessDefinitionStatistic,
  StaticCalledProcessDefinition,
} from '@fxn/types';
import { concatMap, forkJoin, Observable, of, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { memoize } from '@fxn/common/src/lib/services/memoize';
import { pageSizeMax } from '@fxn/grid';
import { ProcessInstanceService } from './process-instance.service';
import { PaginatedDataRequest } from './types/paginated-data-request';

@Injectable({
  providedIn: 'root',
})
export class ProcessDefinitionService {
  private http = inject(HttpClient);
  private processInstanceService = inject(ProcessInstanceService);

  constructor() {
    // setup functions that need to be memoized
    this.getProcessDefinitionsByFilter = memoize(this._getProcessDefinitionsByFilter, 2000);
  }

  public deleteDefinition(
    processDefinitionId: string,
    cascade: boolean = false,
    skipCustomListeners: boolean = false,
    skipIoMappings: boolean = false,
  ) {
    return this.http.delete(`api/process-definitions/${processDefinitionId}`, {
      params: {
        cascade,
        skipCustomListeners,
        skipIoMappings,
      },
    });
  }

  public activateDefinition(id: string, includeProcessInstances: boolean = false) {
    return this.http.put(`api/process-definitions/${id}/suspended`, {
      suspended: false,
      includeProcessInstances,
    });
  }

  public suspendDefinition(id: string, includeProcessInstances: boolean = false) {
    return this.http.put(`api/process-definitions/${id}/suspended`, {
      suspended: true,
      includeProcessInstances,
    });
  }

  public getActivityInstanceHistory(
    processDefinitionId: string,
    activeOnly: boolean = false,
    startedAfter?: string,
    sortBy?: string,
    sortOrder?: string,
  ): Observable<ActivityInstanceHistory[]> {
    return this.http.get<ActivityInstanceHistory[]>(`api/process-definitions/${processDefinitionId}/history`, {
      params: {
        activeOnly: activeOnly.toString(),
        ...(startedAfter && { startedAfter }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
      },
    });
  }

  public getStatistics(processDefinitionId: string): Observable<ProcessDefinitionStatistic[]> {
    return this.http.get<ProcessDefinitionStatistic[]>(`api/process-definitions/${processDefinitionId}/statistics`);
  }

  public getProcessDefinitionCountByFilter(filters?: ProcessDefinitionFilter): Observable<number> {
    return this.http.post<number>(`api/process-definitions/count`, filters || {});
  }

  public getProcessDefinitionById(processDefinitionId: string): Observable<ProcessDefinition> {
    return this.getProcessDefinitionsByFilter(new PaginatedDataRequest({ processDefinitionId }, 1)).pipe(
      map((x) => x[0]),
    );
  }

  public getCalledProcessDefinitions(request: PaginatedDataRequest<CalledProcessDefinitionFilter>) {
    return this.http
      .post<
        [StaticCalledProcessDefinition[], ActivityInstance[]]
      >(`api/process-definitions/called-process-definitions`, request)
      .pipe(
        switchMap(([staticCalledProcessDefinitions, activityInstances]) => {
          // loop through staticCalledProcessDefinitions to establish 'referenced'
          // loop through activity instances to determine 'running'
          // if any items of the two lists match, it's running and referenced

          const definitionObj: { [key: string]: any } = {}; // to easily reference processDefinitions by activityId
          const staticActivityIds: string[] = []; // to track which activityIds belong to staticCalledProcessDefinitions
          // associatedActivityId is a property instead of a key here below because there could hypothetically be one activity
          // which calls multiple different processDefinitions because it is dynamic, and we need an entry for each unique combination
          const processInstanceIdsToQuery: { processInstanceId: string; associatedActivityId: string }[] = [];
          const activityIdFilter = request.filter.activityId;

          staticCalledProcessDefinitions.forEach((staticCalledProcessDefinition) => {
            staticCalledProcessDefinition.calledFromActivityIds.forEach((activityId: string) => {
              if (activityIdFilter === undefined || activityId === activityIdFilter) {
                definitionObj[activityId] = {
                  ...staticCalledProcessDefinition,
                  activityId,
                  state: 'Referenced',
                  // this is an id to be able to support row selection. it's just the activityId:processDefinitionId
                  calledProcessDefinitionId: `${activityId}:${staticCalledProcessDefinition.id}`,
                };
                staticActivityIds.push(activityId);
              }
            });
          });

          activityInstances.forEach((activityInstance) => {
            if (
              activityInstance.id &&
              activityInstance.activityId &&
              activityInstance.activityType === 'callActivity'
            ) {
              if (staticActivityIds.includes(activityInstance.activityId)) {
                definitionObj[activityInstance.activityId].state = 'Running and referenced';
              } else {
                // we need to index this object using the activityInstance.id instead of .activityId to ensure uniqueness
                definitionObj[activityInstance.id] = {
                  activityId: activityInstance.activityId,
                  state: 'Running',
                  name: '', // because we don't know the process definition information of the instance that was created by this activity yet
                  id: '',
                  calledProcessDefinitionId: activityInstance.activityId,
                };
                if (activityInstance.calledProcessInstanceId) {
                  processInstanceIdsToQuery.push({
                    processInstanceId: activityInstance.calledProcessInstanceId,
                    associatedActivityId: activityInstance.id,
                  });
                }
              }
            }
          });

          // if processInstanceIdsToQuery is empty, return values of definitionObj, no need to get additional info
          // else make a call for each item to get process instance, then process definition to get the name
          if (processInstanceIdsToQuery.length < 1) {
            return of(Object.values(definitionObj));
          } else {
            // need next line to weed out duplicate rows where a call activity calls the same process definition
            const processDefinitionIds: any[] = [];
            // we don't need to worry about making multiple calls to get either process instance or process definition
            // because of our memoization, so I didn't worry about excluding potential duplicates
            return forkJoin(
              processInstanceIdsToQuery.map((idObj) =>
                this.processInstanceService.getProcessInstance(idObj.processInstanceId),
              ),
            ).pipe(
              switchMap((processInstances) =>
                forkJoin(
                  processInstances.map((processInstance) =>
                    this.getProcessDefinitionById(processInstance.processDefinitionId as string),
                  ),
                ),
              ),
              map((processDefinitions) => {
                processDefinitions.forEach((processDefinition: ProcessDefinition, index: number) => {
                  if (!processDefinitionIds.includes(processDefinition.id)) {
                    definitionObj[processInstanceIdsToQuery[index].associatedActivityId] = {
                      ...definitionObj[processInstanceIdsToQuery[index].associatedActivityId],
                      name: processDefinition.name,
                      id: processDefinition.id,
                      calledProcessDefinitionId: `${definitionObj[processInstanceIdsToQuery[index].associatedActivityId].calledProcessDefinitionId}:${processDefinition.id}`,
                    };
                    processDefinitionIds.push(processDefinition.id);
                  }
                });
                return Object.values(definitionObj).filter((entry) => entry.id);
              }),
            );
          }
        }),
      );
  }

  public getProcessDefinitionVersionsByKey(
    key: string,
  ): Observable<{ versionDefinitionId: string; versionNumber: number }[]> {
    return this.getProcessDefinitionsByFilter(
      new PaginatedDataRequest({ key, sortBy: 'version', sortOrder: 'asc' }, pageSizeMax),
    ).pipe(
      map((definitions) =>
        definitions.map((x) => ({
          versionNumber: x.version as number,
          versionDefinitionId: x.id as string,
        })),
      ),
    );
  }

  public getProcessDefinitionVersionsById(
    id: string,
  ): Observable<{ versionDefinitionId: string; versionNumber: number }[]> {
    if (id.indexOf(':') > -1) return this.getProcessDefinitionVersionsByKey(id.split(':')[0]);

    return this.getProcessDefinitionById(id).pipe(
      concatMap((processDef) => this.getProcessDefinitionVersionsByKey(processDef.key || '')),
    );
  }

  public getProcessDefinitionsByFilter: (request: PaginatedDataRequest) => Observable<ProcessDefinition[]>;

  private _getProcessDefinitionsByFilter = (request: PaginatedDataRequest): Observable<ProcessDefinition[]> => {
    const api = `api/process-definitions`;

    return this.http.post<ProcessDefinition[]>(api, request);
  };

  public submitStartFormWithDefinitionId(processDefinitionId: string, body: any) {
    return this.http.post(`api/process-definitions/${processDefinitionId}/start`, body);
  }
}
