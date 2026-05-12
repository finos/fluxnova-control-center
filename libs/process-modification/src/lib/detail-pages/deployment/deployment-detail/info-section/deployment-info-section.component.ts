import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { DeploymentProcess, DeploymentResource, DeploymentResponse } from '@fxn/types';
import { SubSink } from 'subsink';
import { ActivatedRoute, Router } from '@angular/router';
import { pageSizeMax } from '@fxn/grid';
import { DeploymentService } from '../../../../services/deployment.service';
import { ProcessDefinitionService } from '../../../../services/process-definition.service';

import { PaginatedDataRequest } from '../../../../services/types/paginated-data-request';
import { DecisionDefinitionService } from '../../../../services/decision-definition.service';

@Component({
  selector: 'fluxnova-deployment-info-section',
  templateUrl: './deployment-info-section.component.html',
  styleUrls: ['./deployment-info-section.component.scss'],
  standalone: false,
})
export class DeploymentInfoSectionComponent implements OnInit, OnDestroy {
  deploymentService = inject(DeploymentService);
  route = inject(ActivatedRoute);
  router = inject(Router);
  processDefinitionService = inject(ProcessDefinitionService);
  decisionDefinitionService = inject(DecisionDefinitionService);

  public deployment: { deployment?: DeploymentResponse; resources?: DeploymentResource[] } = {};
  public deploymentProcessResourceList: DeploymentProcess[] = [];

  isLoading = false;
  subs = new SubSink();
  public prettyDeploymentTime = '';
  public selectedResourceName = '';
  get itemId(): string {
    return this.route.snapshot.params.id;
  }

  ngOnInit() {
    this.subs.add(
      this.deploymentService.getDeploymentDetails(this.itemId).subscribe((response) => {
        this.deployment = response;
        this.prettyDeploymentTime = this.formatDate(this.deployment.deployment?.deploymentTime as string);
        if (this.deployment.resources) this.handleSelectResource(this.deployment.resources[0]);
      }),
      this.processDefinitionService
        .getProcessDefinitionsByFilter(new PaginatedDataRequest({ deploymentId: this.itemId }, pageSizeMax))
        .subscribe((processDefinitions) => {
          this.deploymentProcessResourceList = processDefinitions.map((processDefinition) => ({
            id: processDefinition.id,
            name: processDefinition.name,
            key: processDefinition.key,
            fileName: processDefinition.resource,
            version: processDefinition.version,
            instanceCount: 0,
          }));
        }),
      this.decisionDefinitionService
        .getDecisionDefinitionList(new PaginatedDataRequest({ deploymentId: this.itemId }, pageSizeMax))
        .subscribe((decisionDefinitions) => {
          decisionDefinitions.forEach((decisionDefinition) => {
            this.deploymentProcessResourceList.push({
              id: decisionDefinition.id,
              name: decisionDefinition.name,
              key: decisionDefinition.key,
              fileName: decisionDefinition.resource,
              version: decisionDefinition.version,
            });
          });
        }),
    );
  }

  formatDate(date: string) {
    const myDate = new Date(date);

    const year = myDate.getFullYear();
    const month = (myDate.getMonth() + 1).toString().padStart(2, '0');
    const day = myDate.getDate().toString().padStart(2, '0');
    const hours = myDate.getHours().toString().padStart(2, '0');
    const minutes = myDate.getMinutes().toString().padStart(2, '0');
    const seconds = myDate.getSeconds().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  handleResourceClick(resource: DeploymentResource) {
    this.handleSelectResource(resource);
  }

  handleSelectResource(resource: DeploymentResource) {
    this.selectedResourceName = resource.name;
    this.deploymentService.setSelectedResource(resource);
  }

  get version(): number {
    const foundResource = this.deploymentProcessResourceList.find(
      (deploymentProcess) => deploymentProcess.fileName === this.selectedResourceName,
    );
    if (foundResource) return foundResource.version ? foundResource.version : -1;
    return -1;
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
