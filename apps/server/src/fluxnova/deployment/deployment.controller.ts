import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES, DeploymentParams } from '@fxn/types';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { DeploymentApiGetDeploymentsRequest } from '../generated';
import { FluxnovaController } from '../fluxnova-controller';
import { DeploymentService } from './deployment.service';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import type { Request, Response } from 'express';

const FIVE_MB = 5 * 1024 * 1024;

const uploadOptions: MulterOptions = {
  limits: {
    files: 20,
    fileSize: FIVE_MB,
  },
  fileFilter: (_req, file, cb) => {
    const extension = extname(file.originalname).toLowerCase();
    const isAllowedExtension = new Set(ALLOWED_EXTENSIONS).has(extension);
    const isAllowedMimeType = new Set(ALLOWED_MIME_TYPES).has(file.mimetype);

    if (!isAllowedExtension || !isAllowedMimeType) {
      return cb(new BadRequestException('Unsupported file type'), false);
    }

    cb(null, true);
  },
};

@Controller('api/deployment')
export class DeploymentController extends FluxnovaController {
  private api: DeploymentService;
  protected readonly logger = new Logger(DeploymentController.name);

  constructor(
    protected httpService: HttpService,
    protected configService: ConfigService,
  ) {
    super(httpService, configService);
    this.api = this.createApi(DeploymentService);
  }

  @Get('')
  async getDeployments(@Req() req: Request, @Query() params: DeploymentParams) {
    return this.safeApiCall(async () => {
      const response = await this.api.getDeployments(
        params as DeploymentApiGetDeploymentsRequest,
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error getting deployments');
  }

  @Get('/count')
  async getDeploymentCount(@Req() req: Request, @Query() params: DeploymentParams) {
    return this.safeApiCall(async () => {
      const response = await this.api.getDeploymentsCount(
        params as DeploymentApiGetDeploymentsRequest,
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error getting deployment count');
  }

  @Get(':id/resource')
  async getDeploymentResources(@Req() req: Request, @Param('id') id: string) {
    return this.safeApiCall(async () => {
      const response = await this.api.getDeploymentResources({ id }, await this.createAxiosOptions(req));
      return response.data;
    }, 'Error getting deployment resources');
  }

  @Get(':id')
  async getDeploymentDetail(@Req() req: Request, @Param('id') id: string) {
    return this.safeApiCall(async () => {
      const response = await this.api.getDeployment({ id }, await this.createAxiosOptions(req));
      return response.data;
    }, 'Error getting deployment details');
  }

  @Get(':deploymentId/resource/:resourceId/data')
  async getResourceData(
    @Req() req: Request,
    @Param('deploymentId') id: string,
    @Param('resourceId') resourceId: string,
    @Res() res: Response,
  ) {
    const fileData = await this.safeApiCall(async () => {
      const response = await this.api.getDeploymentResourceData(
        { id, resourceId },
        await this.createAxiosOptions(req, 'arraybuffer'),
      );
      return response.data;
    }, 'Error getting deployment resource data');
    res.set({
      'Content-Type': 'application/octet-stream',
    });
    res.send(fileData);
  }

  @Delete(':id')
  deleteDeployment(
    @Req() req: Request,
    @Param('id') id: string,
    @Query('cascade') cascade: boolean,
    @Query('skipCustomListeners') skipCustomListeners: boolean,
    @Query('skipIoMappings') skipIoMappings: boolean,
  ) {
    return this.safeApiCall(async () => {
      const response = await this.api.deleteDeployment(
        { id, cascade, skipCustomListeners, skipIoMappings },
        await this.createAxiosOptions(req),
      );
      return response.data;
    }, 'Error deleting deployment');
  }

  @Post('create')
  @UseInterceptors(AnyFilesInterceptor(uploadOptions))
  async createDeployment(
    @Req() req: Request,
    @UploadedFiles() files: Array<any>,
    @Body()
    body: {
      deploymentSource?: string | null;
      deploymentName?: string | null;
      deployChangedOnly?: boolean | string | null;
      enableDuplicateFiltering?: boolean | string | null;
    },
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded for deployment');
    }

    return this.safeApiCall(async () => {
      const deploymentSource = body.deploymentSource ?? undefined;
      const deploymentName = body.deploymentName ?? undefined;
      const deployChangedOnly = body.deployChangedOnly ?? false;
      const enableDuplicateFiltering = body.enableDuplicateFiltering ?? false;

      const response = await this.api.createDeployment(
        {
          deploymentSource,
          deploymentName,
          deployChangedOnly,
          enableDuplicateFiltering,
          data: files.map((file: any) => ({
            fieldName: file.fieldname,
            fileName: file.originalname,
            buffer: file.buffer,
            mimeType: file.mimetype,
          })),
        } as any,
        await this.createAxiosOptions(req),
      );

      return response.data;
    }, 'Error creating deployment');
  }
}
