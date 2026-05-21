import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'pino';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as cache from '../common/cache';
import { getMockConfigService } from '../test-support/config';
import { ApplicationRoutesController } from './application-routes.controller';

const mockPinoLogger = { level: 'info' };

describe('ApplicationRoutesController', () => {
  let controller: ApplicationRoutesController;
  const configService: ConfigService = getMockConfigService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      controllers: [ApplicationRoutesController],
      providers: [{ provide: ConfigService, useValue: configService }],
    }).compile();

    controller = module.get<ApplicationRoutesController>(ApplicationRoutesController);

    vi.spyOn(controller, 'getRootPinoLogger').mockImplementation(() => mockPinoLogger as unknown as Logger);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('PUT /log-level', () => {
    afterEach(() => {
      configService.set('FXN_LOG_LEVEL', undefined);
      mockPinoLogger.level = 'info'; // Reset to default
      vi.clearAllMocks();
    });

    it('should set the given log level', async () => {
      await expect(controller.setLogLevel({ 'log-level': 'error' })).resolves.not.toThrow();
      expect(mockPinoLogger.level).toEqual('error');
    });

    it('should not set the given log level if given an invalid level type', async () => {
      await expect(controller.setLogLevel({ 'log-level': 'bad type' })).rejects.toThrow(BadRequestException);
      expect(mockPinoLogger.level).toEqual('info');
    });
  });

  describe('GET /log-level', () => {
    it('should report the current log level', async () => {
      configService.set('FXN_LOG_LEVEL', 'info');

      const resp = await controller.getLogLevel();
      expect(resp).toEqual({ 'log-level': 'INFO' });

      await controller.setLogLevel({ 'log-level': 'error' });

      const resp2 = await controller.getLogLevel();
      expect(resp2).toEqual({ 'log-level': 'ERROR' });
    });
  });

  describe('/clear-cache', () => {
    it('should return 200 with an empty response', async () => {
      const clearAllSpy = vi.spyOn(cache, 'clearAll');
      const resp = await controller.clearCache();

      expect(clearAllSpy).toHaveBeenCalled();
      expect(resp).toEqual({ message: 'Cache cleared successfully' });
    });
  });
});
