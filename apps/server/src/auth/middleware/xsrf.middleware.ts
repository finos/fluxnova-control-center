/* eslint-disable n/no-process-env -- This runs before the config service is initialized so we have to use process.env */

import { NextFunction, Request, Response } from 'express';
import { doubleCsrf } from 'csrf-csrf';

export const csrfConfig = {
  cookieName: 'XSRF-TOKEN',
  getSecret: () => process.env.FXN_CSRF_KEY ?? 'this is a very secret key',
  getSessionIdentifier: (req: Request) => req.session?.id ?? 'anonymous',
  getCsrfTokenFromRequest: (req: Request) => req.headers['x-xsrf-token'] as string,
  skipCsrfProtection: (req: Request) =>
    (req.method === 'POST' && req.originalUrl === '/api/login') ||
    (req.method === 'PUT' && req.originalUrl.includes('/api/log-level')),
};

export const { doubleCsrfProtection, invalidCsrfTokenError } = doubleCsrf(csrfConfig);

export const handleBadCsrfToken = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error === invalidCsrfTokenError) {
    const errorMessage = 'CSRF header is missing or was tampered with';
    res.status(403).send(errorMessage);
  } else {
    return next(error);
  }
};
