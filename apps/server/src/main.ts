/* eslint-disable n/no-process-env -- ConfigService is not available yet, so we must use env directly */

// Node's default of 10 is too low for this app: concurrent outgoing axios requests each add error/close
// listeners to the same keep-alive socket. 22 is just high enough to avoid false positives while
// still catching genuine listener leaks.
import { EventEmitter } from 'events';
EventEmitter.defaultMaxListeners = 22;

// organize-imports-ignore
// these imports need to override code, so they're pulled to the very beginning
import './otel/otel-setup';
import { Logger } from '@nestjs/common';
import 'source-map-support/register';
import 'reflect-metadata';
import 'rxjs';
import express from 'express';
import { mainSetup } from './app/main-setup';

const startTime = Date.now();
const logger = new Logger('main');

if (process.env.FXN_OTEL_ENABLED === 'true') {
  logger.debug(
    `otel setup for env: ${process.env.FXN_ENV || 'dev'} and host ${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}`,
  );
}

const expressApp = express();

mainSetup(expressApp, process)
  .then(() => logger.log('Startup time', { duration: Date.now() - startTime }))
  .catch((err) => logger.error({ err }, 'startup failure'));
