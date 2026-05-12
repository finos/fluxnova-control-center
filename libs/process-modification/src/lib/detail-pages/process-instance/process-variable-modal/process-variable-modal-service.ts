import { inject, Injectable } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { MODAL_DEFAULTS } from '@fxn/common';
import {
  ProcessVariableModalComponent,
  VariableModalResult,
  VariableOptions,
} from './process-variable-modal.component';

@Injectable({ providedIn: 'root' })
export class ProcessVariableModalService {
  private modalService = inject(NgbModal);

  instance?: NgbModalRef;

  async show(variableOptions: VariableOptions, modalOptions = MODAL_DEFAULTS): Promise<VariableModalResult> {
    try {
      this.instance = this.modalService.open(ProcessVariableModalComponent, modalOptions);
      (this.instance.componentInstance as ProcessVariableModalComponent).options = variableOptions;
      return await this.instance.result;
    } catch (err: any) {
      console.debug('process variables modal error', err);
      return { variableValue: '', variableName: '', variableType: '', saved: false, valueInfo: {} };
    }
  }

  hide() {
    this.instance?.dismiss();
  }
}
