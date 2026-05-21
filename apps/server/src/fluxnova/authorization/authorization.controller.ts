import { Controller, Get, Logger, Query, Req } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AuthorizationApi } from '../generated';
import { FluxnovaController } from '../fluxnova-controller';
import type { Request } from 'express';

@Controller('api/authorization')
export class AuthorizationController extends FluxnovaController {
  private api: AuthorizationApi;

  protected readonly logger = new Logger(AuthorizationController.name);

  constructor(
    protected httpService: HttpService,
    protected configService: ConfigService,
  ) {
    super(httpService, configService);
    this.api = this.createApi(AuthorizationApi);
  }

  @Get('check')
  async check(
    @Req() req: Request,
    @Query('permissionName') permissionName: string,
    @Query('resourceName') resourceName: string,
    @Query('resourceType') resourceType: number,
    @Query('resourceId') resourceId?: string,
  ) {
    return this.safeApiCall(async () => {
      const response = await this.api.isUserAuthorized(
        { permissionName, resourceName, resourceType, resourceId },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, `Error checking authorization`);
  }
}
