import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { deploymentDecisionDefinitionColumnDefinitions } from '@fxn/types';
import { SubSink } from 'subsink';
import { DeploymentService } from '../../../../services/deployment.service';
import { DecisionDefinitionService } from '../../../../services/decision-definition.service';
import { BaseTabComponent } from '../../base-tab-component';
import { PimTab, PimTabRowQueryParam } from '../../../item-detail-tab-utils';
import { PaginatedDataRequest } from '../../../../services/types/paginated-data-request';

@Component({
  selector: 'fluxnova-decision-definition',
  templateUrl: './decision-definitions-tab.component.html',
  styleUrls: [],
  standalone: false,
})
export class DecisionDefinitionsTabComponent extends BaseTabComponent implements OnInit, OnDestroy {
  deploymentService = inject(DeploymentService);
  decisionDefinitionService = inject(DecisionDefinitionService);

  public subs$ = new SubSink();
  public decisionDefinitionResourceName!: string;
  override columnDefinitions = Object.keys(deploymentDecisionDefinitionColumnDefinitions).map((colId: string) => ({
    colId,
    ...deploymentDecisionDefinitionColumnDefinitions[colId],
  }));

  ngOnInit() {
    this.subs$.add(
      this.route.queryParams.subscribe((params) => {
        this.decisionDefinitionResourceName = params['resourceName'];
        this.loadData();
      }),
    );
  }

  get rowItemQueryParam(): PimTabRowQueryParam {
    return PimTabRowQueryParam.DecisionInstances;
  }

  get tab(): PimTab {
    return PimTab.Definitions;
  }

  get tabVariant(): string {
    return 'dmn';
  }

  override get dataFilter() {
    return {
      deploymentId: this.detailItemId,
      resourceName: this.decisionDefinitionResourceName,
    };
  }

  dataService(request: PaginatedDataRequest): any {
    return this.decisionDefinitionService.getDecisionDefinitionList(request);
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    this.subs$.unsubscribe();
  }
}
