import { HttpService } from '@nestjs/axios';
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  InternalServerErrorException,
  Logger,
  Param,
  Post,
  Req,
  Res,
  StreamableFile,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream } from 'fs';
import path from 'path';
import { lastValueFrom } from 'rxjs';
import { AxiosAuthRequestConfig, User } from '@fxn/types';
import {
  AUTH_MISCONFIGURED_ERROR_MSG,
  generateUuidV4,
  getCachedRegex,
  ONE_DAY_IN_SEC,
  ONE_MONTH_IN_SEC,
  proxyRequest,
} from '../common';
import { compressString } from '../common/compress-string';
import { EngineController } from '../fluxnova/engine/engine.controller.ts';
import { formatFullName } from './auth.util';
import { Public } from './route.constants';
import { OidcAuthStrategyService } from './strategies/oidc.auth-strategy.service';
import { AuthStrategy } from './strategies/strategies.enum';
import type { Request, Response } from 'express';

@Controller('api')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  private readonly profileImgUserIdRegex: RegExp | null;

  get isOIDCEnabled() {
    return this.configService.get('FXN_AUTH_STRATEGY', AuthStrategy.none).toLowerCase() === AuthStrategy.oidc;
  }

  get isAuthEnabled() {
    return this.configService.get('FXN_AUTH_STRATEGY', AuthStrategy.none).toLowerCase() !== AuthStrategy.none;
  }

  constructor(
    private engineController: EngineController,
    private configService: ConfigService,
    private httpService: HttpService,
    private oidcStrategy: OidcAuthStrategyService,
  ) {
    // Compile and validate the profile image user ID pattern once during initialization
    // Using a sample test input based on the documented pattern: '^([aA]\d{6})(?:@.*)?$'
    const pattern = this.configService.get('FXN_PROFILE_IMG_USER_ID_PATTERN', '');
    this.profileImgUserIdRegex = getCachedRegex(pattern, 'usr1234@example.com');

    if (pattern && !this.profileImgUserIdRegex) {
      this.logger.error(
        'FXN_PROFILE_IMG_USER_ID_PATTERN failed validation. The regex pattern may be unsafe or invalid. ' +
          'Profile image matching will be disabled.',
      );
    }
  }

  @Public()
  @Get('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    req.session = null;
    res.redirect('/login');
  }

  @Public()
  @Get('sso')
  async sso(@Req() req: Request, @Res() res: Response) {
    req.session = null;
    return await this.oidcStrategy.ssoLogin(req, res);
  }

  @Public()
  @Get('callback')
  async callback(@Req() req: Request, @Res() res: Response) {
    try {
      await this.oidcStrategy.handleCallback(req, res);
    } catch (error: any) {
      this.logger.log(error, 'problem with msal login, redirecting to login');

      return res.redirect('/login');
    }
  }

  @Public()
  @Post('login')
  async login(@Req() req: Request, @Res() res: Response, @Body() body: { username: string; password: string }) {
    try {
      if (this.isOIDCEnabled) {
        const result = await this.oidcStrategy.userCredentialsLogin(body.username, body.password);
        req.session = {
          user: {
            id: result?.account?.username,
            fullName: formatFullName(result?.account?.name),
            token: await compressString(result?.idToken || ''),
          },
          id: generateUuidV4(),
        };
      } else throw new InternalServerErrorException(AUTH_MISCONFIGURED_ERROR_MSG);

      res.redirect('/');
    } catch (error: any) {
      this.logger.error(error, 'User login failed');

      req.session = undefined;

      throw new UnauthorizedException(error);
    }
  }

  @Get('auth')
  async getAuth(@Req() req: Request): Promise<{ user: User }> {
    const engines = (await this.engineController.engines(req)) ?? [];

    if (engines.length)
      return {
        user: {
          id: this.isAuthEnabled ? req.session?.user?.id : 'anonymous',
          fullName: this.isAuthEnabled ? req.session?.user?.fullName : 'Anonymous User',
          engines,
        },
      };
    else throw new ForbiddenException('No accessible engines for user');
  }

  @Get('profile-images/:userId')
  async handleProfileImages(@Param('userId') id: string, @Res({ passthrough: true }) res: Response) {
    const profileImgUrl = this.configService.get('FXN_PROFILE_IMG_URL');
    const profileImgFileExtension = this.configService.get('FXN_PROFILE_IMG_FILE_EXTENSION', 'png');
    const requiredVars = [{ envVar: 'FXN_PROFILE_IMG_URL', value: profileImgUrl }];

    const unsetVars: string[] = [];
    requiredVars.forEach(({ envVar, value }) => {
      if (!value) {
        unsetVars.push(envVar);
      }
    });
    if (unsetVars.length > 0) {
      this.logger.warn(
        `In order for profile images to load correctly, ${unsetVars.join(', ')} must be set in the environment.`,
      );
      return sendDefault();
    }

    function sendDefault() {
      const assetPath = path.resolve(`${__dirname}/assets/user-icon.svg`);
      res.setHeader('Cache-Control', `public, max-age=${Math.floor(ONE_MONTH_IN_SEC)}`);
      res.setHeader('Content-Type', 'image/svg+xml');
      return new StreamableFile(createReadStream(assetPath));
    }

    let externalId = id;

    if (this.profileImgUserIdRegex) {
      const match = id.match(this.profileImgUserIdRegex);

      if (!match || match.length < 2 || !match[1]) {
        // Check for correct corpId format or missing capturing group in pattern
        return sendDefault();
      }

      externalId = match?.[1];
    }

    try {
      return await proxyRequest(
        (
          await lastValueFrom(
            this.httpService.get(`${profileImgUrl}/${externalId}.${profileImgFileExtension}`, {
              responseType: 'stream',
              skipDefaultAuth: true,
            } as AxiosAuthRequestConfig),
          )
        ).data,
        res,
        ONE_DAY_IN_SEC,
      );
    } catch (err: any) {
      this.logger.warn(`Error getting people central profile image for ${externalId}, using generic user icon.`, {
        cause: err,
      });
      return sendDefault();
    }
  }
}
