import { BrowserModule } from '@angular/platform-browser';
import { AuthModule } from './auth/auth.module';
import { LayoutModule } from './layout/layout.module';

export function defaultAppImports(): any[] {
  return [BrowserModule, LayoutModule, AuthModule];
}
