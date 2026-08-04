import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { GeneralModule } from '../general/general.module';
import { SessionExpiredModalComponent } from './session-expired-modal/session-expired-modal.component';

@NgModule({
  declarations: [SessionExpiredModalComponent],
  imports: [CommonModule, NgbDropdownModule, FormsModule, GeneralModule],
  exports: [],
})
export class AuthModule {}
