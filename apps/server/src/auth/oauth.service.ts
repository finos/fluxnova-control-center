import { Injectable, Logger } from '@nestjs/common';
import jsonWebToken from 'jsonwebtoken';
import axios from 'axios';
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { ConfigService } from '@nestjs/config';
import { FluxnovaError } from '../common/app-error';
import { getCache } from '../common/cache';

export interface OauthTokenResponse {
  token?: string;
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface GetTokenParams {
  tokenUri: string;
  clientId?: string;
  clientSecret?: string;
  scope?: string;
  contentType?: 'json' | 'form';
}

@Injectable()
export class OauthService {
  public constructor(private readonly config: ConfigService) {}

  public isTokenNearlyExpired(token?: string, secondsAllowedBeforeRenewing = 300): boolean {
    if (!token) {
      return true;
    }
    const decoded = jsonWebToken.decode(token, { complete: true }) as { [key: string]: any };
    const exp = decoded?.payload?.exp;
    return !exp || new Date(exp * 1000).getTime() < new Date().getTime() + secondsAllowedBeforeRenewing * 1000;
  }

  public async getOAuthToken(
    getParams: () => Promise<GetTokenParams>,
    loggerInstance: Logger,
    cacheKeyPrefix?: string,
  ): Promise<string> {
    const tokenParams = await getParams();

    const cachekey = `${cacheKeyPrefix}${tokenParams.clientId}`;
    const tokenCache = getCache('oauthTokens');
    let accessToken = await tokenCache.get<string>(cachekey);
    if (this.isTokenNearlyExpired(accessToken)) {
      try {
        const tokenData = await this.refreshToken(tokenParams);
        accessToken = tokenData.access_token;
        tokenCache.set(cachekey, accessToken);
      } catch (error: any) {
        loggerInstance.error({ error }, 'unable to obtain access token');
      }
    }
    return accessToken ?? '';
  }

  public async refreshToken(params: GetTokenParams): Promise<OauthTokenResponse> {
    try {
      const contentType = params.contentType || 'form';
      let data: any;
      const headers: Record<string, string> = {};

      if (contentType === 'json') {
        headers['Content-Type'] = 'application/json';
        data = {
          client_id: params.clientId,
          client_secret: params.clientSecret,
          grant_type: 'client_credentials',
          scope: params.scope,
        };
      } else {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        const formData = new URLSearchParams();
        formData.append('client_id', params.clientId ?? '');
        formData.append('client_secret', params.clientSecret ?? '');
        formData.append('grant_type', 'client_credentials');
        formData.append('scope', params.scope ?? '');
        data = formData;
      }

      const proxyUrl = this.config.get('http_proxy') || this.config.get('HTTP_PROXY');
      const axiosInstance = axios.create({
        httpAgent: proxyUrl ? new HttpProxyAgent(proxyUrl) : undefined,
        httpsAgent: proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined,
        proxy: false,
      });

      const response = await axiosInstance.post(params.tokenUri, data, {
        headers,
        timeout: 5000,
      });

      return response.data as OauthTokenResponse;
    } catch (error) {
      throw new FluxnovaError(`Error getting Oauth token from: ${params.tokenUri} with client Id: ${params.clientId}`, {
        cause: error,
      });
    }
  }
}
