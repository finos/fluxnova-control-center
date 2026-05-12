import { Controller, Get, Logger, Req, Res } from '@nestjs/common';
import path from 'path';
import { ConfigService } from '@nestjs/config';
import { isRunningLocally, ONE_YEAR_IN_MS } from '../common';
import { Public } from '../auth/route.constants';
import { parseKeyValuePairs } from '../common/parseKeyValuePairs';
import { OTEL_DEFAULT_SERVICE_NAME } from '../otel/otel-default-service-name';
import { AuthStrategy } from '../auth/strategies/strategies.enum';
import { setNoCacheHeaders, StaticAssetsService } from './static-assets.service';
import type { Request, Response } from 'express';

const staticAssetRegex = /^.*\.[a-z0-9]{2,5}$/i;

@Controller()
export class StaticAssetsController {
  private readonly logger = new Logger(StaticAssetsController.name);

  constructor(
    private readonly assetsService: StaticAssetsService,
    private readonly configService: ConfigService,
  ) {}

  isStaticAsset(url: string): boolean {
    const urlPath = new URL(url, 'https://foo.com').pathname;
    return staticAssetRegex.test(urlPath);
  }

  @Get('config.js')
  getConfigJs(@Res() res: Response) {
    const fluxnovaConfig: FluxnovaConfig = {
      authRequired: this.configService.get('FXN_AUTH_STRATEGY', AuthStrategy.none).toLowerCase() !== AuthStrategy.none,
      env: this.configService.get('FXN_ENV', 'dev'),
      fxnPublicUrl: this.configService.get('FXN_PUBLIC_URL', ''),
      isRunningLocally: isRunningLocally(),
      otel: {
        serviceName: this.configService.get('OTEL_SERVICE_NAME', OTEL_DEFAULT_SERVICE_NAME),
        attributes: parseKeyValuePairs(this.configService.get('OTEL_RESOURCE_ATTRIBUTES', '')),
        debug: this.configService.get('FXN_OTEL_DEBUG', 'false') === 'true',
        enabled: this.configService.get('FXN_OTEL_ENABLED', 'false') === 'true',
      },
      version: this.configService.get('FXN_CC_VERSION', '1.0.0'),
    };
    setNoCacheHeaders(res)
      .contentType('application/javascript')
      .status(200)
      .send(`window.fluxnovaConfig = ${JSON.stringify(fluxnovaConfig)}`);
  }

  @Public()
  @Get('favicon.ico')
  getFavicon(@Res() res: Response) {
    res.sendFile(path.resolve(`${__dirname}/assets/favicon.ico`), { maxAge: ONE_YEAR_IN_MS });
  }

  @Public()
  @Get('loading.css')
  getLoadingCss(@Res() res: Response) {
    res.sendFile(path.resolve(`${__dirname}/assets/loading.css`), { maxAge: ONE_YEAR_IN_MS });
  }

  @Public()
  @Get('fluxnova-logo.svg')
  getFluxnovaLogo(@Res() res: Response) {
    res.sendFile(path.resolve(`${__dirname}/assets/fluxnova-logo.svg`), { maxAge: ONE_YEAR_IN_MS });
  }

  @Public()
  @Get('login')
  getLogin(@Res() res: Response) {
    res.sendFile(path.resolve(`${__dirname}/login.html`), { maxAge: ONE_YEAR_IN_MS });
  }

  @Get('*')
  async getApp(@Req() req: Request, @Res() res: Response): Promise<any> {
    const urlPath = req.path || '/';
    const pathParts = urlPath.split('/').filter(Boolean);
    const filename = pathParts.at(-1) ?? '';

    if (!isRunningLocally()) {
      if (!this.isStaticAsset(filename))
        setNoCacheHeaders(res).sendFile(path.resolve(`${__dirname}/../frontend/browser/index.html`));
      else res.sendFile(path.resolve(`${__dirname}/../frontend/browser/${pathParts.join('/')}`));
    } else {
      return await this.assetsService.proxyToLocalAngularDevServer(req, res);
    }
  }
}
