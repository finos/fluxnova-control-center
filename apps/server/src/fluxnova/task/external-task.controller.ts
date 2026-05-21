import { Controller, Get, Logger, Param, Req } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { FluxnovaController } from '../fluxnova-controller';
import { ExternalTaskApi } from '../generated';
import type { Request } from 'express';

@Controller('api/external-tasks')
export class ExternalTaskController extends FluxnovaController {
  private externalTaskApi: ExternalTaskApi;
  protected readonly logger = new Logger(ExternalTaskController.name);

  constructor(
    protected httpService: HttpService,
    protected configService: ConfigService,
  ) {
    super(httpService, configService);
    this.externalTaskApi = this.createApi(ExternalTaskApi);
  }

  @Get(':id/errorDetails')
  async getExternalTaskErrorDetails(@Req() req: Request, @Param('id') id: string) {
    return this.safeApiCall(async () => {
      const response = await this.externalTaskApi.getExternalTaskErrorDetails(
        { id },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error getting external task error details');
  }
}
