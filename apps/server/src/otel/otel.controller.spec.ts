import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OtelController } from './otel.controller';
import { OtelService } from './otel.service';
import type { Response } from 'express';

describe('OtelController', () => {
  let module: TestingModule;
  let controller: OtelController;

  const mockService = {
    proxyToLocalOtelAgent: vi.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [OtelController],
      providers: [{ provide: OtelService, useValue: mockService }],
    }).compile();

    controller = module.get<OtelController>(OtelController);
  });

  describe('postOtelData', () => {
    it('should call proxyToLocalOtelAgent', async () => {
      const req = {};
      const res = {};

      await controller.postOtelData(req as Request, res as Response);

      expect(mockService.proxyToLocalOtelAgent).toHaveBeenCalledWith(req, res);
    });
  });
});
