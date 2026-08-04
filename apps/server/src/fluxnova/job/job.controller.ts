import { Body, Controller, Delete, Get, Logger, Param, Post, Put, Query, Req } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { FluxnovaController } from '../fluxnova-controller';
import {
  HistoricJobLogApi,
  JobApi,
  JobApiGetJobsRequest,
  JobDefinitionApi,
  JobDefinitionApiGetJobDefinitionsCountRequest,
} from '../generated';
import type { Request } from 'express';
import type { BulkJobRetriesRequest, IPaginatedDataRequest, JobDefinitionFilter, JobFilter } from '@fxn/types';

interface filtersBody {
  filter: JobFilter;
  firstResult: number;
  maxResults: number;
}

@Controller('api')
export class JobController extends FluxnovaController {
  private jobApi: JobApi;
  private historicJobLogApi: HistoricJobLogApi;
  private jobDefinitionApi: JobDefinitionApi;
  protected readonly logger = new Logger(JobController.name);

  constructor(
    protected httpService: HttpService,
    protected configService: ConfigService,
  ) {
    super(httpService, configService);
    this.jobApi = this.createApi(JobApi);
    this.historicJobLogApi = this.createApi(HistoricJobLogApi);
    this.jobDefinitionApi = this.createApi(JobDefinitionApi);
  }

  @Post('jobs')
  async getJobsWithFilterBody(@Req() req: Request, @Body() filtersAndPagination: filtersBody) {
    return this.safeApiCall(async () => {
      const apiParams = this.transformJobFilterToApiParams(filtersAndPagination.filter);
      const response = await this.jobApi.getJobs(
        { ...apiParams, firstResult: filtersAndPagination.firstResult, maxResults: filtersAndPagination.maxResults },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error getting jobs');
  }

  @Get('history/job-log')
  async getJobLogsWithFilter(@Req() req: Request, @Query() queryParams: JobFilter) {
    return this.safeApiCall(async () => {
      const apiParams = this.transformJobFilterToApiParams(queryParams);
      const response = await this.historicJobLogApi.getHistoricJobLogs(apiParams, await this.createAxiosOptions(req));
      return response.data;
    }, 'Error getting job logs');
  }

  @Get('history/job-log/count')
  async getJobLogCountWithFilter(@Req() req: Request, @Query() queryParams: JobFilter) {
    return this.safeApiCall(async () => {
      const apiParams = this.transformJobFilterToApiParams(queryParams);
      const response = await this.historicJobLogApi.getHistoricJobLogsCount(
        apiParams,
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error getting job log count');
  }

  @Post('jobs/count')
  getJobsCount(@Req() req: Request, @Body() filters: JobFilter) {
    return this.safeApiCall(async () => {
      const apiParams = this.transformJobFilterToApiParams(filters);
      const response = await this.jobApi.getJobsCount(apiParams, await this.createAxiosOptions(req));
      return response.data?.count ?? 0;
    }, 'Error getting jobs count');
  }

  @Post('jobs/job-definitions/count')
  async getJobDefinitionsCount(@Req() req: Request, @Body() filters: JobDefinitionFilter) {
    return this.safeApiCall(async () => {
      const response = await this.jobDefinitionApi.getJobDefinitionsCount(
        filters as JobDefinitionApiGetJobDefinitionsCountRequest,
        await this.createAxiosOptions(req),
      );
      return response.data?.count ?? 0;
    }, 'Error getting job definitions count');
  }

  @Post('jobs/job-definitions')
  async getJobsDefinitionsWithFilterBody(@Req() req: Request, @Body() request: IPaginatedDataRequest) {
    return this.safeApiCall(async () => {
      const response = await this.jobDefinitionApi.getJobDefinitions(
        { ...request.filter, maxResults: request.maxResults, firstResult: request.firstResult },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error getting job definitions');
  }

  @Put('job-definition/:id/retries')
  async updateJobDefinitionRetries(@Req() req: Request, @Param('id') id: string, @Body() body: { retries: number }) {
    return this.safeApiCall(async () => {
      const response = await this.jobDefinitionApi.setJobRetriesJobDefinition(
        { id, retriesDto: body },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error updating job definition retries');
  }

  @Put('job-definition/:id/suspended')
  async updateDefinitionSuspendStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() options: { suspended: boolean; includeJobs: boolean; executionDate?: string },
  ) {
    return this.safeApiCall(async () => {
      const response = await this.jobDefinitionApi.updateSuspensionStateJobDefinition(
        { id, jobDefinitionSuspensionStateDto: options },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error updating job definition suspension state');
  }

  @Put('jobs/:id/retries')
  async updateJobRetries(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() options: { dueDate: string; retries: number },
  ) {
    return this.safeApiCall(async () => {
      const response = await this.jobApi.setJobRetries(
        { id, jobRetriesDto: options },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error updating job retries');
  }

  @Put('jobs/:id/suspended')
  async updateSuspendStatus(@Req() req: Request, @Param('id') id: string, @Body() options: { suspended: boolean }) {
    return this.safeApiCall(async () => {
      const response = await this.jobApi.updateJobSuspensionState(
        { id, suspensionStateDto: options },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error updating job suspension state');
  }

  @Delete('jobs/:id')
  async deleteJob(@Req() req: Request, @Param('id') id: string) {
    return this.safeApiCall(async () => {
      const response = await this.jobApi.deleteJob({ id }, await this.createAxiosOptions(req));
      return response.data;
    }, 'Error deleting job');
  }

  @Post('jobs/retries')
  async bulkUpdateJobRetries(@Req() req: Request, @Body() retryRequest: BulkJobRetriesRequest) {
    return this.safeApiCall(async () => {
      const response = await this.jobApi.setJobRetriesAsyncOperation(
        { setJobRetriesDto: retryRequest },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error bulk updating job retries');
  }

  @Get('jobs/:id/stacktrace')
  async getStacktrace(@Req() req: Request, @Param('id') id: string) {
    return this.safeApiCall(async () => {
      const response = await this.jobApi.getStacktrace({ id }, await this.createAxiosOptions(req));
      return response.data;
    }, 'Error getting job stacktrace');
  }

  @Post('jobs/:id/duedate/recalculate')
  async recalculateJobDueDate(
    @Req() req: Request,
    @Param('id') id: string,
    @Query('creationDateBased') creationDateBased: boolean,
  ) {
    return this.safeApiCall(async () => {
      const response = await this.jobApi.recalculateDuedate(
        { id, creationDateBased },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error recalculating job due date');
  }

  @Put('jobs/:id/duedate')
  async setJobDueDate(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() options: { duedate: string; cascade: boolean },
  ) {
    return this.safeApiCall(async () => {
      const response = await this.jobApi.setJobDuedate(
        { id, jobDuedateDto: options },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error setting job due date');
  }

  @Put('job-definition/:id/jobPriority')
  async setJobDefinitionPriority(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() options: { priority: number | null; includeJobs: boolean },
  ) {
    return this.safeApiCall(async () => {
      const response = await this.jobDefinitionApi.setJobPriorityJobDefinition(
        { id, jobDefinitionPriorityDto: options },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error setting job definition priority');
  }

  private transformJobFilterToApiParams(filter: JobFilter): JobApiGetJobsRequest {
    const { jobIds, processInstanceIds, dueDates, createTimes, tenantIdIn, sorting, ...otherFilters } = filter;

    return {
      ...otherFilters,
      ...(jobIds && Array.isArray(jobIds) && { jobIds: jobIds.join(',') }),
      ...(processInstanceIds &&
        Array.isArray(processInstanceIds) && { processInstanceIds: processInstanceIds.join(',') }),
      ...(dueDates &&
        Array.isArray(dueDates) &&
        dueDates.length > 0 && {
          dueDates: dueDates.map((dueDate) => `${dueDate.operator}_${dueDate.value}`).join(','),
        }),
      ...(createTimes &&
        Array.isArray(createTimes) &&
        createTimes.length > 0 && {
          createTimes: createTimes.map((createTime) => `${createTime.operator}_${createTime.value}`).join(','),
        }),
      ...(tenantIdIn && Array.isArray(tenantIdIn) && { tenantIdIn: tenantIdIn.join(',') }),
      ...(sorting &&
        Array.isArray(sorting) &&
        sorting.length > 0 &&
        sorting[0].sortBy && {
          sortBy: sorting[0].sortBy,
          sortOrder: sorting[0].sortOrder,
        }),
    };
  }
}
