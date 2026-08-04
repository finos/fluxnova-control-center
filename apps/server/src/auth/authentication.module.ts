import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { HttpModule, HttpModuleOptions, HttpService } from '@nestjs/axios';
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { ApiAuthConfig, AxiosAuthRequestConfig } from '@fxn/types';
import { EngineController } from '../fluxnova/engine/engine.controller';
import { AuthController } from './auth.controller';
import { OidcAuthStrategyService } from './strategies/oidc.auth-strategy.service';
import { SessionGuard } from './guards/session.guard';
import { OauthService } from './oauth.service';

@Module({
  controllers: [AuthController],
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const proxyUrl = configService.get('http_proxy') || configService.get('HTTP_PROXY');
        return {
          httpAgent: proxyUrl ? new HttpProxyAgent(proxyUrl) : undefined,
          httpsAgent: proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined,
          proxy: false,
        } as HttpModuleOptions;
      },
    }),
  ],
  providers: [
    ConfigService,
    EngineController,
    OauthService,
    OidcAuthStrategyService,
    {
      provide: APP_GUARD,
      useClass: SessionGuard,
    },
  ],
  exports: [EngineController, HttpModule, OidcAuthStrategyService],
})
export class AuthenticationModule implements OnModuleInit {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly oauthService: OauthService,
  ) {}

  private logger = new Logger('AuthenticationModule');

  onModuleInit() {
    const apiAuthConfig = this.configService.get<ApiAuthConfig>('apiAuth');

    if (!apiAuthConfig?.authEnabled) {
      this.logger.log('API Auth is disabled; HttpService requests will not include an app-level OAuth token.');
      return;
    }

    this.logger.log('API Auth is enabled; configuring HttpService to attach app-level OAuth tokens.');

    this.httpService.axiosRef.interceptors.request.use(
      async (config: AxiosAuthRequestConfig) => {
        if (config.skipDefaultAuth === true) {
          return config;
        }

        const oauthToken = await this.oauthService.getOAuthToken(
          async () => ({
            tokenUri: apiAuthConfig.tokenURL,
            clientId: apiAuthConfig.clientId,
            clientSecret: apiAuthConfig.clientSecret,
            contentType: 'json' as 'json' | 'form',
          }),
          this.logger,
        );

        const headerName = apiAuthConfig.requestHeaderName;
        config.headers[headerName] = `Bearer ${oauthToken}`;

        return config;
      },
      (error) => Promise.reject(error),
    );
  }
}
