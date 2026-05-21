import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../route.constants';
import { OidcAuthStrategyService } from '../strategies/oidc.auth-strategy.service';
import { AUTH_MISCONFIGURED_ERROR_MSG, getTimeUntilTokenExpiration } from '../../common';
import { AuthStrategy } from '../strategies/strategies.enum';
import { decompressString } from '../../common/compress-string';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

@Injectable()
export class SessionGuard implements CanActivate {
  private readonly logger = new Logger(SessionGuard.name);

  constructor(
    private reflector: Reflector,
    private readonly authService: OidcAuthStrategyService,
    private readonly configService: ConfigService,
  ) {}

  get isOIDCEnabled(): boolean {
    return this.configService.get('FXN_AUTH_STRATEGY').toLowerCase() === AuthStrategy.oidc;
  }

  get isAuthEnabled(): boolean {
    return this.configService.get('FXN_AUTH_STRATEGY', AuthStrategy.none).toLowerCase() !== AuthStrategy.none;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // First, if this is a public route, skip authentication.
    // Next, check if the user is already authenticated.
    // If the user is authenticated, attempt refresh token and allow access
    // otherwise, proceed with the default authentication flow.
    if (isPublic || !this.isAuthEnabled) {
      return true;
    } else if (request.session?.user?.id) {
      const decompressedUserAccessToken = await decompressString(request.session?.user?.token);
      const timeUntilExpiration = getTimeUntilTokenExpiration(decompressedUserAccessToken);
      if (timeUntilExpiration < FIVE_MINUTES_MS) {
        await this.authService.refreshUserAccessToken(request);
      }
      return true;
    } else {
      const isApiRequest = this.isApiRequest(request);
      if (isApiRequest) {
        // For API requests, throw 401/403 instead of redirecting
        throw new UnauthorizedException('Authentication required');
      }
      try {
        if (this.isOIDCEnabled) {
          await this.authService.ssoLogin(request, response);
          return false;
        } else throw new InternalServerErrorException(AUTH_MISCONFIGURED_ERROR_MSG);
      } catch (error) {
        throw new UnauthorizedException(error);
      }
    }
  }

  private isApiRequest(request: Request): boolean {
    const acceptHeader = request.headers?.accept || '';
    const contentTypeHeader = request.headers?.['content-type'] || '';
    return (
      (acceptHeader.includes('application/json') && !acceptHeader.includes('text/html')) ||
      contentTypeHeader.includes('application/json')
    );
  }
}
