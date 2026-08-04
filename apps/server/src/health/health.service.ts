import { HealthCheck, HealthCheckDependencyScope, HealthCheckStatus, HealthDependency } from '@fxn/types';
import { every, flatten, some, sortBy } from 'lodash-es';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseApi } from '../common/base-api';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private config: ConfigService) {}

  public get deployDateTime(): string {
    return this.config.get('FXN_DEPLOY_DATETIME', new Date().toISOString());
  }

  public async getStatus(scope: HealthCheckDependencyScope, apis: BaseApi[]): Promise<HealthCheck> {
    const dependencies: HealthDependency[] = await Promise.all([
      ...(scope !== 'external' ? this.getInternalHealthChecks() : []),
      ...(scope !== 'internal' ? this.getExternalHealthChecks(apis) : []),
    ]);

    const allOk = every(dependencies, (check) => check?.status?.toLowerCase() === 'pass');
    const anyFailures = some(dependencies, (check) => check?.status?.toLowerCase() === 'fail');

    let status: HealthCheckStatus;
    if (allOk) {
      status = 'pass';
    } else if (anyFailures) {
      status = 'fail';
    } else {
      status = 'warn';
    }

    const health = {
      status,
      meta: {
        version: this.config.get('FXN_CC_VERSION'),
        environment: this.config.get('FXN_ENV', 'dev'),
        name: 'UI',
        deployDateTime: this.deployDateTime,
        region: this.config.get('FXN_REGION', 'local'),
        logLevel: this.config.get('FXN_LOG_LEVEL', 'info'),
      },
      dependencies: sortBy(dependencies, 'name'),
    };

    if (health.status === 'fail') {
      this.logger.error(health, 'health check failure');
    }
    if (health.status === 'warn') {
      this.logger.warn(health, 'some health warnings were found');
    }
    return health;
  }

  private getInternalHealthChecks(): Promise<HealthDependency>[] {
    return [];
  }

  private getExternalHealthChecks(apis: BaseApi[]): Promise<HealthDependency>[] {
    return flatten(Object.values(apis).map((api) => api.getHealth()));
  }
}
