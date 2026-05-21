import { Logger } from '@nestjs/common';
import { Express } from 'express';
import { Server } from 'http';
import process from 'process';
import 'reflect-metadata';
import { beforeAll, beforeEach, describe, expect, it, Mocked, MockedFunction, vi } from 'vitest';
import { Dictionary } from '@fxn/types';
import { startServer } from '../start-server.ts';
import { mainSetup } from './main-setup';

vi.mock('../start-server');
vi.mock('../common');

describe('server main', () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });
  const mockApp = {
    use: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    disable: vi.fn(),
  } as unknown as Mocked<Express>;
  const mockStartServer = startServer as MockedFunction<typeof startServer>;
  let mockServer: Mocked<Server>;
  let mockProcess: Mocked<typeof process>;
  let mockProcessListeners: Dictionary<(...args: any[]) => void>;

  beforeEach(() => {
    mockStartServer.mockReset();
    mockProcessListeners = {};
    mockProcess = {
      on: vi.fn().mockImplementation((event, fn) => (mockProcessListeners[event] = fn)),
      exit: vi.fn(),
      emit: vi.fn().mockImplementation((event, ...args) => mockProcessListeners[event](...args)),
    } as unknown as Mocked<typeof process>;
    mockServer = {
      close: vi.fn().mockImplementation((fn) => fn()),
    } as unknown as Mocked<Server>;
    mockStartServer.mockResolvedValue(mockServer);
  });

  it('should disable the etag and powered-by headers', async () => {
    await mainSetup(mockApp, mockProcess);
    expect(mockApp.disable).toHaveBeenCalledWith('etag');
    expect(mockApp.disable).toHaveBeenCalledWith('x-powered-by');
  });

  it('should start the server', async () => {
    await mainSetup(mockApp, mockProcess);
    expect(startServer).toHaveBeenCalledTimes(1);
    expect(startServer).toHaveBeenCalledWith(mockApp);
  });

  describe('process errors', () => {
    const loggerSpyError = vi.spyOn(Logger.prototype, 'error');

    beforeEach(async () => {
      await mainSetup(mockApp, mockProcess);
    });

    it('should shutdown the server on uncaught exception', () => {
      const error = new Error('doh');
      mockProcess.emit('uncaughtException', error);
      expect(loggerSpyError).toHaveBeenCalledWith({ error }, 'uncaught exception');
      expect(mockServer.close).toHaveBeenCalled();
    });

    it('should exit the process with 1 on uncaught exception', () => {
      mockProcess.emit('uncaughtException', new Error('doh'));
      expect(mockProcess.exit).toHaveBeenCalledWith(1);
    });

    it('should shutdown the server on unhandled rejection', () => {
      const promise = Promise.reject('test').catch(() => {});
      const error = new Error('doh');
      mockProcess.emit('unhandledRejection', new Error('doh'), promise);
      expect(loggerSpyError).toHaveBeenCalledWith({ error, promise }, 'unhandled rejection');
      expect(mockServer.close).toHaveBeenCalled();
    });

    it('should exit the process with 1 on unhandled rejection', () => {
      const promise = Promise.reject('test').catch(() => {});
      const error = new Error('doh');
      mockProcess.emit('unhandledRejection', error, promise);
      expect(mockProcess.exit).toHaveBeenCalledWith(1);
    });

    it('should shutdown the server on SIGTERM', () => {
      mockProcess.emit('SIGTERM', 'SIGTERM');
      expect(mockServer.close).toHaveBeenCalled();
    });

    it('should exit the process with 0 on SIGTERM', () => {
      mockProcess.emit('SIGTERM', 'SIGTERM');
      expect(mockProcess.exit).toHaveBeenCalledWith(0);
    });

    it('should shutdown the server on SIGINT', () => {
      mockProcess.emit('SIGINT', 'SIGINT');
      expect(mockServer.close).toHaveBeenCalled();
    });

    it('should exit the process with 0 on SIGINT', () => {
      mockProcess.emit('SIGINT', 'SIGINT');
      expect(mockProcess.exit).toHaveBeenCalledWith(0);
    });

    it('should force exit the process after a timeout if server not closed', () => {
      mockServer.close.mockImplementation(() => mockServer);
      mockProcess.emit('SIGINT', 'SIGINT');
      expect(mockProcess.exit).not.toHaveBeenCalled();
      vi.advanceTimersByTime(10000);
      expect(mockProcess.exit).toHaveBeenCalledWith(0);
    });
  });
});
