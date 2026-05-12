/* eslint-disable n/no-process-env -- Direct process.env access is being used to manipulate the configuration & is acceptable in the context of these tests. */

import { describe, expect, it, vi } from 'vitest';
import { csrfConfig, handleBadCsrfToken, invalidCsrfTokenError } from './xsrf.middleware';
import type { Request } from 'express';

describe('XSRFMiddleware', () => {
  const loginReq = {
    method: 'POST',
    originalUrl: '/api/login',
    headers: {
      'x-xsrf-token': 'test-token',
    },
    session: {
      id: 'test-session-id',
    },
  } as unknown as Request;

  const mockRequest = {
    url: 'fake url',
  };
  const mockResponse = {
    status: vi.fn(),
    json: vi.fn(),
    locals: {
      tracer: {
        getSpanId: vi.fn(),
        getTraceId: vi.fn(),
      },
    },
  };

  it('should omit POST /login from csrf protection', async () => {
    expect(csrfConfig).toBeDefined();
    expect(csrfConfig.skipCsrfProtection(loginReq)).toBe(true);
  });

  it('should configure the cookieName to be XSRF-TOKEN', async () => {
    expect(csrfConfig).toBeDefined();
    expect(csrfConfig.cookieName).toEqual('XSRF-TOKEN');
  });

  it('should get the csrf token from the x-xsrf-token header', async () => {
    expect(csrfConfig).toBeDefined();
    expect(csrfConfig.getCsrfTokenFromRequest(loginReq)).toEqual('test-token');
  });

  it('should use session.id as the session identifier', async () => {
    expect(csrfConfig).toBeDefined();
    expect(csrfConfig.getSessionIdentifier(loginReq)).toEqual('test-session-id');
  });

  it('should get the csrf secret from the env', async () => {
    process.env.FXN_CSRF_KEY = 'test-secret';

    expect(csrfConfig).toBeDefined();
    expect(csrfConfig.getSecret()).toEqual('test-secret');
  });

  it('should return 403 for invalid csrf tokens', async () => {
    const returnVal = {
      send: vi.fn(),
    };
    mockResponse.status.mockReturnValue(returnVal);
    handleBadCsrfToken(invalidCsrfTokenError, mockRequest as any, mockResponse as any, null as any);

    expect(mockResponse.status).toHaveBeenCalledTimes(1);
    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(returnVal.send).toHaveBeenCalledWith('CSRF header is missing or was tampered with');
  });
});
