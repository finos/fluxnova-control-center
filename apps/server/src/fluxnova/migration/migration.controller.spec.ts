import { MigrationPlan } from '@fxn/types';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MigrationController } from './migration.controller';

describe('MigrationController', () => {
  let controller: MigrationController;

  const migrationRequest = {
    migrationPlan: {
      sourceProcessDefinitionId: 'source',
      targetProcessDefinitionId: 'target',
      updateEventTriggers: false,
    },
    skipCustomListeners: true,
    skipIoMappings: true,
    processInstanceIds: ['instance-1', 'instance-2'],
  };

  const generatedMigrationPlan: MigrationPlan = {
    ...migrationRequest.migrationPlan,
  };

  const mockHttpService = {};

  const mockConfigService = {
    get: vi.fn(),
  };

  const mockMigrationApi = {
    generateMigrationPlan: vi.fn().mockResolvedValue({ data: generatedMigrationPlan }),
    executeMigrationPlanAsync: vi.fn().mockResolvedValue({ data: { id: 'batch-id' } }),
  };

  const mockRequest = {
    user: { id: 'test-user' },
    headers: {},
  } as unknown as Request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MigrationController],
      providers: [
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<MigrationController>(MigrationController);

    (controller as any).api = mockMigrationApi;
    vi.spyOn(controller as any, 'createAxiosOptions').mockReturnValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('given a source, target, and list of instances, generates AND executes migration of those instances', async () => {
    const result = await controller.executeMigrationPlan(mockRequest, migrationRequest);

    expect(mockMigrationApi.generateMigrationPlan).toHaveBeenCalledWith(
      { migrationPlanGenerationDto: migrationRequest.migrationPlan },
      {},
    );

    expect(mockMigrationApi.executeMigrationPlanAsync).toHaveBeenCalledWith(
      {
        migrationExecutionDto: {
          ...migrationRequest,
          migrationPlan: generatedMigrationPlan,
        },
      },
      {},
    );

    expect(result).toEqual({ id: 'batch-id' });
  });
});
