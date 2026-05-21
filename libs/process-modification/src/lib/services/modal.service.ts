import { inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

@Injectable({
  providedIn: 'root',
})
export class ModalService extends NgbModal {
  private document = inject<Document>(DOCUMENT);

  override open(content: unknown, options?: NgbModalOptions): NgbModalRef {
    const activeElement = this.document.activeElement as HTMLElement;
    if (activeElement) {
      activeElement.blur();
    }

    return super.open(content, options);
  }
}
