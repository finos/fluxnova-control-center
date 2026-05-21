import { ToastService } from '@fxn/common';
import { firstValueFrom, of, throwError } from 'rxjs';
import { defaultPageSize } from '@fxn/grid';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { JobService } from './job.service';
import { PaginatedDataRequest } from './types/paginated-data-request';
import { BatchService } from './support/batch.service';

describe('JobService', () => {
  let jobService: JobService;
  const mockHttp = {
    get: vi.fn(() => of({})),
    post: vi.fn(() => of({})),
    put: vi.fn(() => of({})),
    delete: vi.fn(() => of({})),
  };

  const mockToastService = {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  };

  const mockBatch = {
    getBatchStatistics: vi.fn().mockReturnValue(of({})),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        JobService,
        { provide: ToastService, useValue: mockToastService },
        { provide: BatchService, useValue: mockBatch },
        { provide: HttpClient, useValue: mockHttp },
      ],
    });
    jobService = TestBed.inject(JobService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should send http post call to /jobs/count', () => {
    const filters = { jobId: 'job123' };
    jobService.getJobCountByFilter(filters);
    expect(mockHttp.post).toHaveBeenCalledWith('api/jobs/count', filters);
  });

  it('should send http post call to /jobs', () => {
    const filter = { jobId: 'job123' };
    const req = new PaginatedDataRequest(filter, 100, 50);
    jobService.getJobsByFilter(req);
    expect(mockHttp.post).toHaveBeenCalledWith('api/jobs', {
      filter,
      firstResult: 50,
      maxResults: 100,
    });
  });

  it('should set the defaults correctly in getJobsByFilter', () => {
    const filter = { jobId: 'job123' };
    const req = new PaginatedDataRequest(filter);
    jobService.getJobsByFilter(req);
    expect(mockHttp.post).toHaveBeenCalledWith('api/jobs', {
      filter,
      firstResult: 0,
      maxResults: defaultPageSize,
    });
  });

  it('should send http post call to /jobs/job-definitions/count', () => {
    const filters = { jobDefinitionId: 'job123' };
    jobService.getJobDefinitionsCountByFilter(filters);
    expect(mockHttp.post).toHaveBeenCalledWith('api/jobs/job-definitions/count', filters);
  });

  it('should send http post call to /jobs/job-definitions', () => {
    const filter = { jobDefinitionId: 'job123' };
    const req = new PaginatedDataRequest(filter, 100, 50);
    jobService.getJobDefinitionsByFilter(req);
    expect(mockHttp.post).toHaveBeenCalledWith('api/jobs/job-definitions', req);
  });

  it('should send http put call to /jobs/id/suspended', () => {
    jobService.updateSuspendStatus('job123', { suspended: true });
    expect(mockHttp.put).toHaveBeenCalledWith('api/jobs/job123/suspended', { suspended: true });
  });

  it('should send http put call to /job-definition/id/suspended', () => {
    jobService.updateDefinitionSuspendStatus('jobDefinition123', {
      suspended: true,
      includeJobs: true,
      executionDate: 'fake date',
    });
    expect(mockHttp.put).toHaveBeenCalledWith('api/job-definition/jobDefinition123/suspended', {
      suspended: true,
      includeJobs: true,
      executionDate: 'fake date',
    });
  });

  it('should send http delete call to /jobs/id', () => {
    jobService.deleteJob('job123');
    expect(mockHttp.delete).toHaveBeenCalledWith('api/jobs/job123');
  });

  it('should call update for single job', () => {
    const jobIds = ['job1'];
    jobService.updateJobRetries('test-tenant-id', jobIds, 5);
    expect(mockHttp.put).toHaveBeenCalledWith('api/jobs/job1/retries', { retries: 5 });
  });

  it('deletes single job', () => {
    jobService.deleteJob('deleteId');
    expect(mockHttp.delete).toHaveBeenCalledWith(`api/jobs/deleteId`);
  });

  it('deletes multiple jobs', () => {
    jobService.deleteJobs(['deleteId1', 'deleteId2']);
    expect(mockHttp.delete).toHaveBeenCalledWith(`api/jobs/deleteId1`);
    expect(mockHttp.delete).toHaveBeenCalledWith(`api/jobs/deleteId2`);
  });

  it('retries multiple jobs', () => {
    jobService.retryJobs(['retryId1', 'retryId2']);
    expect(mockHttp.put).toHaveBeenCalledWith('api/jobs/retryId1/retries', { retries: 1 });
    expect(mockHttp.put).toHaveBeenCalledWith('api/jobs/retryId2/retries', { retries: 1 });
  });

  it('retries multiple jobs by definition', () => {
    jobService.retryJobsByDefinitions(['retryDefinition1', 'retryDefinition2']).subscribe();
    expect(mockHttp.put).toHaveBeenCalledWith('api/job-definition/retryDefinition1/retries', { retries: 1 });
    expect(mockHttp.put).toHaveBeenCalledWith('api/job-definition/retryDefinition2/retries', { retries: 1 });
  });

  it('should call update for multiple jobs', () => {
    const jobIds = ['job1', 'job2'];
    jobService.updateJobRetries('test-tenant-id', jobIds, 5);
    expect(mockHttp.post).toHaveBeenCalledWith('api/jobs/retries', {
      jobIds,
      retries: 5,
    });
  });

  it('on call to update multiple jobs, taps observable to show success toast with link to batch', () => {
    const jobIds = ['test-id-1', 'test-id-2'];
    const retries = 3;
    const dueDate = 'test-due-date';
    const postResult = { id: 'test-batch-id' };
    const tenantId = 'test-tenant-id';
    mockHttp.post.mockReturnValueOnce(of(postResult));

    const observable = jobService.updateJobRetries(tenantId, jobIds, retries, dueDate);
    observable.subscribe();

    expect(mockHttp.post).toHaveBeenCalledWith(`api/jobs/retries`, {
      jobIds,
      retries,
      dueDate,
    });
    expect(mockToastService.success).toHaveBeenCalledWith(
      expect.stringContaining(`href="${tenantId}/batches/test-batch-id"`),
      { delay: 10000 },
    );
  });

  it('should recalculate job due date', () => {
    const jobId = 'job1';
    jobService.recalculateJobDueDate(jobId, false);
    expect(mockHttp.post).toHaveBeenCalledWith('api/jobs/job1/duedate/recalculate?creationDateBased=false', null);
  });

  it('should throw error from recalculateJobDueDate', async () => {
    const jobId = '123';
    const creationDateBased = true;

    mockHttp.post.mockImplementation(() => throwError(new Error('Internal Server Error')));

    const promise = firstValueFrom(jobService.recalculateJobDueDate(jobId, creationDateBased));
    await expect(promise).rejects.toThrowError();

    expect(mockHttp.post).toHaveBeenCalledWith(
      `api/jobs/${jobId}/duedate/recalculate?creationDateBased=${creationDateBased}`,
      null,
    );
  });

  it('should set job due date', () => {
    const jobId = 'job1';
    jobService.setJobDueDate(jobId, 'date', true);
    expect(mockHttp.put).toHaveBeenCalledWith('api/jobs/job1/duedate', { duedate: 'date', cascade: true });
  });

  it('should throw error from setJobDueDate', async () => {
    const jobId = '123';

    mockHttp.put.mockImplementation(() => throwError(new Error('Internal Server Error')));

    const promise = firstValueFrom(jobService.setJobDueDate(jobId, 'date', true));
    await expect(promise).rejects.toThrowError();

    expect(mockHttp.put).toHaveBeenCalledWith(`api/jobs/${jobId}/duedate`, { duedate: 'date', cascade: true });
  });

  it('should set job definition priority', () => {
    const jobDefinitionId = 'jobDef1';
    jobService.setJobDefinitionPriority(jobDefinitionId, 1, false);
    expect(mockHttp.put).toHaveBeenCalledWith('api/job-definition/jobDef1/jobPriority', {
      priority: 1,
      includeJobs: false,
    });
  });

  it('should throw error from setJobDefinitionPriority', async () => {
    const jobDefinitionId = 'jobDef1';

    mockHttp.put.mockImplementation(() => throwError(new Error('Internal Server Error')));

    const promise = firstValueFrom(jobService.setJobDefinitionPriority(jobDefinitionId, 1, false));
    await expect(promise).rejects.toThrowError();

    expect(mockHttp.put).toHaveBeenCalledWith(`api/job-definition/${jobDefinitionId}/jobPriority`, {
      priority: 1,
      includeJobs: false,
    });
  });
});
