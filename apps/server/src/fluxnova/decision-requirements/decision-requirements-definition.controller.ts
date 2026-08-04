import { Controller, Get, Logger, Query, Req } from '@nestjs/common';
import { DecisionRequirementsDefinitionParams } from '@fxn/types';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { FluxnovaController } from '../fluxnova-controller';
import {
  DecisionRequirementsDefinitionApi,
  DecisionRequirementsDefinitionApiGetDecisionRequirementsDefinitionsRequest,
} from '../generated';
import type { Request } from 'express';

@Controller('api/decision-requirements-definition')
export class DecisionRequirementsDefinitionController extends FluxnovaController {
  private api: DecisionRequirementsDefinitionApi;
  protected readonly logger = new Logger(DecisionRequirementsDefinitionController.name);

  constructor(
    protected httpService: HttpService,
    protected configService: ConfigService,
  ) {
    super(httpService, configService);
    this.api = this.createApi(DecisionRequirementsDefinitionApi);
  }

  @Get('')
  async getDecisionRequirementsDefinitionList(
    @Req() req: Request,
    @Query() params: DecisionRequirementsDefinitionParams,
  ) {
    return this.safeApiCall(async () => {
      const response = await this.api.getDecisionRequirementsDefinitions(
        params as DecisionRequirementsDefinitionApiGetDecisionRequirementsDefinitionsRequest,
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error getting decision requirements definitions');
  }
}
