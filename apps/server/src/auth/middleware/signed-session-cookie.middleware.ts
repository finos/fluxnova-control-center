import cookieSession from 'cookie-session';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESSION_TIMEOUT_MS } from './session-constants';

@Injectable()
export class SignedSessionCookieMiddleware implements NestMiddleware {
  private sessionMiddleware?: ReturnType<typeof cookieSession>;

  constructor(private readonly configService: ConfigService) {}

  async use(req: any, res: any, next: () => void) {
    if (!this.sessionMiddleware) {
      const keys: string = this.configService.get<string>('FXN_COOKIE_KEYS', 'super secret key 1,super secret key 2');
      this.sessionMiddleware = cookieSession({
        name: 'fluxnova-ui',
        keys: keys?.split(','),
        maxAge: SESSION_TIMEOUT_MS,
        sameSite: 'lax',
      });
    }
    return this.sessionMiddleware(req, res, next);
  }
}
