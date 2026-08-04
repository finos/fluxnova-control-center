/* eslint-disable n/no-process-env -- This is used during application startup, before the config service is available. */
export function isRunningLocally() {
  return process.env.container !== 'docker' || process.env.NODE_ENV === 'test';
}
