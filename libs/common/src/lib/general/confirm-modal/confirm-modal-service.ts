import { inject, Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  CONFIRM_MODAL_DEFAULT_OPTIONS,
  ConfirmModalComponent,
  ConfirmOptions,
  ModalResult,
} from './confirm-modal.component';

@Injectable({ providedIn: 'root' })
export class ConfirmModalService {
  private modalService = inject(NgbModal);

  async show(options: ConfirmOptions, modalOptions = CONFIRM_MODAL_DEFAULT_OPTIONS): Promise<ModalResult> {
    try {
      const instance = this.modalService.open(ConfirmModalComponent, modalOptions);
      if (options) {
        (instance.componentInstance as ConfirmModalComponent).options = options;
      }
      return await instance.result;
    } catch (err: any) {
      console.debug('modal confirm error', err);
      return { confirmed: false };
    }
  }
}
