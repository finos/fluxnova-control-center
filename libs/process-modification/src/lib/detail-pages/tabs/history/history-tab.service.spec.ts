import {
  ActivityInstanceHistory,
  DetailHistory,
  Incident,
  ProcessInstanceHistoryTabItem,
  UserOperationHistory,
} from '@fxn/types';
import { beforeEach, describe, expect, it } from 'vitest';
import { CREATE_OPERATION_TYPE, DEFAULT_USER, HistoryTabService } from './history-tab.service';

describe('History Tab Service', () => {
  let service: HistoryTabService;

  const userOperationHistory = [
    {
      id: '30d17c72-5ee9-11ee-b941-02f6ae7b73e9',
      deploymentId: '70accb39-5ee8-11ee-b941-02f6ae7b73e9',
      processDefinitionId: 'CamLotsOfHistoryTest:5:70af152c-5ee8-11ee-b941-02f6ae7b73e9',
      processDefinitionKey: 'CamLotsOfHistoryTest',
      processInstanceId: '739481e3-5ee8-11ee-b941-02f6ae7b73e9',
      userId: 'usr1234',
      timestamp: '2023-09-29T12:56:53.449-0400',
      operationId: '30d17c71-5ee9-11ee-b941-02f6ae7b73e9',
      operationType: 'ModifyProcessInstance',
      entityType: 'ProcessInstance',
      removalTime: '2023-10-29T13:52:00.730-0400',
      rootProcessInstanceId: '739481e3-5ee8-11ee-b941-02f6ae7b73e9',
      category: 'Operator',
    },
    {
      id: '2ecece7c-5ee9-11ee-b941-02f6ae7b73e9',
      deploymentId: '70accb39-5ee8-11ee-b941-02f6ae7b73e9',
      processDefinitionId: 'CamLotsOfHistoryTest:5:70af152c-5ee8-11ee-b941-02f6ae7b73e9',
      processDefinitionKey: 'CamLotsOfHistoryTest',
      processInstanceId: '739481e3-5ee8-11ee-b941-02f6ae7b73e9',
      userId: 'usr1234',
      timestamp: '2023-09-29T12:56:50.076-0400',
      operationId: '2ecece7b-5ee9-11ee-b941-02f6ae7b73e9',
      operationType: 'ModifyProcessInstance',
      entityType: 'ProcessInstance',
      removalTime: '2023-10-29T13:52:00.730-0400',
      rootProcessInstanceId: '739481e3-5ee8-11ee-b941-02f6ae7b73e9',
      category: 'Operator',
      taskId: '123',
    },
    {
      id: '30d17c72-5ee9-11ee-b941-02f6ae7b73b1',
      deploymentId: '70accb39-5ee8-11ee-b941-02f6ae7b73e9',
      processDefinitionId: 'CamLotsOfHistoryTest:5:70af152c-5ee8-11ee-b941-02f6ae7b73e9',
      processDefinitionKey: 'CamLotsOfHistoryTest',
      processInstanceId: '739481e3-5ee8-11ee-b941-02f6ae7b73e9',
      userId: 'usr1234',
      timestamp: '2023-09-29T12:56:53.449-0400',
      operationId: '30d17c71-5ee9-11ee-b941-02f6ae7b73e9',
      operationType: 'ModifyVariable',
      entityType: 'ProcessInstance',
      removalTime: '2023-10-29T13:52:00.730-0400',
      rootProcessInstanceId: '739481e3-5ee8-11ee-b941-02f6ae7b73e9',
      category: 'Operator',
    },
    {
      id: '7kf92nck-5ee9-11ee-b941-02f6ae7b73e9',
      deploymentId: '70accb39-5ee8-11ee-b941-02f6ae7b73e9',
      processDefinitionId: 'CamLotsOfHistoryTest:5:70af152c-5ee8-11ee-b941-02f6ae7b73e9',
      processDefinitionKey: 'CamLotsOfHistoryTest',
      processInstanceId: '739481e3-5ee8-11ee-b941-02f6ae7b73e9',
      userId: 'usr1234',
      timestamp: '2023-09-29T12:56:50.076-0400',
      operationId: '7kf92nck-5ee9-11ee-b941-02f6ae7b73e9',
      operationType: 'ModifyProcessInstance',
      entityType: 'ProcessInstance',
      removalTime: '2023-10-29T13:52:00.730-0400',
      rootProcessInstanceId: '739481e3-5ee8-11ee-b941-02f6ae7b73e9',
      category: 'Operator',
      annotation: 'Testing Annotation',
    },
  ] as unknown as UserOperationHistory[];

  const detailHistory = [
    {
      time: '2023-09-29T13:52:00.730-0400',
      operationType: 'Variable',
      userOperationId: '30d17c71-5ee9-11ee-b941-02f6ae7b73e9',
      variableName: 'aVarName',
      value: 'aVarValue',
      valueInfo: {},
      activityInstanceId: '',
      tenantId: '',
      caseDefinitionKey: '',
      variableInstanceId: '',
      variableType: 'String',
    },
    {
      time: '2023-09-29T13:52:00.730-0400',
      operationType: 'Variable',
      userOperationId: null,
      variableName: 'anotherVarName',
      value: 'anotherVarValue',
      valueInfo: {},
      activityInstanceId: '',
      tenantId: '',
      caseDefinitionKey: '',
      variableInstanceId: '',
      variableType: 'String',
    },
  ] as unknown as DetailHistory[];
  const incidentHistory = [
    {
      id: 'Event_1krw1o0:e41c8458-5ef0-11ee-b941-02f6ae7b73e9',
      executionId: '739481e3-5ee8-11ee-b941-02f6ae7b73e9',
      activityId: 'Event_1krw1o0',
      createTime: '2023-09-29T13:52:00.730-0400',
      endTime: '2023-09-29T13:52:00.730-0400',
      incidentType: CREATE_OPERATION_TYPE,
      incidentMessage: 'A problem occurred',
    },
  ] as unknown as Incident[];
  const activityInstanceHistory = [
    {
      id: 'Event_1krw1o0:e41c8458-5ef0-11ee-b941-02f6ae7b73e9',
      parentActivityInstanceId: '739481e3-5ee8-11ee-b941-02f6ae7b73e9',
      activityId: 'Event_1krw1o0',
      activityType: 'terminateEndEvent',
      activityName: 'anActivityName',
      processDefinitionKey: 'CamLotsOfHistoryTest',
      processDefinitionId: 'CamLotsOfHistoryTest:5:70af152c-5ee8-11ee-b941-02f6ae7b73e9',
      processInstanceId: '739481e3-5ee8-11ee-b941-02f6ae7b73e9',
      executionId: '739481e3-5ee8-11ee-b941-02f6ae7b73e9',
      startTime: '2023-09-29T13:52:00.730-0400',
      endTime: '2023-09-29T13:52:00.730-0400',
      durationInMillis: 0,
      canceled: false,
      completeScope: true,
      removalTime: '2023-10-29T13:52:00.730-0400',
      rootProcessInstanceId: '739481e3-5ee8-11ee-b941-02f6ae7b73e9',
      taskId: '123',
    },
    {
      id: 'Event_174p1ua:6061aa1f-5eec-11ee-b941-02f6ae7b73e9',
      parentActivityInstanceId: '739481e3-5ee8-11ee-b941-02f6ae7b73e9',
      activityId: 'Event_174p1ua',
      activityName: 'Wait 1 Second',
      activityType: 'intermediateTimer',
      processDefinitionKey: 'CamLotsOfHistoryTest',
      processDefinitionId: 'CamLotsOfHistoryTest:5:70af152c-5ee8-11ee-b941-02f6ae7b73e9',
      processInstanceId: '739481e3-5ee8-11ee-b941-02f6ae7b73e9',
      executionId: '6061aa1e-5eec-11ee-b941-02f6ae7b73e9',
      startTime: '2023-09-29T13:19:41.738-0400',
      endTime: '2023-09-29T13:19:42.171-0400',
      durationInMillis: 433,
      canceled: true,
      completeScope: false,
      removalTime: '2023-10-29T13:52:00.730-0400',
      rootProcessInstanceId: '739481e3-5ee8-11ee-b941-02f6ae7b73e9',
    },
  ] as unknown as ActivityInstanceHistory[];

  const transformedHistory: ProcessInstanceHistoryTabItem[] = [
    {
      activityId: 'Event_1krw1o0',
      details: 'A problem occurred',
      duration: '0:00:00.0',
      endTime: '2023-09-29T13:52:00.730-0400',
      entityType: 'Event_1krw1o0',
      executionId: '739481e3-5ee8-11ee-b941-02f6ae7b73e9',
      id: 'Event_1krw1o0:e41c8458-5ef0-11ee-b941-02f6ae7b73e9',
      operationType: 'Create',
      startTime: '2023-09-29T13:52:00.730-0400',
      type: 'Incident',
      userId: 'System',
    },
    {
      data: 'anotherVarValue',
      dataLabel: 'anotherVarName',
      duration: '0:00:00.0',
      endTime: '2023-09-29T13:52:00.730-0400',
      entityType: 'Variable',
      executionId: undefined,
      id: undefined,
      operationType: 'CreateVariable',
      startTime: '2023-09-29T13:52:00.730-0400',
      type: 'Detail',
      userId: 'System',
      userOperationId: null,
      variableName: 'anotherVarName',
    },
    {
      activityId: 'Event_1krw1o0',
      duration: '0:00:00.0',
      endTime: '2023-09-29T13:52:00.730-0400',
      entityType: 'terminateEndEvent',
      executionId: '739481e3-5ee8-11ee-b941-02f6ae7b73e9',
      id: 'Event_1krw1o0:e41c8458-5ef0-11ee-b941-02f6ae7b73e9',
      name: 'anActivityName',
      operationType: 'Create',
      startTime: '2023-09-29T13:52:00.730-0400',
      taskId: '123',
      type: 'Activity Instance',
      userId: 'System',
    },
    {
      activityId: 'Event_174p1ua',
      duration: '0:00:00.4',
      endTime: '2023-09-29T13:19:42.171-0400',
      entityType: 'intermediateTimer',
      executionId: '6061aa1e-5eec-11ee-b941-02f6ae7b73e9',
      id: 'Event_174p1ua:6061aa1f-5eec-11ee-b941-02f6ae7b73e9',
      name: 'Wait 1 Second',
      operationType: 'Create',
      startTime: '2023-09-29T13:19:41.738-0400',
      taskId: undefined,
      type: 'Activity Instance',
      userId: 'System',
    },
    {
      data: undefined,
      dataLabel: undefined,
      duration: '0:00:00.0',
      endTime: '2023-09-29T12:56:53.449-0400',
      entityType: 'ProcessInstance',
      executionId: undefined,
      id: '30d17c72-5ee9-11ee-b941-02f6ae7b73e9',
      operationType: 'ModifyProcessInstance',
      startTime: '2023-09-29T12:56:53.449-0400',
      taskId: undefined,
      type: 'User Operation',
      userId: 'usr1234',
      userOperationId: '30d17c71-5ee9-11ee-b941-02f6ae7b73e9',
      variableName: undefined,
    },
    {
      data: 'aVarValue',
      dataLabel: 'aVarName',
      duration: '0:00:00.0',
      endTime: '2023-09-29T12:56:53.449-0400',
      entityType: 'ProcessInstance',
      executionId: undefined,
      id: '30d17c72-5ee9-11ee-b941-02f6ae7b73e9',
      operationType: 'ModifyProcessInstance',
      startTime: '2023-09-29T12:56:53.449-0400',
      taskId: undefined,
      type: 'User Operation',
      userId: 'usr1234',
      userOperationId: '30d17c71-5ee9-11ee-b941-02f6ae7b73e9',
      variableName: 'aVarName',
    },
    {
      data: 'aVarValue',
      dataLabel: 'aVarName',
      duration: '0:00:00.0',
      endTime: '2023-09-29T12:56:53.449-0400',
      entityType: 'ProcessInstance',
      executionId: undefined,
      id: '30d17c72-5ee9-11ee-b941-02f6ae7b73b1',
      operationType: 'ModifyVariable',
      startTime: '2023-09-29T12:56:53.449-0400',
      taskId: undefined,
      type: 'User Operation',
      userId: 'usr1234',
      userOperationId: '30d17c71-5ee9-11ee-b941-02f6ae7b73e9',
      variableName: 'aVarName',
    },
    {
      data: undefined,
      dataLabel: undefined,
      duration: '0:00:00.0',
      endTime: '2023-09-29T12:56:50.076-0400',
      entityType: 'ProcessInstance',
      executionId: undefined,
      id: '2ecece7c-5ee9-11ee-b941-02f6ae7b73e9',
      name: 'anActivityName',
      operationType: 'ModifyProcessInstance',
      startTime: '2023-09-29T12:56:50.076-0400',
      taskId: '123',
      type: 'User Operation',
      userId: 'usr1234',
      userOperationId: '2ecece7b-5ee9-11ee-b941-02f6ae7b73e9',
      variableName: undefined,
    },
    {
      data: 'Testing Annotation',
      dataLabel: 'Annotation',
      duration: '0:00:00.0',
      endTime: '2023-09-29T12:56:50.076-0400',
      entityType: 'ProcessInstance',
      executionId: undefined,
      id: '7kf92nck-5ee9-11ee-b941-02f6ae7b73e9',
      operationType: 'ModifyProcessInstance',
      startTime: '2023-09-29T12:56:50.076-0400',
      taskId: undefined,
      type: 'User Operation',
      userId: 'usr1234',
      userOperationId: '7kf92nck-5ee9-11ee-b941-02f6ae7b73e9',
      variableName: undefined,
    },
  ];

  beforeEach(() => {
    service = new HistoryTabService();
  });

  it('should combine and order history data', () => {
    const actual = service.combineAndOrderHistoryData(
      userOperationHistory,
      detailHistory,
      activityInstanceHistory,
      incidentHistory,
    );
    expect(actual).toEqual(transformedHistory);
  });

  it('should return correct variable value and name', () => {
    expect(service.setVariableValue('newVarName', 'newVarValue')).toEqual('<b>newVarName</b>: newVarValue');
  });

  describe('transformUserOperationObjects', () => {
    it('returns empty array when userOperationHistoryItems is empty', () => {
      const result = service.transformUserOperationObjects([], [], []);
      expect(result).toEqual([]);
    });

    it('returns user operation item with default user when userId is missing', () => {
      const userOperationHistoryNoUser = [
        {
          id: 'id1',
          timestamp: '2023-01-01T00:00:00.000Z',
          operationId: 'op1',
          operationType: 'ModifyProcessInstance',
          entityType: 'ProcessInstance',
        },
      ] as unknown as UserOperationHistory[];
      const result = service.transformUserOperationObjects(userOperationHistoryNoUser, [], []);
      expect(result[0].userId).toBe(DEFAULT_USER);
    });

    it('adds activity name when taskId matches in activityInstanceHistoryItems', () => {
      const userOpHistory = [
        {
          id: 'id2',
          timestamp: '2023-01-01T00:00:00.000Z',
          operationId: 'op2',
          operationType: 'ModifyProcessInstance',
          entityType: 'ProcessInstance',
          taskId: 'task1',
        },
      ] as unknown as UserOperationHistory[];
      const activityInstHistory = [
        {
          taskId: 'task1',
          activityName: 'Activity Name',
        },
      ] as unknown as ActivityInstanceHistory[];
      const result = service.transformUserOperationObjects(userOpHistory, [], activityInstHistory);
      expect(result[0].name).toBe('Activity Name');
    });

    it('does not add the user operation item if operationType is ModifyVariable', () => {
      const userOpHistory = [
        {
          id: 'id3',
          timestamp: '2023-01-01T00:00:00.000Z',
          operationId: 'op3',
          operationType: 'ModifyVariable',
          entityType: 'ProcessInstance',
        },
      ] as unknown as UserOperationHistory[];
      const result = service.transformUserOperationObjects(userOpHistory, [], []);
      expect(result).toEqual([]);
    });

    it('adds detail items as additional user operation items', () => {
      const userOpHistory = [
        {
          id: 'id4',
          timestamp: '2023-01-01T00:00:00.000Z',
          operationId: 'op4',
          operationType: 'ModifyProcessInstance',
          entityType: 'ProcessInstance',
        },
      ] as unknown as UserOperationHistory[];
      const detailHist = [
        {
          userOperationId: 'op4',
          variableName: 'var1',
          value: 'val1',
        },
        {
          userOperationId: 'op4',
          variableName: 'var2',
          value: 'val2',
        },
      ] as unknown as DetailHistory[];
      const result = service.transformUserOperationObjects(userOpHistory, detailHist, []);
      expect(result.length).toBe(3);
      expect(result[1].variableName).toBe('var1');
      expect(result[1].data).toBe('val1');
      expect(result[2].variableName).toBe('var2');
      expect(result[2].data).toBe('val2');
    });

    it('sets data and dataLabel from annotation if present', () => {
      const userOpHistory = [
        {
          id: 'id5',
          timestamp: '2023-01-01T00:00:00.000Z',
          operationId: 'op5',
          operationType: 'ModifyProcessInstance',
          entityType: 'ProcessInstance',
          annotation: 'Some annotation',
          property: 'Some property',
        },
      ] as unknown as UserOperationHistory[];
      const result = service.transformUserOperationObjects(userOpHistory, [], []);
      expect(result[0].data).toBe('Some annotation');
      expect(result[0].dataLabel).toBe('Annotation');
    });
  });
});
