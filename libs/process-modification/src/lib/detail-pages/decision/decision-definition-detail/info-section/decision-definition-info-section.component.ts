import { Component, EventEmitter, inject, OnDestroy, OnInit, Output } from '@angular/core';
import { DecisionDefinition, MAX_RESULT_COUNT } from '@fxn/types';
import { SubSink } from 'subsink';
import { ActivatedRoute, Router } from '@angular/router';
import { keyBy } from 'lodash-es';
import { getUrlSegments } from '@fxn/common';
import { DecisionDefinitionService } from '../../../../services/decision-definition.service';

@Component({
  selector: 'fluxnova-decision-definition-info-section',
  templateUrl: './decision-definition-info-section.component.html',
  styleUrl: './decision-definition-info-section.component.scss',
  standalone: false,
})
export class DecisionDefinitionInfoSectionComponent implements OnInit, OnDestroy {
  route = inject(ActivatedRoute);
  router = inject(Router);
  private decisionDefinitionService = inject(DecisionDefinitionService);

  decisionDefinition?: DecisionDefinition | null = null;
  isLoading = false;
  subSink = new SubSink();
  versions?: DecisionDefinition[] = [];

  mapIdToDecisionDefinition: { [id: string]: DecisionDefinition } = {};

  @Output() versionSelected = new EventEmitter<string>();

  onChange(id: string) {
    this.router.navigate([getUrlSegments(this.router.url).tenant, `decision-definitions`, id], {
      replaceUrl: true,
    });
  }

  ngOnInit() {
    this.subSink.add(this.getDecisionDefinitionSubscription());
  }

  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  private getDecisionDefinitionSubscription() {
    const idFromRoute = this.route.snapshot.params?.id;

    return this.decisionDefinitionService.getDecisionDefinitionVersionList(idFromRoute, MAX_RESULT_COUNT).subscribe({
      next: (decisionDefinitionList) => {
        this.versions = decisionDefinitionList.sort(
          (item1: DecisionDefinition, item2: DecisionDefinition) => item1.version - item2.version,
        );
        this.mapIdToDecisionDefinition = keyBy(decisionDefinitionList, 'id');
        this.currentVersionDefinitionId = idFromRoute;
        this.isLoading = false;
      },
      error: (e) => {
        console.error(e);
      },
    });
  }

  set currentVersionDefinitionId(id: string) {
    this.decisionDefinition = this.mapIdToDecisionDefinition[id];
  }

  get currentVersionDefinitionId() {
    return this.decisionDefinition?.id ?? '';
  }
}
