import { Body, Controller, Get, Logger, Param, Post, Query, Req } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { FluxnovaController } from '../fluxnova-controller';
import { DecisionDefinitionApi, DecisionDefinitionApiGetDecisionDefinitionsRequest } from '../generated';
import type { Request } from 'express';
import type { DecisionDefinitionEvaluateRequest, DecisionDefinitionParams } from '@fxn/types';

@Controller('api/decision-definition')
export class DecisionDefinitionController extends FluxnovaController {
  private api: DecisionDefinitionApi;
  protected readonly logger = new Logger(DecisionDefinitionController.name);

  constructor(
    protected httpService: HttpService,
    protected configService: ConfigService,
  ) {
    super(httpService, configService);
    this.api = this.createApi(DecisionDefinitionApi);
  }

  @Get('')
  async getDecisionDefinitionList(@Req() req: Request, @Query() params: DecisionDefinitionParams) {
    return this.safeApiCall(async () => {
      const response = await this.api.getDecisionDefinitions(
        params as DecisionDefinitionApiGetDecisionDefinitionsRequest,
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error getting decision definitions');
  }

  @Get('/count')
  async getDecisionDefinitionCount(@Req() req: Request, @Query() params: DecisionDefinitionParams) {
    return this.safeApiCall(async () => {
      const response = await this.api.getDecisionDefinitionsCount(params, await this.createAxiosOptions(req));
      return response.data;
    }, 'Error getting decision definitions count');
  }

  @Get(':id')
  async getDecisionDefinitionDetail(@Req() req: Request, @Param('id') id: string) {
    return this.safeApiCall(async () => {
      const response = await this.api.getDecisionDefinitionById({ id }, await this.createAxiosOptions(req));
      return response.data;
    }, 'Error getting decision definition details');
  }

  @Get(':id/xml')
  getDecisionDefinitionDiagram(@Req() req: Request, @Param('id') id: string) {
    return this.safeApiCall(async () => {
      const response = await this.api.getDecisionDefinitionDmnXmlById({ id }, await this.createAxiosOptions(req));
      return response.data;
    }, 'Error getting decision definition diagram');
  }

  @Post(':id/evaluate')
  evaluateDecisionDefinition(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: DecisionDefinitionEvaluateRequest,
  ) {
    return this.safeApiCall(async () => {
      const response = await this.api.evaluateDecisionById(
        { id, evaluateDecisionDto: body },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error evaluating decision definition');
  }
}
