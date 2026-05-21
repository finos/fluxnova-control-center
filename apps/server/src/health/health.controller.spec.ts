import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HealthCheck, livenessCheck } from '@fxn/types';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  const res: Partial<Response> = {
    setHeader: vi.fn(),
    send: vi.fn(),
    status: vi.fn().mockReturnValue({ send: vi.fn() }),
  };

  let healthService: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [ConfigService, HealthService],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthService = module.get<HealthService>(HealthService);

    vi.spyOn(healthService, 'getStatus').mockImplementation(vi.fn());

    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('/liveness', () => {
    beforeEach(() => {
      livenessCheck.ready = false;
    });

    it('should return 500 when livenessCheck is not ready', async () => {
      await expect(controller.getLiveness(res as Response)).rejects.toThrow(InternalServerErrorException);
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
    });

    it('should return 200 when livenessCheck is ready', async () => {
      livenessCheck.ready = true;

      const response = await controller.getLiveness(res as Response);

      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(response).toEqual({});
    });
  });

  describe('/health', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return 200 for "pass" health status', async () => {
      vi.mocked(healthService.getStatus).mockResolvedValue(<HealthCheck>{ status: 'pass' });

      const resp = await controller.getHealth(res as Response);

      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(resp).toEqual(<HealthCheck>{ status: 'pass' });
    });

    it('should return 200 for "warn" health status', async () => {
      vi.mocked(healthService.getStatus).mockResolvedValue(<HealthCheck>{ status: 'warn' });

      const resp = await controller.getHealth(res as Response);

      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(resp).toEqual(<HealthCheck>{ status: 'warn' });
    });

    it('should return 500 for "fail" health status', async () => {
      vi.mocked(healthService.getStatus).mockResolvedValue(<HealthCheck>{ status: 'fail' });

      try {
        await controller.getHealth(res as Response);
      } catch (error: any) {
        expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
        expect(error).toBeInstanceOf(InternalServerErrorException);
        expect(error.response).toEqual(<HealthCheck>{ status: 'fail' });
      }
    });

    it('should handle unexpected health statuses', async () => {
      vi.mocked(healthService.getStatus).mockResolvedValue(<HealthCheck>{ status: 'unknown' });

      try {
        await controller.getHealth(res as Response);
      } catch (error: any) {
        expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
        expect(error).toBeInstanceOf(InternalServerErrorException);
        expect(error.response).toEqual(<HealthCheck>{ status: 'unknown' });
      }
    });
  });
});
