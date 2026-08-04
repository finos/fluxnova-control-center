import { Component, inject, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ActionPermissionsSpec, ApplyChangesModalOptions } from '@fxn/types';
import { PermissionService } from '@fxn/common/src/lib/services/permission.service';

@Component({
  selector: 'fluxnova-apply-changes-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.scss'],
  standalone: false,
})
export class ApplyChangesConfirmModalComponent implements OnInit {
  modal = inject(NgbActiveModal);
  private permissionService = inject(PermissionService);

  public skipCustomListeners = true;
  public skipIoMappings = true;
  public annotation = '';
  public options: ApplyChangesModalOptions = { willTerminate: false };
  protected userHasPermissionsToTerminate = false;

  async ngOnInit(): Promise<void> {
    this.userHasPermissionsToTerminate = await this.permissionService.meetsPermissionSpecification(
      ActionPermissionsSpec.TerminateProcessInstance,
    );
  }

  public confirm() {
    this.modal.close({
      confirmed: true,
      clearChanges: false,
      skipCustomListeners: this.skipCustomListeners,
      skipIoMappings: this.skipIoMappings,
      annotation: this.annotation.trim() ? this.annotation : undefined,
    });
  }

  public clear() {
    this.modal.close({
      confirmed: false,
      clearChanges: true,
    });
  }
}
