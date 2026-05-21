import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Variable } from '@fxn/types';
import { VariableController } from './variable.controller';

describe('VariableController', () => {
  let controller: VariableController;

  const mockHttpService = {};

  const mockConfigService = {
    get: vi.fn(),
  };

  const mockVariableInstanceApi = {
    queryVariableInstances: vi.fn().mockResolvedValue({ data: [] }),
    queryVariableInstancesCount: vi.fn().mockResolvedValue({ data: { count: 0 } }),
    getVariableInstanceBinary: vi.fn().mockResolvedValue({ data: null }),
  };

  const mockHistoricVariableInstanceApi = {
    getHistoricVariableInstance: vi.fn().mockResolvedValue({ data: {} }),
    queryHistoricVariableInstances: vi.fn().mockResolvedValue({ data: [] }),
    queryHistoricVariableInstancesCount: vi.fn().mockResolvedValue({ data: { count: 0 } }),
    getHistoricVariableInstanceBinary: vi.fn().mockResolvedValue({ data: null }),
  };

  const mockProcessInstanceApi = {
    modifyProcessInstanceVariables: vi.fn().mockResolvedValue({ data: null }),
  };

  const mockTaskVariableApi = {
    modifyTaskVariables: vi.fn().mockResolvedValue({ data: null }),
  };

  const mockExecutionApi = {
    modifyLocalExecutionVariables: vi.fn().mockResolvedValue({ data: null }),
  };

  const mockRequest = {
    user: { id: 'test-user' },
    headers: {},
  } as any as Request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VariableController],
      providers: [
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<VariableController>(VariableController);

    (controller as any).variableInstanceApi = mockVariableInstanceApi;
    (controller as any).historicVariableInstanceApi = mockHistoricVariableInstanceApi;
    (controller as any).processInstanceApi = mockProcessInstanceApi;
    (controller as any).taskVariableApi = mockTaskVariableApi;
    (controller as any).executionApi = mockExecutionApi;
    vi.spyOn(controller as any, 'createAxiosOptions').mockReturnValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  let filterInput = { processInstanceIdIn: ['asdf'] } as any;

  it('should get variable count for an active process instance', async () => {
    await controller.getProcessInstanceVariableCount(mockRequest, filterInput);

    expect(mockVariableInstanceApi.queryVariableInstancesCount).toHaveBeenCalledWith(
      { variableInstanceQueryDto: filterInput },
      {},
    );
  });

  it('should get variable count for a historical process instance', async () => {
    await controller.getProcessInstanceVariableCountHistory(mockRequest, filterInput);

    expect(mockHistoricVariableInstanceApi.queryHistoricVariableInstancesCount).toHaveBeenCalledWith(
      { historicVariableInstanceQueryDto: filterInput },
      {},
    );
  });

  it('should call getHistoricVariableInstance when its controller is called', async () => {
    await controller.getHistoricInstanceVariable(mockRequest, '123');

    expect(mockHistoricVariableInstanceApi.getHistoricVariableInstance).toHaveBeenCalledWith({ id: '123' }, {});
  });

  it('should get process instance variables with pagination', async () => {
    const request = {
      filter: {
        processInstanceIdIn: 'test-id',
      },
      firstResult: 0,
      maxResults: 50,
    };

    await controller.getProcessInstanceVariables(mockRequest, request);

    expect(mockVariableInstanceApi.queryVariableInstances).toHaveBeenCalledWith(
      {
        deserializeValues: false,
        maxResults: 50,
        firstResult: 0,
        variableInstanceQueryDto: {
          processInstanceIdIn: 'test-id',
        },
      },
      {},
    );
  });

  it('should get process instance variables history with pagination', async () => {
    filterInput = {
      filter: {
        processInstanceIdIn: 'test-id',
      },
      firstResult: 0,
      maxResults: 50,
    };

    await controller.getProcessInstanceVariablesHistory(mockRequest, filterInput);

    expect(mockHistoricVariableInstanceApi.queryHistoricVariableInstances).toHaveBeenCalledWith(
      {
        deserializeValues: false,
        maxResults: 50,
        firstResult: 0,
        historicVariableInstanceQueryDto: {
          processInstanceIdIn: 'test-id',
        },
      },
      {},
    );
  });

  it('should update a process variable with a valid name', async () => {
    const variable = {
      id: '',
      name: 'variableName',
      value: 'variableValue',
      type: 'String',
      valueInfo: { serializationDataFormat: 'application/json' },
      processInstanceId: 'process-instance-id',
    } as Variable;

    await controller.updateProcessVariable(mockRequest, variable);

    expect(mockProcessInstanceApi.modifyProcessInstanceVariables).toHaveBeenCalledWith(
      {
        id: variable.processInstanceId,
        patchVariablesDto: {
          [variable.name]: {
            value: variable.value,
            type: variable.type,
            valueInfo: variable.valueInfo,
          },
        },
      },
      {},
    );
  });

  it.each(['variable_name', 'variable-name', 'variable.name', 'variable:name', 'variable-1.2_name:prod'])(
    'should allow a process variable name that matches the supported pattern: %s',
    async (name) => {
      const variable = {
        id: '',
        name,
        value: 'variableValue',
        type: 'String',
        processInstanceId: 'process-instance-id',
      } as Variable;

      await controller.updateProcessVariable(mockRequest, variable);

      expect(mockProcessInstanceApi.modifyProcessInstanceVariables).toHaveBeenCalledWith(
        {
          id: variable.processInstanceId,
          patchVariablesDto: {
            [name]: {
              value: variable.value,
              type: variable.type,
              valueInfo: variable.valueInfo,
            },
          },
        },
        {},
      );
    },
  );

  it('should update a task variable with a valid name', async () => {
    const variable = {
      id: '',
      name: 'variableName',
      value: 'variableValue',
      type: 'String',
      taskId: 'task-id',
    } as Variable;

    await controller.updateTaskVariable(mockRequest, variable);

    expect(mockTaskVariableApi.modifyTaskVariables).toHaveBeenCalledWith(
      {
        id: variable.taskId,
        patchVariablesDto: {
          [variable.name]: {
            value: variable.value,
            type: variable.type,
            valueInfo: variable.valueInfo,
          },
        },
      },
      {},
    );
  });

  it('should update an execution variable with a valid name', async () => {
    const variable = {
      id: '',
      name: 'variableName',
      value: 'variableValue',
      type: 'String',
      executionId: 'execution-id',
    } as Variable;

    await controller.updateExecutionVariable(mockRequest, variable);

    expect(mockExecutionApi.modifyLocalExecutionVariables).toHaveBeenCalledWith(
      {
        id: variable.executionId,
        patchVariablesDto: {
          [variable.name]: {
            value: variable.value,
            type: variable.type,
            valueInfo: variable.valueInfo,
          },
        },
      },
      {},
    );
  });

  it.each(['__proto__', 'prototype', 'constructor'])(
    'should reject a blocked variable name when updating a process variable: %s',
    (name) => {
      const variable = {
        id: '',
        name,
        value: 'variableValue',
        type: 'String',
        processInstanceId: 'process-instance-id',
      } as Variable;

      expect(() => controller.updateProcessVariable(mockRequest, variable)).toThrowError(BadRequestException);
      expect(mockProcessInstanceApi.modifyProcessInstanceVariables).not.toHaveBeenCalled();
    },
  );

  it('should reject a variable name with invalid characters when updating a process variable', () => {
    const variable = {
      id: '',
      name: 'variable/name',
      value: 'variableValue',
      type: 'String',
      processInstanceId: 'process-instance-id',
    } as Variable;

    expect(() => controller.updateProcessVariable(mockRequest, variable)).toThrowError(BadRequestException);
    expect(mockProcessInstanceApi.modifyProcessInstanceVariables).not.toHaveBeenCalled();
  });

  it.each(['variable name', 'variable/name', 'variable\\name', 'variable?name', 'variable,name', 'variable@name'])(
    'should reject a process variable name that contains unsupported characters: %s',
    (name) => {
      const variable = {
        id: '',
        name,
        value: 'variableValue',
        type: 'String',
        processInstanceId: 'process-instance-id',
      } as Variable;

      expect(() => controller.updateProcessVariable(mockRequest, variable)).toThrowError(BadRequestException);
      expect(mockProcessInstanceApi.modifyProcessInstanceVariables).not.toHaveBeenCalled();
    },
  );

  it('should allow a process variable name with 128 characters', async () => {
    const variable = {
      id: '',
      name: 'a'.repeat(128),
      value: 'variableValue',
      type: 'String',
      processInstanceId: 'process-instance-id',
    } as Variable;

    await controller.updateProcessVariable(mockRequest, variable);

    expect(mockProcessInstanceApi.modifyProcessInstanceVariables).toHaveBeenCalledWith(
      {
        id: variable.processInstanceId,
        patchVariablesDto: {
          [variable.name]: {
            value: variable.value,
            type: variable.type,
            valueInfo: variable.valueInfo,
          },
        },
      },
      {},
    );
  });

  it('should reject a process variable name longer than 128 characters', () => {
    const variable = {
      id: '',
      name: 'a'.repeat(129),
      value: 'variableValue',
      type: 'String',
      processInstanceId: 'process-instance-id',
    } as Variable;

    expect(() => controller.updateProcessVariable(mockRequest, variable)).toThrowError(BadRequestException);
    expect(mockProcessInstanceApi.modifyProcessInstanceVariables).not.toHaveBeenCalled();
  });

  it('should reject an empty variable name when updating a process variable', () => {
    const variable = {
      id: '',
      name: '',
      value: 'variableValue',
      type: 'String',
      processInstanceId: 'process-instance-id',
    } as Variable;

    expect(() => controller.updateProcessVariable(mockRequest, variable)).toThrowError(BadRequestException);
    expect(mockProcessInstanceApi.modifyProcessInstanceVariables).not.toHaveBeenCalled();
  });

  it('should reject a missing process instance id when updating a process variable', () => {
    const variable = {
      id: '',
      name: 'variableName',
      value: 'variableValue',
      type: 'String',
    } as Variable;

    expect(() => controller.updateProcessVariable(mockRequest, variable)).toThrowError(BadRequestException);
    expect(mockProcessInstanceApi.modifyProcessInstanceVariables).not.toHaveBeenCalled();
  });

  it('should reject a missing task id when updating a task variable', () => {
    const variable = {
      id: '',
      name: 'variableName',
      value: 'variableValue',
      type: 'String',
    } as Variable;

    expect(() => controller.updateTaskVariable(mockRequest, variable)).toThrowError(BadRequestException);
    expect(mockTaskVariableApi.modifyTaskVariables).not.toHaveBeenCalled();
  });

  it('should reject a missing execution id when updating an execution variable', () => {
    const variable = {
      id: '',
      name: 'variableName',
      value: 'variableValue',
      type: 'String',
    } as Variable;

    expect(() => controller.updateExecutionVariable(mockRequest, variable)).toThrowError(BadRequestException);
    expect(mockExecutionApi.modifyLocalExecutionVariables).not.toHaveBeenCalled();
  });

  it('should delete a process scoped variable', async () => {
    const variable = {
      id: '',
      name: 'variableName',
      value: 'variableValue',
      type: 'String',
      processInstanceId: 'process-instance-id',
    } as Variable;

    await controller.deleteProcessVariable(mockRequest, variable);

    expect(mockProcessInstanceApi.modifyProcessInstanceVariables).toHaveBeenCalledWith(
      {
        id: variable.processInstanceId,
        patchVariablesDto: {
          deletions: [variable.name],
        },
      },
      {},
    );
  });

  it('should delete a task scoped variable', async () => {
    const variable = {
      id: '',
      name: 'variableName',
      value: 'variableValue',
      type: 'String',
      taskId: 'task-id',
    } as Variable;

    await controller.deleteTaskVariable(mockRequest, variable);

    expect(mockTaskVariableApi.modifyTaskVariables).toHaveBeenCalledWith(
      {
        id: variable.taskId,
        patchVariablesDto: {
          deletions: [variable.name],
        },
      },
      {},
    );
  });

  it('should delete an execution scoped variable', async () => {
    const variable = {
      id: '',
      name: 'variableName',
      value: 'variableValue',
      type: 'String',
      executionId: 'execution-id',
    } as Variable;

    await controller.deleteExecutionVariable(mockRequest, variable);

    expect(mockExecutionApi.modifyLocalExecutionVariables).toHaveBeenCalledWith(
      {
        id: variable.executionId,
        patchVariablesDto: {
          deletions: [variable.name],
        },
      },
      {},
    );
  });

  it('should get variable binary', async () => {
    const id = 'test-variable-id';

    await controller.getVariableBinary(mockRequest, id);

    expect(mockVariableInstanceApi.getVariableInstanceBinary).toHaveBeenCalledWith({ id }, {});
  });

  it('should get historic variable binary', async () => {
    const id = 'test-historic-variable-id';

    await controller.getHistoricVariableBinary(mockRequest, id);

    expect(mockHistoricVariableInstanceApi.getHistoricVariableInstanceBinary).toHaveBeenCalledWith({ id }, {});
  });
});
