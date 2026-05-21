import { find } from 'lodash-es';

import { ProcessEngineDto } from '@fxn/types';

export function envForTenant(tenantId: string, engines: ProcessEngineDto[]): ProcessEngineDto | undefined {
  return find(engines, (engine) => engine.name === tenantId);
}
