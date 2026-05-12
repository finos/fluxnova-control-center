import { ProcessEngineDto } from './fluxnova';

export class Tenant {
  id?: string;
  displayName?: string;
  group?: string;
  groupDisplayName?: string;
}

export class User {
  engines: ProcessEngineDto[] = [];
  id?: string | null;
  fullName?: string | null;
}
