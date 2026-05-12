import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as http from 'http';
import * as https from 'https';
import type { Request, Response } from 'express';

@Injectable()
export class OtelService {
  public readonly logger = new Logger(OtelService.name);
  private noProxyHttpAgent = new http.Agent({ keepAlive: true });
  private noProxyHttpsAgent = new https.Agent({ keepAlive: true });

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  async proxyToLocalOtelAgent(req: Request, res: Response<any, Record<string, any>>) {
    const otelURL = new URL(this.configService.get('OTEL_EXPORTER_OTLP_ENDPOINT', 'http://localhost:4318'));
    otelURL.pathname = this.getPathName(req);

    try {
      const proxiedResponse = await this.httpService.axiosRef.request({
        method: 'POST',
        url: otelURL.toString(),
        headers: {
          ...req.headers,
          host: otelURL.hostname,
        },
        params: req.query,
        data: req.body,
        responseType: 'stream',
        proxy: false,
        // TODO: Bypass proxy without doing this?
        httpAgent: this.noProxyHttpAgent,
        httpsAgent: this.noProxyHttpsAgent,
      });

      res.status(proxiedResponse.status);

      Object.entries(proxiedResponse.headers).forEach(([key, value]) => {
        if (value !== undefined) res.setHeader(key, value as string);
      });

      proxiedResponse.data.pipe(res);
    } catch (err: unknown) {
      this.logger.debug({ err }, 'Error while proxying OTEL');
      res.status(500).send(`Error proxying request for OTEL`);
    }
  }

  private getPathName(req: Request): string {
    if (req.url.includes('/v1/traces')) {
      return '/v1/traces';
    }
    if (req.url.includes('/v1/metrics')) {
      return '/v1/metrics';
    }
    return '/v1/logs';
  }
}
