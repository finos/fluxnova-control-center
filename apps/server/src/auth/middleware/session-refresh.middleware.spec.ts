import { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { SESSION_REFRESH_INTERVAL_MS } from './session-constants';
import { SessionRefreshMiddleware } from './session-refresh.middleware';

describe('SessionRefreshMiddleware', () => {
  const sessionRefreshMiddleware = new SessionRefreshMiddleware();

  it('should refresh the session if last refresh is older than SESSION_REFRESH_INTERVAL', async () => {
    const mockSession = { last: Date.now() - SESSION_REFRESH_INTERVAL_MS - 1000 };
    const mockRequest = { session: mockSession } as unknown as Request;
    const mockResponse = { status: vi.fn(), send: vi.fn() } as unknown as Response;
    const next = vi.fn();

    await sessionRefreshMiddleware.use(mockRequest, mockResponse, next);

    expect(mockSession.last).toBeGreaterThan(Date.now() - SESSION_REFRESH_INTERVAL_MS);
    expect(next).toHaveBeenCalled();
  });

  it('should not refresh the session if last refresh is within SESSION_REFRESH_INTERVAL', async () => {
    const last = Date.now() - 1000;
    const mockSession = { last };
    const mockRequest = { session: mockSession } as unknown as Request;
    const mockResponse = { status: vi.fn(), send: vi.fn() } as unknown as Response;
    const next = vi.fn();

    await sessionRefreshMiddleware.use(mockRequest, mockResponse, next);

    expect(mockSession.last).toBeLessThanOrEqual(last);
    expect(next).toHaveBeenCalled();
  });
});
