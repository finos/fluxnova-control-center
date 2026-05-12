import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { FluxnovaController } from '../fluxnova-controller';
import { VersionApi } from '../generated';
import { EngineService } from './engine.service';

@Injectable()
export class EngineController extends FluxnovaController {
  protected api: EngineService;
  protected versionApi: VersionApi;
  protected readonly logger = new Logger(EngineController.name);

  constructor(
    protected readonly httpService: HttpService,
    protected readonly configService: ConfigService,
  ) {
    super(httpService, configService);

    this.api = this.createApi(EngineService);
    this.versionApi = this.createApi(VersionApi);
  }

  public async engines(req: Request) {
    return this.safeApiCall(
      async () =>
        (
          await this.api.getProcessEngineNames({
            ...(await this.createAxiosOptions(req)),
            url: '?access=application',
          })
        ).data,
      'Error getting engines',
    );
  }
}
