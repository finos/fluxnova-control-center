import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class XSRFCookieHandler implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    if (req.csrfToken) res.cookie('XSRF-TOKEN', req.csrfToken());

    return next();
  }
}
