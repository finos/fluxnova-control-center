import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { DecisionDefinition, DecisionInstance } from '@fxn/types';
import { SubSink } from 'subsink';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { DecisionDefinitionService } from '../../../../services/decision-definition.service';
import { DecisionInstanceService } from '../../../../services/decision-instance.service';

@Component({
  selector: 'fluxnova-decision-instance-info-section',
  templateUrl: './decision-instance-info-section.component.html',
  styleUrl: './decision-instance-info-section.component.scss',
  standalone: false,
})
export class DecisionInstanceInfoSectionComponent implements OnInit, OnDestroy {
  route = inject(ActivatedRoute);
  router = inject(Router);
  private decisionDefinitionService = inject(DecisionDefinitionService);
  private decisionInstanceService = inject(DecisionInstanceService);

  decisionInstance?: DecisionInstance | DecisionDefinition;
  isLoading = false;
  subSink = new SubSink();

  ngOnInit() {
    const instanceId = this.route.snapshot.params?.instanceId;
    const definitionId = this.route.snapshot.params?.id;

    this.subSink.add(
      forkJoin([
        this.decisionInstanceService.getInstance(instanceId),
        this.decisionDefinitionService.getDecisionDefinitionDetail(definitionId),
      ])
        .pipe(
          map(([instance, definition]) => ({
            ...instance,
            version: definition.version,
            deploymentId: definition.deploymentId,
          })),
        )
        .subscribe((instance) => {
          this.decisionInstance = instance;
        }),
    );
  }

  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }
}
