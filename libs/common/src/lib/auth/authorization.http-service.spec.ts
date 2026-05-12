import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { firstValueFrom, of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { ItemType } from '@fxn/types/src/entity-types';
import { EngineResourceType, ResourcePermissionPair } from '@fxn/types/src/permissions';
import { UserService } from '../services/user.service';
import { AuthorizationHttpService } from './authorization.http-service';

describe('AuthorizationHttpService', () => {
  let service: AuthorizationHttpService;
  let httpClientSpy: { get: Mock };
  let userServiceSpy: { user: { id: string } | undefined; selectedTenantId: string | undefined };

  const mockPermission: ResourcePermissionPair = {
    resourceName: ItemType.ProcessDefinition,
    resourceType: EngineResourceType.ProcessDefinition,
    permissionName: 'READ',
    resourceId: 'abc123',
  };

  beforeEach(() => {
    httpClientSpy = { get: vi.fn() };
    userServiceSpy = { user: { id: 'testUser' }, selectedTenantId: 'testTenant' };
    TestBed.configureTestingModule({
      providers: [
        AuthorizationHttpService,
        { provide: HttpClient, useValue: httpClientSpy },
        { provide: UserService, useValue: userServiceSpy },
      ],
    });
    service = TestBed.inject(AuthorizationHttpService);
    sessionStorage.clear();
    vi.useFakeTimers();
  });

  it('should construct the correct URL with resourceId', () => {
    httpClientSpy.get.mockReturnValue(of({ authorized: true }));
    service.check(mockPermission).subscribe();
    expect(httpClientSpy.get).toHaveBeenCalledWith(
      './api/authorization/check?permissionName=READ&resourceName=ProcessDefinition&resourceType=6&resourceId=abc123',
    );
  });

  it('should construct the correct URL without resourceId', () => {
    const perm = { ...mockPermission };
    delete perm.resourceId;
    httpClientSpy.get.mockReturnValue(of({ authorized: false }));
    service.check(perm).subscribe();
    expect(httpClientSpy.get).toHaveBeenCalledWith(
      './api/authorization/check?permissionName=READ&resourceName=ProcessDefinition&resourceType=6',
    );
  });

  it('should return authorized true from checkSync', async () => {
    httpClientSpy.get.mockReturnValue(of({ authorized: true }));
    const result = await service.checkSync(mockPermission);
    expect(result).toBe(true);
  });

  it('should return authorized false from checkSync', async () => {
    httpClientSpy.get.mockReturnValue(of({ authorized: false }));
    const result = await service.checkSync(mockPermission);
    expect(result).toBe(false);
  });

  describe('caching behavior', () => {
    beforeEach(() => {
      sessionStorage.clear();
    });

    it('should cache the result after first checkSync call', async () => {
      httpClientSpy.get.mockReturnValue(of({ authorized: true }));

      // First call should hit the HTTP service
      const result1 = await service.checkSync(mockPermission);
      expect(result1).toBe(true);
      expect(httpClientSpy.get).toHaveBeenCalledTimes(1);

      // Second call should use cached value
      const result2 = await service.checkSync(mockPermission);
      expect(result2).toBe(true);
      expect(httpClientSpy.get).toHaveBeenCalledTimes(1); // Still only 1 call
    });

    it('should create different cache keys for different permissions', async () => {
      httpClientSpy.get.mockReturnValue(of({ authorized: true }));

      const permission1 = { ...mockPermission, resourceId: 'abc123' };
      const permission2 = { ...mockPermission, resourceId: 'xyz789' };

      await service.checkSync(permission1);
      await service.checkSync(permission2);

      // Should have made 2 separate HTTP calls for different resource IDs
      expect(httpClientSpy.get).toHaveBeenCalledTimes(2);
    });

    it('should create different cache keys for permissions with and without resourceId', async () => {
      httpClientSpy.get.mockReturnValue(of({ authorized: true }));

      const permissionWithId = { ...mockPermission };
      const permissionWithoutId = { ...mockPermission };
      delete permissionWithoutId.resourceId;

      await service.checkSync(permissionWithId);
      await service.checkSync(permissionWithoutId);

      // Should have made 2 separate HTTP calls
      expect(httpClientSpy.get).toHaveBeenCalledTimes(2);
    });

    it('should cache false values as well as true values', async () => {
      httpClientSpy.get.mockReturnValue(of({ authorized: false }));

      // First call
      const result1 = await service.checkSync(mockPermission);
      expect(result1).toBe(false);
      expect(httpClientSpy.get).toHaveBeenCalledTimes(1);

      // Second call should use cached false value
      const result2 = await service.checkSync(mockPermission);
      expect(result2).toBe(false);
      expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
    });

    it('should handle different permission names in cache', async () => {
      httpClientSpy.get.mockReturnValue(of({ authorized: true }));

      const permission1 = { ...mockPermission, permissionName: 'READ' as const };
      const permission2 = { ...mockPermission, permissionName: 'UPDATE' as const };

      await service.checkSync(permission1);
      await service.checkSync(permission2);

      // Should have made 2 separate HTTP calls for different permission names
      expect(httpClientSpy.get).toHaveBeenCalledTimes(2);
    });

    it('should handle different resource names in cache', async () => {
      httpClientSpy.get.mockReturnValue(of({ authorized: true }));

      const permission1 = { ...mockPermission, resourceName: ItemType.ProcessDefinition };
      const permission2 = { ...mockPermission, resourceName: ItemType.ProcessInstance };

      await service.checkSync(permission1);
      await service.checkSync(permission2);

      // Should have made 2 separate HTTP calls for different resource names
      expect(httpClientSpy.get).toHaveBeenCalledTimes(2);
    });

    it('should handle different resource types in cache', async () => {
      httpClientSpy.get.mockReturnValue(of({ authorized: true }));

      const permission1 = { ...mockPermission, resourceType: EngineResourceType.ProcessDefinition };
      const permission2 = { ...mockPermission, resourceType: EngineResourceType.ProcessInstance };

      await service.checkSync(permission1);
      await service.checkSync(permission2);

      // Should have made 2 separate HTTP calls for different resource types
      expect(httpClientSpy.get).toHaveBeenCalledTimes(2);
    });

    it('should handle different user ids in cache', async () => {
      httpClientSpy.get.mockReturnValue(of({ authorized: true }));

      await service.checkSync(mockPermission);
      userServiceSpy.user = { id: 'otherUser' };
      vi.advanceTimersByTime(2100); // Wait for memoization to clear
      await service.checkSync(mockPermission);

      // Should have made 2 separate calls for different user IDs
      expect(httpClientSpy.get).toHaveBeenCalledTimes(2);
    });

    it('should handle different tenant ids in cache', async () => {
      httpClientSpy.get.mockReturnValue(of({ authorized: true }));

      await service.checkSync(mockPermission);
      userServiceSpy.selectedTenantId = 'otherTenant';
      vi.advanceTimersByTime(2100); // Wait for memoization to clear
      await service.checkSync(mockPermission);

      // Should have made 2 separate calls for different tenant IDs
      expect(httpClientSpy.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('check method', () => {
    it('should return observable with authorized true', async () => {
      httpClientSpy.get.mockReturnValue(of({ authorized: true }));

      const result = await firstValueFrom(service.check(mockPermission));
      expect(result.authorized).toBe(true);
      expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
    });

    it('should return observable with authorized false', async () => {
      httpClientSpy.get.mockReturnValue(of({ authorized: false }));

      const result = await firstValueFrom(service.check(mockPermission));
      expect(result.authorized).toBe(false);
      expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
    });

    it('should use memoization for direct check calls', () => {
      httpClientSpy.get.mockReturnValue(of({ authorized: true }));

      // Call check twice with same arguments
      service.check(mockPermission).subscribe();
      service.check(mockPermission).subscribe();

      expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
    });

    it('should not use memoization when permissions change', () => {
      httpClientSpy.get.mockReturnValue(of({ authorized: true }));

      service.check({ ...mockPermission, resourceId: 'abc123' }).subscribe();
      service.check({ ...mockPermission, resourceId: 'xyz789' }).subscribe();

      expect(httpClientSpy.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('request deduplication', () => {
    it('should deduplicate simultaneous requests for the same permission', async () => {
      httpClientSpy.get.mockReturnValue(of({ authorized: true }));

      // Make 3 simultaneous requests for the same permission
      const promise1 = service.checkSync(mockPermission);
      const promise2 = service.checkSync(mockPermission);
      const promise3 = service.checkSync(mockPermission);

      const results = await Promise.all([promise1, promise2, promise3]);

      // All should return the same result
      expect(results).toEqual([true, true, true]);
      // But only one HTTP call should have been made
      expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
    });

    it('should handle simultaneous requests for different permissions independently', async () => {
      httpClientSpy.get.mockReturnValue(of({ authorized: true }));

      const permission1 = { ...mockPermission, resourceId: 'abc123' };
      const permission2 = { ...mockPermission, resourceId: 'xyz789' };

      // Make simultaneous requests for different permissions
      const promise1a = service.checkSync(permission1);
      const promise1b = service.checkSync(permission1);
      const promise2a = service.checkSync(permission2);
      const promise2b = service.checkSync(permission2);

      await Promise.all([promise1a, promise1b, promise2a, promise2b]);

      // Should make 2 HTTP calls (one per unique permission, deduplicated)
      expect(httpClientSpy.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('cache key generation', () => {
    it('should generate unique cache keys for permissions with underscores in fields', async () => {
      httpClientSpy.get.mockReturnValue(of({ authorized: true }));

      const permission1 = {
        ...mockPermission,
        resourceName: 'user_profile' as any,
        resourceId: '1',
      };
      const permission2 = {
        ...mockPermission,
        resourceName: 'user' as any,
        resourceId: 'profile_1',
      };

      await service.checkSync(permission1);
      await service.checkSync(permission2);

      expect(httpClientSpy.get).toHaveBeenCalledTimes(2);
    });

    it('should generate unique cache keys for permissions with special characters', async () => {
      httpClientSpy.get.mockReturnValue(of({ authorized: true }));

      const permission1 = {
        ...mockPermission,
        resourceId: 'abc:123',
      };
      const permission2 = {
        ...mockPermission,
        resourceId: 'abc|123',
      };

      await service.checkSync(permission1);
      await service.checkSync(permission2);

      expect(httpClientSpy.get).toHaveBeenCalledTimes(2);
    });

    it('should handle null and undefined resourceId consistently in cache keys', async () => {
      httpClientSpy.get.mockReturnValue(of({ authorized: true }));

      const permissionWithoutId = { ...mockPermission };
      delete permissionWithoutId.resourceId;

      await service.checkSync(permissionWithoutId);
      expect(httpClientSpy.get).toHaveBeenCalledTimes(1);

      await service.checkSync(permissionWithoutId);
      expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
    });
  });
});
