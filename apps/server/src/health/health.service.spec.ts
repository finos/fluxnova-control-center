import { HealthDependency } from '@fxn/types';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { BaseApi } from '../common/base-api';
import { HealthService } from './health.service';

//TODO: Rewrite these in terms of open source and no explicit fluxnova references

describe('HealthService', () => {
  const mockFluxnovaApi = {
    getHealth: vi.fn(),
  } as unknown as Mocked<BaseApi>;

  const fluxnovaPassResponse: HealthDependency = {
    message: undefined,
    name: 'Fluxnova-uat',
    scope: 'external',
    status: 'pass',
  };

  const fluxnovaFailResponse: HealthDependency = {
    message: 'oh no',
    name: 'Fluxnova-uat',
    scope: 'external',
    status: 'fail',
  };

  const fluxnovaWarnResponse: HealthDependency = {
    message: 'something might be up',
    name: 'Fluxnova-uat',
    scope: 'external',
    status: 'warn',
  };

  let healthService: HealthService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ConfigService, HealthService],
    }).compile();

    healthService = moduleRef.get(HealthService);

    mockFluxnovaApi.getHealth.mockReturnValue([Promise.resolve(fluxnovaPassResponse)]);
  });

  it('gets the status of a healthy endpoint', async () => {
    const status = await healthService.getStatus(undefined, [mockFluxnovaApi]);
    expect(mockFluxnovaApi.getHealth).toHaveBeenCalled();
    expect(status.dependencies).toEqual(expect.arrayContaining([fluxnovaPassResponse]));
  });

  it('gets the status of an unhealthy endpoint', async () => {
    mockFluxnovaApi.getHealth.mockReturnValue([Promise.resolve(fluxnovaFailResponse)]);
    const status = await healthService.getStatus(undefined, [mockFluxnovaApi]);
    expect(status.dependencies).toEqual(expect.arrayContaining([fluxnovaFailResponse]));
  });

  it('should show as healthy if all pass', async () => {
    const status = await healthService.getStatus(undefined, [mockFluxnovaApi]);
    expect(status.status).toEqual('pass');
  });

  it('should show as unhealthy if any fail', async () => {
    mockFluxnovaApi.getHealth.mockReturnValue([Promise.resolve(fluxnovaFailResponse)]);
    const status = await healthService.getStatus(undefined, [mockFluxnovaApi]);
    expect(status.status).toEqual('fail');
  });

  it('should show as warn if any dependencies are warn', async () => {
    mockFluxnovaApi.getHealth.mockReturnValue([Promise.resolve(fluxnovaWarnResponse)]);
    const status = await healthService.getStatus(undefined, [mockFluxnovaApi]);
    expect(status.status).toEqual('warn');
  });

  it('sorts the dependencies by name', async () => {
    const { dependencies } = await healthService.getStatus(undefined, [mockFluxnovaApi]);
    expect(dependencies[0].name).toEqual('Fluxnova-uat');
  });

  it('should only include external dependencies when scope is "external"', async () => {
    const { dependencies } = await healthService.getStatus('external', [mockFluxnovaApi]);
    expect(dependencies).not.toContain(expect.objectContaining({ scope: 'internal' }));
    expect(dependencies.length).toBeGreaterThan(0);
  });

  it('should only include internal dependencies when scope is "internal"', async () => {
    const { dependencies } = await healthService.getStatus('internal', [mockFluxnovaApi]);
    expect(dependencies).not.toContain(expect.objectContaining({ scope: 'external' }));
    expect(dependencies).toHaveLength(0);
  });
});
