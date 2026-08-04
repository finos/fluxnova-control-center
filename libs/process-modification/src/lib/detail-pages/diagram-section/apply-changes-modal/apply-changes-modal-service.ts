import { inject, Injectable } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { MODAL_DEFAULTS } from '@fxn/common';
import { ApplyChangesModalOptions, ApplyChangesModalResults } from '@fxn/types';
import { ApplyChangesConfirmModalComponent } from './confirm-modal.component';

@Injectable({ providedIn: 'root' })
export class ApplyChangesModalService {
  private modalService = inject(NgbModal);

  instance?: NgbModalRef;

  async show(options: ApplyChangesModalOptions, modalOptions = MODAL_DEFAULTS): Promise<ApplyChangesModalResults> {
    try {
      this.instance = this.modalService.open(ApplyChangesConfirmModalComponent, modalOptions);
      if (options) {
        (this.instance.componentInstance as ApplyChangesConfirmModalComponent).options = options;
      }
      return await this.instance.result;
    } catch (err: any) {
      console.debug('apply changes modal error', err);
      return { confirmed: false, clearChanges: false };
    }
  }

  hide() {
    this.instance?.dismiss();
  }
}
