import globalAxios, { AxiosResponse, RawAxiosRequestConfig } from 'axios';
import FormData from 'form-data';
import { DeploymentApi, DeploymentApiAxiosParamCreator, DeploymentDto } from '../generated';
import { BASE_PATH, operationServerMap } from '../generated/base';
import { createRequestFunction } from '../generated/common';

export interface DeploymentUploadFile {
  fieldName?: string;
  fileName: string;
  buffer: Buffer;
  mimeType?: string;
}

export interface DeploymentApiCreateDeploymentMultiRequest {
  tenantId?: string | null;
  deploymentSource?: string | null;
  deployChangedOnly?: boolean | null;
  enableDuplicateFiltering?: boolean | null;
  deploymentName?: string | null;
  deploymentActivationTime?: string | null;
  data: DeploymentUploadFile | DeploymentUploadFile[];
}

export class DeploymentService extends DeploymentApi {
  /**
   * TODO: Delete this functionality when the generated api for create deployment supports multiple files.
   *
   * Overrides generated createDeployment to support sending many files in one request.
   * The generated client only supports a single file parameter named 'data'. Fluxnova supports
   * multiple binaries as long as each form part has a different name. The Fluxnova API Spec has been updated
   * and the generated client supports multiple files, this method should hopefully no longer be necessary and be removed.
   */
  public override async createDeployment(
    requestParameters: any = {},
    options?: RawAxiosRequestConfig,
  ): Promise<AxiosResponse<DeploymentDto>> {
    const filesInput = (requestParameters as DeploymentApiCreateDeploymentMultiRequest).data;
    let files: DeploymentUploadFile[];
    if (Array.isArray(filesInput)) {
      files = filesInput;
    } else if (filesInput) {
      files = [filesInput];
    } else {
      throw new Error('DeploymentService.createDeployment requires at least one file in the "data" field.');
    }

    const p = requestParameters as DeploymentApiCreateDeploymentMultiRequest;

    const localVarAxiosParamCreator = DeploymentApiAxiosParamCreator(this.configuration);
    const localVarAxiosArgs = await localVarAxiosParamCreator.createDeployment(
      p.tenantId ?? undefined,
      p.deploymentSource ?? undefined,
      p.deployChangedOnly ?? undefined,
      p.enableDuplicateFiltering ?? undefined,
      p.deploymentName ?? undefined,
      p.deploymentActivationTime ?? undefined,
      undefined as any,
      options,
    );

    const form = new FormData();
    if (p.tenantId != null) form.append('tenant-id', p.tenantId);
    if (p.deploymentSource != null) form.append('deployment-source', p.deploymentSource);
    if (p.deployChangedOnly != null) form.append('deploy-changed-only', String(p.deployChangedOnly));
    if (p.enableDuplicateFiltering != null)
      form.append('enable-duplicate-filtering', String(p.enableDuplicateFiltering));
    if (p.deploymentName != null) form.append('deployment-name', p.deploymentName);
    if (p.deploymentActivationTime != null) form.append('deployment-activation-time', p.deploymentActivationTime);

    files.forEach((f, idx) => {
      const partName = (f.fieldName && f.fieldName.trim()) || (idx === 0 ? 'data' : `data${idx + 1}`);
      form.append(partName, f.buffer, {
        filename: f.fileName,
        contentType: f.mimeType || 'application/octet-stream',
      });
    });

    localVarAxiosArgs.options.data = form;
    localVarAxiosArgs.options.headers = {
      ...(localVarAxiosArgs.options.headers || {}),
      ...(options?.headers || {}),
      ...form.getHeaders(),
    };

    const localVarOperationServerIndex = this.configuration?.serverIndex ?? 0;
    const localVarOperationServerBasePath =
      operationServerMap['DeploymentApi.createDeployment']?.[localVarOperationServerIndex]?.url;

    return await createRequestFunction(
      localVarAxiosArgs,
      globalAxios,
      BASE_PATH,
      this.configuration,
    )(this.axios, localVarOperationServerBasePath || this.basePath);
  }
}
