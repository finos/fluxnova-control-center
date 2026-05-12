import { describe, expect, it } from 'vitest';
import { Tenant, User } from '@fxn/types';
import { firstValueFrom } from 'rxjs';
import { UserService } from './user.service';

describe('UserService', () => {
  it('should update and retrieve the user correctly', async () => {
    const service = new UserService();
    const user: User = { id: '1', fullName: 'John Doe' } as User;

    service.user = user;
    const firstValue = await firstValueFrom(service.$user);

    expect(service.user).toEqual(user);
    expect(firstValue).toEqual(user);
  });

  it('should update and retrieve the selected tenant correctly', async () => {
    const service = new UserService();
    const tenant: Tenant = { id: '1', name: 'Tenant A' } as Tenant;

    service.selectedTenant = tenant;
    const firstValue = await firstValueFrom(service.$selectedTenant);

    expect(service.selectedTenant).toEqual(tenant);
    expect(firstValue).toEqual(tenant);
  });

  it('should return undefined for selectedTenantId if no tenant is set', () => {
    const service = new UserService();

    expect(service.selectedTenantId).toBeUndefined();
  });

  it('should return the correct selectedTenantId when a tenant is set', () => {
    const service = new UserService();
    const tenant: Tenant = { id: '123', name: 'Tenant B' } as Tenant;

    service.selectedTenant = tenant;

    expect(service.selectedTenantId).toBe('123');
  });
});
