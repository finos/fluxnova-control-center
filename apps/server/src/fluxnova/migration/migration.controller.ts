import { Body, Controller, Logger, Post, Req } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { FluxnovaController } from '../fluxnova-controller';
import { MigrationApi } from '../generated';
import type { Request } from 'express';
import type { MigrationExecutionRequest } from '@fxn/types';

@Controller('api/migration')
export class MigrationController extends FluxnovaController {
  private api: MigrationApi;
  protected readonly logger = new Logger(MigrationController.name);

  constructor(
    protected httpService: HttpService,
    protected configService: ConfigService,
  ) {
    super(httpService, configService);
    this.api = this.createApi(MigrationApi);
  }

  @Post('executeAsync')
  async executeMigrationPlan(@Req() req: Request, @Body() request: MigrationExecutionRequest) {
    const migrationPlan = await this.safeApiCall(async () => {
      const response = await this.api.generateMigrationPlan(
        { migrationPlanGenerationDto: request.migrationPlan },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error generating migration plan');
    return this.safeApiCall(async () => {
      const response = await this.api.executeMigrationPlanAsync(
        {
          migrationExecutionDto: {
            ...request,
            migrationPlan,
          },
        },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error executing migration plan');
  }
}
