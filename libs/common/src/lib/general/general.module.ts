import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  NgbDatepickerModule,
  NgbDropdownModule,
  NgbModalModule,
  NgbPaginationModule,
  NgbPopoverModule,
  NgbTimepickerModule,
  NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgeMonacoModule } from '@cisstech/nge/monaco';
import { SelectTenantModalComponent } from '../auth/select-tenant-modal.component';
import { SelectTenantComponent } from '../auth/select-tenant.component';
import { ConfirmModalComponent } from './confirm-modal/confirm-modal.component';
import { CopyLinkDirective } from './copy-link/copy-link.directive';
import { DateFormatPipe } from './date-format';
import { DateRangeSelectComponent } from './date-range-select/date-range-select.component';
import { DateSelectComponent } from './date-select/date-select.component';
import { IconComponent } from './icons/icon.component';
import { LoadingCompactComponent } from './loading/loading-compact/loading-compact.component';
import { LoadingComponent } from './loading/loading.component';
import { LoadingDirective } from './loading/loading.directive';
import { MultiSelectComponent } from './multi-select/multi-select.component';
import { RadioButtonsToggleComponent } from './radio-buttons-toggle/radio-buttons-toggle.component';
import { TruncateWithTooltipDirective } from './truncate-with-tooltip.directive';
import { SearchNavigationComponent } from './search-navigation/search-navigation.component';
import { FooterComponent } from './footer/footer.component';
import { NgbTimeDateAdapter, TimeSelectComponent } from './date-range-select/time-select.component';
import { BackButtonComponent } from './back-button/back-button.component';
import { CodeEditorComponent } from './code-editor/code-editor.component';
import { ValueWithUnitsComponent } from './fluxnova-value-units/value-with-units.component';
import { HasPermissionsDirective } from './permissions/has-permissions.directive';

@NgModule({
  declarations: [
    IconComponent,
    LoadingDirective,
    LoadingComponent,
    LoadingCompactComponent,
    TruncateWithTooltipDirective,
    MultiSelectComponent,
    DateSelectComponent,
    DateRangeSelectComponent,
    TimeSelectComponent,
    RadioButtonsToggleComponent,
    DateFormatPipe,
    ConfirmModalComponent,
    CodeEditorComponent,
    CopyLinkDirective,
    SearchNavigationComponent,
    FooterComponent,
    SelectTenantModalComponent,
    SelectTenantComponent,
    ValueWithUnitsComponent,
    BackButtonComponent,
    HasPermissionsDirective,
  ],
  imports: [
    NgbTooltipModule,
    NgbDatepickerModule,
    NgbTimepickerModule,
    NgbPopoverModule,
    NgbDropdownModule,
    NgbModalModule,
    CommonModule,
    RouterModule,
    NgbPaginationModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    NgeMonacoModule.forRoot({
      assets: 'assets/nge/monaco',
      theming: {
        themes: [
          // custom themes
          'assets/nge/monaco/themes/vs-dark.json',
          'assets/nge/monaco/themes/github.json',
        ],
        default: 'github',
      },
    }),
  ],
  exports: [
    IconComponent,
    LoadingDirective,
    LoadingComponent,
    TruncateWithTooltipDirective,
    NgbTooltipModule,
    MultiSelectComponent,
    DateSelectComponent,
    DateRangeSelectComponent,
    TimeSelectComponent,
    RadioButtonsToggleComponent,
    DateFormatPipe,
    CopyLinkDirective,
    ClipboardModule,
    LoadingCompactComponent,
    SearchNavigationComponent,
    FooterComponent,
    ValueWithUnitsComponent,
    BackButtonComponent,
    SelectTenantModalComponent,
    SelectTenantComponent,
    CodeEditorComponent,
    HasPermissionsDirective,
  ],
  providers: [NgbTimeDateAdapter],
})
export class GeneralModule {}
