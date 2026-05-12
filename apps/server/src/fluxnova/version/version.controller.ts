import { HttpService } from '@nestjs/axios';
import { Controller, Get, Logger, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FluxnovaController } from '../fluxnova-controller';
import { VersionApi } from '../generated';
import type { Request } from 'express';

@Controller('api/version')
export class VersionController extends FluxnovaController {
  private versionApi: VersionApi;
  protected readonly logger = new Logger(VersionController.name);

  constructor(
    protected httpService: HttpService,
    protected configService: ConfigService,
  ) {
    super(httpService, configService);
    this.versionApi = this.createApi(VersionApi);
  }

  @Get('')
  getRestAPIVersion(@Req() req: Request) {
    return this.safeApiCall(async () => {
      const response = await this.versionApi.getRestAPIVersion(await this.createAxiosOptions(req));
      return response.data;
    }, 'Error getting version');
  }
}
