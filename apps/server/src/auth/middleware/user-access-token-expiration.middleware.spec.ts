import 'cookie-session';
import { NextFunction, Request, Response } from 'express';
import { afterEach, beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { getTimeUntilTokenExpiration } from '../../common/get-time-until-token-expiration';
import { UserAccessTokenExpirationMiddleware } from './user-access-token-expiration.middleware';

vi.mock('../../logging');
vi.mock('../../common/get-time-until-token-expiration');

describe('UserAccessTokenExpirationMiddleware', () => {
  let session: { userId?: string } = {};
  let mockReq: any;
  let mockRes: Response;
  const mockNext = vi.fn() as Mocked<NextFunction>;
  const mockGetTimeUntilTokenExpiration = vi.mocked(getTimeUntilTokenExpiration);

  let middleware: UserAccessTokenExpirationMiddleware;

  beforeEach(() => {
    session = {};
    mockReq = {
      url: 'http://whatever.com',
      method: 'GET',
      session,
      openidTokens: {
        claims: () => ({ sub: 'testUserId' }),
      },
    } as unknown as Mocked<Request>;
    mockRes = {
      sendStatus: vi.fn(),
    } as unknown as Mocked<Response>;
    middleware = new UserAccessTokenExpirationMiddleware();
  });

  afterEach(() => vi.resetAllMocks());

  it('should NOT clear session if access token is NOT expired', async () => {
    mockReq.session = { user: { token: 'fakeToken' } };
    mockGetTimeUntilTokenExpiration.mockReturnValueOnce(10000);

    await middleware.use(mockReq, mockRes, mockNext);

    expect(mockGetTimeUntilTokenExpiration).toHaveBeenCalledWith('fakeToken');
    expect(mockReq.session.user).toEqual({ token: 'fakeToken' });
    expect(mockNext).toHaveBeenCalled();
  });

  it('should clear session if access token IS expired', async () => {
    mockReq.session = { user: { token: 'fakeToken' } };
    mockGetTimeUntilTokenExpiration.mockReturnValueOnce(0);

    await middleware.use(mockReq, mockRes, mockNext);

    expect(mockGetTimeUntilTokenExpiration).toHaveBeenCalledWith('fakeToken');
    expect(mockReq.session).toBeNull();
    expect(mockNext).toHaveBeenCalled();
  });

  it('should not clear session if access token is missing', async () => {
    mockReq.session = { testKey: 'test-value' };

    await middleware.use(mockReq, mockRes, mockNext);

    expect(mockGetTimeUntilTokenExpiration).not.toHaveBeenCalled();
    expect(mockReq.session).toEqual({ testKey: 'test-value' });
  });
});
