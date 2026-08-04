import { Express } from 'express';
import * as NestPino from 'nestjs-pino';
import process from 'process';
import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import { livenessCheck } from '@fxn/types';
import { handleBadCsrfToken } from '../auth';
import { startServer } from '../start-server';
import { FluxnovaError, isRunningLocally } from '../common';
import { AppModule } from './app.module';

const logger = new Logger('main-setup');

export async function mainSetup(expressApp: Express, proc: typeof process) {
  try {
    const app: NestExpressApplication = await NestFactory.create<NestExpressApplication>(
      AppModule,
      new ExpressAdapter(expressApp),
    );

    app.useLogger(app.get(NestPino.Logger));
    app.useGlobalInterceptors(new NestPino.LoggerErrorInterceptor());

    app.use(handleBadCsrfToken);

    // Disable headers we don't want to use
    app.getHttpAdapter().getInstance().disable('etag');
    app.getHttpAdapter().getInstance().disable('x-powered-by');

    //Set request body size limits
    app.useBodyParser('json', { limit: '5mb' });
    app.useBodyParser('urlencoded', { extended: false, limit: '5mb' });

    await app.init();

    const server = await startServer(expressApp);

    //this is a good practice but messed up local dev auto reload, only run in docker
    if (!isRunningLocally()) {
      const gracefulShutdown = (code: number, args?: any[]) => {
        livenessCheck.ready = false;
        logger.log({ code, args }, 'Http server closing');
        server.close((err) => {
          logger.log({ err }, 'Http server closed.');
          Logger.flush();
          proc.exit(code ?? 0);
        });
        // If server hasn't finished in 10s, shut down process
        setTimeout(() => {
          logger.log('Http server taking too long to close, forcing process exit after 10 seconds');
          Logger.flush();
          proc.exit(code ?? 0);
        }, 10000).unref(); // Prevents the timeout from registering on event loop
      };

      proc.on('SIGTERM', (...args: any[]) => {
        logger.log({ args }, 'SIGTERM signal received');
        gracefulShutdown(0, args);
      });
      proc.on('SIGINT', (...args: any[]) => {
        logger.log({ args }, 'SIGINT signal received.');
        gracefulShutdown(0, args);
      });
      proc.on('uncaughtException', (error) => {
        logger.error({ error }, 'uncaught exception');
        gracefulShutdown(1);
      });
      proc.on('unhandledRejection', (error, promise) => {
        logger.error({ error, promise }, 'unhandled rejection');
        gracefulShutdown(1);
      });
    }

    livenessCheck.ready = true;
  } catch (error: any) {
    throw new FluxnovaError('Error setting up app', { cause: error });
  }
}
