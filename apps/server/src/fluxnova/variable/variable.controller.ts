import { BadRequestException, Body, Controller, Get, Logger, Param, Post, Req } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { FluxnovaController } from '../fluxnova-controller';
import {
  ExecutionApi,
  ExecutionApiModifyLocalExecutionVariablesRequest,
  HistoricVariableInstanceApi,
  HistoricVariableInstanceApiQueryHistoricVariableInstancesCountRequest,
  ProcessInstanceApi,
  ProcessInstanceApiModifyProcessInstanceVariablesRequest,
  TaskVariableApi,
  TaskVariableApiModifyTaskVariablesRequest,
  VariableInstanceApi,
  VariableInstanceApiQueryVariableInstancesRequest,
  VariableValueDto,
} from '../generated';
import type { Request } from 'express';
import type { IPaginatedDataRequest, Variable, VariableSearchFilter } from '@fxn/types/src/fluxnova';

// Keep policy centralized and explicit
const VARIABLE_NAME_PATTERN = /^[A-Za-z0-9_.:-]{1,128}$/;
const BLOCKED_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

function assertSafeVariableName(name: unknown): asserts name is string {
  if (typeof name !== 'string') {
    throw new BadRequestException('Variable name must be a string');
  }

  const trimmed = name.trim();
  if (!trimmed) {
    throw new BadRequestException('Variable name is required');
  }

  if (!VARIABLE_NAME_PATTERN.test(trimmed)) {
    throw new BadRequestException('Variable name contains invalid characters');
  }

  if (BLOCKED_KEYS.has(trimmed)) {
    throw new BadRequestException('Variable name is not allowed');
  }
}

function buildPatchBody(
  variable: Variable,
  id?: string,
):
  | ProcessInstanceApiModifyProcessInstanceVariablesRequest
  | TaskVariableApiModifyTaskVariablesRequest
  | ExecutionApiModifyLocalExecutionVariablesRequest {
  if (!id) throw new BadRequestException('Id (task, process, execution) is required');

  assertSafeVariableName(variable.name);
  const variableName = variable.name;

  const bodyValue: VariableValueDto = {
    value: variable.value,
    type: variable.type,
    valueInfo: variable.valueInfo,
  };

  // Null-prototype object prevents prototype pollution via special keys
  const patchVariablesDto: Record<string, typeof bodyValue> = Object.create(null);
  patchVariablesDto[variableName] = bodyValue;

  return { id, patchVariablesDto };
}

@Controller('api/variables')
export class VariableController extends FluxnovaController {
  private variableInstanceApi: VariableInstanceApi;
  private historicVariableInstanceApi: HistoricVariableInstanceApi;
  private processInstanceApi: ProcessInstanceApi;
  private taskVariableApi: TaskVariableApi;
  private executionApi: ExecutionApi;
  protected readonly logger = new Logger(VariableController.name);

  constructor(
    protected httpService: HttpService,
    protected configService: ConfigService,
  ) {
    super(httpService, configService);
    this.variableInstanceApi = this.createApi(VariableInstanceApi);
    this.historicVariableInstanceApi = this.createApi(HistoricVariableInstanceApi);
    this.processInstanceApi = this.createApi(ProcessInstanceApi);
    this.taskVariableApi = this.createApi(TaskVariableApi);
    this.executionApi = this.createApi(ExecutionApi);
  }

  @Post('')
  getProcessInstanceVariables(@Req() req: Request, @Body() request: IPaginatedDataRequest) {
    return this.safeApiCall(async () => {
      const response = await this.variableInstanceApi.queryVariableInstances(
        {
          maxResults: request.maxResults,
          firstResult: request.firstResult,
          deserializeValues: false,
          variableInstanceQueryDto: request.filter,
        },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error getting process instance variables');
  }

  @Get('variable-history/:id')
  getHistoricInstanceVariable(@Req() req: Request, @Param('id') id: string) {
    return this.safeApiCall(async () => {
      const response = await this.historicVariableInstanceApi.getHistoricVariableInstance(
        { id },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error getting historic process instance variable');
  }

  @Post('count')
  getProcessInstanceVariableCount(@Req() req: Request, @Body() filterInput: VariableSearchFilter) {
    return this.safeApiCall(async () => {
      const response = await this.variableInstanceApi.queryVariableInstancesCount(
        { variableInstanceQueryDto: filterInput } as VariableInstanceApiQueryVariableInstancesRequest,
        await this.createAxiosOptions(req),
      );
      return response.data?.count;
    }, 'Error getting process instance variable count');
  }

  @Post('variable-history')
  getProcessInstanceVariablesHistory(@Req() req: Request, @Body() request: IPaginatedDataRequest) {
    return this.safeApiCall(async () => {
      const response = await this.historicVariableInstanceApi.queryHistoricVariableInstances(
        {
          firstResult: request.firstResult,
          maxResults: request.maxResults,
          deserializeValues: false,
          historicVariableInstanceQueryDto: request.filter,
        },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error getting historic process instance variables');
  }

  @Post('variable-history/count')
  getProcessInstanceVariableCountHistory(@Req() req: Request, @Body() filterInput: VariableSearchFilter) {
    return this.safeApiCall(async () => {
      const response = await this.historicVariableInstanceApi.queryHistoricVariableInstancesCount(
        {
          historicVariableInstanceQueryDto: filterInput,
        } as HistoricVariableInstanceApiQueryHistoricVariableInstancesCountRequest,
        await this.createAxiosOptions(req),
      );
      return response.data?.count;
    }, 'Error getting historic process instance variable count');
  }

  @Post('update-process')
  updateProcessVariable(@Req() req: Request, @Body() variable: Variable) {
    const body = buildPatchBody(variable, variable.processInstanceId);

    return this.safeApiCall(async () => {
      const response = await this.processInstanceApi.modifyProcessInstanceVariables(
        body,
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error updating process instance variable');
  }

  @Post('update-task')
  updateTaskVariable(@Req() req: Request, @Body() variable: Variable) {
    const body: TaskVariableApiModifyTaskVariablesRequest = buildPatchBody(variable, variable.taskId);

    return this.safeApiCall(async () => {
      const response = await this.taskVariableApi.modifyTaskVariables(body, await this.createAxiosOptions(req));
      return response.data;
    }, 'Error updating task variable');
  }

  @Post('update-execution')
  updateExecutionVariable(@Req() req: Request, @Body() variable: Variable) {
    const body: ExecutionApiModifyLocalExecutionVariablesRequest = buildPatchBody(variable, variable.executionId);

    return this.safeApiCall(async () => {
      const response = await this.executionApi.modifyLocalExecutionVariables(body, await this.createAxiosOptions(req));
      return response.data;
    }, 'Error updating execution variable');
  }

  @Post('delete-process')
  deleteProcessVariable(@Req() req: Request, @Body() variable: Variable) {
    const body = {
      deletions: [variable.name],
    };
    return this.safeApiCall(async () => {
      const response = await this.processInstanceApi.modifyProcessInstanceVariables(
        { id: variable.processInstanceId ?? '', patchVariablesDto: body },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error deleting process instance variable');
  }

  @Post('delete-task')
  deleteTaskVariable(@Req() req: Request, @Body() variable: Variable) {
    const body = {
      deletions: [variable.name],
    };
    return this.safeApiCall(async () => {
      const response = await this.taskVariableApi.modifyTaskVariables(
        { id: variable.taskId ?? '', patchVariablesDto: body },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error deleting task variable');
  }

  @Post('delete-execution')
  deleteExecutionVariable(@Req() req: Request, @Body() variable: Variable) {
    const body = {
      deletions: [variable.name],
    };
    return this.safeApiCall(async () => {
      const response = await this.executionApi.modifyLocalExecutionVariables(
        { id: variable.executionId ?? '', patchVariablesDto: body },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error deleting execution variable');
  }

  @Get(':id/data')
  getVariableBinary(@Req() req: Request, @Param('id') id: string) {
    return this.safeApiCall(async () => {
      const response = await this.variableInstanceApi.getVariableInstanceBinary(
        { id },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error getting variable binary data');
  }

  @Get('history/:id/data')
  getHistoricVariableBinary(@Req() req: Request, @Param('id') id: string) {
    return this.safeApiCall(async () => {
      const response = await this.historicVariableInstanceApi.getHistoricVariableInstanceBinary(
        { id },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error getting historic variable binary data');
  }
}
