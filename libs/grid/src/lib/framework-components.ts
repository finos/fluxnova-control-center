import { GridRendererComponentKey } from '@fxn/types/src';
import { LinkRendererComponent } from './link-renderer.component';
import { IconLinkRendererComponent } from './icon-link-renderer.component';
import { BatchProgressRendererComponent } from './batch-progress/batch-progress-renderer.component';
import { JobStateRendererComponent } from './job-state/job-state-renderer';
import { DateRendererComponent } from './date-renderer.component';
import { AddButtonFloatingFilterComponent } from './add-button-floating-filter/add-button-floating-filter.component';
import { EditVariablesControlsRendererComponent } from './edit-variables-controls-renderer.component';
import { TextWithLabelRendererComponent } from './text-with-label-renderer.component';
import { TruncateWithTooltipRendererComponent } from './truncate-with-tooltip-renderer.component';
import { TooltipHeaderComponent } from './tooltip-header.component';
import { DateInputComponent } from './date-input/date-input.component';
import { MultiSelectFloatingFilterComponent } from './multi-select-floating-filter/multi-select-floating-filter.component';
import { SingleSelectFloatingFilterComponent } from './single-select-floating-filter/single-select-floating-filter.component';
import { FloatingDateInputFilterComponent } from './floating-date-input-filter/floating-date-input-filter.component';
import { DefaultFloatingFilterComponent } from './default-floating-filter/default-floating-filter.component';
import { VersionFloatingFilterComponent } from './version-floating-filter/version-floating-filter.component';
import { StackTraceRendererComponent } from './stack-trace-renderer.component';
import { ActivityNameFromDomRendererComponent } from './activity-name-from-dom-renderer.component';

export const frameworkComponents: Record<GridRendererComponentKey, any> = {
  linkRenderer: LinkRendererComponent,
  iconLinkRenderer: IconLinkRendererComponent,
  batchProgressRenderer: BatchProgressRendererComponent,
  jobStateRenderer: JobStateRendererComponent,
  dateRenderer: DateRendererComponent,
  addButtonFloatingFilter: AddButtonFloatingFilterComponent,
  editControlsRenderer: EditVariablesControlsRendererComponent,
  textWithLabelRenderer: TextWithLabelRendererComponent,
  truncateWithTooltipRenderer: TruncateWithTooltipRendererComponent,
  agColumnHeader: TooltipHeaderComponent,
  agDateInput: DateInputComponent,
  multiSelectFloatingFilter: MultiSelectFloatingFilterComponent,
  singleSelectFloatingFilter: SingleSelectFloatingFilterComponent,
  dateInputFloatingFilter: FloatingDateInputFilterComponent,
  defaultFloatingFilter: DefaultFloatingFilterComponent,
  versionFloatingFilter: VersionFloatingFilterComponent,
  stackTraceRenderer: StackTraceRendererComponent,
  activityNameFromDOMRenderer: ActivityNameFromDomRendererComponent,
};
