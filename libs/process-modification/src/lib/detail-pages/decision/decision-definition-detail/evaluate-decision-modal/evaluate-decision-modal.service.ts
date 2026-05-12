import { inject, Injectable } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { MODAL_DEFAULTS } from '@fxn/common';
import {
  EvaluateDecisionModalComponent,
  EvaluateDecisionModalResult,
  EvaluateDecisionOptions,
} from './evaluate-decision-modal.component';

@Injectable({ providedIn: 'root' })
export class EvaluateDecisionModalService {
  private modalService = inject(NgbModal);

  instance?: NgbModalRef;

  async show(options: EvaluateDecisionOptions, modalOptions = MODAL_DEFAULTS): Promise<EvaluateDecisionModalResult> {
    try {
      this.instance = this.modalService.open(EvaluateDecisionModalComponent, modalOptions);
      if (options) {
        (this.instance.componentInstance as EvaluateDecisionModalComponent).options = options;
      }
      return await this.instance.result;
    } catch {
      return { jsonValue: '', submitted: false };
    }
  }

  hide() {
    this.instance?.dismiss();
  }
}
