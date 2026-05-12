import { of, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ToastService } from '@fxn/common';
import { afterEach, beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { IncidentService } from './incident.service';
import { PaginatedDataRequest } from './types/paginated-data-request';

describe('IncidentService', () => {
  let service: IncidentService;

  const mockHttp = {
    post: vi.fn().mockReturnValue(of()),
  } as unknown as Mocked<HttpClient>;

  const mockToastService = {
    error: vi.fn(),
  } as unknown as Mocked<ToastService>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        IncidentService,
        { provide: HttpClient, useValue: mockHttp },
        { provide: ToastService, useValue: mockToastService },
      ],
    });

    service = TestBed.inject(IncidentService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should send request to incident endpoint', () => {
    const req = new PaginatedDataRequest({}, 100);
    service.getIncidentsByFilterAndPagination(req);
    expect(mockHttp.post).toHaveBeenCalledWith('api/incidents', {
      filter: {},
      firstResult: 0,
      maxResults: 100,
    });
  });

  it('should send request to get incident count', () => {
    service.getIncidentCountByFilter({ activityId: 'activity123' });
    expect(mockHttp.post).toHaveBeenCalledWith('api/incidents/count', { activityId: 'activity123' });
  });

  it('should use toastService to display error on getIncidentsByFilterAndPagination', async () => {
    mockHttp.post.mockReturnValue(throwError(() => ({ message: 'Bad Request' })));
    const req = new PaginatedDataRequest({});

    service.getIncidentsByFilterAndPagination(req).subscribe();

    expect(mockToastService.error).toHaveBeenCalledWith('Bad Request');
  });

  it('should use toastService to display error on getIncidentCountByFilter', async () => {
    mockHttp.post.mockReturnValueOnce(throwError(() => ({ message: 'Bad Request' })));

    service.getIncidentCountByFilter({ activityId: 'activity123' }).subscribe();

    expect(mockToastService.error).toHaveBeenCalledWith('Bad Request');
  });
});
