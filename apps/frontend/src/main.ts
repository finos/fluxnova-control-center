import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { initOpenTelemetry } from '@fxn/common';
import { AG_GRID_MODULES } from '@fxn/grid';
import { ModuleRegistry, provideGlobalGridOptions } from 'ag-grid-community';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

// Register needed community features for AG Grid
ModuleRegistry.registerModules(AG_GRID_MODULES);
provideGlobalGridOptions({ theme: 'legacy' });

if (window.fluxnovaConfig.otel?.enabled) initOpenTelemetry(window.fluxnovaConfig.otel);

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error('Error bootstrapping the AppModule', err));
