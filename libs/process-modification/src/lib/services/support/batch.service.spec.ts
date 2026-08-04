import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { BatchService } from './batch.service';

describe('Batch Service', () => {
  let service: BatchService;
  const mockHttp = {
    get: vi.fn(() => of({})),
    delete: vi.fn(() => of({})),
    put: vi.fn(() => of({})),
  } as unknown as Mocked<HttpClient>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BatchService, { provide: HttpClient, useValue: mockHttp }],
    });

    service = TestBed.inject(BatchService);
  });

  it('should call the batch/statistics service with the correct batchId and return an Observable', async () => {
    const batchId = 'abc-123-456';
    const result = service.getBatchStatistics(batchId);

    expect(mockHttp.get).toHaveBeenCalledWith(`api/batch/statistics?batchId=${batchId}`);
    expect(result).toBeTruthy();
  });

  it('calls delete historic endpoint for multiple ids', () => {
    service.deleteMultipleHistoric(['id1', 'id2']).subscribe();
    expect(mockHttp.delete).toHaveBeenCalledWith(`api/history/batch/id1`);
    expect(mockHttp.delete).toHaveBeenCalledWith(`api/history/batch/id2`);
  });

  it('calls delete endpoint for multiple ids', () => {
    service.deleteMultiple(['id1', 'id2'], true).subscribe();
    expect(mockHttp.delete).toHaveBeenCalledWith(`api/batch/id1`, { params: { cascade: true } });
    expect(mockHttp.delete).toHaveBeenCalledWith(`api/batch/id2`, { params: { cascade: true } });
  });

  it('calls suspend endpoint for multiple ids', () => {
    service.suspendMultiple(['id1', 'id2'], true).subscribe();
    expect(mockHttp.put).toHaveBeenCalledWith('api/batch/id1/suspended', { suspended: true });
    expect(mockHttp.put).toHaveBeenCalledWith('api/batch/id2/suspended', { suspended: true });
  });
});
