import { Controller, Get, Logger, Param, Query, Req } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { FluxnovaController } from '../fluxnova-controller';
import {
  DecisionDefinitionApi,
  HistoricDecisionInstanceApi,
  HistoricDecisionInstanceApiGetHistoricDecisionInstancesRequest,
} from '../generated';
import type { Request } from 'express';
import type { DecisionInstanceParams } from '@fxn/types';

@Controller('api/decision-instances')
export class DecisionInstanceController extends FluxnovaController {
  private decisionInstanceApi: HistoricDecisionInstanceApi;
  private decisionDefinitionApi: DecisionDefinitionApi;
  protected readonly logger = new Logger(DecisionInstanceController.name);

  constructor(
    protected httpService: HttpService,
    protected configService: ConfigService,
  ) {
    super(httpService, configService);
    this.decisionInstanceApi = this.createApi(HistoricDecisionInstanceApi);
    this.decisionDefinitionApi = this.createApi(DecisionDefinitionApi);
  }

  @Get('')
  async getList(@Req() req: Request, @Query() params: DecisionInstanceParams) {
    return this.safeApiCall(async () => {
      const response = await this.decisionInstanceApi.getHistoricDecisionInstances(
        params as HistoricDecisionInstanceApiGetHistoricDecisionInstancesRequest,
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error getting decision instances');
  }

  @Get('/count')
  async getListCount(@Req() req: Request, @Query() params: DecisionInstanceParams) {
    return this.safeApiCall(async () => {
      const response = await this.decisionInstanceApi.getHistoricDecisionInstancesCount(
        params,
        await this.createAxiosOptions(req),
      );
      return response.data?.count ?? 0;
    }, 'Error getting decision instance count');
  }

  @Get(':id')
  async getInstance(
    @Req() req: Request,
    @Param('id') id: string,
    @Query('includeInputs') includeInputs: boolean,
    @Query('includeOutputs') includeOutputs: boolean,
  ) {
    return this.safeApiCall(async () => {
      const response = await this.decisionInstanceApi.getHistoricDecisionInstance(
        { id, includeInputs, includeOutputs },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error getting decision instance details');
  }

  @Get(':id/diagram')
  async getDiagram(@Req() req: Request, @Param('id') id: string) {
    return this.safeApiCall(async () => {
      const response = await this.decisionDefinitionApi.getDecisionDefinitionDmnXmlById(
        { id },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error getting decision instance diagram');
  }
}
