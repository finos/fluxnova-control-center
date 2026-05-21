import { Body, Controller, Delete, Get, Logger, Param, ParseBoolPipe, Post, Put, Query, Req } from '@nestjs/common';
import {
  ActivityInstanceHistory,
  CalledProcessDefinitionFilter,
  ProcessDefinitionDiagram,
  ProcessDefinitionFilter,
  StaticCalledProcessDefinition,
} from '@fxn/types';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { FluxnovaController } from '../fluxnova-controller';
import {
  HistoricActivityInstanceApi,
  HistoricActivityInstanceApiGetHistoricActivityInstancesRequest,
  ProcessDefinitionApi,
  ProcessDefinitionApiGetProcessDefinitionsRequest,
} from '../generated';
import { getCache, withCache } from '../../common';
import type { Request } from 'express';

interface filtersBody {
  filter: ProcessDefinitionFilter;
  firstResult: number;
  maxResults: number;
}

@Controller('api/process-definitions')
export class ProcessDefinitionController extends FluxnovaController {
  private processDefinitionApi: ProcessDefinitionApi;
  private historicActivityInstanceApi: HistoricActivityInstanceApi;
  protected readonly logger = new Logger(ProcessDefinitionController.name);

  constructor(
    protected httpService: HttpService,
    protected configService: ConfigService,
  ) {
    super(httpService, configService);
    this.processDefinitionApi = this.createApi(ProcessDefinitionApi);
    this.historicActivityInstanceApi = this.createApi(HistoricActivityInstanceApi);
  }

  @Post('/')
  async getProcessDefinitionWithFilterBody(@Req() req: Request, @Body() filtersAndPagination: filtersBody) {
    return this.safeApiCall(async () => {
      const apiParams = this.transformProcessDefinitionFilterToApiParams(filtersAndPagination.filter);
      const response = await this.processDefinitionApi.getProcessDefinitions(
        { ...apiParams, firstResult: filtersAndPagination.firstResult, maxResults: filtersAndPagination.maxResults },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error getting process definitions with filter');
  }

  @Post('count')
  getProcessDefinitionCount(@Req() req: Request, @Body() filters: ProcessDefinitionFilter) {
    return this.safeApiCall(async () => {
      const apiParams = this.transformProcessDefinitionFilterToApiParams(filters);
      const response = await this.processDefinitionApi.getProcessDefinitionsCount(
        apiParams,
        await this.createAxiosOptions(req),
      );
      return response.data?.count ?? 0;
    }, 'Error getting process definition count');
  }

  @Post(':id/start')
  submitProcessDefinitionStartForm(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    return this.safeApiCall(async () => {
      const response = await this.processDefinitionApi.submitForm(
        { id, startProcessInstanceFormDto: body },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error submitting process definition start form');
  }

  @Put(':id/suspended')
  suspended(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() options: { suspended: boolean; includeProcessInstances: boolean },
  ) {
    return this.safeApiCall(async () => {
      const response = await this.processDefinitionApi.updateProcessDefinitionSuspensionStateById(
        { id, processDefinitionSuspensionStateDto: options },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error updating process definition suspension state');
  }

  @Delete(':id')
  deleteDefinition(
    @Req() req: Request,
    @Param('id') id: string,
    @Query('cascade', ParseBoolPipe) cascade: boolean,
    @Query('skipCustomListeners', ParseBoolPipe) skipCustomListeners: boolean,
    @Query('skipIoMappings', ParseBoolPipe) skipIoMappings: boolean,
  ) {
    return this.safeApiCall(async () => {
      const response = await this.processDefinitionApi.deleteProcessDefinition(
        { id, cascade, skipCustomListeners, skipIoMappings },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error deleting process definition');
  }

  @Get(':processDefinitionId/diagram')
  getProcessDefinitionDiagram(@Req() req: Request, @Param('processDefinitionId') id: string) {
    return this.safeApiCall(async () => {
      const response = await this.processDefinitionApi.getProcessDefinitionBpmn20Xml(
        { id },
        await this.createAxiosOptions(req),
      );
      const processDefinitionDiagram = {} as ProcessDefinitionDiagram;
      processDefinitionDiagram.name = '';
      processDefinitionDiagram.definitionId = id;
      processDefinitionDiagram.xml = response.data.bpmn20Xml ?? '';
      return processDefinitionDiagram;
    }, 'Error getting process definition diagram');
  }

  @Get(':processDefinitionId/diagram/xml')
  getProcessDefinitionDiagramXML(@Req() req: Request, @Param('processDefinitionId') id: string) {
    return this.safeApiCall(async () => {
      const response = await this.processDefinitionApi.getProcessDefinitionBpmn20Xml(
        { id },
        await this.createAxiosOptions(req),
      );
      return response.data.bpmn20Xml ?? '';
    }, 'Error getting process definition diagram XML');
  }

  @Get(':processDefinitionId/statistics')
  getProcessDefinitionStatistics(@Req() req: Request, @Param('processDefinitionId') id: string) {
    return this.safeApiCall(async () => {
      const response = await this.processDefinitionApi.getActivityStatistics(
        { id, incidents: true },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error getting process definition statistics');
  }

  @Post('called-process-definitions')
  async getCalledProcessDefinitions(@Req() req: Request, @Body() request: { filter: CalledProcessDefinitionFilter }) {
    const activityId = request.filter.activityId;
    let staticCalledProcessDefinitions = (await this.safeApiCall(async () => {
      const response = await this.processDefinitionApi.getStaticCalledProcessDefinitions(
        { id: request.filter.processDefinitionId },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error  getting static called process definitions')) as StaticCalledProcessDefinition[];

    if (activityId !== undefined) {
      staticCalledProcessDefinitions = staticCalledProcessDefinitions.filter((staticCalledProcessDefinition) =>
        staticCalledProcessDefinition.calledFromActivityIds.includes(activityId),
      );
    }
    const activityInstanceHistory = await this.safeApiCall(async () => {
      const response = await this.historicActivityInstanceApi.getHistoricActivityInstances(
        request.filter as HistoricActivityInstanceApiGetHistoricActivityInstancesRequest,
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error getting activity instance history');
    return [staticCalledProcessDefinitions, activityInstanceHistory];
  }

  @Get(':processDefinitionId/history')
  async getProcessDefinitionHistory(
    @Req() req: Request,
    @Param('processDefinitionId') id: string,
    @Query('activeOnly', ParseBoolPipe) activeOnly: boolean,
    @Query('startedAfter') startedAfter?: string,
  ): Promise<ActivityInstanceHistory[]> {
    const opts = await this.createAxiosOptions(req);
    const shouldCache = !activeOnly;
    const cacheKey = shouldCache
      ? (() => {
          const baseKey = `pd-history:${id}`;
          return startedAfter ? `${baseKey}:${startedAfter}` : baseKey;
        })()
      : '';

    const activityInstanceHistory = await (shouldCache
      ? this.withProcessDefinitionHistoryCache(cacheKey, () => this.fetchHistory(id, activeOnly, opts, startedAfter))
      : this.fetchHistory(id, activeOnly, opts, startedAfter));

    return activityInstanceHistory as ActivityInstanceHistory[];
  }

  private fetchHistory(processDefinitionId: string, unfinished: boolean, opts: any, startedAfter?: string) {
    return this.fetchAll(
      () =>
        this.historicActivityInstanceApi
          .getHistoricActivityInstancesCount({ processDefinitionId, unfinished, startedAfter }, opts)
          .then((res) => res.data.count ?? 0),
      (firstResult, maxResults) =>
        this.safeApiCall(
          () =>
            this.historicActivityInstanceApi
              .getHistoricActivityInstances(
                { processDefinitionId, unfinished, firstResult, maxResults, startedAfter },
                opts,
              )
              .then((res) => res.data),
          'Error getting historic activity instances',
        ),
    );
  }

  private withProcessDefinitionHistoryCache<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const cache = getCache('processDefinitionHistory');
    return withCache(cache, key, loader);
  }

  private transformProcessDefinitionFilterToApiParams(
    filter: ProcessDefinitionFilter,
  ): ProcessDefinitionApiGetProcessDefinitionsRequest {
    const { processDefinitionIdIn, keysIn, tenantIdIn, ...otherFilters } = filter;

    return {
      ...otherFilters,
      ...(processDefinitionIdIn &&
        Array.isArray(processDefinitionIdIn) && { processDefinitionIdIn: processDefinitionIdIn.join(',') }),
      ...(keysIn && Array.isArray(keysIn) && { keysIn: keysIn.join(',') }),
      ...(tenantIdIn && Array.isArray(tenantIdIn) && { tenantIdIn: tenantIdIn.join(',') }),
    } as ProcessDefinitionApiGetProcessDefinitionsRequest;
  }
}
