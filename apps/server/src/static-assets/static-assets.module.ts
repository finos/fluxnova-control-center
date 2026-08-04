import { Injectable, Logger, MiddlewareConsumer, Module, NestMiddleware } from '@nestjs/common';
import expressStaticGzip from 'express-static-gzip';
import { ConfigModule } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import { isRunningLocally } from '../common';
import { AuthenticationModule } from '../auth/authentication.module';
import { StaticAssetsController } from './static-assets.controller';
import { setNoCacheHeaders, StaticAssetsService } from './static-assets.service';

@Module({
  controllers: [StaticAssetsController],
  providers: [StaticAssetsService],
  imports: [ConfigModule, AuthenticationModule],
})
export class StaticAssetsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ServeStaticMiddleware).exclude('api/(.*)').forRoutes('*');
  }
}

@Injectable()
export class ServeStaticMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ServeStaticMiddleware.name);

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      if (!isRunningLocally()) {
        expressStaticGzip(`${__dirname}/../frontend/browser`, {
          enableBrotli: true,
          orderPreference: ['br'],
          serveStatic: {
            maxAge: '1y',
            setHeaders: (response: any, urlPath: string) => {
              if (urlPath?.endsWith('.html') && !response.headersSent) {
                setNoCacheHeaders(res);
              }
            },
          },
        });
      }

      return next();
    } catch (error: any) {
      this.logger.error({ error }, 'context setup error');
      next(error);
    }
  }
}
