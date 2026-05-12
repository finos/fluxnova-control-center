import { Component, EventEmitter, inject, Input, OnDestroy, Output } from '@angular/core';
import { ProcessDefinition } from '@fxn/types';
import { ToastService } from '@fxn/common';
import { from, Subject, Subscription, takeUntil } from 'rxjs';
import { delay, map, mergeMap } from 'rxjs/operators';
import { map as lodashMap } from 'lodash-es';
import { ProcessDefinitionVersion } from '../../../item-detail-page.types';
import { ProcessDefinitionService } from '../../../../services/process-definition.service';
import { ProcessInstanceService } from '../../../../services/process-instance.service';
import { ItemDetailPageCommunicationService } from '../../../item-detail-page.communication.service';

const CONCURRENT_REQUEST_COUNT = 2;

@Component({
  selector: 'fluxnova-process-definition-info-section',
  templateUrl: './process-definition-info-section.component.html',
  styleUrls: ['./process-definition-info-section.component.scss'],
  standalone: false,
})
export class ProcessDefinitionInfoSectionComponent implements OnDestroy {
  private readonly definitionService = inject(ProcessDefinitionService);
  private readonly instanceService = inject(ProcessInstanceService);
  private readonly eventBus = inject(ItemDetailPageCommunicationService);
  toastService = inject(ToastService);

  @Input() set processDefinitionId(processDefinitionId: string) {
    if (processDefinitionId) {
      this.currentVersionDefinitionId = processDefinitionId;
      this.init();
    }
  }

  @Output() versionSelected = new EventEmitter<string>();

  cancel$ = new Subject<void>();
  currentVersionDefinitionId = '';
  definitionSub?: Subscription;
  isLoading = false;
  processDefinition: ProcessDefinition = { id: '' };
  reloadSub?: Subscription;
  versions?: ProcessDefinitionVersion[];
  versionsSub?: Subscription;
  versionCounts: any = {};
  versionCountsSub?: Subscription;

  init() {
    this.reloadSub = this.eventBus.reloadNeeded$.subscribe((doReload) => doReload && this.loadDetails());
    this.loadDetails();
  }

  onVersionOpen() {
    if (this.currentVersionDefinitionId && this.versions) {
      this.versionCounts = {};
      this.versionCountsSub?.unsubscribe();
      this.versionCountsSub = from(
        lodashMap(this.versions, 'versionDefinitionId').map((id, index) => {
          const delayTime = this.versions && index >= this.versions.length - CONCURRENT_REQUEST_COUNT ? 0 : 200;

          return this.instanceService.getProcessInstanceCountByFilter({ processDefinitionId: id }).pipe(
            map((count) => ({ id: id, count })),
            delay(delayTime),
          );
        }),
      )
        .pipe(
          mergeMap((result) => result, CONCURRENT_REQUEST_COUNT),
          takeUntil(this.cancel$),
        )
        .subscribe((result: any) => {
          this.versionCounts[result.id] = result.count;
        });
    }
  }

  onVersionClose() {
    this.cancel$.next();
  }

  loadDetails() {
    this.definitionSub?.unsubscribe();
    this.definitionSub = this.definitionService
      .getProcessDefinitionById(this.currentVersionDefinitionId)
      .pipe(delay(0))
      .subscribe({
        next: this.onDetailsLoaded.bind(this),
        error: this.onDetailsLoadFailed.bind(this),
      });
  }

  onDetailsLoaded(processDefinition?: ProcessDefinition) {
    this.processDefinition = processDefinition ?? ({} as ProcessDefinition);

    if (this.processDefinition?.key) {
      this.getVersions(this.processDefinition.key);
    }
  }

  onDetailsLoadFailed(error: any) {
    this.toastService.error(error?.message ?? 'Failed to load process definition');
  }

  getVersions(processDefinitionKey: string) {
    this.versionsSub?.unsubscribe();
    this.versionsSub = this.definitionService.getProcessDefinitionVersionsByKey(processDefinitionKey).subscribe({
      next: this.onVersionsLoaded.bind(this),
      error: this.onVersionsLoadFailed.bind(this),
    });
  }

  onVersionsLoaded(versions: ProcessDefinitionVersion[]) {
    this.versions = versions;
  }

  onVersionsLoadFailed(error: any) {
    this.toastService.error(error?.message ?? 'Failed to load process definition versions');
  }

  ngOnDestroy() {
    this.definitionSub?.unsubscribe();
    this.reloadSub?.unsubscribe();
    this.versionsSub?.unsubscribe();
    this.versionCountsSub?.unsubscribe();
  }
}
