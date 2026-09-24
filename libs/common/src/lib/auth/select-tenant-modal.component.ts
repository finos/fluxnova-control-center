import { AfterViewInit, Component } from '@angular/core';
import { Tenant, User } from '@fxn/types';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'fluxnova-select-tenant-modal',
  templateUrl: './select-tenant-modal.component.html',
  styleUrls: ['./select-tenant-modal.component.scss'],
  standalone: false,
})
export class SelectTenantModalComponent implements AfterViewInit {
  modal?: NgbModalRef;
  userInfo?: { user: User; currentTenant: Tenant | null };

  init(modal: NgbModalRef, user: User) {
    this.modal = modal;
    this.userInfo = {
      user,
      currentTenant: null,
    };
  }

  ngAfterViewInit(): void {
    window.AppReady = true;
  }

  tenantSelected(tenant: Tenant) {
    this.modal?.close(tenant);
  }
}
