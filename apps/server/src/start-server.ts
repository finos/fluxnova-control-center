/* eslint-disable n/no-process-env -- ConfigService is not available yet, so we must use env directly */

import { Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import { Express } from 'express';
import { readFile } from 'fs/promises';
import http from 'http';
import https from 'https';
import { FLUXNOVA_PORT, FluxnovaError, isRunningLocally } from './common';

const logger = new Logger('StartServer');

export interface SslKeyAndCert {
  cert?: string;
  key?: string;
}

export async function startServer(app: Express) {
  const port = FLUXNOVA_PORT;
  let server: https.Server | http.Server;
  if (process.env.FXN_FORCE_HTTP) {
    server = await startHttpServer(app, port);
  } else {
    const sslObject = await getSslKeyAndCert();
    if (sslObject) {
      server = await startHttpsServer(app, sslObject, port);
    } else {
      server = await startHttpServer(app, port);
    }
  }
  server.keepAliveTimeout = 85 * 1000;
  server.headersTimeout = 90 * 1000;
  return server;
}

async function getSslKeyAndCert(): Promise<SslKeyAndCert | undefined> {
  let key, cert;

  try {
    const keyFile = `${__dirname}/cert/fluxnova.finos.local.key`;
    const certFile = `${__dirname}/cert/fluxnova.finos.local.crt`;
    key = await readFile(keyFile, 'utf8');
    cert = await readFile(certFile, 'utf8');
  } catch {
    logger.log('SSL cert/key not found in filesystem');
  }

  if (!key || !cert) {
    logger.log('SSL cert/key not available, using http');

    if (!isRunningLocally()) {
      throw new Error('cannot start without ssl');
    }

    return undefined;
  }

  return {
    key,
    cert,
  };
}

async function startHttpsServer(app: Express, sslSecret: SslKeyAndCert, port: string | number): Promise<https.Server> {
  return startAsync(https.createServer(sslSecret, app), port);
}

async function startHttpServer(app: Express, port: string | number): Promise<http.Server> {
  return startAsync(app, port);
}

function startAsync<T extends EventEmitter>(
  server: { listen: (port: string | number, callback: () => void) => T },
  port: string | number,
): Promise<T> {
  return new Promise((res, rej) => {
    const response = server
      .listen(port, () => {
        logger.log(`Listening at http://localhost:${port}`);
        res(response);
      })
      .on('error', (error) => {
        rej(new FluxnovaError('failed to start server', { cause: error }));
      });
  });
}
