import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import {
  BPMN_COLUMN_DEFINITIONS,
  ColDefWithFilterParams,
  DeploymentProcess,
  DeploymentResource,
  ProcessDefinition,
  ProcessDefinitionFilter,
} from '@fxn/types';
import { SubSink } from 'subsink';
import { concatMap, forkJoin, map, Observable, of } from 'rxjs';
import { DeploymentService } from '../../../services/deployment.service';
import { ProcessDefinitionService } from '../../../services/process-definition.service';
import { ProcessInstanceService } from '../../../services/process-instance.service';
import { BaseTabComponent } from '../base-tab-component';
import { PimTab, PimTabRowQueryParam } from '../../item-detail-tab-utils';
import { PaginatedDataRequest } from '../../../services/types/paginated-data-request';

@Component({
  selector: 'fluxnova-process-definition-info-tab',
  templateUrl: './process-definition-info-tab.component.html',
  styleUrls: ['./process-definition-info-tab.component.scss'],
  standalone: false,
})
export class ProcessDefinitionInfoTabComponent extends BaseTabComponent implements OnInit, OnDestroy {
  deploymentService = inject(DeploymentService);
  processDefinitionService = inject(ProcessDefinitionService);
  processInstanceService = inject(ProcessInstanceService);

  public subs$ = new SubSink();
  public selectedResource?: DeploymentResource;
  public isLoading = true;
  links$?: Observable<DeploymentProcess[] | undefined>;
  columnDefinitions: ColDefWithFilterParams[] = Object.values(BPMN_COLUMN_DEFINITIONS);

  get rowItemQueryParam(): PimTabRowQueryParam {
    return PimTabRowQueryParam.Instances;
  }

  get tab(): PimTab {
    return PimTab.Definitions;
  }

  get tabVariant(): string {
    return 'bpmn';
  }

  override get dataFilter(): ProcessDefinitionFilter {
    return { deploymentId: this.detailItemId, resourceName: this.selectedResource?.name };
  }

  ngOnInit() {
    this.subs$.add(
      this.deploymentService.selectedResource.subscribe((value) => {
        this.selectedResource = value;
        this.loadData();
      }),
    );
  }

  dataService(request: PaginatedDataRequest): any {
    return this.processDefinitionService.getProcessDefinitionsByFilter(request).pipe(
      concatMap((processDefinitionResponse: ProcessDefinition[]) => {
        if (processDefinitionResponse.length > 0)
          return forkJoin(
            processDefinitionResponse.map((processDefinition) =>
              this.processInstanceService
                .getProcessInstanceCountByFilter({ processDefinitionId: processDefinition.id })
                .pipe(
                  map((count) => ({
                    processDefinitionId: processDefinition.id,
                    processDefinitionName: processDefinition.name,
                    key: processDefinition.key,
                    fileName: processDefinition.resource,
                    instanceCount: count,
                    processDefinitionVersion: processDefinition.version,
                  })),
                ),
            ),
          );
        else {
          return of([]);
        }
      }),
    );
  }

  onDataLoad(data: any[]) {
    super.onDataLoad(data);

    this.links$ = of(data.filter((resource) => resource.fileName === this.selectedResource?.name));
  }
}
