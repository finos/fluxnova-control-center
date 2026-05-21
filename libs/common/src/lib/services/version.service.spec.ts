import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { VersionService } from './version.service';

vi.mock('./memoize', () => ({
  memoize: vi.fn((fn) => fn),
}));

describe('VersionService', () => {
  let service: VersionService;
  let mockHttp: { get: Mock };

  beforeEach(() => {
    mockHttp = {
      get: vi.fn(() => of({ version: '1.2.3' })),
    };

    TestBed.configureTestingModule({
      providers: [VersionService, { provide: HttpClient, useValue: mockHttp }],
    });

    service = TestBed.inject(VersionService);
  });

  it('should call the correct endpoint and return the version', async () => {
    const result = await firstValueFrom(service.getRestAPIVersion());
    expect(result).toEqual({ version: '1.2.3' });
    expect(mockHttp.get).toHaveBeenCalledWith('api/version');
  });
});
