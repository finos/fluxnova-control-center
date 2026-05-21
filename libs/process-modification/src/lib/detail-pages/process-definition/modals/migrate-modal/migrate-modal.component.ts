import { Component, ElementRef, inject, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SubSink } from 'subsink';
import { finalize, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { differenceBy, forEach } from 'lodash-es';
import { MigrationExecutionRequest, ProcessDefinition, ProcessInstance } from '@fxn/types';
import { ToastService } from '@fxn/common';
import ElementRegistry from 'diagram-js/lib/core/ElementRegistry';
import { Canvas } from 'bpmn-js/lib/features/context-pad/ContextPadProvider';
import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer';
import { ProcessDefinitionVersion } from '../../../item-detail-page.types';
import { GenericDiagramSectionViewComponent } from '../../../../common/diagram/generic-diagram-viewer.component';
import { VersionMigrationService } from '../../../../services/version-migration.service';
import { ProcessInstanceService } from '../../../../services/process-instance.service';
import { ProcessDefinitionService } from '../../../../services/process-definition.service';

interface VersionOption extends ProcessDefinitionVersion {
  disabled?: boolean;
}

interface MigrationInfo {
  processDefinitionId: string;
  diagram: string;
}

@Component({
  selector: 'fluxnova-migrate-modal',
  templateUrl: './migrate-modal.component.html',
  styleUrls: ['./migrate-modal.component.scss'],
  standalone: false,
})
export class MigrateModalComponent implements OnDestroy, OnInit {
  modal = inject(NgbActiveModal);
  private versionMigration = inject(VersionMigrationService);
  private toastService = inject(ToastService);
  private elementRef = inject(ElementRef);
  private processInstanceService = inject(ProcessInstanceService);
  private definitionService = inject(ProcessDefinitionService);

  @ViewChild('sourceDiagramComponent') sourceDiagramComponent?: GenericDiagramSectionViewComponent;
  @ViewChild('targetDiagramComponent') targetDiagramComponent?: GenericDiagramSectionViewComponent;
  @Input() processInstances?: ProcessInstance[];
  @Input() processDefinitionId = '';
  @Input() tenantId = '';

  source?: MigrationInfo;
  targetDefinitionId = '';
  processDefinition?: ProcessDefinition;
  versionOptions?: VersionOption[];
  versions?: ProcessDefinitionVersion[];
  oldVersion?: ProcessDefinitionVersion;
  modalBody?: Element;
  newVersionNumber?: number;
  isDiagramOpen = false;
  isLoading = false;
  isMigrating = false;
  additions: any[] = [];
  deletions: any[] = [];
  totalCount = 0;
  skipCustomListeners = true;
  skipIoMappings = true;
  updateEventTriggers = false;

  sourceVersionSubscriptions = new SubSink();
  targetVersionSubscriptions = new SubSink();
  animationListener = () => this.loadDiagrams();

  ngOnInit() {
    this.modalBody = this.elementRef.nativeElement.querySelector('.modal-body');

    // This can be removed if we ever get rid of the modal resize animation
    this.modalBody?.addEventListener('transitionend', this.animationListener);

    this.sourceVersionSubscriptions.add(
      forkJoin([
        this.definitionService.getProcessDefinitionById(this.processDefinitionId),
        this.definitionService.getProcessDefinitionVersionsById(this.processDefinitionId),
        this.processInstanceService.getProcessInstanceCountByFilter({
          processDefinitionId: this.processDefinitionId,
          unfinished: true,
        }),
      ]).subscribe({
        next: ([definition, versions, count]) => this.onDataLoaded(definition, versions, count),
        error: this.onDataLoadFailed.bind(this),
      }),
    );
  }

  onDataLoaded(
    definition: ProcessDefinition,
    versions: { versionDefinitionId: string; versionNumber: number }[],
    count: number,
  ) {
    this.processDefinition = definition;
    this.versions = versions;
    this.totalCount = count;

    this.setVersions(definition.version ?? 0);
  }

  onDataLoadFailed(error: any) {
    this.toastService.error(error?.message ?? 'Failed to load the data required for migrating instances.');
  }

  setVersions(currentVersionNumber: number) {
    this.oldVersion = this.versions?.find((v) => v.versionNumber === currentVersionNumber);

    if (this.oldVersion) {
      this.versionOptions = this.versions?.map((v) => ({
        ...v,
        disabled: v.versionNumber === this.oldVersion?.versionNumber,
      }));

      this.newVersionNumber = this.getNearestVersion(this.versions ?? [], this.oldVersion);
      this.updateTargetVersion();
    } else {
      throw new Error(`No version found for this process definition version: ${this.processDefinition?.version}`);
    }
  }

  getNearestVersion(versions: ProcessDefinitionVersion[], oldVersion: ProcessDefinitionVersion) {
    const currentIndex = versions.indexOf(oldVersion);
    const newIndex = currentIndex + 1 === versions.length ? currentIndex - 1 : currentIndex + 1;
    return versions[newIndex].versionNumber;
  }

  /**
   * TODO: These should be updated when we refactor the diagram viewers.
   */
  loadDiagrams() {
    if (this.isDiagramOpen) {
      if (this.sourceDiagramComponent) {
        this.sourceDiagramComponent.id = this.processDefinitionId;
      }
      if (this.targetDiagramComponent) this.targetDiagramComponent.id = this.targetDefinitionId;
    }
  }

  updateTargetVersion() {
    const newVersion = this.versions?.find((v) => v.versionNumber === this.newVersionNumber);

    if (newVersion) {
      this.targetDefinitionId = newVersion.versionDefinitionId;

      this.loadDiagrams();
    }
  }

  showDiff() {
    this.clearDiff();

    const source = this.sourceDiagramComponent?.navigatedViewer as NavigatedViewer;
    const target = this.targetDiagramComponent?.navigatedViewer as NavigatedViewer;
    const sourceRegistry = source?.get<ElementRegistry>('elementRegistry').getAll();
    const targetRegistry = target?.get<ElementRegistry>('elementRegistry').getAll();

    if (sourceRegistry && targetRegistry) {
      this.additions = differenceBy(targetRegistry, sourceRegistry, 'id');
      this.deletions = differenceBy(sourceRegistry, targetRegistry, 'id');
    }

    forEach(this.additions, (addition: any) => {
      target?.get<Canvas>('canvas').addMarker(addition.id, 'addition');
    });
    forEach(this.deletions, (deletion: any) => {
      source?.get<Canvas>('canvas').addMarker(deletion.id, 'deletion');
    });
  }

  clearDiff() {
    forEach(this.deletions, (deletion) => {
      (this.sourceDiagramComponent?.navigatedViewer as NavigatedViewer)
        ?.get<Canvas>('canvas')
        .removeMarker(deletion.id, 'deletion');
    });
  }

  executeMigration() {
    this.isMigrating = true;
    const request: MigrationExecutionRequest = <MigrationExecutionRequest>{
      migrationPlan: {
        sourceProcessDefinitionId: this.oldVersion?.versionDefinitionId,
        targetProcessDefinitionId: this.targetDefinitionId,
        updateEventTriggers: this.updateEventTriggers,
      },
      skipCustomListeners: this.skipCustomListeners,
      skipIoMappings: this.skipIoMappings,
    };

    if (this.processInstances?.length) {
      request.processInstanceIds = this.processInstances?.map((instance) => instance.id);
    } else {
      request.processInstanceQuery = {
        processDefinitionId: this.processDefinitionId,
      };
    }

    this.versionMigration
      .executeProcessInstancesMigration(request)
      .pipe(
        finalize(() => {
          this.isMigrating = false;
        }),
        catchError((error) => of({ error })),
      )
      .subscribe((result: any) => {
        if (result?.error) {
          this.toastService.error('An error occurred when attempting to migrate instance(s)');
        } else {
          this.toastService.success(
            `Request to migrate ${this.processInstances?.length || this.totalCount} instances to version ${
              this.newVersionNumber
            } submitted successfully.  Click <a href="${this.tenantId}/batches/${
              result.id
            }">here</a> to view the status of the migration.`,
            { delay: 10000 },
          );
          this.modal.close(result);
        }
      });
  }

  ngOnDestroy() {
    this.sourceVersionSubscriptions.unsubscribe();
    this.targetVersionSubscriptions.unsubscribe();
    this.modalBody?.removeEventListener('transitionend', this.animationListener);
  }
}
