import { Tenant, User } from './user-types';

export interface UserInfoState {
  token?: string;
  user?: User;
  currentTenant?: Tenant;
}

export interface Auth {
  user: User;
}
