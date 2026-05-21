import { HttpClient } from '@angular/common/http';
import { ToastService } from '@fxn/common';
import { lastValueFrom, of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { DiagramService } from './diagram.service';

describe('DiagramService', () => {
  let diagramService: DiagramService;

  const mockToastService = { error: vi.fn() } as unknown as Mocked<ToastService>;
  const mockHttp = {
    get: vi.fn().mockReturnValue(of({})),
  } as unknown as Mocked<HttpClient>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DiagramService,
        { provide: ToastService, useValue: mockToastService },
        { provide: HttpClient, useValue: mockHttp },
      ],
    });

    diagramService = TestBed.inject(DiagramService);

    vi.clearAllMocks();
  });

  it('should call the process-definitions service', () => {
    const definitionId = '1234';
    diagramService.getProcessDefinitionDiagram(definitionId);

    expect(mockHttp.get).toHaveBeenCalledWith(`api/process-definitions/${definitionId}/diagram`);
  });

  it('should call the decision-definitions service', () => {
    const definitionId = '1234';
    diagramService.getDecisionDefinitionDiagram(definitionId);

    expect(mockHttp.get).toHaveBeenCalledWith(`api/decision-definition/${definitionId}/xml`);
  });

  it('should notify the user of the error', () => {
    diagramService.handleError('message');

    expect(mockToastService.error).toHaveBeenCalledTimes(1);
  });

  it('should return an observable with a properly formatted error', async () => {
    const error = diagramService.handleError('message');

    await expect(lastValueFrom(error)).resolves.toEqual({ error: 'message' });
  });
});
