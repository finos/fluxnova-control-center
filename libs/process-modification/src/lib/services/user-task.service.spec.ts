import { firstValueFrom, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { UserTask } from '@fxn/types';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { UserTaskService } from './user-task.service';
import { PaginatedDataRequest } from './types/paginated-data-request';

const mockHttp = {
  post: vi.fn(),
} as unknown as Mocked<HttpClient>;

describe('UserTaskService', () => {
  let service: UserTaskService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UserTaskService, { provide: HttpClient, useValue: mockHttp }],
    });
    service = TestBed.inject(UserTaskService);
    vi.clearAllMocks();
  });

  it('should send request to user-tasks/count endpoint', async () => {
    const filter = { some: 'filter' } as any;
    mockHttp.post.mockReturnValueOnce(of(42));

    const result = await firstValueFrom(service.getUserTaskCountByFilter(filter));

    expect(result).toBe(42);
    expect(mockHttp.post).toHaveBeenCalledWith('api/user-tasks/count', filter);
  });

  it('should send request to user-tasks/ endpoint', async () => {
    const req = new PaginatedDataRequest({
      filter: {
        processInstanceId: 'abc123',
      },
      firstResult: 0,
      maxResults: 10,
    });
    const tasks: UserTask[] = [{ id: '1' } as UserTask];
    mockHttp.post.mockReturnValueOnce(of(tasks));

    const result = await firstValueFrom(service.getUserTasksByFilter(req));

    expect(result).toEqual(tasks);
    expect(mockHttp.post).toHaveBeenCalledWith('api/user-tasks/', req);
  });

  it('should memoize getUserTaskCountByFilter', () => {
    const filter = { some: 'filter' } as any;
    mockHttp.post.mockReturnValue(of(1));
    const obs1 = service.getUserTaskCountByFilter(filter);
    const obs2 = service.getUserTaskCountByFilter(filter);
    expect(obs1).toBe(obs2); // Memoized returns same observable
  });

  it('should memoize getUserTasksByFilter', () => {
    const req = { filter: {}, firstResult: 0, maxResults: 10 } as PaginatedDataRequest;
    mockHttp.post.mockReturnValue(of([]));
    const obs1 = service.getUserTasksByFilter(req);
    const obs2 = service.getUserTasksByFilter(req);
    expect(obs1).toBe(obs2); // Memoized returns same observable
  });

  it('should call the underlying _getUserTaskCountByFilter', async () => {
    const filter = { foo: 'bar' } as any;
    mockHttp.post.mockReturnValueOnce(of(99));

    const result = await firstValueFrom((service as any)._getUserTaskCountByFilter(filter));

    expect(result).toBe(99);
    expect(mockHttp.post).toHaveBeenCalledWith('api/user-tasks/count', filter);
  });

  it('should call the underlying _getUserTasksByFilter', async () => {
    const req = { filter: {}, firstResult: 0, maxResults: 5 } as PaginatedDataRequest;
    const tasks: UserTask[] = [{ id: '2' } as UserTask];
    mockHttp.post.mockReturnValueOnce(of(tasks));

    const result = await firstValueFrom((service as any)._getUserTasksByFilter(req));

    expect(result).toEqual(tasks);
    expect(mockHttp.post).toHaveBeenCalledWith('api/user-tasks/', req);
  });
});
