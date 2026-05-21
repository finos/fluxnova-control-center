import { Injectable, Logger } from '@nestjs/common';
import { LogLevel } from '@azure/msal-common';
import { AuthorizationCodeRequest, ConfidentialClientApplication, Configuration, ProtocolMode } from '@azure/msal-node';
import { ConfigService } from '@nestjs/config';
import { OIDCConfig } from '@fxn/types';
import axios, { AxiosInstance } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';
import { generateUuidV4 } from '../../common';
import { decodeState, RequestState } from '../../context';
import { formatFullName } from '../auth.util';
import { compressString, decompressString } from '../../common/compress-string';
import type { Request, Response } from 'express';

@Injectable()
export class OidcAuthStrategyService {
  private readonly logger = new Logger(OidcAuthStrategyService.name);
  private readonly proxyUrl?: string;
  private confidentialClientApplication?: ConfidentialClientApplication;
  private _msalConfig?: Configuration;
  private _oidcConfig?: OIDCConfig;

  private get oidcConfig(): OIDCConfig {
    if (!this._oidcConfig) {
      this._oidcConfig = this.config.get<OIDCConfig>('oidc', {} as OIDCConfig);
    }
    return this._oidcConfig;
  }

  public get msalConfig(): Configuration {
    if (!this._msalConfig) {
      this._msalConfig = this.buildMsalConfig();
    }
    return this._msalConfig;
  }

  public readonly axiosInstance: AxiosInstance;

  constructor(private readonly config: ConfigService) {
    this.proxyUrl = this.config.get('http_proxy') || this.config.get('HTTP_PROXY');
    this.axiosInstance = axios.create({
      httpAgent: this.proxyUrl ? new HttpProxyAgent(this.proxyUrl) : undefined,
      httpsAgent: this.proxyUrl ? new HttpsProxyAgent(this.proxyUrl) : undefined,
      proxy: false,
    });
  }

  private buildMsalConfig(): Configuration {
    return {
      auth: {
        clientId: this.oidcConfig.clientId ?? '',
        clientSecret: this.oidcConfig.clientSecret,
        authority: this.oidcConfig.authority,
        knownAuthorities: this.oidcConfig.knownAuthorities,
        protocolMode: ProtocolMode.OIDC,
        authorityMetadata: JSON.stringify({
          authorization_endpoint: this.oidcConfig.authorizationURL,
          token_endpoint: this.oidcConfig.tokenURL,
          issuer: this.oidcConfig.issuer,
          userinfo_endpoint: this.oidcConfig.userInfoURL,
        }),
      },
      system: {
        networkClient: {
          sendGetRequestAsync: async (url: string) => {
            try {
              const resp = await this.axiosInstance.get(url, { responseType: 'json', validateStatus: () => true });
              return {
                headers: resp.headers,
                body: resp.data,
                status: resp.status,
              };
            } catch (err: any) {
              return {
                headers: (err.response && err.response.headers) || {},
                body: (err.response && err.response.data) || { error: err.message },
                status: (err.response && err.response.status) || 500,
              };
            }
          },
          sendPostRequestAsync: async (url: string, options: any) => {
            try {
              const resp = await this.axiosInstance.post(url, options?.body, {
                headers: options?.headers,
                responseType: 'json',
                validateStatus: () => true,
              });
              return {
                headers: resp.headers,
                body: resp.data,
                status: resp.status,
              };
            } catch (err: any) {
              return {
                headers: (err.response && err.response.headers) || {},
                body: (err.response && err.response.data) || { error: err.message },
                status: (err.response && err.response.status) || 500,
              };
            }
          },
        },
        loggerOptions: {
          loggerCallback: (logLevel: any, message: any) => {
            switch (logLevel) {
              case LogLevel.Error:
                return this.logger.error(message);
              case LogLevel.Warning:
                return this.logger.warn(message);
              case LogLevel.Info:
                return this.logger.log(message);
              default:
                return this.logger.debug(message);
            }
          },
          logLevel: LogLevel.Info,
        },
      },
    };
  }

  async getClient() {
    if (!this.confidentialClientApplication) {
      this.confidentialClientApplication = new ConfidentialClientApplication(this.msalConfig);
    }

    return this.confidentialClientApplication;
  }

  async handleCallback(req: Request & { state?: RequestState }, res: Response) {
    const client = await this.getClient();
    const tokenRequest: AuthorizationCodeRequest = {
      code: req.query.code as string,
      scopes: this.oidcConfig.scopes,
      redirectUri: this.oidcConfig.callbackURL,
    };

    try {
      const response = await client.acquireTokenByCode(tokenRequest);

      if (req.session) {
        req.session.user = {
          id: response.account?.username,
          fullName: formatFullName(response.account?.name),
          token: await compressString(response.idToken),
        };

        // This is used by the csrf protection middleware to verify requests
        req.session.id = generateUuidV4();
      }

      req.state = decodeState(req.query?.state as string, this.logger);
      res.redirect(req.state.returnTo as string);
    } catch (error: any) {
      this.logger.error({ error }, 'msal callback error');
      res.status(500).send('msal callback error');
    }
  }

  async ssoLogin(req: Request, res: Response) {
    const client = await this.getClient();
    const requestState = { returnTo: req.url !== '/api/sso' ? req.url : '/' };

    const authCodeUrlParameters = {
      scopes: this.oidcConfig.scopes,
      redirectUri: this.oidcConfig.callbackURL,
      state: Buffer.from(JSON.stringify(requestState)).toString('base64'),
    };

    try {
      const authURL = await client.getAuthCodeUrl(authCodeUrlParameters);
      res.redirect(authURL);
    } catch (error: any) {
      this.logger.error({ error }, 'oidc auth error');
    }
  }

  // Perform a best effort attempt at refreshing the user's access token.
  // A failure will just result in the user using their current access token
  // until it expires.
  public async refreshUserAccessToken(request: Request) {
    if (!request.session?.user?.token) {
      return;
    }
    const client = await this.getClient();
    const accounts = await client.getTokenCache().getAllAccounts();
    const userAccount = accounts.filter((account) => account.username === request.session?.user?.id)[0];
    if (!userAccount) {
      return;
    }
    const decompressedUserAccessToken = await decompressString(request.session.user.token);
    if (userAccount.idToken && userAccount.idToken !== decompressedUserAccessToken) {
      // The user.token in the session is not the same as the current idToken in the cache.
      // This means the token was already refreshed in a separate request.
      // So we want to update the session with the latest idToken from the cache.
      request.session.user.token = await compressString(userAccount.idToken);
      return;
    }
    try {
      const response = await client.acquireTokenSilent({
        scopes: this.oidcConfig.scopes,
        account: userAccount,
        forceRefresh: true,
      });
      request.session.user.token = await compressString(response.idToken);
    } catch (error: any) {
      this.logger.error({ error }, 'msal refresh token error');
    }
  }

  // Manual login
  public async userCredentialsLogin(userId: string, password: string) {
    const client = await this.getClient();
    const usernamePasswordRequest = {
      scopes: this.oidcConfig.scopes,
      password,
      username: `${userId}`,
    };

    return client.acquireTokenByUsernamePassword(usernamePasswordRequest);
  }
}
