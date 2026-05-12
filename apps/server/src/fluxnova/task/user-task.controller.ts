import { Body, Controller, Logger, Post, Req } from '@nestjs/common';
import { type IPaginatedDataRequest } from '@fxn/types';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { FluxnovaController } from '../fluxnova-controller.ts';
import { TaskApi, TaskWithAttachmentAndCommentDto } from '../generated';
import type { Request } from 'express';

@Controller('api/user-tasks')
export class UserTaskController extends FluxnovaController {
  private taskApi: TaskApi;
  protected readonly logger = new Logger(UserTaskController.name);

  constructor(
    protected httpService: HttpService,
    protected configService: ConfigService,
  ) {
    super(httpService, configService);
    this.taskApi = this.createApi(TaskApi);
  }

  @Post('/')
  async getUserTaskWithFilter(@Req() req: Request, @Body() filtersAndPagination: IPaginatedDataRequest) {
    return this.safeApiCall(async (): Promise<TaskWithAttachmentAndCommentDto[]> => {
      const response = await this.taskApi.getTasks(
        {
          ...filtersAndPagination.filter,
          maxResults: filtersAndPagination.maxResults,
          firstResult: filtersAndPagination.firstResult,
        },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error getting user tasks');
  }

  @Post('count')
  getUserTaskCountWithFilter(@Req() req: Request, @Body() filters: { [key: string]: string }) {
    return this.safeApiCall(async () => {
      const response = await this.taskApi.getTasksCount(filters, await this.createAxiosOptions(req));
      return response.data?.count ?? 0;
    }, 'Error getting user task count');
  }
}
