import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { getTimeUntilTokenExpiration } from '../../common/get-time-until-token-expiration';
import { decompressString } from '../../common/compress-string';

@Injectable()
export class UserAccessTokenExpirationMiddleware implements NestMiddleware {
  private logger = new Logger(UserAccessTokenExpirationMiddleware.name);

  constructor() {}

  async use(req: Request, res: Response, next: NextFunction) {
    if (req.session?.user?.token) {
      const decompressedUserAccessToken = await decompressString(req.session.user.token);
      const timeUntilExpiration = getTimeUntilTokenExpiration(decompressedUserAccessToken);
      if (timeUntilExpiration <= 0) {
        this.logger.warn('user access token has expired, clearing session');
        req.session = null;
      }
    }
    next();
  }
}
