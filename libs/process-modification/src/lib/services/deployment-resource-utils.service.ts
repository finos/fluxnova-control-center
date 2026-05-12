import { inject, Injectable } from '@angular/core';
import { DeploymentResource, DIAGRAM_TYPE } from '@fxn/types';
import { downloadDataBuffer } from '@fxn/common';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DeploymentResourceUtilsService {
  private http = inject(HttpClient);

  private readonly fileTypeMap = [
    { suffix: '.js', language: 'javascript' as const },
    { suffix: '.ts', language: 'javascript' as const },
    { suffix: '.groovy', language: 'java' as const }, // Groovy is based on java so use java's syntax
    { suffix: '.xml', language: 'xml' as const },
  ];

  public isBPMN(resource?: DeploymentResource) {
    return this.isMatchingSuffix(resource, '.bpmn');
  }

  public isDMN(resource?: DeploymentResource) {
    return this.isMatchingSuffix(resource, '.dmn');
  }

  public getDiagramType(resource?: DeploymentResource): DIAGRAM_TYPE {
    if (this.isBPMN(resource)) return DIAGRAM_TYPE.BPMN;
    else return DIAGRAM_TYPE.DMN;
  }

  public isDiagram(resource?: DeploymentResource) {
    return this.isBPMN(resource) || this.isDMN(resource);
  }

  public getViewableFileLanguage(resource?: DeploymentResource) {
    const matchedMapping = this.fileTypeMap.find((mapping) => this.isMatchingSuffix(resource, mapping.suffix));
    return matchedMapping ? matchedMapping.language : undefined;
  }

  public getSuffix(deploymentResource?: DeploymentResource) {
    const fileName = deploymentResource?.name ?? '';
    const lastIndexOfPeriod = fileName.lastIndexOf('.');
    return fileName.slice(lastIndexOfPeriod);
  }

  public getResourceData(resource: DeploymentResource) {
    return this.getResourceDataBuffer(resource).pipe(
      map((data: ArrayBuffer) => {
        const decoder = new TextDecoder();
        return { data: decoder.decode(data) };
      }),
    );
  }

  public getResourceDataBuffer(resource: DeploymentResource) {
    return this.http.get<any>(`api/deployment/${resource.deploymentId}/resource/${resource.id}/data`, {
      responseType: 'arraybuffer' as 'json',
    });
  }

  public getDiagramDataBuffer(processDefinitionId: string) {
    return this.http.get<any>(`api/process-definitions/${processDefinitionId}/diagram/xml`, {
      responseType: 'arraybuffer' as 'json',
    });
  }

  public downloadDeploymentResource(resource: DeploymentResource) {
    this.getResourceDataBuffer(resource).subscribe(
      (arrayBuffer) => downloadDataBuffer(arrayBuffer, resource.name),
      (err) => throwError(err),
    );
  }

  public downloadDiagramResource(processDefinitionId: string, processDefinitionKey: string) {
    this.getDiagramDataBuffer(processDefinitionId).subscribe(
      // TODO: Currently using the process definition key as a more human readable name for the file,
      //  however, it would be good to see if we can get the resource name here.
      (arrayBuffer) => downloadDataBuffer(arrayBuffer, (processDefinitionKey + '.bpmn').toLowerCase()),
      (err) => throwError(err),
    );
  }

  private isMatchingSuffix(deploymentResource?: DeploymentResource, fileExtension?: string) {
    return !!deploymentResource && !!fileExtension && this.getSuffix(deploymentResource) === fileExtension;
  }
}
