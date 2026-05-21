/* eslint-disable n/no-process-env -- Direct process.env access is being used to manipulate the configuration & is acceptable in the context of these tests. */

import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { ONE_YEAR_IN_MS } from '../common';
import { getMockConfigService } from '../test-support/config';
import { StaticAssetsController } from './static-assets.controller';
import { StaticAssetsService } from './static-assets.service';
import type { Request, Response } from 'express';

const mockResponse = {
  sendFile: vi.fn(),
  setHeader: vi.fn(),
  contentType: vi.fn(() => mockResponse),
  status: vi.fn(() => mockResponse),
  send: vi.fn(),
} as unknown as Mocked<Response>;

const mockReq = {} as Mocked<Request>;
const mockService: Mocked<StaticAssetsService> = {
  proxyToLocalAngularDevServer: vi.fn(),
} as unknown as Mocked<StaticAssetsService>;

describe('The static-asset controller', () => {
  let module: TestingModule;
  let controller: StaticAssetsController;
  let configService: ConfigService;

  beforeEach(async () => {
    configService = getMockConfigService();

    module = await Test.createTestingModule({
      controllers: [StaticAssetsController],
      providers: [
        { provide: StaticAssetsService, useValue: mockService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    controller = module.get<StaticAssetsController>(StaticAssetsController);

    // reset state
    delete process.env.container;
    delete process.env.FXN_ENV;
    delete process.env.FXN_CC_VERSION;
    process.env.NODE_ENV = 'test';

    (mockReq as any).path = undefined;
    (mockReq as any).url = undefined;

    vi.clearAllMocks();
  });

  it('should send the favicon file with correct headers', async () => {
    controller.getFavicon(mockResponse);

    expect(mockResponse.sendFile).toHaveBeenCalledWith(expect.stringContaining('assets/favicon.ico'), {
      maxAge: ONE_YEAR_IN_MS,
    });
  });

  it('should delegate to the the local angular dev server when running locally', () => {
    controller.getApp(mockReq, mockResponse);

    expect(mockService.proxyToLocalAngularDevServer).toHaveBeenCalledWith(mockReq, mockResponse);
  });

  it('should return the static index.html file when not running locally and not requesting a static asset', () => {
    process.env.container = 'docker';
    process.env.NODE_ENV = 'production';

    controller.getApp(mockReq, mockResponse);

    expect(mockResponse.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache, no-store, must-revalidate');
    expect(mockResponse.setHeader).toHaveBeenCalledWith('Pragma', 'no-cache');
    expect(mockResponse.setHeader).toHaveBeenCalledWith('Expire', 0);
    expect(mockResponse.sendFile).toHaveBeenCalledWith(expect.stringContaining('frontend/browser/index.html'));
  });

  it('should return the static asset when not running locally and requesting a static asset', () => {
    process.env.container = 'docker';
    process.env.NODE_ENV = 'production';

    (mockReq as any).path = '/assets/loader.js';
    controller.getApp(mockReq, mockResponse);

    expect(mockResponse.sendFile).toHaveBeenCalledWith(expect.stringContaining('frontend/browser/assets/loader.js'));
  });

  it('should return the configuration', () => {
    process.env.FXN_ENV = 'test';
    process.env.FXN_CC_VERSION = '12345';
    process.env.OTEL_SERVICE_NAME = 'test-service-name';
    process.env.OTEL_RESOURCE_ATTRIBUTES = 'testKey=test-value';
    process.env.FXN_OTEL_ENABLED = 'true';
    process.env.FXN_OTEL_DEBUG = 'true';
    process.env.FXN_PUBLIC_URL = 'https://fluxnova.finos.org';
    process.env.FXN_AUTH_STRATEGY = 'oidc';

    controller.getConfigJs(mockResponse);

    expect(mockResponse.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache, no-store, must-revalidate');
    expect(mockResponse.setHeader).toHaveBeenCalledWith('Pragma', 'no-cache');
    expect(mockResponse.setHeader).toHaveBeenCalledWith('Expire', 0);
    expect(mockResponse.contentType).toHaveBeenCalledWith('application/javascript');
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.send).toHaveBeenCalledWith(
      `window.fluxnovaConfig = ${JSON.stringify({
        authRequired: true,
        env: 'test',
        fxnPublicUrl: 'https://fluxnova.finos.org',
        isRunningLocally: true,
        otel: {
          serviceName: 'test-service-name',
          attributes: {
            testKey: 'test-value',
          },
          debug: true,
          enabled: true,
        },
        version: '12345',
      })}`,
    );
  });

  it('defaults service name when not set in env variable OTEL_SERVICE_NAME', () => {
    process.env.FXN_ENV = 'test';
    process.env.FXN_CC_VERSION = '12345';
    process.env.OTEL_RESOURCE_ATTRIBUTES = 'testKey=test-value';
    process.env.FXN_OTEL_ENABLED = 'true';
    process.env.FXN_OTEL_DEBUG = 'true';
    process.env.FXN_PUBLIC_URL = 'https://fluxnova.finos.org';
    process.env.FXN_AUTH_STRATEGY = 'none';
    delete process.env.OTEL_SERVICE_NAME;

    controller.getConfigJs(mockResponse);

    expect(mockResponse.send).toHaveBeenCalledWith(
      `window.fluxnovaConfig = ${JSON.stringify({
        authRequired: false,
        env: 'test',
        fxnPublicUrl: 'https://fluxnova.finos.org',
        isRunningLocally: true,
        otel: {
          serviceName: 'fluxnova',
          attributes: {
            testKey: 'test-value',
          },
          debug: true,
          enabled: true,
        },
        version: '12345',
      })}`,
    );
  });

  it('should send the loading.css file', () => {
    controller.getLoadingCss(mockResponse);

    expect(mockResponse.sendFile).toHaveBeenCalledWith(expect.stringContaining('assets/loading.css'), {
      maxAge: ONE_YEAR_IN_MS,
    });
  });

  it('should send the fluxnova-logo.svg file', () => {
    controller.getFluxnovaLogo(mockResponse);

    expect(mockResponse.sendFile).toHaveBeenCalledWith(expect.stringContaining('assets/fluxnova-logo.svg'), {
      maxAge: ONE_YEAR_IN_MS,
    });
  });

  it('should send the login.html file', () => {
    controller.getLogin(mockResponse);

    expect(mockResponse.sendFile).toHaveBeenCalledWith(expect.stringContaining('assets/login.html'), {
      maxAge: ONE_YEAR_IN_MS,
    });
  });
});
