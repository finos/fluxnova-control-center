import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { forkJoin, Observable, of, take } from 'rxjs';
import { MODAL_DEFAULTS } from '@fxn/common';
import { map } from 'rxjs/operators';
import { ButtonActions } from '@fxn/types/src';
import { ItemDetailPageComponent } from '../../item-detail-page.component';
import { DecisionDefinitionService } from '../../../services/decision-definition.service';
import { DecisionDefinitionTabs, PimTab } from '../../item-detail-tab-utils';
import { ToolbarEvent } from '../../../common/toolbar/toolbar.component';
import { ToolbarService } from '../../../common/toolbar/toolbar.service';
import { DecisionInstanceService } from '../../../services/decision-instance.service';
import { EvaluateDecisionModalService } from './evaluate-decision-modal/evaluate-decision-modal.service';

const COUNTS_DEFAULT: { [p: string]: number } = {
  [PimTab.DecisionInstances]: 0,
};

@Component({
  selector: 'fluxnova-decision-definition-details-page',
  templateUrl: '../../item-detail-page.component.html',
  styleUrls: ['../../item-detail-page.component.scss'],
  standalone: false,
})
export class DecisionDefinitionDetailPageComponent extends ItemDetailPageComponent implements OnInit, OnDestroy {
  private toolbarService = inject(ToolbarService);
  private evaluateDecisionModalService = inject(EvaluateDecisionModalService);
  decisionDefinitionService = inject(DecisionDefinitionService);
  decisionInstanceService = inject(DecisionInstanceService);

  ngOnInit() {
    this.isLoading = true;
    this.counts = COUNTS_DEFAULT;

    this.subs$.add(
      this.decisionDefinitionService.getDecisionDefinitionDetail(this.itemId).subscribe({
        next: () => {
          this.isItemFound$ = of(true);
          this.isLoading = false;
        },
        error: (error) => {
          console.log(error);
          this.isLoading = false;
        },
      }),
      this.toolbarService.emitter.subscribe(this.onToolbarButtonClick.bind(this)),
    );
    this.setUpTabs();
  }

  override initTabNames() {
    this.tabs = DecisionDefinitionTabs;
  }

  override getInitialTabCount(tab: PimTab): Observable<number> {
    switch (tab) {
      case PimTab.DecisionInstances:
        return this.decisionInstanceService.getInstancesCount({ decisionDefinitionId: this.itemId });
      default:
        console.error(`No getInitialTabCount implementation for tab ${tab}`);
        return of(0);
    }
  }

  override getInitialTabCountsObservable() {
    return (
      forkJoin([this.getInitialTabCount(PimTab.DecisionInstances)])
        .pipe(
          map(([decisionInstanceCount]) =>
            Object.assign({}, this.counts, {
              [PimTab.DecisionInstances]: decisionInstanceCount,
            }),
          ),
        )
        // Only need this subscription when the component inits
        // If we don't unsubscribe then the counts flicker when filters/sorting change
        .pipe(take(1))
    );
  }

  override getUpdatedTabCountsObservable(tabAndFilter: { tab: string; filter: any }) {
    {
      let serviceObservable: Observable<number> | undefined;

      switch (tabAndFilter.tab) {
        case PimTab.DecisionInstances:
          serviceObservable = this.decisionInstanceService.getInstancesCount(tabAndFilter.filter);
          break;
      }

      return !!serviceObservable && !!tabAndFilter.tab
        ? serviceObservable.pipe(map((count) => ({ [tabAndFilter.tab]: count })))
        : of({});
    }
  }

  async onToolbarButtonClick(event: ToolbarEvent) {
    if (event.action !== 'click') {
      return;
    }

    switch (event.target) {
      case ButtonActions.EVALUATE_DECISION:
        await this.evaluateDecisionModalService.show(
          {
            decisionDefinitionId: this.itemId,
            title: 'Evaluate Decision',
            message:
              'Evaluate a decision with this definition by entering the variable information to use for the evaluation.',
            jsonValue: '',
          },
          {
            ...MODAL_DEFAULTS,
            modalDialogClass: 'dynamic-modal',
          },
        );
        break;
    }
  }

  ngOnDestroy() {
    this.subs$.unsubscribe();
    super.ngOnDestroy();
  }
}
