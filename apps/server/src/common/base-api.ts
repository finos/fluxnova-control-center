import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import {
  DEFAULT_ENGINE_HEADER_KEY,
  DEFAULT_IDENTITY_HEADER_KEY,
  HealthCheck,
  HealthCheckStatus,
  HealthDependency,
  TENANT_HEADER_KEY,
} from '@fxn/types';
import { Request } from 'express';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { decompressString } from './compress-string';

export class BaseApi {
  protected readonly logger: Logger = new Logger(BaseApi.name);
  protected userId?: string;
  protected userAccessToken?: string;
  protected tenant?: string;
  protected baseURL?: string;
  protected headers: Record<string, string> = {};

  get identityHeaderKey(): string {
    return this.configService.get('FXN_IDENTITY_HEADER_KEY', DEFAULT_IDENTITY_HEADER_KEY);
  }

  get engineHeaderKey(): string {
    return this.configService.get('FXN_ENGINE_HEADER_KEY', DEFAULT_ENGINE_HEADER_KEY);
  }

  constructor(
    protected httpService: HttpService,
    protected configService: ConfigService,
  ) {}

  public async initializeHttpService(req: Request): Promise<void> {
    this.userId = req?.session?.user?.id;
    this.userAccessToken = await decompressString(req?.session?.user?.token);
    this.tenant = req?.headers?.[TENANT_HEADER_KEY] as string | undefined;

    this.setHttpHeaders();
  }

  private setHttpHeaders(): void {
    if (this.userAccessToken) {
      this.headers[this.identityHeaderKey] = this.userAccessToken;
    }
    if (this.tenant) {
      this.headers[this.engineHeaderKey] = this.tenant;
    }
  }

  getHealth(): Promise<HealthDependency>[] {
    return [this.getStandardApiHealth()];
  }

  protected handleHealthCheckError(error: Error, name?: string): HealthDependency {
    return {
      status: 'fail',
      name: name,
      scope: 'external',
      message: `There was a network error retrieving the health status for this service: ${error}`,
    };
  }

  protected async getStandardApiHealth(): Promise<HealthDependency> {
    let body: HealthCheck;
    try {
      const response = await firstValueFrom(
        this.httpService.get<HealthCheck>(`${this.baseURL}/health?scope=internal`, {
          headers: this.headers,
        }),
      );
      const statusCode = response.status;
      body = response.data;
      if (statusCode !== 200 && statusCode !== 500) {
        throw new Error(`Unknown status code received from health check: ${response.status}`);
      }
      if (!body.status || !body.meta) {
        return {
          status: 'fail',
          statusCode,
          scope: 'external',
          message: `The response received was not in a recognized format: ${JSON.stringify(body)}`,
        };
      }

      return {
        status: body.status as HealthCheckStatus,
        statusCode,
        name: this.baseURL,
        scope: 'external',
        message: body.meta?.message,
      };
    } catch (error: any) {
      return this.handleHealthCheckError(error);
    }
  }
}
