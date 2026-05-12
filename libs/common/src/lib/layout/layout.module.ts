import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  NgbCollapseModule,
  NgbDropdownModule,
  NgbModalModule,
  NgbNavModule,
  NgbPopoverModule,
  NgbToastModule,
  NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';
import { LetDirective, PushPipe } from '@ngrx/component';
import { NgSelectModule } from '@ng-select/ng-select';
import { ResizableModule } from 'angular-resizable-element';
import { AngularSplitModule } from 'angular-split';
import { AuthModule } from '../auth/auth.module';
import { GeneralModule } from '../general/general.module';
import { AuthInterceptor } from '../interceptor/auth-interceptor';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { RootLayoutComponent } from './root-layout/root-layout.component';
import { SideDrawerComponent } from './side-drawer/side-drawer.component';
import { TabsViewComponent } from './tabs-view/tabs-view.component';
import { ToastContainerComponent } from './toast-container/toast-container.component';
import { TabsViewNameFormatterPipe } from './tabs-view/tabs-view-name-formatter/tabs-view-name-formatter.pipe';

@NgModule({
  declarations: [
    SideDrawerComponent,
    RootLayoutComponent,
    ToastContainerComponent,
    PageNotFoundComponent,
    TabsViewComponent,
    TabsViewNameFormatterPipe,
  ],
  imports: [
    AuthModule,
    ResizableModule,
    CommonModule,
    FormsModule,
    GeneralModule,
    NgbCollapseModule,
    NgbDropdownModule,
    NgbModalModule,
    RouterModule,
    NgbToastModule,
    AngularSplitModule,
    DragDropModule,
    NgbTooltipModule,
    NgbPopoverModule,
    LetDirective,
    PushPipe,
    NgbNavModule,
    NgSelectModule,
  ],
  providers: [
    { provide: Window, useValue: window },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    TabsViewNameFormatterPipe,
  ],
  exports: [
    SideDrawerComponent,
    RootLayoutComponent,
    ToastContainerComponent,
    PageNotFoundComponent,
    TabsViewComponent,
    TabsViewNameFormatterPipe,
  ],
})
export class LayoutModule {}
