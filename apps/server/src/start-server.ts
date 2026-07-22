/* eslint-disable n/no-process-env -- ConfigService is not available yet, so we must use env directly */

import { Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import { Express } from 'express';
import { readFile } from 'fs/promises';
import http from 'http';
import https from 'https';
import { FLUXNOVA_PORT, FluxnovaError, isRunningLocally } from './common';

const logger = new Logger('StartServer');

export interface SslConfiguration {
  cert?: string;
  key?: string;
  passphrase?: string;
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

async function getSslKeyAndCert(): Promise<SslConfiguration | undefined> {
  const keyFile = process.env.FXN_SSL_KEY_PATH ?? '/certs/server.key';
  const certFile = process.env.FXN_SSL_CERT_PATH ?? '/certs/server.crt';

  let key, cert;
  try {
    [key, cert] = await Promise.all([readFile(keyFile, 'utf8'), readFile(certFile, 'utf8')]);
  } catch {
    if (!isRunningLocally()) {
      throw new Error(`SSL cert/key not found or unreadable at configured paths (key: ${keyFile}, cert: ${certFile})`);
    }

    logger.log('SSL cert/key not available, using http');

    return undefined;
  }

  const passphrase = await resolvePassphrase();
  return {
    key,
    cert,
    ...(passphrase ? { passphrase } : {}),
  };
}

async function resolvePassphrase(): Promise<string | undefined> {
  if (process.env.FXN_SSL_KEY_PASSPHRASE) {
    return process.env.FXN_SSL_KEY_PASSPHRASE;
  }

  const passphraseFile = process.env.FXN_SSL_KEY_PASSPHRASE_FILE ?? '/certs/SSL_KEYSTORE_PASSWORD';
  try {
    return (await readFile(passphraseFile, 'utf8')).trim();
  } catch {
    // No passphrase file present — assume unencrypted key
    return undefined;
  }
}

async function startHttpsServer(
  app: Express,
  sslSecret: SslConfiguration,
  port: string | number,
): Promise<https.Server> {
  let server: https.Server;
  try {
    server = https.createServer(sslSecret, app);
  } catch (error) {
    const isPassphraseError = sslSecret.passphrase !== undefined;
    if (isPassphraseError) {
      logger.error(`Failed to initialize TLS — passphrase may be incorrect: ${(error as Error).message}`);
    } else {
      logger.error(`Failed to initialize TLS server: ${(error as Error).message}`);
    }
    throw new FluxnovaError('failed to create https server', { cause: error });
  }
  return startAsync(server, port);
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
