import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import type { MigrationExecutionRequest } from '@fxn/types';

export interface MigrationResult {
  success: boolean;
  code?: number;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class VersionMigrationService {
  private http = inject(HttpClient);

  public generateVersionMigrationPlan(migrationPlan: any) {
    return this.http
      .get('/migration/generate', { params: { migrationPlan } })
      .pipe(map((result: any) => result.generateMigrationPlan));
  }

  public executeProcessInstancesMigration(request: MigrationExecutionRequest) {
    return this.http.post('api/migration/executeAsync', request);
  }
}
