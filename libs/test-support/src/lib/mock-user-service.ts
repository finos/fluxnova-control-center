import { ReplaySubject } from 'rxjs';
import { Tenant, User } from '@fxn/types';

export const mockUserInfo = {
  currentTenant: {
    id: 'tenant1',
    displayName: 'Tenant 1',
    group: 'realm1',
    groupDisplayName: 'Realm 1',
  },
  user: {
    id: 'user1',
    engines: [
      { name: 'tenant1', displayName: 'Tenant 1', group: 'realm1', groupDisplayName: 'Realm 1' },
      { name: 'tenant2', displayName: 'Tenant 2', group: 'realm2', groupDisplayName: 'Realm 2' },
    ],
  },
};

export const mockUserService = {
  user: mockUserInfo.user as User,
  selectedTenant: mockUserInfo.currentTenant as Tenant,
  selectedTenantId: mockUserInfo.currentTenant.id,
  $user: new ReplaySubject(1),
  $selectedTenant: new ReplaySubject(1),
};

mockUserService.$user.next(mockUserInfo.user as User);
mockUserService.$selectedTenant.next(mockUserInfo.currentTenant as Tenant);
