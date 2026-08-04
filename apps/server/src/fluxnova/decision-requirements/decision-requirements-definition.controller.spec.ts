import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DecisionRequirementsDefinitionController } from './decision-requirements-definition.controller';

describe('DecisionRequirementsDefinitionController', () => {
  let controller: DecisionRequirementsDefinitionController;

  const mockHttpService = {};

  const mockConfigService = {
    get: vi.fn(),
  };

  const mockDecisionRequirementsDefinitionApi = {
    getDecisionRequirementsDefinitions: vi.fn().mockResolvedValue({ data: [] }),
  };

  const mockRequest = {
    user: { id: 'test-user' },
    headers: {},
  } as unknown as Request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DecisionRequirementsDefinitionController],
      providers: [
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<DecisionRequirementsDefinitionController>(DecisionRequirementsDefinitionController);

    (controller as any).api = mockDecisionRequirementsDefinitionApi;
    vi.spyOn(controller as any, 'createAxiosOptions').mockReturnValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate to the getDecisionRequirementsDefinitions method on DecisionRequirementsDefinitionApi', async () => {
    const params = { id: 'test-id' };
    await controller.getDecisionRequirementsDefinitionList(mockRequest, params);

    expect(mockDecisionRequirementsDefinitionApi.getDecisionRequirementsDefinitions).toHaveBeenCalledWith(params, {});
  });

  it('should handle empty params', async () => {
    await controller.getDecisionRequirementsDefinitionList(mockRequest, {});

    expect(mockDecisionRequirementsDefinitionApi.getDecisionRequirementsDefinitions).toHaveBeenCalledWith({}, {});
  });
});
