import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { memoize } from '@fxn/common/src/lib/services/memoize';
import { ActivityInstanceHistory, ProcessInstance } from '@fxn/types';
import { ProcessInstanceService } from './process-instance.service';
import { PaginatedDataRequest } from './types/paginated-data-request';

@Injectable({
  providedIn: 'root',
})
export class CalledProcessInstancesService {
  protected processInstanceService = inject(ProcessInstanceService);

  constructor() {
    this.getRowDataList = memoize(this._getRowDataList, 10000);
    this.getCalledProcessInstanceCount = memoize(this._getCalledProcessInstanceCount, 10000);
  }

  public getRowDataList: (request: PaginatedDataRequest) => Observable<ProcessInstance[]>;

  public getCalledProcessInstanceCount: (params: { [key: string]: any }) => Observable<number>;

  private _getCalledProcessInstanceCount = (params: { [key: string]: any }) => {
    const scrubbedParams = { ...params };
    const processInstanceId = scrubbedParams?.processInstanceId;
    delete scrubbedParams?.processInstanceId;

    // Unfortunately the history/process-instance/count api does not support
    // filtering by activityId AND superProcessInstanceId at the same time.
    // Instead, we'll use that api only when we aren't filtering by an activityId.
    // If we are, then we'll go about it in a round about way by first fetching the
    // relevant activity instances and then counting how many of those have a calledProcessInstanceId.

    if (scrubbedParams.activityId)
      return this.processInstanceService.getActivityInstances(processInstanceId, scrubbedParams.activityId).pipe(
        map((result) => result.historical.filter(({ calledProcessInstanceId }) => !!calledProcessInstanceId)),
        switchMap((activityList) => of(activityList.length)),
      );
    else
      return this.processInstanceService.getProcessInstanceHistoryCountByFilter({
        superProcessInstanceId: processInstanceId,
        ...scrubbedParams,
      });
  };

  private _getRowDataList = (request: PaginatedDataRequest) => {
    const scrubbedParams = { ...request.filter };
    const processInstanceId = scrubbedParams['processInstanceId'];
    const activityId = scrubbedParams['activityId'];
    delete scrubbedParams['processInstanceId'];

    // Unfortunately, the process-instance/:id/activity-instances api does not
    // support pagination or sorting, so we'll have to fetch all the relevant activity instances.
    // Also, unfortunately, we can't paginate and use the list of activity instances to limit
    // the process instances that we retrieve unless we want to perform ordering, slicing, AND
    // filtering by the parameters here on the front end.  Instead, pass ALL of the activity
    // instances to the getProcessInstanceList function, and that function will be responsible for
    // limiting the process instances that it returns based on the filters provided.

    return this.processInstanceService.getActivityInstances(processInstanceId, activityId).pipe(
      map((result) => result.historical.filter(({ calledProcessInstanceId }) => !!calledProcessInstanceId)),
      switchMap((activityList) => this.getProcessInstanceList(activityList, request)),
    );
  };

  private getProcessInstanceList(
    activityList: ActivityInstanceHistory[],
    request: PaginatedDataRequest,
  ): Observable<ProcessInstance[]> {
    if (!activityList?.length) return of([]);

    const scrubbedParams = { ...request.filter };
    const superProcessInstanceId = scrubbedParams['processInstanceId'];
    delete scrubbedParams['processInstanceId'];

    // Because the response from the history/process-instance api does not include
    // activityId information for the called process instances, we need to create
    // a mapping of calledProcessInstanceId to the activityId that called it,
    // so that we can pass that information along to the frontend.

    const activityIdObject = activityList.reduce(
      (acc, activity) => {
        if (activity.calledProcessInstanceId) {
          acc[activity.calledProcessInstanceId] = activity.activityId ?? '';
        }
        return acc;
      },
      {} as { [key: string]: string },
    );

    // As a reminder: We need to supply the list of process instances that we want to fetch details for
    // instead of filtering by superProcessInstanceId because the history/process-instance api does not
    // support filtering by activityId.  We still supply the superProcessInstanceId as a filter so that
    // the server can get the incident information for the instances without having to call the incident
    // api for each instance to check if it has an incident or not.

    const processInstanceIds = activityList.map(({ calledProcessInstanceId }) => calledProcessInstanceId);
    const getInstances = this.processInstanceService.getProcessInstancesWithIncidentInfo(
      new PaginatedDataRequest(
        { processInstanceIds, ...scrubbedParams, superProcessInstanceId },
        request.maxResults,
        request.firstResult,
      ),
    );

    return getInstances.pipe(
      map((instances) => instances.map((instance) => ({ ...instance, activityId: activityIdObject[instance.id] }))),
    );
  }
}
