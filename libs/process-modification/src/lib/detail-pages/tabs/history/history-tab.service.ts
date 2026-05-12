import { Injectable } from '@angular/core';
import {
  ActivityInstanceHistory,
  DetailHistory,
  Incident,
  ProcessInstanceHistoryTabItem,
  UserOperationHistory,
} from '@fxn/types';
import { concat, filter, find, forEach, map, orderBy } from 'lodash-es';
import { convertMsToDurationString, diffDateStrings } from '@fxn/common';
export const INCIDENT_TYPE = 'Incident';
export const CREATE_OPERATION_TYPE = 'Create';
export const DETAIL_TYPE = 'Detail';
export const USER_OPERATION_TYPE = 'User Operation';
export const ACTIVITY_INSTANCE_TYPE = 'Activity Instance';
export const DEFAULT_USER = 'System';
const VARIABLE = 'Variable';

@Injectable({
  providedIn: 'root',
})
export class HistoryTabService {
  constructor() {}

  combineAndOrderHistoryData(
    userOperationHistoryItems: UserOperationHistory[] = [],
    detailHistoryItems: DetailHistory[] = [],
    activityInstanceHistoryItems: ActivityInstanceHistory[] = [],
    incidentHistoryItems: Incident[] = [],
  ) {
    return orderBy(
      concat(
        this.transformUserOperationObjects(userOperationHistoryItems, detailHistoryItems, activityInstanceHistoryItems),
        this.transformIncidentHistoryItemsObjects(incidentHistoryItems),
        this.transformVariableCreationObjects(detailHistoryItems),
        this.transformActivityInstanceHistoryItemsObjects(activityInstanceHistoryItems),
      ),
      'startTime',
      'desc',
    );
  }

  transformUserOperationObjects(
    userOperationHistoryItems: UserOperationHistory[],
    detailHistoryItems: DetailHistory[],
    activityInstanceHistoryItems: ActivityInstanceHistory[],
  ) {
    const results: ProcessInstanceHistoryTabItem[] = [];

    // Pre-index detailHistoryItems by userOperationId for O(1) lookup
    const detailHistoryByUserOperationId: Record<string, DetailHistory[]> = {};

    forEach(detailHistoryItems, (item) => {
      if (item.userOperationId != null) {
        if (!detailHistoryByUserOperationId[item.userOperationId]) {
          detailHistoryByUserOperationId[item.userOperationId] = [];
        }
        detailHistoryByUserOperationId[item.userOperationId].push(item);
      }
    });

    forEach(userOperationHistoryItems, (resp: UserOperationHistory) => {
      const userOperationItem: ProcessInstanceHistoryTabItem = {
        id: resp.id,
        startTime: resp.timestamp,
        endTime: resp.timestamp,
        duration: resp.timestamp ? '0:00:00.0' : undefined,
        type: USER_OPERATION_TYPE,
        entityType: resp.entityType,
        operationType: resp.operationType,
        data: resp.annotation ?? resp.newValue,
        dataLabel: resp.annotation ? 'Annotation' : resp.property,
        userOperationId: resp.operationId,
        taskId: resp.taskId,
        variableName: resp.property,
        userId: resp.userId || DEFAULT_USER,
        executionId: resp.executionId,
      };

      // Add Activity information if the User Operation is associated with a Task
      const activityInstance = find(activityInstanceHistoryItems, ['taskId', userOperationItem.taskId]);
      if (activityInstance && activityInstance.taskId) {
        userOperationItem.name = activityInstance.activityName;
      }

      //Add the initial User Modification item, if it's not specifically a ModifyVariable item
      if (userOperationItem.operationType !== 'ModifyVariable') {
        results.push(userOperationItem);
      }

      const detailItems: DetailHistory[] =
        detailHistoryByUserOperationId[userOperationItem.userOperationId ?? ''] || [];

      // Associate any ModifyVariable history items that were done as part of this User Operation
      if (detailItems.length) {
        results.push(
          ...map(detailItems, (item) => {
            const dupUserOperationItem = { ...userOperationItem };

            dupUserOperationItem.variableName = item.variableName as string;
            dupUserOperationItem.data = item.value as string;
            dupUserOperationItem.dataLabel = item.variableName;

            return dupUserOperationItem;
          }),
        );
      }
    });

    return results;
  }

  transformVariableCreationObjects(detailHistoryItems: DetailHistory[]) {
    return filter(detailHistoryItems, (item) => item.userOperationId === null).map((item) => ({
      id: item.id,
      executionId: item.executionId,
      startTime: item.time,
      endTime: item.time,
      duration: item.time ? '0:00:00.0' : undefined,
      type: DETAIL_TYPE,
      entityType: VARIABLE,
      operationType: CREATE_OPERATION_TYPE + VARIABLE,
      variableName: item.variableName,
      userOperationId: item.userOperationId,
      data: item.value,
      dataLabel: item.variableName,
      userId: DEFAULT_USER,
    }));
  }
  transformIncidentHistoryItemsObjects(incidentHistoryItems: Incident[]) {
    return incidentHistoryItems.map((x) => ({
      id: x.id,
      executionId: x.executionId,
      activityId: x.activityId,
      type: INCIDENT_TYPE,
      entityType: x.activityId,
      startTime: x.createTime,
      endTime: x.endTime,
      duration:
        x.createTime && x.endTime ? convertMsToDurationString(diffDateStrings(x.createTime, x.endTime)) : undefined,
      operationType: x.incidentType,
      details: x.incidentMessage,
      userId: DEFAULT_USER,
    }));
  }

  transformActivityInstanceHistoryItemsObjects(activityInstanceHistoryItems: ActivityInstanceHistory[]) {
    return activityInstanceHistoryItems.map((item) => ({
      id: item.id,
      executionId: item.executionId,
      activityId: item.activityId,
      startTime: item.startTime,
      endTime: item.endTime,
      duration: item.durationInMillis !== undefined ? convertMsToDurationString(item.durationInMillis) : undefined,
      name: item.activityName,
      type: ACTIVITY_INSTANCE_TYPE,
      entityType: item.activityType,
      operationType: CREATE_OPERATION_TYPE,
      taskId: item.taskId,
      userId: DEFAULT_USER,
    }));
  }

  setVariableValue(variableName: string, newValue: string) {
    return `<b>${variableName}</b>: ${newValue}`;
  }
}
