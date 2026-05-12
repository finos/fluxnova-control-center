import { beforeEach, describe, expect, it, vi } from 'vitest';
import globalAxios from 'axios';
import { DeploymentService } from './deployment.service';

const appendMock = vi.fn();
vi.mock('form-data', () => ({
  default: vi.fn().mockImplementation(function () {
    return {
      append: appendMock,
      getHeaders: () => ({ 'content-type': 'multipart/form-data' }),
    };
  }),
}));

let service: DeploymentService;

beforeEach(() => {
  service = new DeploymentService();
  vi.clearAllMocks();
  appendMock.mockClear();
});

describe('Deployment Service', () => {
  it('should create deployment with form data for single file', async () => {
    const mockResponse = { data: { id: 'deployment-1', name: 'test-deployment' } };
    vi.spyOn(globalAxios, 'request').mockResolvedValue(mockResponse);

    const testFile = {
      fileName: 'test.bpmn',
      buffer: Buffer.from('test content'),
    };

    const result = await service.createDeployment({
      deploymentName: 'test-deployment',
      deploymentSource: 'process-application',
      deployChangedOnly: true,
      data: testFile,
    });

    expect(result.data).toEqual({ id: 'deployment-1', name: 'test-deployment' });
    expect(globalAxios.request).toHaveBeenCalled();
    expect(appendMock).toHaveBeenCalledTimes(4);
    expect(appendMock).toHaveBeenCalledWith('deployment-source', 'process-application');
    expect(appendMock).toHaveBeenCalledWith('deploy-changed-only', 'true');
    expect(appendMock).toHaveBeenCalledWith('deployment-name', 'test-deployment');
    expect(appendMock).toHaveBeenCalledWith(
      'data',
      testFile.buffer,
      expect.objectContaining({
        filename: 'test.bpmn',
        contentType: 'application/octet-stream',
      }),
    );
  });

  it('should create deployment with form data for multiple files', async () => {
    const mockResponse = { data: { id: 'deployment-2', name: 'multi-file-deployment' } };
    vi.spyOn(globalAxios, 'request').mockResolvedValue(mockResponse);

    const testFiles = [
      { fileName: 'process1.bpmn', buffer: Buffer.from('process 1') },
      { fileName: 'process2.bpmn', buffer: Buffer.from('process 2'), mimeType: 'text/plain' },
    ];

    const result = await service.createDeployment({
      tenantId: 'tenant-1',
      enableDuplicateFiltering: false,
      deploymentName: 'multi-file-deployment',
      deploymentActivationTime: '2026-02-10T12:00:00.000Z',
      data: testFiles,
    });

    expect(result.data).toEqual({ id: 'deployment-2', name: 'multi-file-deployment' });
    expect(globalAxios.request).toHaveBeenCalled();
    expect(appendMock).toHaveBeenCalledTimes(6);
    expect(appendMock).toHaveBeenCalledWith('tenant-id', 'tenant-1');
    expect(appendMock).toHaveBeenCalledWith('enable-duplicate-filtering', 'false');
    expect(appendMock).toHaveBeenCalledWith('deployment-name', 'multi-file-deployment');
    expect(appendMock).toHaveBeenCalledWith('deployment-activation-time', '2026-02-10T12:00:00.000Z');
    expect(appendMock).toHaveBeenCalledWith(
      'data',
      testFiles[0].buffer,
      expect.objectContaining({
        filename: 'process1.bpmn',
        contentType: 'application/octet-stream',
      }),
    );
    expect(appendMock).toHaveBeenCalledWith(
      'data2',
      testFiles[1].buffer,
      expect.objectContaining({
        filename: 'process2.bpmn',
        contentType: 'text/plain',
      }),
    );
  });

  it('should throw an error if the API call fails', async () => {
    vi.spyOn(globalAxios, 'request').mockRejectedValue(new Error('API error'));

    const testFile = {
      fileName: 'test.bpmn',
      buffer: Buffer.from('test content'),
    };

    await expect(
      service.createDeployment({
        data: testFile,
      }),
    ).rejects.toThrow('API error');
  });
});
