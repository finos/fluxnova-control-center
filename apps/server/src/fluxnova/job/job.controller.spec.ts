import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Job } from '@fxn/types';
import { JobController } from './job.controller';

const mockedJobResponse: Job = {
  id: '123',
};

describe('JobController', () => {
  let controller: JobController;

  const mockHttpService = {};

  const mockConfigService = {
    get: vi.fn(),
  };

  const mockJobApi = {
    getJobs: vi.fn().mockResolvedValue({ data: [mockedJobResponse] }),
    getJobsCount: vi.fn().mockResolvedValue({ data: { count: 1 } }),
    setJobRetries: vi.fn().mockResolvedValue({ data: null }),
    updateJobSuspensionState: vi.fn().mockResolvedValue({ data: null }),
    deleteJob: vi.fn().mockResolvedValue({ data: null }),
    setJobRetriesAsyncOperation: vi.fn().mockResolvedValue({ data: { id: '124q5', type: 'set-job-retries' } }),
    getStacktrace: vi.fn().mockResolvedValue({ data: 'stacktrace' }),
    recalculateDuedate: vi.fn().mockResolvedValue({ data: null }),
    setJobDuedate: vi.fn().mockResolvedValue({ data: null }),
  };

  const mockHistoricJobLogApi = {
    getHistoricJobLogs: vi.fn().mockResolvedValue({ data: [] }),
    getHistoricJobLogsCount: vi.fn().mockResolvedValue({ data: { count: 0 } }),
  };

  const mockJobDefinitionApi = {
    getJobDefinitionsCount: vi.fn().mockResolvedValue({ data: { count: 1 } }),
    getJobDefinitions: vi.fn().mockResolvedValue({ data: [{ id: 'jobDefId', processDefinitionId: 'processDefId' }] }),
    setJobRetriesJobDefinition: vi.fn().mockResolvedValue({ data: null }),
    updateSuspensionStateJobDefinition: vi.fn().mockResolvedValue({ data: null }),
    setJobPriorityJobDefinition: vi.fn().mockResolvedValue({ data: null }),
  };

  const mockRequest = {
    user: { id: 'test-user' },
    headers: {},
  } as any as Request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobController],
      providers: [
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<JobController>(JobController);

    (controller as any).jobApi = mockJobApi;
    (controller as any).historicJobLogApi = mockHistoricJobLogApi;
    (controller as any).jobDefinitionApi = mockJobDefinitionApi;
    vi.spyOn(controller as any, 'createAxiosOptions').mockReturnValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get the jobs list by filter and pagination', async () => {
    const result = await controller.getJobsWithFilterBody(mockRequest, {
      filter: {},
      firstResult: 1,
      maxResults: 50,
    });

    expect(mockJobApi.getJobs).toHaveBeenCalledWith({ firstResult: 1, maxResults: 50 }, {});
    expect(result).toEqual([mockedJobResponse]);
  });

  it('should get the jobs list count by filter', async () => {
    const result = await controller.getJobsCount(mockRequest, {});

    expect(mockJobApi.getJobsCount).toHaveBeenCalledWith({}, {});
    expect(result).toEqual(1);
  });

  it('should get the jobs definition count by filter', async () => {
    const result = await controller.getJobDefinitionsCount(mockRequest, { jobDefinitionId: 'asdf' });

    expect(mockJobDefinitionApi.getJobDefinitionsCount).toHaveBeenCalledWith({ jobDefinitionId: 'asdf' }, {});
    expect(result).toEqual(1);
  });

  it('should get job definitions by filter', async () => {
    const result = await controller.getJobsDefinitionsWithFilterBody(mockRequest, {
      filter: { processDefinitionId: 'processDefId' },
      firstResult: 0,
      maxResults: 50,
    });

    expect(mockJobDefinitionApi.getJobDefinitions).toHaveBeenCalledWith(
      { processDefinitionId: 'processDefId', maxResults: 50, firstResult: 0 },
      {},
    );
    expect(result).toEqual([{ id: 'jobDefId', processDefinitionId: 'processDefId' }]);
  });

  it('should get job logs with filter', async () => {
    await controller.getJobLogsWithFilter(mockRequest, {});

    expect(mockHistoricJobLogApi.getHistoricJobLogs).toHaveBeenCalledWith({}, {});
  });

  it('should get job log count with filter', async () => {
    await controller.getJobLogCountWithFilter(mockRequest, {});

    expect(mockHistoricJobLogApi.getHistoricJobLogsCount).toHaveBeenCalledWith({}, {});
  });

  it('should update job definition retries', async () => {
    await controller.updateJobDefinitionRetries(mockRequest, 'jobDef1', { retries: 7 });

    expect(mockJobDefinitionApi.setJobRetriesJobDefinition).toHaveBeenCalledWith(
      { id: 'jobDef1', retriesDto: { retries: 7 } },
      {},
    );
  });

  it('should update job retries', async () => {
    await controller.updateJobRetries(mockRequest, 'job1', { dueDate: '2023-01-01', retries: 7 });

    expect(mockJobApi.setJobRetries).toHaveBeenCalledWith(
      { id: 'job1', jobRetriesDto: { dueDate: '2023-01-01', retries: 7 } },
      {},
    );
  });

  it('should update suspend status', async () => {
    await controller.updateSuspendStatus(mockRequest, 'job1', { suspended: true });

    expect(mockJobApi.updateJobSuspensionState).toHaveBeenCalledWith(
      { id: 'job1', suspensionStateDto: { suspended: true } },
      {},
    );
  });

  it('should update definition suspend status', async () => {
    await controller.updateDefinitionSuspendStatus(mockRequest, 'jobDefinition1', {
      suspended: true,
      includeJobs: true,
      executionDate: 'fake date',
    });

    expect(mockJobDefinitionApi.updateSuspensionStateJobDefinition).toHaveBeenCalledWith(
      {
        id: 'jobDefinition1',
        jobDefinitionSuspensionStateDto: {
          suspended: true,
          includeJobs: true,
          executionDate: 'fake date',
        },
      },
      {},
    );
  });

  it('should delete job', async () => {
    await controller.deleteJob(mockRequest, 'job1');

    expect(mockJobApi.deleteJob).toHaveBeenCalledWith({ id: 'job1' }, {});
  });

  it('should bulk update job retries', async () => {
    const jobIds = ['job1', 'job2', 'job3'];
    const result = await controller.bulkUpdateJobRetries(mockRequest, { jobIds, retries: 7 });

    expect(mockJobApi.setJobRetriesAsyncOperation).toHaveBeenCalledWith(
      { setJobRetriesDto: { jobIds, retries: 7 } },
      {},
    );
    expect(result).toEqual({ id: '124q5', type: 'set-job-retries' });
  });

  it('should get stacktrace', async () => {
    const result = await controller.getStacktrace(mockRequest, 'job1');

    expect(mockJobApi.getStacktrace).toHaveBeenCalledWith({ id: 'job1' }, {});
    expect(result).toEqual('stacktrace');
  });

  it('should recalculate due date for job', async () => {
    await controller.recalculateJobDueDate(mockRequest, 'job1', true);

    expect(mockJobApi.recalculateDuedate).toHaveBeenCalledWith({ id: 'job1', creationDateBased: true }, {});
  });

  it('should set due date for job', async () => {
    const options = { duedate: '2023-01-01', cascade: true };
    await controller.setJobDueDate(mockRequest, 'job1', options);

    expect(mockJobApi.setJobDuedate).toHaveBeenCalledWith({ id: 'job1', jobDuedateDto: options }, {});
  });

  it('should set priority for job definition', async () => {
    const options = { priority: 1, includeJobs: true };
    await controller.setJobDefinitionPriority(mockRequest, 'job1', options);

    expect(mockJobDefinitionApi.setJobPriorityJobDefinition).toHaveBeenCalledWith(
      { id: 'job1', jobDefinitionPriorityDto: options },
      {},
    );
  });

  it('should return 0 when jobs count is null or undefined', async () => {
    mockJobApi.getJobsCount.mockResolvedValue({ data: { count: null } });

    const result = await controller.getJobsCount(mockRequest, {});

    expect(result).toEqual(0);
  });

  it('should return 0 when job definitions count is null or undefined', async () => {
    mockJobDefinitionApi.getJobDefinitionsCount.mockResolvedValue({ data: { count: null } });

    const result = await controller.getJobDefinitionsCount(mockRequest, {});

    expect(result).toEqual(0);
  });
});
