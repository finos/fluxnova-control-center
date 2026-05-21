import { Controller, Post, Req, Res } from '@nestjs/common';
import { OtelService } from './otel.service';
import type { Request, Response } from 'express';

@Controller('api')
export class OtelController {
  constructor(private readonly assetsService: OtelService) {}

  @Post(['v1/traces', 'v1/metrics', 'v1/logs'])
  async postOtelData(@Req() req: Request, @Res() res: Response) {
    await this.assetsService.proxyToLocalOtelAgent(req, res);
  }
}
