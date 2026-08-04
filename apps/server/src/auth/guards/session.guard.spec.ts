import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { OidcAuthStrategyService } from '../strategies/oidc.auth-strategy.service';
import { AuthStrategy } from '../strategies/strategies.enum';
import { AUTH_MISCONFIGURED_ERROR_MSG, getTimeUntilTokenExpiration } from '../../common';
import { SessionGuard } from './session.guard';

vi.mock('../../common/get-time-until-token-expiration');
const mockGetTimeUntilTokenExpiration = vi.mocked(getTimeUntilTokenExpiration);

describe('SessionGuard', () => {
  let sessionGuard: SessionGuard;
  let mockReflector: Reflector;
  let mockExecutionContext: ExecutionContext;

  const mockAzureAdAuthService = {
    got: {
      get: vi.fn(),
      post: vi.fn(),
      extend: vi.fn().mockReturnThis(),
    } as any,

    getClient: vi.fn().mockResolvedValue(this),
    ssoLogin: vi.fn(),
    userCredentialsLogin: vi.fn(),
    getUserNameFromTokenClaims: vi.fn((preferredUsername: string) => preferredUsername),
    refreshUserAccessToken: vi.fn(),
  } as unknown as Mocked<OidcAuthStrategyService>;

  const mockConfigService = {
    get: vi.fn().mockReturnValue(AuthStrategy.oidc),
  } as unknown as Mocked<ConfigService>;

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: vi.fn(),
    } as unknown as Reflector;

    sessionGuard = new SessionGuard(mockReflector, mockAzureAdAuthService, mockConfigService);

    mockExecutionContext = {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({ session: {} }),
        getResponse: vi.fn(),
      }),
      getHandler: vi.fn(),
      getClass: vi.fn(),
    } as unknown as ExecutionContext;
  });

  it('should allow access if the route is public', async () => {
    vi.mocked(mockReflector.getAllAndOverride).mockReturnValue(true);
    const result = await sessionGuard.canActivate(mockExecutionContext);
    expect(result).toBe(true);
  });

  it('should allow access if AuthStrategy is NONE', async () => {
    vi.mocked(mockReflector.getAllAndOverride).mockReturnValue(false);
    mockConfigService.get.mockReturnValue(AuthStrategy.none);

    const result = await sessionGuard.canActivate(mockExecutionContext);
    expect(result).toBe(true);
  });

  it('should allow access if the user is authenticated', async () => {
    vi.mocked(mockReflector.getAllAndOverride).mockReturnValue(false);
    const mockRequest = { session: { user: { id: '123' } } };
    vi.mocked(mockExecutionContext.switchToHttp().getRequest).mockReturnValue(mockRequest);
    mockGetTimeUntilTokenExpiration.mockReturnValue(30 * 60 * 1000); // 30 minutes

    const result = await sessionGuard.canActivate(mockExecutionContext);
    expect(result).toBe(true);
  });

  it('should attempt to refresh the token when there is less than 5 minutes until expiration', async () => {
    vi.mocked(mockReflector.getAllAndOverride).mockReturnValue(false);
    mockConfigService.get.mockReturnValue(AuthStrategy.oidc);
    const mockRequest = { session: { user: { id: '123' } } };
    vi.mocked(mockExecutionContext.switchToHttp().getRequest).mockReturnValue(mockRequest);
    mockGetTimeUntilTokenExpiration.mockReturnValue(2 * 60 * 1000); // 2 minutes

    const result = await sessionGuard.canActivate(mockExecutionContext);

    expect(mockAzureAdAuthService.refreshUserAccessToken).toHaveBeenCalledWith(mockRequest);
    expect(result).toBe(true);
  });

  it('should call ssoLogin and return false when OIDC is enabled', async () => {
    vi.mocked(mockReflector.getAllAndOverride).mockReturnValue(false);
    mockConfigService.get.mockReturnValue(AuthStrategy.oidc);
    const ssoLoginSpy = vi.spyOn(mockAzureAdAuthService, 'ssoLogin').mockResolvedValue(undefined);

    const result = await sessionGuard.canActivate(mockExecutionContext);

    expect(ssoLoginSpy).toHaveBeenCalledWith(
      mockExecutionContext.switchToHttp().getRequest(),
      mockExecutionContext.switchToHttp().getResponse(),
    );
    expect(result).toBe(false);
  });

  it('should throw InternalServerErrorException wrapped in an UnauthorizedException when an AuthStrategy other than OIDC or NONE is specified', async () => {
    vi.mocked(mockReflector.getAllAndOverride).mockReturnValue(false);
    mockConfigService.get.mockReturnValue('saml');

    try {
      await sessionGuard.canActivate(mockExecutionContext);
      // make sure to cause an assertion error if the canActivate doesn't throw an error
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(error.message).toBe(AUTH_MISCONFIGURED_ERROR_MSG);
    }
  });

  it('should throw UnauthorizedException when ssoLogin throws an error', async () => {
    vi.mocked(mockReflector.getAllAndOverride).mockReturnValue(false);
    vi.spyOn(mockAzureAdAuthService, 'ssoLogin').mockRejectedValue(new Error('SSO error'));

    await expect(sessionGuard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
  });
});
