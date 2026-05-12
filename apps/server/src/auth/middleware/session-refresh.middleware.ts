import { NextFunction, Request, Response } from 'express';
import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { SESSION_REFRESH_INTERVAL_MS } from './session-constants';

@Injectable()
export class SessionRefreshMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SessionRefreshMiddleware.name);

  async use(req: Request, res: Response, next: NextFunction) {
    if (req.session && (!req.session.last || Date.now() - req.session.last > SESSION_REFRESH_INTERVAL_MS)) {
      req.session.last = Date.now();
      this.logger.verbose({ last: req.session.last }, 'refreshing session maxAge, set last request to');
    }
    next();
  }
}
