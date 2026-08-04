import { Component } from '@angular/core';
import { NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { MODAL_DEFAULTS } from '../../general/modal-defaults';

export const SESSION_EXPIRED_MODAL_DEFAULT_OPTIONS: NgbModalOptions = {
  ...MODAL_DEFAULTS,
  size: 'md',
  backdrop: 'static',
  backdropClass: 'opaque',
  windowClass: 'session-expired-modal',
  ariaLabelledBy: 'session-expired',
};

@Component({
  selector: 'fluxnova-session-expired-modal',
  templateUrl: './session-expired-modal.component.html',
  styleUrls: ['./session-expired-modal.component.scss'],
  standalone: false,
})
export class SessionExpiredModalComponent {}
