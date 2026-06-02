import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosRequestConfig, isAxiosError, ResponseType } from 'axios';
import {
  DEFAULT_ENGINE_HEADER_KEY,
  DEFAULT_IDENTITY_HEADER_KEY,
  EngineTenantRatio,
  TENANT_HEADER_KEY,
} from '@fxn/types';
import { Logger } from '@nestjs/common';
import { isEmpty, omitBy } from 'lodash-es';
import { FluxnovaError, parseResponseBody, scrubError } from '../common';
import { decompressString } from '../common/compress-string';
import { Configuration } from './generated';
import { BaseAPI } from './generated/base';
import type { Request } from 'express';

export abstract class FluxnovaController {
  protected abstract readonly logger: Logger;

  protected get engineHeaderKey(): string {
    return this.configService.get<string>('FXN_ENGINE_HEADER_KEY', DEFAULT_ENGINE_HEADER_KEY);
  }

  protected get idTokenHeaderKey(): string {
    return this.configService.get<string>('FXN_IDENTITY_HEADER_KEY', DEFAULT_IDENTITY_HEADER_KEY);
  }

  protected get tenancyRatio(): EngineTenantRatio | undefined {
    return this.configService.get<EngineTenantRatio>('FXN_ENGINE_TENANT_RATIO');
  }

  protected constructor(
    protected httpService: HttpService,
    protected configService: ConfigService,
  ) {}

  protected createApi<T extends BaseAPI>(ApiClass: new (...params: ConstructorParameters<typeof BaseAPI>) => T): T {
    return new ApiClass(
      new Configuration({
        basePath: this.configService.get<string>('FXN_REST_API_URL'),
      }),
      undefined,
      this.httpService.axiosRef,
    );
  }

  protected async createAxiosOptions(req: Request, responseType: ResponseType = 'json'): Promise<AxiosRequestConfig> {
    const customHeaders: Record<string, string | undefined> = {
      [this.idTokenHeaderKey]: (await decompressString(req.session?.user?.token)) as string,
    };

    if (this.tenancyRatio?.toLowerCase() === EngineTenantRatio.ONE_TO_ONE)
      customHeaders[this.engineHeaderKey] = req.headers[TENANT_HEADER_KEY] as string;
    else if (this.tenancyRatio?.toLowerCase() === EngineTenantRatio.ONE_TO_MANY) {
      //TODO: Should there be an engine header?
      //TODO: Add tenant header in the one-to-many scenario
    }

    return {
      responseType,
      headers: {
        ...omitBy(customHeaders, isEmpty),
      },
    };
  }

  protected handleApiError(error: unknown, defaultMessage: string): never {
    let fluxnovaMessage;
    if (error instanceof AxiosError && error.response?.data) {
      fluxnovaMessage = parseResponseBody(error.response)?.message;
    }

    const scrubbedError = scrubError(error);
    this.logger.error(scrubbedError);
    throw new FluxnovaError(fluxnovaMessage ?? defaultMessage, { cause: scrubbedError });
  }

  protected async safeApiCall<TResult>(
    apiCall: () => Promise<TResult>,
    defaultMessage: string,
    ignore404: boolean = false,
  ): Promise<TResult> {
    try {
      return await apiCall();
    } catch (error: unknown) {
      // In some cases we want to ignore 404 errors and return an empty result
      if (isAxiosError(error) && error.response?.status === 404 && ignore404) {
        return {} as TResult;
      } else {
        this.handleApiError(error, defaultMessage);
      }
    }
  }

  /**
   * Fetch all items by first retrieving the total count, then kicking off
   * parallel page requests—but never more than `maxConcurrency` at once.
   *
   * @param countFn        Function returning the total number of items
   * @param pageFn         Function taking (firstResult, maxResults) and returning a page of items
   * @param pageSize       Number of items per page (default: 1000)
   * @param maxConcurrency Maximum number of parallel requests (default: 5)
   * @param maxTotalResults Maximum number of total results (optional)
   */
  async fetchAll<T>(
    countFn: () => Promise<number>,
    pageFn: (firstResult: number, maxResults: number) => Promise<T[]>,
    pageSize: number = 1000,
    maxConcurrency: number = 5,
    maxTotalResults?: number,
  ): Promise<T[]> {
    const total = await countFn();
    const pages =
      maxTotalResults && total > maxTotalResults ? Math.ceil(maxTotalResults / pageSize) : Math.ceil(total / pageSize);
    const results: T[] = [];

    const offsets = Array.from({ length: pages }, (_, i) => i * pageSize);

    for (let i = 0; i < offsets.length; i += maxConcurrency) {
      const chunk = offsets.slice(i, i + maxConcurrency);
      const batchResults = await Promise.all(chunk.map((offset) => pageFn(offset, pageSize)));
      batchResults.forEach((page) => results.push(...page));
    }

    return results;
  }
}
