import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom, Observable, of } from 'rxjs';
import { DecisionDefinition } from '@fxn/types';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DecisionDefinitionService } from './decision-definition.service';
import { PaginatedDataRequest } from './types/paginated-data-request';

describe('decision definition service', () => {
  const mockHttp = {
    get: vi.fn(() => ({
      pipe: vi.fn(),
    })),
  } as any;

  let service: DecisionDefinitionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DecisionDefinitionService, { provide: HttpClient, useValue: mockHttp }],
    });

    service = TestBed.inject(DecisionDefinitionService);

    vi.clearAllMocks();
  });

  it.skip('should call the list endpoint with the specified params', () => {
    const params = { deploymentId: '123', resourceName: 'a name' };
    service.getDecisionDefinitionList(params);

    expect(mockHttp.get).toHaveBeenCalledWith('api/decision-definition', {
      params: new HttpParams({ fromObject: { ...params } }),
    });
  });

  it('should call the details endpoint with the specified params', () => {
    service.getDecisionDefinitionDetail('123');

    expect(mockHttp.get).toHaveBeenCalledWith('api/decision-definition/123');
  });

  it('should return related decision definitions when decisionDefinition is valid', async () => {
    const mockDecisionDefinition = { key: 'testKey', name: 'testName' } as DecisionDefinition;
    const mockRelatedDefinitions = [{ key: 'relatedKey', name: 'relatedName' }] as DecisionDefinition[];

    vi.spyOn(service, 'getDecisionDefinitionDetail').mockReturnValue(of(mockDecisionDefinition));
    vi.spyOn(service, 'getDecisionDefinitionList').mockReturnValue(of(mockRelatedDefinitions));

    const result = await firstValueFrom(service['_getRelatedDecisionDefinitionVersionList']('testId'));
    expect(result).toEqual(mockRelatedDefinitions);
  });

  it('should return an empty array when decisionDefinition is invalid', async () => {
    const mockDecisionDefinition = { key: '', name: '' } as DecisionDefinition;

    vi.spyOn(service, 'getDecisionDefinitionDetail').mockReturnValue(of(mockDecisionDefinition));

    const result = await firstValueFrom(service['_getRelatedDecisionDefinitionVersionList']('testId'));
    expect(result).toEqual([]);
  });

  it('should receive correct maxResults when fetching related decision definitions', async () => {
    const mockDecisionDefinition = { key: 'testKey', name: 'testName' } as DecisionDefinition;
    const mockRelatedDefinitions = [{ key: 'relatedKey', name: 'relatedName' }] as DecisionDefinition[];

    vi.spyOn(service, 'getDecisionDefinitionDetail').mockReturnValue(of(mockDecisionDefinition));
    vi.spyOn(service, 'getDecisionDefinitionList').mockReturnValue(of(mockRelatedDefinitions));

    const maxResults = 10;
    const result = await firstValueFrom(
      service['_getRelatedDecisionDefinitionVersionList']('testId', maxResults) as Observable<DecisionDefinition[]>,
    );

    expect(result).toEqual(mockRelatedDefinitions);
    expect(service.getDecisionDefinitionList).toHaveBeenCalledWith(
      new PaginatedDataRequest({ key: 'testKey' }, maxResults),
    );
  });
});

describe('getDecisionDefinitions', () => {
  const mockHttp2 = {
    get: vi.fn((url): Observable<any> => {
      switch (url) {
        case 'api/decision-definition':
          return of([{ name: 'foo' }]);
        case 'api/decision-definition/count':
          return of({ count: 1 });
      }
      return of({});
    }),
  } as any;

  let service: DecisionDefinitionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DecisionDefinitionService, { provide: HttpClient, useValue: mockHttp2 }],
    });

    service = TestBed.inject(DecisionDefinitionService);

    vi.clearAllMocks();
  });

  it('should return definitions and count', async () => {
    const params = { keyLike: '%foo%' };
    const req = new PaginatedDataRequest(params);
    const result = await firstValueFrom(service.getDecisionDefinitions(req));

    expect(mockHttp2.get).toHaveBeenCalledWith('api/decision-definition', expect.any(Object));
    expect(mockHttp2.get).toHaveBeenCalledWith('api/decision-definition/count', expect.any(Object));

    const expectedParams = {
      keyLike: ['%foo%'],
      maxResults: ['50'],
      firstResult: ['0'],
    };

    const receivedParams = {} as any;
    const receivedParams2 = {} as any;
    const httpParams = mockHttp2.get.mock.calls[0][1].params;
    const httpParams2 = mockHttp2.get.mock.calls[1][1].params;

    httpParams.keys().forEach((key: string) => {
      receivedParams[key] = httpParams.getAll(key);
    });
    httpParams2.keys().forEach((key: string) => {
      receivedParams2[key] = httpParams2.getAll(key);
    });

    expect(receivedParams).toEqual(expectedParams);
    expect(receivedParams2).toEqual(expectedParams);

    expect(result).toBeDefined();
    expect(result.count).toBeDefined();
    expect(result.items).toBeDefined();
  });
});
