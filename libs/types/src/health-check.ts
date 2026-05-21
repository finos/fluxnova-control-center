export type HealthCheckStatus = 'ok' | 'pass' | 'warn' | 'fail';

export type HealthCheckDependencyScope = 'internal' | 'external' | undefined;

export interface HealthCheck {
  status: string;
  meta: HealthMeta;
  dependencies: HealthDependency[];
}

export interface HealthDependency {
  name?: string;
  url?: string;
  scope: HealthCheckDependencyScope;
  status: HealthCheckStatus;
  statusCode?: number;
  message?: string;
}

export interface HealthMeta {
  version?: string;
  name: string;
  environment: string;
  deployDateTime: string;
  message?: string;
  region?: string;
  logLevel: string;
}

export interface Status {
  name: string;
  status: HealthCheckStatus;
  dependencies?: Status[];
}

export const livenessCheck = {
  ready: false,
};
