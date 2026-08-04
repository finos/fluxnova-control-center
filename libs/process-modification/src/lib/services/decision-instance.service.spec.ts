import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { DecisionInstanceService } from './decision-instance.service';
import { PaginatedDataRequest } from './types/paginated-data-request';

describe('decision instance service', () => {
  const mockHttp = {
    get: vi.fn(() => ({
      pipe: vi.fn(),
    })),
  } as any;

  let service: DecisionInstanceService;

  beforeAll(() => {
    TestBed.configureTestingModule({
      providers: [DecisionInstanceService, { provide: HttpClient, useValue: mockHttp }],
    });

    service = TestBed.inject(DecisionInstanceService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should call the list endpoint with the specified params', () => {
    const params = { decisionDefinitionId: 'aDecisionDefinitionId' };
    const req = new PaginatedDataRequest(params);
    service.getDecisionInstanceList(req);

    expect(mockHttp.get).toHaveBeenCalledWith('api/decision-instances', expect.any(Object));

    const expectedParams = {
      decisionDefinitionId: ['aDecisionDefinitionId'],
      maxResults: ['50'],
      firstResult: ['0'],
    };

    const receivedParams = {} as any;
    const httpParams = mockHttp.get.mock.calls[0][1].params;
    httpParams.keys().forEach((key: string) => {
      receivedParams[key] = httpParams.getAll(key);
    });

    expect(receivedParams).toEqual(expectedParams);
  });

  it('should have sorting information if there was sorting information provided', () => {
    const params = {
      decisionDefinitionId: 'aDecisionDefinitionId',
      sortBy: 'evaluationTime',
      sortOrder: 'asc',
    };
    const req = new PaginatedDataRequest(params);

    service.getDecisionInstanceList(req);

    expect(mockHttp.get).toHaveBeenCalledWith('api/decision-instances', expect.any(Object));

    const expectedParams = {
      decisionDefinitionId: ['aDecisionDefinitionId'],
      sortBy: ['evaluationTime'],
      sortOrder: ['asc'],
      maxResults: ['50'],
      firstResult: ['0'],
    };

    const receivedParams = {} as any;
    const httpParams = mockHttp.get.mock.calls[0][1].params;
    httpParams.keys().forEach((key: string) => {
      receivedParams[key] = httpParams.getAll(key);
    });

    expect(receivedParams).toEqual(expectedParams);
  });

  it('should call the diagram endpoint', () => {
    const testId = 'testId';
    const expectedUrl = `api/decision-instances/${testId}/diagram`;

    service.getDiagram(testId);

    expect(mockHttp.get).toHaveBeenCalledWith(expectedUrl);
  });

  it('should call the count endpoint', () => {
    const params = {
      filter: { processDefinitionId: { filter: 'aProcessDefinitionId' } },
    };
    service.getInstancesCount(params);

    expect(mockHttp.get).toHaveBeenCalledWith('api/decision-instances/count', {
      params: {
        filter: {
          processDefinitionId: {
            filter: 'aProcessDefinitionId',
          },
        },
      },
    });
  });
});
