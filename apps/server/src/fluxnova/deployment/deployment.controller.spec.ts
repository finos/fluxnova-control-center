import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { DeploymentController } from './deployment.controller';
import type { Response } from 'express';

describe('DeploymentController', () => {
  let controller: DeploymentController;

  const mockHttpService = {};

  const mockConfigService = {
    get: vi.fn(),
  };

  const mockDeploymentApi = {
    getDeployments: vi.fn().mockResolvedValue({ data: [] }),
    getDeploymentsCount: vi.fn().mockResolvedValue({ data: { count: 0 } }),
    getDeploymentResources: vi.fn().mockResolvedValue({ data: [] }),
    getDeployment: vi.fn().mockResolvedValue({ data: {} }),
    getDeploymentResourceData: vi.fn().mockResolvedValue({ data: Buffer.from('test data') }),
    deleteDeployment: vi.fn().mockResolvedValue({ data: null }),
    createDeployment: vi.fn().mockResolvedValue({ data: { id: 'deployment-1' } }),
  };

  const mockRequest = {
    user: { id: 'test-user' },
    headers: {},
  } as unknown as Request;

  const mockResponse = {
    set: vi.fn(),
    send: vi.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeploymentController],
      providers: [
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<DeploymentController>(DeploymentController);

    (controller as any).api = mockDeploymentApi;
    vi.spyOn(controller as any, 'createAxiosOptions').mockReturnValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate to the getDeployments method on DeploymentApi', async () => {
    const params = { id: 'test-deployment' };
    await controller.getDeployments(mockRequest, params);

    expect(mockDeploymentApi.getDeployments).toHaveBeenCalledWith(params, {});
  });

  it('should delegate to the getDeploymentsCount method on DeploymentApi', async () => {
    const params = { id: 'test-deployment' };
    await controller.getDeploymentCount(mockRequest, params);

    expect(mockDeploymentApi.getDeploymentsCount).toHaveBeenCalledWith(params, {});
  });

  it('should delegate to the getDeploymentResources method on DeploymentApi', async () => {
    await controller.getDeploymentResources(mockRequest, 'abc-123-456');

    expect(mockDeploymentApi.getDeploymentResources).toHaveBeenCalledWith({ id: 'abc-123-456' }, {});
  });

  it('should delegate to the getDeployment method on DeploymentApi', async () => {
    await controller.getDeploymentDetail(mockRequest, 'abc-123-456');

    expect(mockDeploymentApi.getDeployment).toHaveBeenCalledWith({ id: 'abc-123-456' }, {});
  });

  it('should delegate to the getDeploymentResourceData method on DeploymentApi', async () => {
    const deploymentId = 'abc-123-456';
    const resourceId = 'bcd-234-345';

    await controller.getResourceData(mockRequest, deploymentId, resourceId, mockResponse);

    expect(mockDeploymentApi.getDeploymentResourceData).toHaveBeenCalledWith({ id: deploymentId, resourceId }, {});
    expect(mockResponse.set).toHaveBeenCalledWith({
      'Content-Type': 'application/octet-stream',
    });
    expect(mockResponse.send).toHaveBeenCalledWith(Buffer.from('test data'));
  });

  it('should delegate to the deleteDeployment method on DeploymentApi', async () => {
    const deploymentId = 'abc-123-456';
    await controller.deleteDeployment(mockRequest, deploymentId, false, true, true);

    expect(mockDeploymentApi.deleteDeployment).toHaveBeenCalledWith(
      {
        id: deploymentId,
        cascade: false,
        skipCustomListeners: true,
        skipIoMappings: true,
      },
      {},
    );
  });

  it('should reject createDeployment when no files are provided', async () => {
    await expect(
      controller.createDeployment(mockRequest, [], {
        deploymentSource: 'source',
        deploymentName: 'name',
        deployChangedOnly: true,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(mockDeploymentApi.createDeployment).not.toHaveBeenCalled();
  });

  it('should delegate to createDeployment method DeploymentApi', async () => {
    const files = [
      {
        fieldname: 'file',
        originalname: 'diagram.bpmn',
        buffer: Buffer.from('diagram'),
        mimetype: 'application/octet-stream',
      },
    ];

    await controller.createDeployment(mockRequest, files, {
      deploymentSource: 'process-application',
      deploymentName: 'my-deployment',
      deployChangedOnly: 'false',
      enableDuplicateFiltering: 'true',
    });

    expect(mockDeploymentApi.createDeployment).toHaveBeenCalledWith(
      {
        deploymentSource: 'process-application',
        deploymentName: 'my-deployment',
        deployChangedOnly: 'false',
        enableDuplicateFiltering: 'true',
        data: [
          {
            fieldName: 'file',
            fileName: 'diagram.bpmn',
            buffer: Buffer.from('diagram'),
            mimeType: 'application/octet-stream',
          },
        ],
      },
      {},
    );
  });
});
