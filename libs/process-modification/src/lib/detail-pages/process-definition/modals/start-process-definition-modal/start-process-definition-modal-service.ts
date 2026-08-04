import { inject, Injectable } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { MODAL_DEFAULTS } from '@fxn/common';
import { StartProcessDefinitionOptions } from '@fxn/types';
import {
  StartProcessDefinitionModalComponent,
  StartProcessDefinitionModalResult,
} from '../start-process-definition-modal/start-process-definition-modal.component';

@Injectable({ providedIn: 'root' })
export class StartProcessDefinitionModalService {
  private modalService = inject(NgbModal);

  instance?: NgbModalRef;

  async show(
    options: StartProcessDefinitionOptions,
    modalOptions = MODAL_DEFAULTS,
  ): Promise<StartProcessDefinitionModalResult> {
    try {
      this.instance = this.modalService.open(StartProcessDefinitionModalComponent, modalOptions);
      if (options) {
        (this.instance.componentInstance as StartProcessDefinitionModalComponent).options = options;
      }
      return await this.instance.result;
    } catch (err: any) {
      console.debug('start process definition modal error', err);
      return { jsonValue: '', businessKey: err, submitted: false, instanceId: '' };
    }
  }

  hide() {
    this.instance?.dismiss();
  }
}
