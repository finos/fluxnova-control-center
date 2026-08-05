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

    it('gets the key and cert and starts an https server using default /certs paths', async () => {
      const key = 'server-key-content';
      const cert = 'server-cert-content';
      mockReadFile.mockResolvedValueOnce(key).mockResolvedValueOnce(cert).mockRejectedValueOnce(new Error('ENOENT')); // no passphrase file
      mockIsRunningLocally.mockReturnValueOnce(true);
      mockHttps.createServer.mockReturnValueOnce(mockHttpsServer as unknown as https.Server);

      const server = await startServer(mockExpress as unknown as Express);

      expect(mockReadFile.mock.calls[0][0]).toBe('/certs/server.key');
      expect(mockReadFile.mock.calls[1][0]).toBe('/certs/server.crt');
      expect(mockReadFile.mock.calls[2][0]).toBe('/certs/SSL_KEYSTORE_PASSWORD');
      expect(mockHttps.createServer).toHaveBeenCalledWith(expect.objectContaining({ key, cert }), mockExpress);
      expect(mockHttpsServer.listen).toHaveBeenCalledWith(1234, expect.any(Function));
      expect(server).toBe(mockHttpsServer);
      expect(server.keepAliveTimeout).toBe(EIGHTY_FIVE_SECONDS);
      expect(server.headersTimeout).toBe(NINETY_SECONDS);
    });

    it('reads passphrase from /certs/SSL_KEYSTORE_PASSWORD when no FXN_SSL_KEY_PASSPHRASE env var', async () => {
      const key = 'encrypted-key-content';
      const cert = 'cert-content';
      mockReadFile.mockResolvedValueOnce(key).mockResolvedValueOnce(cert).mockResolvedValueOnce('mounted-passphrase\n'); // passphrase file (trimmed)
      mockIsRunningLocally.mockReturnValueOnce(true);
      mockHttps.createServer.mockReturnValueOnce(mockHttpsServer as unknown as https.Server);

      const server = await startServer(mockExpress as unknown as Express);

      expect(mockHttps.createServer).toHaveBeenCalledWith(
        expect.objectContaining({ key, cert, passphrase: 'mounted-passphrase' }),
        mockExpress,
      );
      expect(server).toBe(mockHttpsServer);
    });

    it('reads passphrase from FXN_SSL_KEY_PASSPHRASE_FILE when set', async () => {
      process.env.FXN_SSL_KEY_PASSPHRASE_FILE = '/run/secrets/keypass';
      const key = 'encrypted-key-content';
      const cert = 'cert-content';
      mockReadFile.mockResolvedValueOnce(key).mockResolvedValueOnce(cert).mockResolvedValueOnce('file-passphrase');
      mockIsRunningLocally.mockReturnValueOnce(true);
      mockHttps.createServer.mockReturnValueOnce(mockHttpsServer as unknown as https.Server);

      const server = await startServer(mockExpress as unknown as Express);

      expect(mockReadFile.mock.calls[2][0]).toBe('/run/secrets/keypass');
      expect(mockHttps.createServer).toHaveBeenCalledWith(
        expect.objectContaining({ passphrase: 'file-passphrase' }),
        mockExpress,
      );
      expect(server).toBe(mockHttpsServer);
      delete process.env.FXN_SSL_KEY_PASSPHRASE_FILE;
    });

    it('prefers FXN_SSL_KEY_PASSPHRASE env var over passphrase file', async () => {
      process.env.FXN_SSL_KEY_PASSPHRASE = 'env-passphrase';
      const key = 'encrypted-key-content';
      const cert = 'cert-content';
      mockReadFile.mockResolvedValueOnce(key).mockResolvedValueOnce(cert);
      mockIsRunningLocally.mockReturnValueOnce(true);
      mockHttps.createServer.mockReturnValueOnce(mockHttpsServer as unknown as https.Server);

      await startServer(mockExpress as unknown as Express);

      // readFile should only be called twice (key + cert), not for passphrase file
      expect(mockReadFile).toHaveBeenCalledTimes(2);
      expect(mockHttps.createServer).toHaveBeenCalledWith(
        expect.objectContaining({ passphrase: 'env-passphrase' }),
        mockExpress,
      );
      delete process.env.FXN_SSL_KEY_PASSPHRASE;
    });

    it('uses FXN_SSL_CERT_PATH and FXN_SSL_KEY_PATH env vars when set', async () => {
      process.env.FXN_SSL_KEY_PATH = '/custom/path/server.key';
      process.env.FXN_SSL_CERT_PATH = '/custom/path/server.crt';
      const key = 'custom-key-content';
      const cert = 'custom-cert-content';
      mockReadFile.mockResolvedValueOnce(key).mockResolvedValueOnce(cert).mockRejectedValueOnce(new Error('ENOENT')); // no passphrase file
      mockIsRunningLocally.mockReturnValueOnce(true);
      mockHttps.createServer.mockReturnValueOnce(mockHttpsServer as unknown as https.Server);

      const server = await startServer(mockExpress as unknown as Express);

      expect(mockReadFile.mock.calls[0][0]).toBe('/custom/path/server.key');
      expect(mockReadFile.mock.calls[1][0]).toBe('/custom/path/server.crt');
      expect(mockHttps.createServer).toHaveBeenCalledWith(expect.objectContaining({ key, cert }), mockExpress);
      expect(server).toBe(mockHttpsServer);
      delete process.env.FXN_SSL_KEY_PATH;
      delete process.env.FXN_SSL_CERT_PATH;
    });

    it('passes passphrase to https server when FXN_SSL_KEY_PASSPHRASE is set', async () => {
      process.env.FXN_SSL_KEY_PASSPHRASE = 'supersecret';
      const key = 'encrypted-key-content';
      const cert = 'cert-content';
      mockReadFile.mockResolvedValueOnce(key).mockResolvedValueOnce(cert);
      mockIsRunningLocally.mockReturnValueOnce(true);
      mockHttps.createServer.mockReturnValueOnce(mockHttpsServer as unknown as https.Server);

      const server = await startServer(mockExpress as unknown as Express);

      expect(mockHttps.createServer).toHaveBeenCalledWith(
        expect.objectContaining({ key, cert, passphrase: 'supersecret' }),
        mockExpress,
      );
      expect(server).toBe(mockHttpsServer);
      delete process.env.FXN_SSL_KEY_PASSPHRASE;
    });

    it('does not include passphrase in https options when no passphrase env var or file', async () => {
      const key = 'unencrypted-key-content';
      const cert = 'cert-content';
      mockReadFile.mockResolvedValueOnce(key).mockResolvedValueOnce(cert).mockRejectedValueOnce(new Error('ENOENT')); // no passphrase file
      mockIsRunningLocally.mockReturnValueOnce(true);
      mockHttps.createServer.mockReturnValueOnce(mockHttpsServer as unknown as https.Server);

      await startServer(mockExpress as unknown as Express);

      const callArg = mockHttps.createServer.mock.calls[0][0] as Record<string, unknown>;
      expect(callArg).not.toHaveProperty('passphrase');
    });

    it('throws a clear error when https.createServer fails due to bad passphrase', async () => {
      process.env.FXN_SSL_KEY_PASSPHRASE = 'wrongpassphrase';
      const key = 'encrypted-key-content';
      const cert = 'cert-content';
      mockReadFile.mockResolvedValueOnce(key).mockResolvedValueOnce(cert);
      mockIsRunningLocally.mockReturnValueOnce(true);
      mockHttps.createServer.mockImplementationOnce(() => {
        throw new Error('ERR_OSSL_BAD_DECRYPT');
      });

      await expect(startServer(mockExpress as unknown as Express)).rejects.toBeDefined();
      delete process.env.FXN_SSL_KEY_PASSPHRASE;
    });

    describe.each([
      { key: null, cert: 'test-cert', description: 'missing key' },
      { key: 'test-key', cert: null, description: 'missing cert' },
      { key: null, cert: null, description: 'missing both key and cert' },
    ])('handles missing key or cert: $description', ({ key, cert }) => {
      it('defaults to http server when key or cert is missing.', async () => {
        if (!key) {
          mockReadFile.mockRejectedValueOnce(new Error('ENOENT'));
        } else {
          mockReadFile.mockResolvedValueOnce(key);
        }
        if (!cert) {
          mockReadFile.mockRejectedValueOnce(new Error('ENOENT'));
        } else {
          mockReadFile.mockResolvedValueOnce(cert);
        }
        mockIsRunningLocally.mockReturnValueOnce(true);

        const server = await startServer(mockExpress as unknown as Express);

        expect(mockExpress.listen).toHaveBeenCalledWith(1234, expect.any(Function));
        expect(server).toBe(mockHttpServer);
        expect(server.keepAliveTimeout).toBe(EIGHTY_FIVE_SECONDS);
        expect(server.headersTimeout).toBe(NINETY_SECONDS);
      });

      it('throws error when not running locally and missing key or cert', async () => {
        if (!key) {
          mockReadFile.mockRejectedValueOnce(new Error('ENOENT'));
        } else {
          mockReadFile.mockResolvedValueOnce(key);
        }
        if (!cert) {
          mockReadFile.mockRejectedValueOnce(new Error('ENOENT'));
        } else {
          mockReadFile.mockResolvedValueOnce(cert);
        }
        mockIsRunningLocally.mockReturnValueOnce(false);

        await expect(startServer(mockExpress as unknown as Express)).rejects.toThrow(
          'SSL cert/key not found or unreadable at configured paths',
        );
      });
    });

    it('throws error with key and cert paths included when not running locally', async () => {
      process.env.FXN_SSL_KEY_PATH = '/custom/key.pem';
      process.env.FXN_SSL_CERT_PATH = '/custom/cert.pem';
      mockReadFile.mockRejectedValueOnce(new Error('ENOENT'));
      mockIsRunningLocally.mockReturnValueOnce(false);

      await expect(startServer(mockExpress as unknown as Express)).rejects.toThrow(
        /\/custom\/key\.pem.*\/custom\/cert\.pem/,
      );
      delete process.env.FXN_SSL_KEY_PATH;
      delete process.env.FXN_SSL_CERT_PATH;
    });
  });
});
