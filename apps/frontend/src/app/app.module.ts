import { NgModule } from '@angular/core';
import { LetDirective, PushPipe } from '@ngrx/component';
import { defaultAppImports, defaultAppProviders, GeneralModule, IS_PRODUCTION } from '@fxn/common';
import { ProcessModificationModule } from '@fxn/pim';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [...defaultAppImports(), GeneralModule, AppRoutingModule, ProcessModificationModule, LetDirective, PushPipe],
  providers: [{ provide: IS_PRODUCTION, useValue: environment.production }, ...defaultAppProviders()],
  bootstrap: [AppComponent],
})
export class AppModule {}
