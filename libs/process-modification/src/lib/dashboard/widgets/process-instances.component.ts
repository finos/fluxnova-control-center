import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import pluralize from 'pluralize';
import { WINDOW } from 'ngx-window-token';
import { ProcessInstanceService } from '../../services/process-instance.service';
import { PaginatedDataRequest } from '../../services/types/paginated-data-request';
import { WidgetBase } from './widget-base';

@Component({
  selector: 'fluxnova-process-instances',
  styleUrls: ['./widget-base.scss'],
  templateUrl: './widget-base.component.html',
  standalone: false,
})
export class ProcessInstancesComponent extends WidgetBase implements OnInit, OnDestroy {
  private instanceService = inject(ProcessInstanceService);
  protected window = inject<Window>(WINDOW);

  protected override queryParams = () =>
    `filters={"state":{"filterType":"select","filter":"unfinished","type":"equals"},"startTime":{"dateFrom":"${this.calculatedTimeFrame}","type":"after"},"processDefinitionKey":{"filterType":"textArray","filter":"${this.selectedDefinitionKey}","type":"multi"}}&sorting=[{"colId":"startTime","sort":"desc"}]&toggleFilters=`;

  constructor() {
    super('process-instances');
  }

  ngOnInit() {
    super.onInit();
  }

  ngOnDestroy() {
    super.onDestroy();
  }

  override loadData() {
    super.loadData();

    this.subSink.add(
      this.instanceService
        .getProcessInstancesByFilter(
          new PaginatedDataRequest(
            {
              unfinished: true,
              startedAfter: this.calculatedTimeFrame,
              sorting: [
                {
                  sortBy: 'definitionKey',
                  sortOrder: 'desc',
                },
              ],
            },
            this.MAX_ITEM_COUNT,
          ),
        )
        .subscribe(this.onDataLoaded.bind(this)),
    );
  }

  get widgetTitle(): string {
    return `Unfinished <b>Process Instances</b> started in the last ${this.selectedTimeFrameAmount} ${pluralize(this.selectedTimeFrameUnit, this.selectedTimeFrameAmount)}`;
  }
}
