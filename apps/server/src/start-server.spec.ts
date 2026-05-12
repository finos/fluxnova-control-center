/* eslint-disable n/no-process-env -- ConfigService is not available yet, so we must use env directly */

import { Express } from 'express';
import { readFile } from 'fs/promises';
import https from 'https';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isRunningLocally } from './common';
import { startServer } from './start-server';

vi.mock('fs/promises');
vi.mock('http');
vi.mock('https');
vi.mock('./common', () => ({
  FluxnovaError: vi.fn(),
  FLUXNOVA_PORT: 1234,
  isRunningLocally: vi.fn(),
}));

const mockIsRunningLocally = vi.mocked(isRunningLocally);
const mockReadFile = vi.mocked(readFile);
const mockHttps = vi.mocked(https);

const EIGHTY_FIVE_SECONDS = 85 * 1000;
const NINETY_SECONDS = 90 * 1000;

describe('start-server', () => {
  describe('startServer', () => {
    const mockExpress = {
      listen: vi.fn(),
    };
    const mockHttpServer = {
      on: vi.fn(),
    };
    const mockHttpsServer = {
      listen: vi.fn(),
      on: vi.fn(),
    };

    beforeEach(() => {
      mockExpress.listen.mockImplementationOnce((port, callback) => {
        setTimeout(callback, 0);
        return mockHttpServer;
      });
      mockHttpServer.on.mockReturnValueOnce(mockHttpServer);
      mockHttpsServer.listen.mockImplementationOnce((port, callback) => {
        setTimeout(callback, 0);
        return mockHttpsServer;
      });
      mockHttpsServer.on.mockReturnValueOnce(mockHttpsServer);
    });

    afterEach(() => vi.resetAllMocks());

    it('should start an http server when env variable override', async () => {
      process.env.FXN_FORCE_HTTP = 'true';

      const server = await startServer(mockExpress as unknown as Express);

      expect(mockReadFile).not.toHaveBeenCalled();
      expect(mockExpress.listen).toHaveBeenCalledWith(1234, expect.any(Function));
      expect(server).toBe(mockHttpServer);
      expect(server.keepAliveTimeout).toBe(EIGHTY_FIVE_SECONDS);
      expect(server.headersTimeout).toBe(NINETY_SECONDS);
      delete process.env.FXN_FORCE_HTTP;
    });

    it('gets the key and cert and starts an https server', async () => {
      const key = 'fluxnova.finos.local.key';
      const cert = 'fluxnova.finos.local.cert';
      mockReadFile.mockResolvedValueOnce(key).mockResolvedValueOnce(cert);
      mockIsRunningLocally.mockReturnValueOnce(true);
      mockHttps.createServer.mockReturnValueOnce(mockHttpsServer as unknown as https.Server);

      const server = await startServer(mockExpress as unknown as Express);

      // Assert correct file paths are used for key and cert
      expect(mockReadFile.mock.calls[0][0]).toContain('fluxnova.finos.local.key');
      expect(mockReadFile.mock.calls[1][0]).toContain('fluxnova.finos.local.crt');
      expect(mockHttps.createServer).toHaveBeenCalledWith(expect.objectContaining({ key, cert }), mockExpress);
      expect(mockHttpsServer.listen).toHaveBeenCalledWith(1234, expect.any(Function));
      expect(server).toBe(mockHttpsServer);
      expect(server.keepAliveTimeout).toBe(EIGHTY_FIVE_SECONDS);
      expect(server.headersTimeout).toBe(NINETY_SECONDS);
    });

    describe.each([
      { key: null, cert: 'test-cert' },
      { key: 'test-key', cert: null },
      { key: null, cert: null },
    ])('handles missing key or cert: %p', ({ key, cert }) => {
      it('defaults to http server when key or cert is missing.', async () => {
        mockReadFile.mockResolvedValueOnce(key as string).mockResolvedValueOnce(cert as string);
        mockIsRunningLocally.mockReturnValueOnce(true);

        const server = await startServer(mockExpress as unknown as Express);

        expect(mockExpress.listen).toHaveBeenCalledWith(1234, expect.any(Function));
        expect(server).toBe(mockHttpServer);
        expect(server.keepAliveTimeout).toBe(EIGHTY_FIVE_SECONDS);
        expect(server.headersTimeout).toBe(NINETY_SECONDS);
      });

      it('throws error when not running locally and missing key or cert', async () => {
        mockReadFile.mockResolvedValueOnce(key as string).mockResolvedValueOnce(cert as string);
        mockIsRunningLocally.mockReturnValueOnce(false);

        await expect(startServer(mockExpress as unknown as Express)).rejects.toMatchObject({
          message: 'cannot start without ssl',
        });
      });
    });
  });
});
