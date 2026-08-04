import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { DecisionRequirementsDefinitionService } from './decision-requirements-definition';
import { PaginatedDataRequest } from './types/paginated-data-request';
import { DecisionInstanceService } from './decision-instance.service';

describe('The Decision requirements definition service', () => {
  const mockHttp = {
    get: vi.fn(() => ({
      pipe: vi.fn(),
    })),
  } as any;

  let service: DecisionRequirementsDefinitionService;

  beforeAll(() => {
    TestBed.configureTestingModule({
      providers: [DecisionInstanceService, { provide: HttpClient, useValue: mockHttp }],
    });

    service = TestBed.inject(DecisionRequirementsDefinitionService);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call the list endpoint with the specified params', () => {
    const params = new PaginatedDataRequest({ deploymentId: '123', resourceName: 'a name' });
    service.getDecisionRequirementsDefinitionList(params);

    expect(mockHttp.get).toHaveBeenCalledWith('api/decision-requirements-definition', expect.any(Object));

    const expectedParams = {
      deploymentId: ['123'],
      resourceName: ['a name'],
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
});
