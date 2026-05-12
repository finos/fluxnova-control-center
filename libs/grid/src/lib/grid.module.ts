import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  NgbDatepickerModule,
  NgbPaginationModule,
  NgbPopoverModule,
  NgbToastModule,
  NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { DateFormatPipe, GeneralModule } from '@fxn/common';
import { AgPaginationComponent } from './ag-pagination/ag-pagination.component';
import { DateInputComponent } from './date-input/date-input.component';
import { DateRendererComponent } from './date-renderer.component';
import { DefaultFloatingFilterComponent } from './default-floating-filter/default-floating-filter.component';
import { FloatingDateInputFilterComponent } from './floating-date-input-filter/floating-date-input-filter.component';
import { HistoryLinkRendererComponent } from './history-link-renderer/history-link-renderer.component';
import { LinkRendererComponent } from './link-renderer.component';
import { IconLinkRendererComponent } from './icon-link-renderer.component';
import { MultiSelectFloatingFilterComponent } from './multi-select-floating-filter/multi-select-floating-filter.component';
import { SingleSelectFloatingFilterComponent } from './single-select-floating-filter/single-select-floating-filter.component';
import { TooltipHeaderComponent } from './tooltip-header.component';
import { TruncateWithTooltipRendererComponent } from './truncate-with-tooltip-renderer.component';
import { ActivityNameFromDomRendererComponent } from './activity-name-from-dom-renderer.component';
import { TextWithLabelRendererComponent } from './text-with-label-renderer.component';
import { VersionFloatingFilterComponent } from './version-floating-filter/version-floating-filter.component';
import { LoadAllRowsComponent } from './load-all-rows-component/load-all-rows.component';
import { EditVariablesControlsRendererComponent } from './edit-variables-controls-renderer.component';
import { AddButtonFloatingFilterComponent } from './add-button-floating-filter/add-button-floating-filter.component';
import { BatchProgressRendererComponent } from './batch-progress/batch-progress-renderer.component';
import { JobStateRendererComponent } from './job-state/job-state-renderer';

@NgModule({
  declarations: [
    AgPaginationComponent,
    LinkRendererComponent,
    IconLinkRendererComponent,
    TruncateWithTooltipRendererComponent,
    BatchProgressRendererComponent,
    JobStateRendererComponent,
    TooltipHeaderComponent,
    ActivityNameFromDomRendererComponent,
    EditVariablesControlsRendererComponent,
    TextWithLabelRendererComponent,
    DateRendererComponent,
    DateInputComponent,
    FloatingDateInputFilterComponent,
    MultiSelectFloatingFilterComponent,
    SingleSelectFloatingFilterComponent,
    HistoryLinkRendererComponent,
    DefaultFloatingFilterComponent,
    VersionFloatingFilterComponent,
    LoadAllRowsComponent,
    AddButtonFloatingFilterComponent,
  ],
  imports: [
    NgbTooltipModule,
    CommonModule,
    FormsModule,
    NgSelectModule,
    RouterModule,
    GeneralModule,
    NgbPaginationModule,
    NgbToastModule,
    NgbDatepickerModule,
    NgbPopoverModule,
  ],
  exports: [AgPaginationComponent],
  providers: [DateFormatPipe],
})
export class GridModule {}
