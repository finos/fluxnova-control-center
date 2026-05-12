import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Incident } from '@fxn/types';
import { IncidentController } from './incident.controller';

describe('IncidentController', () => {
  let controller: IncidentController;

  const mockHttpService = {};

  const mockConfigService = {
    get: vi.fn(),
  };

  const mockHistoricIncidentApi = {
    getHistoricIncidents: vi.fn().mockResolvedValue({ data: [] }),
    getHistoricIncidentsCount: vi.fn().mockResolvedValue({ data: { count: 0 } }),
  };

  const mockRequest = {
    user: { id: 'test-user' },
    headers: {},
  } as unknown as Request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncidentController],
      providers: [
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<IncidentController>(IncidentController);

    (controller as any).api = mockHistoricIncidentApi;
    vi.spyOn(controller as any, 'createAxiosOptions').mockReturnValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return a list of incidents', async () => {
    const result: Incident[] = [
      {
        id: 'test1',
      },
    ];

    mockHistoricIncidentApi.getHistoricIncidents.mockResolvedValue({ data: result });

    const request = { filter: {}, firstResult: 1, maxResults: 50 };
    const response = await controller.getIncidentsByFilterAndPagination(mockRequest, request);

    expect(mockHistoricIncidentApi.getHistoricIncidents).toHaveBeenCalledWith(
      { ...request.filter, maxResults: request.maxResults, firstResult: request.firstResult },
      {},
    );
    expect(response).toEqual(result);
  });

  it('should delegate to the getHistoricIncidentsCount method on HistoricIncidentApi', async () => {
    const filters = { processDefinitionId: 'test-process' };
    const expectedCount = 5;

    mockHistoricIncidentApi.getHistoricIncidentsCount.mockResolvedValue({ data: { count: expectedCount } });

    const response = await controller.getIncidentsCount(mockRequest, filters);

    expect(mockHistoricIncidentApi.getHistoricIncidentsCount).toHaveBeenCalledWith(filters, {});
    expect(response).toEqual(expectedCount);
  });

  it('should return 0 when count is null or undefined', async () => {
    const filters = { processDefinitionId: 'test-process' };

    mockHistoricIncidentApi.getHistoricIncidentsCount.mockResolvedValue({ data: { count: null } });

    const response = await controller.getIncidentsCount(mockRequest, filters);

    expect(mockHistoricIncidentApi.getHistoricIncidentsCount).toHaveBeenCalledWith(filters, {});
    expect(response).toEqual(0);
  });

  it('should return 0 when count data is undefined', async () => {
    const filters = { processDefinitionId: 'test-process' };

    mockHistoricIncidentApi.getHistoricIncidentsCount.mockResolvedValue({ data: undefined });

    const response = await controller.getIncidentsCount(mockRequest, filters);

    expect(mockHistoricIncidentApi.getHistoricIncidentsCount).toHaveBeenCalledWith(filters, {});
    expect(response).toEqual(0);
  });
});
