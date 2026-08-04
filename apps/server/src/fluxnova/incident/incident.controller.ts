import { Body, Controller, Logger, Post, Req } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { HistoricIncidentApi, HistoricIncidentApiGetHistoricIncidentsCountRequest } from '../generated';
import { FluxnovaController } from '../fluxnova-controller';
import type { Request } from 'express';
import type { IncidentsFilter, IPaginatedDataRequest } from '@fxn/types';

@Controller('api/incidents')
export class IncidentController extends FluxnovaController {
  private api: HistoricIncidentApi;
  protected readonly logger = new Logger(IncidentController.name);

  constructor(
    protected httpService: HttpService,
    protected configService: ConfigService,
  ) {
    super(httpService, configService);
    this.api = this.createApi(HistoricIncidentApi);
  }
  @Post('/')
  async getIncidentsByFilterAndPagination(@Req() req: Request, @Body() request: IPaginatedDataRequest) {
    return this.safeApiCall(async () => {
      const response = await this.api.getHistoricIncidents(
        { ...request.filter, maxResults: request.maxResults, firstResult: request.firstResult },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error getting incidents');
  }

  @Post('count')
  async getIncidentsCount(@Req() req: Request, @Body() filters: IncidentsFilter) {
    return this.safeApiCall(async () => {
      const response = await this.api.getHistoricIncidentsCount(
        filters as HistoricIncidentApiGetHistoricIncidentsCountRequest,
        await this.createAxiosOptions(req),
      );
      return response.data?.count ?? 0;
    }, 'Error getting incidents count');
  }
}
