import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { deploymentDecisionRequirementsDefinitionsColumnDefinitions } from '@fxn/types';
import { SubSink } from 'subsink';
import { DeploymentService } from '../../../../services/deployment.service';
import { DecisionRequirementsDefinitionService } from '../../../../services/decision-requirements-definition';
import { BaseTabComponent } from '../../base-tab-component';
import { PimTab, PimTabRowQueryParam } from '../../../item-detail-tab-utils';
import { PaginatedDataRequest } from '../../../../services/types/paginated-data-request';

@Component({
  selector: 'fluxnova-decision-requirements-definitions',
  templateUrl: './decision-requirements-definitions-tab.component.html',
  styleUrls: [],
  standalone: false,
})
export class DrdTabComponent extends BaseTabComponent implements OnInit, OnDestroy {
  deploymentService = inject(DeploymentService);
  decisionRequirementsDefinitionService = inject(DecisionRequirementsDefinitionService);

  public subs$ = new SubSink();
  public drdResourceName!: string;
  override columnDefinitions = Object.keys(deploymentDecisionRequirementsDefinitionsColumnDefinitions).map(
    (colId: string) => ({
      colId,
      ...deploymentDecisionRequirementsDefinitionsColumnDefinitions[colId],
    }),
  );

  ngOnInit() {
    this.subs$.add(
      this.route.queryParams.subscribe((params) => {
        this.drdResourceName = params['resourceName'];
        this.loadData();
      }),
    );
  }

  get rowItemQueryParam(): PimTabRowQueryParam {
    return PimTabRowQueryParam.Undefined;
  }

  get tab(): PimTab {
    return PimTab.DecisionRequirementsDefinitions;
  }

  override get dataFilter() {
    return {
      deploymentId: this.detailItemId,
      resourceName: this.drdResourceName,
    };
  }

  dataService(request: PaginatedDataRequest): any {
    return this.decisionRequirementsDefinitionService.getDecisionRequirementsDefinitionList(request);
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    this.subs$.unsubscribe();
  }
}
