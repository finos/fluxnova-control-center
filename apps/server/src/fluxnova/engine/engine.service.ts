import globalAxios, { AxiosResponse, RawAxiosRequestConfig } from 'axios';
import { ProcessEngineDto } from '@fxn/types';
import { EngineApi, EngineApiAxiosParamCreator } from '../generated';
import { BASE_PATH, operationServerMap } from '../generated/base';
import { createRequestFunction } from '../generated/common';

export class EngineService extends EngineApi {
  /**
   * TODO: Remove this!
   *
   * This override is only necessary until Fluxnova Engine Rest API
   * supports the update engine endpoint, and we build the client
   * from Fluxnova instead of Fluxnova.
   *
   * @param options
   */
  public override async getProcessEngineNames(
    options?: RawAxiosRequestConfig,
  ): Promise<AxiosResponse<Array<ProcessEngineDto>>> {
    const localVarAxiosParamCreator = EngineApiAxiosParamCreator(this.configuration);
    const localVarAxiosArgs = await localVarAxiosParamCreator.getProcessEngineNames(options);
    const localVarOperationServerIndex = this.configuration?.serverIndex ?? 0;
    const localVarOperationServerBasePath =
      operationServerMap['EngineApi.getProcessEngineNames']?.[localVarOperationServerIndex]?.url;

    if (options?.url) localVarAxiosArgs.url = `${localVarAxiosArgs.url}${options?.url}`;

    return await createRequestFunction(
      localVarAxiosArgs,
      globalAxios,
      BASE_PATH,
      this.configuration,
    )(this.axios, localVarOperationServerBasePath || this.basePath);
  }
}
