import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import pluralize from 'pluralize';
import { WINDOW } from 'ngx-window-token';
import { map } from 'rxjs/operators';
import { IncidentService } from '../../services/incident.service';
import { PaginatedDataRequest } from '../../services/types/paginated-data-request';
import { WidgetBase } from './widget-base';

@Component({
  selector: 'fluxnova-incident-volume',
  styleUrls: ['./widget-base.scss'],
  templateUrl: './widget-base.component.html',
  standalone: false,
})
export class IncidentVolumeComponent extends WidgetBase implements OnInit, OnDestroy {
  private incidentsService = inject(IncidentService);
  protected window = inject<Window>(WINDOW);

  constructor() {
    super('incidents');
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
      this.incidentsService
        .getIncidentsByFilterAndPagination(
          new PaginatedDataRequest(
            {
              open: true,
              createTimeAfter: this.calculatedTimeFrame,
              sortBy: 'processDefinitionKey',
              sortOrder: 'desc',
            },
            this.MAX_ITEM_COUNT,
          ),
        )
        .pipe(
          map((incidents) =>
            incidents.map(({ processDefinitionKey, processDefinitionId, ...rest }) => ({
              // When incidents are associated with a batch, they are not process specific.
              // Indicate that instead of just showing "null" in these cases.
              processDefinitionKey: processDefinitionKey ?? '(not process specific)',
              processDefinitionId: processDefinitionId ?? '(not process specific)',
              ...rest,
            })),
          ),
        )
        .subscribe(this.onDataLoaded.bind(this)),
    );
  }

  get widgetTitle(): string {
    return `Unresolved <b>Incidents</b> opened in the last ${this.selectedTimeFrameAmount} ${pluralize(this.selectedTimeFrameUnit, this.selectedTimeFrameAmount)}`;
  }
}
