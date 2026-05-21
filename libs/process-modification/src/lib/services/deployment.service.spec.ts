import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeploymentService } from './deployment.service';
import { DeploymentResourceUtilsService } from './deployment-resource-utils.service';

describe('deployment.service', () => {
  const textEncoder = new window.TextEncoder();
  const testResourceTextResponse = 'test response';
  const resourceResponse = textEncoder.encode(testResourceTextResponse);

  const mockHttp = {
    get: vi.fn(() => resourceResponse),
    delete: vi.fn(() => of({})),
  } as any;

  const mockResourceUtilsService = {} as any;
  let service: DeploymentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DeploymentService,
        { provide: HttpClient, useValue: mockHttp },
        { provide: DeploymentResourceUtilsService, useValue: mockResourceUtilsService },
      ],
    });

    service = TestBed.inject(DeploymentService);
  });

  it('should delete deployment', () => {
    service.deleteDeployment('asdf', false, true, true);

    expect(mockHttp.delete).toHaveBeenCalledWith(`api/deployment/asdf`, {
      params: {
        cascade: false,
        skipCustomListeners: true,
        skipIoMappings: true,
      },
    });
  });
});
