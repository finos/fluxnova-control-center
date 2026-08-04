import { Body, Controller, Delete, Get, Logger, Param, Post, Put, Query, Req } from '@nestjs/common';
import {
  type CompleteActivityInstanceInfo,
  Incident,
  type IPaginatedDataRequest,
  type ProcessInstance,
  type ProcessInstanceBulkTerminateRequest,
  type ProcessInstanceTerminateRequest,
} from '@fxn/types';
import { includes, isEmpty, isString } from 'lodash-es';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { FluxnovaController } from '../fluxnova-controller';
import {
  HistoricActivityInstanceApi,
  HistoricDetailApi,
  HistoricIncidentApi,
  HistoricProcessInstanceApi,
  HistoricProcessInstanceApiQueryHistoricProcessInstancesCountRequest,
  HistoricProcessInstanceApiQueryHistoricProcessInstancesRequest,
  HistoricUserOperationLogApi,
  ProcessInstanceApi,
  ProcessInstanceApiQueryProcessInstancesCountRequest,
} from '../generated';
import type { Request } from 'express';

export const allHistoryTypes = ['detail', 'activityInstance', 'incident', 'userOperation'];

@Controller('api/process-instances')
export class ProcessInstanceController extends FluxnovaController {
  private processInstanceApi: ProcessInstanceApi;
  private historicProcessInstanceApi: HistoricProcessInstanceApi;
  private historicIncidentApi: HistoricIncidentApi;
  private historicUserOperationLogApi: HistoricUserOperationLogApi;
  private historicDetailApi: HistoricDetailApi;
  private historicActivityInstanceApi: HistoricActivityInstanceApi;
  protected readonly logger = new Logger(ProcessInstanceController.name);

  constructor(
    protected httpService: HttpService,
    protected configService: ConfigService,
  ) {
    super(httpService, configService);
    this.processInstanceApi = this.createApi(ProcessInstanceApi);
    this.historicProcessInstanceApi = this.createApi(HistoricProcessInstanceApi);
    this.historicIncidentApi = this.createApi(HistoricIncidentApi);
    this.historicUserOperationLogApi = this.createApi(HistoricUserOperationLogApi);
    this.historicDetailApi = this.createApi(HistoricDetailApi);
    this.historicActivityInstanceApi = this.createApi(HistoricActivityInstanceApi);
  }

  @Post('/')
  async getProcessInstanceWithFilterBody(
    @Req() req: Request,
    @Body() filtersAndPagination: IPaginatedDataRequest,
    @Query('includeIncidentInfo') includeIncidentInfo?: string,
  ) {
    const calls = [];
    const superProcessInstanceId = filtersAndPagination.filter.superProcessInstanceId;
    const filterForLogging = filtersAndPagination.filter
      ? {
          ...filtersAndPagination.filter,
          variables: filtersAndPagination.filter.variables?.map((v: any) => ({ ...v, value: '[REDACTED]' })),
        }
      : {};

    this.logger.log(`Getting process instances with filter:\n${JSON.stringify(filterForLogging, null, 4)}`);

    calls.push(
      this.safeApiCall(async () => {
        const response = await this.historicProcessInstanceApi.queryHistoricProcessInstances(
          {
            firstResult: filtersAndPagination.firstResult,
            maxResults: filtersAndPagination.maxResults,
            historicProcessInstanceQueryDto: filtersAndPagination.filter,
          } as HistoricProcessInstanceApiQueryHistoricProcessInstancesRequest,
          await this.createAxiosOptions(req),
        );
        return response.data;
      }, 'Error getting process instances'),
    );

    if (includeIncidentInfo) {
      // If we have a process definition ID we can get incidents by that,
      // if not, then use the list of process instance IDs, otherwise
      // use the process instance id.

      switch (true) {
        case !isEmpty(filtersAndPagination.filter.processDefinitionId):
          calls.push(
            this.safeApiCall(async () => {
              const response = await this.historicIncidentApi.getHistoricIncidents(
                { processDefinitionId: filtersAndPagination.filter.processDefinitionId, open: true },
                await this.createAxiosOptions(req),
              );
              return response.data;
            }, 'Error getting historic incidents'),
          );
          break;
        case !isEmpty(superProcessInstanceId):
          calls.push(
            this.safeApiCall(async () => {
              const response = await this.processInstanceApi.getProcessInstances(
                { superProcessInstance: superProcessInstanceId, withIncident: true },
                await this.createAxiosOptions(req),
              );
              return response.data;
            }, 'Error getting process instances with incidents'),
          );
          break;
        case !isEmpty(filtersAndPagination.filter.processInstanceId):
        default:
          calls.push(
            this.safeApiCall(async () => {
              const response = await this.historicIncidentApi.getHistoricIncidents(
                { processInstanceId: filtersAndPagination.filter.processInstanceId, open: true },
                await this.createAxiosOptions(req),
              );
              return response.data;
            }, 'Error getting historic incidents'),
          );
          break;
      }
    }

    const result = await Promise.all(calls);
    const instances: ProcessInstance[] = result.shift() as ProcessInstance[];
    let incidents: Incident[];
    let instancesWithIncidents: ProcessInstance[];

    if (superProcessInstanceId) instancesWithIncidents = result.flat() as ProcessInstance[];
    else incidents = result.flat() as Incident[];

    return instances.map((instance) => ({
      ...instance,
      hasIncidents: superProcessInstanceId
        ? instancesWithIncidents.some((i) => i.id === instance.id)
        : incidents?.some((i) => i.processInstanceId === instance.id),
    }));
  }

  @Post('history/count')
  getProcessInstanceHistoryCount(@Req() req: Request, @Body() filters: { [key: string]: string }) {
    const filterForLogging = {
      ...filters,
      variables: (filters as any).variables?.map((v: any) => ({ ...v, value: '[REDACTED]' })),
    };
    this.logger.log(
      `Getting process instance history count with filters:\n${JSON.stringify(filterForLogging, null, 4)}`,
    );
    return this.safeApiCall(async () => {
      const response = await this.historicProcessInstanceApi.queryHistoricProcessInstancesCount(
        {
          historicProcessInstanceQueryDto: filters,
        } as HistoricProcessInstanceApiQueryHistoricProcessInstancesCountRequest,
        await this.createAxiosOptions(req),
      );
      return response.data?.count ?? 0;
    }, 'Error getting process instance history count');
  }

  @Post('count')
  getProcessInstanceCount(@Req() req: Request, @Body() filters: { [key: string]: string }) {
    const filterForLogging = {
      ...filters,
      variables: (filters as any).variables?.map((v: any) => ({ ...v, value: '[REDACTED]' })),
    };
    this.logger.log(`Getting process instance count with filters:\n${JSON.stringify(filterForLogging, null, 4)}`);
    return this.safeApiCall(async () => {
      const response = await this.processInstanceApi.queryProcessInstancesCount(
        {
          processInstanceQueryDto: filters,
        } as ProcessInstanceApiQueryProcessInstancesCountRequest,
        await this.createAxiosOptions(req),
      );
      return response.data?.count ?? 0;
    }, 'Error getting process instance count');
  }

  @Get(':id/history')
  async getProcessInstanceHistory(
    @Req() req: Request,
    @Param('id') id: string,
    @Query('typeFilters') typeFilters?: string[] | string,
    @Query('getAllResults') getAllResults?: boolean,
  ) {
    let filters = typeFilters || allHistoryTypes;
    if (isString(filters)) {
      filters = [filters];
    }
    const maxResults = getAllResults ? undefined : 500;
    const operationHistory = includes(filters, 'userOperation')
      ? this.safeApiCall(async () => {
          const response = await this.historicUserOperationLogApi.queryUserOperationEntries(
            { processInstanceId: id, maxResults },
            await this.createAxiosOptions(req),
          );
          return response.data;
        }, 'Error getting user operation history')
      : [];
    const detailHistory = includes(filters, 'detail')
      ? this.safeApiCall(async () => {
          const response = await this.historicDetailApi.getHistoricDetails(
            { processInstanceId: id, maxResults },
            await this.createAxiosOptions(req),
          );
          return response.data;
        }, 'Error getting detail history')
      : [];
    const activityInstanceHistory = includes(filters, 'activityInstance')
      ? this.safeApiCall(async () => {
          const response = await this.historicActivityInstanceApi.getHistoricActivityInstances(
            { processInstanceId: id, maxResults },
            await this.createAxiosOptions(req),
          );
          return response.data;
        }, 'Error getting activity instance history')
      : [];
    const incidentHistory = includes(filters, 'incident')
      ? this.safeApiCall(async () => {
          const response = await this.historicIncidentApi.getHistoricIncidents(
            { processInstanceId: id, maxResults },
            await this.createAxiosOptions(req),
          );
          return response.data;
        }, 'Error getting incident history')
      : [];
    return Promise.all([operationHistory, detailHistory, activityInstanceHistory, incidentHistory]).then((result) => ({
      userOperation: result[0],
      detail: result[1],
      activityInstance: result[2],
      incident: result[3],
    }));
  }

  @Post(':id/modification')
  processModification(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    return this.safeApiCall(async () => {
      const response = await this.processInstanceApi.modifyProcessInstance(
        { id, processInstanceModificationDto: body },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error modifying process instance');
  }

  @Put(':id/suspended')
  suspendOrActivate(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    return this.safeApiCall(async () => {
      const response = await this.processInstanceApi.updateSuspensionStateById(
        { id, suspensionStateDto: body },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error updating process instance suspension state');
  }

  @Delete(':id/terminate')
  terminate(@Req() req: Request, @Param('id') id: string, @Body() input: ProcessInstanceTerminateRequest) {
    return this.safeApiCall(async () => {
      const response = await this.processInstanceApi.deleteProcessInstance(
        { id, ...input },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error terminating process instance');
  }

  @Post('suspended-async')
  bulkSuspendOrActivate(
    @Req() req: Request,
    @Body() suspendedAsyncBody: { processInstanceIds: Array<string>; suspended: boolean },
  ) {
    return this.safeApiCall(async () => {
      const response = await this.processInstanceApi.updateSuspensionStateAsyncOperation(
        { processInstanceSuspensionStateAsyncDto: suspendedAsyncBody },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error updating process instance suspension states in bulk');
  }

  @Post('delete')
  bulkTerminate(@Req() req: Request, @Body() bulkTerminateBody: ProcessInstanceBulkTerminateRequest) {
    return this.safeApiCall(async () => {
      const response = await this.processInstanceApi.deleteProcessInstancesAsyncOperation(
        { deleteProcessInstancesDto: bulkTerminateBody },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error terminating process instances in bulk');
  }

  @Get(':id/activity-instances')
  async getProcessInstanceActivityInstances(
    @Req() req: Request,
    @Param('id') processInstanceId: string,
    @Query('includeHistoricalInfo') includeHistoricalInfo: string,
    @Query('activityId') activityId?: string,
  ): Promise<CompleteActivityInstanceInfo> {
    return await Promise.all([
      this.safeApiCall(
        async () => {
          const response = await this.processInstanceApi.getActivityInstanceTree(
            { id: processInstanceId },
            await this.createAxiosOptions(req),
          );
          return response.data;
        },
        'Error getting activity instances',
        true,
      ),
      includeHistoricalInfo === 'true'
        ? this.safeApiCall(async () => {
            const allHistoric = await this.fetchAll(
              async () => {
                const countResponse = await this.historicActivityInstanceApi.getHistoricActivityInstancesCount(
                  { processInstanceId, activityId },
                  await this.createAxiosOptions(req),
                );
                return countResponse.data?.count ?? 0;
              },
              async (firstResult: number, maxResults: number) => {
                const pageResponse = await this.historicActivityInstanceApi.getHistoricActivityInstances(
                  { firstResult, maxResults, processInstanceId, activityId, sortBy: 'startTime', sortOrder: 'desc' },
                  await this.createAxiosOptions(req),
                );
                return pageResponse.data ?? [];
              },
            );
            return allHistoric;
          }, 'Error getting historical activity instances')
        : Promise.resolve([]),
    ]).then(
      ([activityInstance, historicalActivityInstances]) =>
        ({
          active: activityInstance,
          historical: historicalActivityInstances,
        }) as CompleteActivityInstanceInfo,
    );
  }
}
