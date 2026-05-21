import { Injectable, Logger } from '@nestjs/common';
import * as tcpPortUsed from 'tcp-port-used';
import { HttpService } from '@nestjs/axios';
import { Agent } from 'http';
import type { Request, Response } from 'express';

export function setNoCacheHeaders(res: any) {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expire', 0);
  return res;
}

@Injectable()
export class StaticAssetsService {
  public readonly logger = new Logger(StaticAssetsService.name);
  private readonly httpAgent = new Agent({ keepAlive: true });

  constructor(private httpService: HttpService) {}

  async proxyToLocalAngularDevServer(req: Request, res: Response<any, Record<string, any>>) {
    const host = 'localhost';
    const port = 4200;
    const baseUrl = `http://${host}:${port}`;

    try {
      const proxiedResponse = await this.httpService.axiosRef.request({
        method: req.method,
        url: `${baseUrl}${req.url}`,
        headers: {
          ...req.headers,
          host,
        },
        params: req.query,
        responseType: 'stream',
        httpAgent: this.httpAgent,
      });

      res.status(proxiedResponse.status);

      Object.entries(proxiedResponse.headers).forEach(([key, value]) => {
        if (value !== undefined) res.setHeader(key, value as string);
      });

      proxiedResponse.data.pipe(res);
    } catch (err: any) {
      if (err.code === 'ECONNREFUSED') {
        const localApp = await tcpPortUsed.check(port, host);
        if (!localApp) {
          this.logger.error(`frontend not being served locally`);
          res.status(500).send(`To view the frontend locally, you must be running "nx serve frontend"`);
          return;
        }
      }

      if (res.headersSent) {
        this.logger.warn(`Headers already sent, cannot handle error for ${baseUrl}${req.url}`, err);
        return;
      }
      if (err.response && err.response.status === 304) {
        this.logger.debug('304 error ignored while proxying request');
        res.status(304).end();
      } else {
        this.logger.error(`error proxying request for ${baseUrl}${req.url}`, err);
        res.status(500).send(`error proxying request`);
      }
    }
  }
}
