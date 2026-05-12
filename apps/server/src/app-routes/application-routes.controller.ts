import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Logger, Put } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import * as pino from 'pino';
import { pinoLogLevelTypes } from '../logging';
import { clearAll } from '../common';
import { Public } from '../auth/route.constants';

@Public()
@Controller('api')
export class ApplicationRoutesController {
  private readonly logger = new Logger(ApplicationRoutesController.name);

  constructor(private configService: ConfigService) {}

  // This function makes it possible to mock the logger in tests
  public getRootPinoLogger(): pino.Logger {
    return PinoLogger.root;
  }

  @Get('log-level')
  async getLogLevel() {
    return { 'log-level': this.getRootPinoLogger().level.toUpperCase() };
  }

  @Put('log-level')
  @HttpCode(HttpStatus.NO_CONTENT)
  async setLogLevel(@Body() body: { 'log-level': string }) {
    const newLevel: string = body['log-level'].toLowerCase();

    if (pinoLogLevelTypes.has(newLevel as pino.Level)) {
      this.configService.set('FXN_LOG_LEVEL', newLevel);
      this.getRootPinoLogger().level = newLevel as pino.Level;
    } else {
      this.logger.error(`Invalid log level provided: '${newLevel}'`);
      throw new BadRequestException('Invalid log level provided');
    }
  }

  @Get('clear-cache')
  async clearCache() {
    clearAll();
    return { message: 'Cache cleared successfully' };
  }
}
