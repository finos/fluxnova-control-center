import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DecisionDefinitionController } from './decision-definition.controller';

describe('DecisionDefinitionController', () => {
  let controller: DecisionDefinitionController;

  const mockHttpService = {};

  const mockConfigService = {
    get: vi.fn(),
  };

  const mockDecisionDefinitionApi = {
    getDecisionDefinitions: vi.fn().mockResolvedValue({ data: [] }),
    getDecisionDefinitionsCount: vi.fn().mockResolvedValue({ data: { count: 0 } }),
    getDecisionDefinitionById: vi.fn().mockResolvedValue({ data: {} }),
    getDecisionDefinitionDmnXmlById: vi.fn().mockResolvedValue({ data: '<xml></xml>' }),
    evaluateDecisionById: vi.fn().mockResolvedValue({ data: [] }),
  };

  const mockRequest = {
    user: { id: 'test-user' },
    headers: {},
  } as unknown as Request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DecisionDefinitionController],
      providers: [
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<DecisionDefinitionController>(DecisionDefinitionController);

    (controller as any).api = mockDecisionDefinitionApi;
    vi.spyOn(controller as any, 'createAxiosOptions').mockReturnValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate to the getDecisionDefinitions method on DecisionDefinitionApi', async () => {
    const params = { keyLike: '%foo%' };
    await controller.getDecisionDefinitionList(mockRequest, params);

    expect(mockDecisionDefinitionApi.getDecisionDefinitions).toHaveBeenCalledWith(params, {});
  });

  it('should delegate to the getDecisionDefinitionsCount method on DecisionDefinitionApi', async () => {
    const params = { keyLike: '%foo%' };
    await controller.getDecisionDefinitionCount(mockRequest, params);

    expect(mockDecisionDefinitionApi.getDecisionDefinitionsCount).toHaveBeenCalledWith(params, {});
  });

  it('should delegate to the getDecisionDefinitionById method on DecisionDefinitionApi', async () => {
    await controller.getDecisionDefinitionDetail(mockRequest, '123');

    expect(mockDecisionDefinitionApi.getDecisionDefinitionById).toHaveBeenCalledWith({ id: '123' }, {});
  });

  it('should delegate to the getDecisionDefinitionDmnXmlById method on DecisionDefinitionApi', async () => {
    await controller.getDecisionDefinitionDiagram(mockRequest, '123');

    expect(mockDecisionDefinitionApi.getDecisionDefinitionDmnXmlById).toHaveBeenCalledWith({ id: '123' }, {});
  });

  it('should delegate to the evaluateDecisionById method on DecisionDefinitionApi', async () => {
    const body = {
      variables: {
        foo: {
          value: 'bar',
          type: 'String',
          valueInfo: {},
        },
      },
    };
    await controller.evaluateDecisionDefinition(mockRequest, '123', body);

    expect(mockDecisionDefinitionApi.evaluateDecisionById).toHaveBeenCalledWith(
      { id: '123', evaluateDecisionDto: body },
      {},
    );
  });
});
