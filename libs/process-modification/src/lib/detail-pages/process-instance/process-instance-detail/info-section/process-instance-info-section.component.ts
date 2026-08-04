import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ProcessInstance, ProcessInstanceStatesMap } from '@fxn/types';
import { SubSink } from 'subsink';
import { ActivatedRoute } from '@angular/router';
import { ProcessInstanceService } from '../../../../services/process-instance.service';
import { ItemDetailPageCommunicationService } from '../../../item-detail-page.communication.service';

@Component({
  selector: 'fluxnova-process-instance-info-section',
  templateUrl: './process-instance-info-section.component.html',
  styleUrls: ['./process-instance-info-section.component.scss'],
  standalone: false,
})
export class ProcessInstanceInfoSectionComponent implements OnInit, OnDestroy {
  processInstanceService = inject(ProcessInstanceService);
  eventBus = inject(ItemDetailPageCommunicationService);
  route = inject(ActivatedRoute);

  set processInstanceId(processInstanceId: string) {
    if (processInstanceId) {
      this._processInstanceId = processInstanceId;
    }
  }

  get processInstanceId() {
    return this._processInstanceId;
  }

  private _processInstanceId = '';
  processInstance?: ProcessInstance;
  isLoading = false;
  subs$ = new SubSink();
  stateMap = ProcessInstanceStatesMap;

  ngOnInit() {
    this.subs$.add(
      this.eventBus.reloadNeeded$.subscribe((doReload) => {
        if (doReload) this.loadData();
      }),
      this.route.params.subscribe((params) => {
        this.processInstanceId = params?.id;
        this.loadData();
      }),
    );
  }

  loadData() {
    this.isLoading = true;
    this.subs$.add(
      this.processInstanceService.getProcessInstance(this.processInstanceId).subscribe((processInstance) => {
        this.processInstance = processInstance;
        this.isLoading = false;
      }),
    );
  }

  ngOnDestroy() {
    this.subs$.unsubscribe();
  }
}
