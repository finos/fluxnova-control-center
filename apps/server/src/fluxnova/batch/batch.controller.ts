import { Body, Controller, Delete, Get, Logger, Param, Put, Query, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { FluxnovaController } from '../fluxnova-controller';
import {
  BatchApi,
  BatchApiGetBatchStatisticsRequest,
  HistoricBatchApi,
  HistoricBatchApiGetHistoricBatchesRequest,
} from '../generated';
import type { Request } from 'express';
import type { BatchParams } from '@fxn/types';

@Controller('api')
export class BatchController extends FluxnovaController {
  private batchApi: BatchApi;
  private historicBatchApi: HistoricBatchApi;
  protected readonly logger = new Logger(BatchController.name);

  constructor(
    protected httpService: HttpService,
    protected configService: ConfigService,
  ) {
    super(httpService, configService);
    this.batchApi = this.createApi(BatchApi);
    this.historicBatchApi = this.createApi(HistoricBatchApi);
  }

  @Get('batch/statistics')
  getBatchStatistics(@Req() req: Request, @Query('batchId') batchId: string) {
    return this.safeApiCall(async () => {
      const response = await this.batchApi.getBatchStatistics({ batchId }, await this.createAxiosOptions(req));
      return response.data;
    }, 'Error getting batch statistics');
  }

  @Get('history/batch')
  getBatchHistory(@Req() req: Request, @Query() params: BatchParams) {
    const searchParams = new URLSearchParams(params as any);
    searchParams.set('completed', 'true');

    return this.safeApiCall(async () => {
      const response = await this.historicBatchApi.getHistoricBatches(
        { ...params, completed: true } as HistoricBatchApiGetHistoricBatchesRequest,
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error getting historic batches');
  }

  @Get('history/batch/count')
  getBatchHistoryCount(@Req() req: Request, @Query() params: BatchParams) {
    return this.safeApiCall(async () => {
      const response = await this.historicBatchApi.getHistoricBatchesCount(
        { ...params, completed: true },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error getting historic batch count');
  }

  @Get('history/batch/:id')
  getBatch(@Req() req: Request, @Param('id') id: string) {
    return this.safeApiCall(async () => {
      const response = await this.historicBatchApi.getHistoricBatch({ id }, await this.createAxiosOptions(req));
      return response.data;
    }, 'Error getting historic batch');
  }

  @Get('batch')
  getBatches(@Req() req: Request, @Query() params: BatchParams) {
    return this.safeApiCall(async () => {
      const response = await this.batchApi.getBatchStatistics(
        params as BatchApiGetBatchStatisticsRequest,
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error getting batches');
  }

  @Get('batch/count')
  getBatchCount(@Req() req: Request, @Query() params: BatchParams) {
    return this.safeApiCall(async () => {
      const response = await this.batchApi.getBatchStatisticsCount(params, await this.createAxiosOptions(req));
      return response.data;
    }, 'Error getting batch count');
  }

  @Delete('batch/:id')
  deleteBatch(@Req() req: Request, @Param('id') id: string, @Query('cascade') cascade: boolean) {
    return this.safeApiCall(async () => {
      const response = await this.batchApi.deleteBatch({ id, cascade }, await this.createAxiosOptions(req));
      return response.data;
    }, 'Error deleting batch');
  }

  @Delete('history/batch/:id')
  deleteHistoricBatch(@Req() req: Request, @Param('id') id: string) {
    return this.safeApiCall(async () => {
      const response = await this.historicBatchApi.deleteHistoricBatch({ id }, await this.createAxiosOptions(req));
      return response.data;
    }, 'Error deleting historic batch');
  }

  @Put('batch/:id/suspended')
  suspend(@Req() req: Request, @Param('id') id: string, @Body() body: { suspended: boolean }) {
    return this.safeApiCall(async () => {
      const response = await this.batchApi.updateBatchSuspensionState(
        { id, suspensionStateDto: body },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error updating batch suspension state');
  }
}
