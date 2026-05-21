import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule, NgIf } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  NgbCollapseModule,
  NgbDatepickerModule,
  NgbDropdownModule,
  NgbModal,
  NgbModalModule,
  NgbNavModule,
  NgbPopoverModule,
  NgbTimepickerModule,
  NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { LetDirective } from '@ngrx/component';
import { AuthModule, GeneralModule, LayoutModule } from '@fxn/common';
import { GridModule } from '@fxn/grid';
import { AgGridModule } from 'ag-grid-angular';
import { ResizableModule } from 'angular-resizable-element';
import { AngularSplitModule } from 'angular-split';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ItemDetailPageComponent } from './detail-pages/item-detail-page.component';
import { ItemsTableComponent } from './common/items-table/items-table.component';
import { JobListComponent } from './list-pages/job/job-list.component';
import { ProcessDefinitionListComponent } from './list-pages/process-definition/process-definition-list.component';
import { ProcessInstanceListComponent } from './list-pages/process-instance/process-instance-list.component';
import { IncidentListComponent } from './list-pages/incident/incident-list.component';
import { ContextMenuComponent } from './detail-pages/diagram-section/context-menu/context-menu.component';
import { ContextMenuItemComponent } from './detail-pages/diagram-section/context-menu/context-menu-item.component';
import { DiagramToolbarComponent } from './detail-pages/diagram-section/diagram-toolbar/diagram-toolbar.component';
import { ApplyChangesConfirmModalComponent } from './detail-pages/diagram-section/apply-changes-modal/confirm-modal.component';
import { HeatmapSettingsModalComponent } from './detail-pages/diagram-section/heatmap-settings-modal/heatmap-settings-modal.component';
import { ToggleFiltersComponent } from './common/toggle-filters/toggle-filters.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DiagramLegendComponent } from './detail-pages/diagram-section/legend/diagram-legend.component';
import { IncidentVolumeComponent } from './dashboard/widgets/incident-volume.component';
import { ProcessInstancesComponent } from './dashboard/widgets/process-instances.component';
import { ToolbarComponent } from './common/toolbar/toolbar.component';
import { ToolbarButtonComponent } from './common/toolbar/toolbar-button.component';
import { GenericDiagramSectionViewComponent } from './common/diagram/generic-diagram-viewer.component';
import { DecisionDiagramViewerComponent } from './common/diagram/decision-diagram-viewer.component';
import { DeploymentListComponent } from './list-pages/deployment/deployment-list.component';
import { DecisionDefinitionListComponent } from './list-pages/decision-definition/decision-definition-list.component';
import { BatchListComponent } from './list-pages/batch/batch-list.component';
import { DecisionDefinitionDetailPageComponent } from './detail-pages/decision/decision-definition-detail/decision-definition-detail-page.component';
import { DecisionDefinitionInfoSectionComponent } from './detail-pages/decision/decision-definition-detail/info-section/decision-definition-info-section.component';
import { DecisionInstancesTabComponent } from './detail-pages/tabs/decision-instance/decision-instances-tab.component';
import { DecisionInstanceDetailPageComponent } from './detail-pages/decision/decision-instance-detail/decision-instance-detail-page.component';
import { DecisionInstanceInfoSectionComponent } from './detail-pages/decision/decision-instance-detail/info-section/decision-instance-info-section.component';
import { DeploymentInfoSectionComponent } from './detail-pages/deployment/deployment-detail/info-section/deployment-info-section.component';
import { DecisionDefinitionsTabComponent } from './detail-pages/tabs/dmn/decision-definitions/decision-definitions-tab.component';
import { DrdTabComponent } from './detail-pages/tabs/dmn/decision-requirements-definitions/decision-requirements-definitions-tab.component';
import { DeploymentDetailsPageComponent } from './detail-pages/deployment/deployment-detail/deployment-detail-page.component';
import { ProcessDefinitionInfoTabComponent } from './detail-pages/tabs/bpmn/process-definition-info-tab.component';
import { ProcessVariableModalComponent } from './detail-pages/process-instance/process-variable-modal/process-variable-modal.component';
import { StartProcessDefinitionModalComponent } from './detail-pages/process-definition/modals/start-process-definition-modal/start-process-definition-modal.component';
import { FileViewComponent } from './detail-pages/deployment/deployment-detail/file-viewer/file-view.component';
import { HistoryTabComponent } from './detail-pages/tabs/history/history-tab.component';
import { IncidentsTabComponent } from './detail-pages/tabs/incidents/incidents-tab.component';
import { InstancesTabComponent } from './detail-pages/tabs/process-instance/instances-tab.component';
import { JobDefinitionsTabComponent } from './detail-pages/tabs/job-definition/job-definitions-tab.component';
import { CalledProcessDefinitionsTabComponent } from './detail-pages/tabs/called-process-definition/called-process-definitions-tab.component';
import { CalledProcessInstancesTabComponent } from './detail-pages/tabs/called-process-instance/called-process-instances-tab.component';
import { JobsTabComponent } from './detail-pages/tabs/job/jobs-tab.component';
import { MigrateModalComponent } from './detail-pages/process-definition/modals/migrate-modal/migrate-modal.component';
import { ProcessDefinitionDetailPageComponent } from './detail-pages/process-definition/process-definition-detail/process-definition-detail-page.component';
import { ProcessDefinitionInfoSectionComponent } from './detail-pages/process-definition/process-definition-detail/info-section/process-definition-info-section.component';
import { ProcessInstanceDetailPageComponent } from './detail-pages/process-instance/process-instance-detail/process-instance-detail-page.component';
import { ProcessInstanceInfoSectionComponent } from './detail-pages/process-instance/process-instance-detail/info-section/process-instance-info-section.component';
import { VariablesTabComponent } from './detail-pages/tabs/variable/variables-tab.component';
import { InputOutputTabComponent } from './detail-pages/tabs/input-output/input-output-tab.component';
import { EvaluateDecisionModalComponent } from './detail-pages/decision/decision-definition-detail/evaluate-decision-modal/evaluate-decision-modal.component';
import { ModalService } from './services/modal.service';
import { BatchDetailsComponent } from './detail-pages/batch/batch-details/batch-details.component';
import { FailedJobsTabComponent } from './detail-pages/batch/batch-details/failed-jobs-tab.component';
import { JobLogsTabComponent } from './detail-pages/batch/batch-details/job-logs-tab.component';
import { RemainingJobsTabComponent } from './detail-pages/batch/batch-details/remaining-jobs-tab.component';
import { UserTasksTabComponent } from './detail-pages/tabs/user-tasks/user-tasks-tab.component';
import { BatchInfoSectionComponent } from './detail-pages/batch/batch-details/info-section/batch-info-section.component';
import { ActionsFloatingContainerComponent } from './detail-pages/tabs/actions-floating-container/actions-floating-container.component';

@NgModule({
  declarations: [
    DecisionDefinitionDetailPageComponent,
    DecisionDefinitionInfoSectionComponent,
    DecisionInstancesTabComponent,
    DecisionInstanceDetailPageComponent,
    DecisionInstanceInfoSectionComponent,
    DeploymentInfoSectionComponent,
    DecisionDefinitionsTabComponent,
    DrdTabComponent,
    DeploymentDetailsPageComponent,
    EvaluateDecisionModalComponent,
    ProcessDefinitionInfoTabComponent,
    ProcessVariableModalComponent,
    ApplyChangesConfirmModalComponent,
    HeatmapSettingsModalComponent,
    StartProcessDefinitionModalComponent,
    ContextMenuComponent,
    ContextMenuItemComponent,
    DashboardComponent,
    DiagramLegendComponent,
    DiagramToolbarComponent,
    FileViewComponent,
    HistoryTabComponent,
    IncidentListComponent,
    IncidentVolumeComponent,
    IncidentsTabComponent,
    InstancesTabComponent,
    ItemDetailPageComponent,
    ItemsTableComponent,
    JobDefinitionsTabComponent,
    CalledProcessDefinitionsTabComponent,
    CalledProcessInstancesTabComponent,
    JobListComponent,
    JobsTabComponent,
    MigrateModalComponent,
    ProcessDefinitionDetailPageComponent,
    ProcessDefinitionInfoSectionComponent,
    ProcessDefinitionListComponent,
    ProcessInstanceDetailPageComponent,
    ProcessInstanceInfoSectionComponent,
    ProcessInstanceListComponent,
    ProcessInstancesComponent,
    ToggleFiltersComponent,
    ToolbarButtonComponent,
    ToolbarComponent,
    VariablesTabComponent,
    DecisionDefinitionDetailPageComponent,
    DecisionInstancesTabComponent,
    DecisionInstanceDetailPageComponent,
    DecisionInstanceInfoSectionComponent,
    InputOutputTabComponent,
    DeploymentListComponent,
    DecisionDefinitionListComponent,
    BatchListComponent,
    BatchDetailsComponent,
    BatchInfoSectionComponent,
    FailedJobsTabComponent,
    JobLogsTabComponent,
    RemainingJobsTabComponent,
    UserTasksTabComponent,
    ActionsFloatingContainerComponent,
  ],
  imports: [
    AgGridModule,
    AngularSplitModule,
    AuthModule,
    CommonModule,
    DragDropModule,
    FormsModule,
    GeneralModule,
    GridModule,
    LayoutModule,
    LetDirective,
    NgSelectModule,
    NgbCollapseModule,
    NgbDatepickerModule,
    NgbDropdownModule,
    NgbModalModule,
    NgbNavModule,
    NgbTimepickerModule,
    NgbTooltipModule,
    ReactiveFormsModule,
    ResizableModule,
    RouterModule,
    ScrollingModule,
    NgIf,
    NgbPopoverModule,
    GenericDiagramSectionViewComponent,
    DecisionDiagramViewerComponent,
    NgApexchartsModule,
  ],
  providers: [{ provide: NgbModal, useClass: ModalService }],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  exports: [ItemsTableComponent, ToggleFiltersComponent, ToolbarComponent],
})
export class ProcessModificationModule {}
