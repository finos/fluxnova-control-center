import { Controller, Get, InternalServerErrorException, Query, Res } from '@nestjs/common';
import { livenessCheck } from '@fxn/types';
import { Public } from '../auth/route.constants';
import { HealthService } from './health.service';
import type { Response } from 'express';

@Public()
@Controller('api')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  async getHealth(
    @Res({ passthrough: true }) response: Response,
    @Query('scope') scope?: 'internal' | 'external' | undefined,
  ) {
    response.setHeader('Cache-Control', 'no-cache');
    const health = await this.healthService.getStatus(scope, []);

    if (health.status === 'pass' || health.status === 'warn') {
      return health;
    } else {
      throw new InternalServerErrorException(health);
    }
  }

  @Get('liveness')
  async getLiveness(@Res({ passthrough: true }) response: Response) {
    response.setHeader('Cache-Control', 'no-cache');

    if (livenessCheck.ready) {
      return {};
    } else {
      throw new InternalServerErrorException(livenessCheck);
    }
  }
}
