import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ProcessDefinition } from '@fxn/types';
import { ToastService } from '@fxn/common';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { ProcessDefinitionService } from '../../../../services/process-definition.service';
import { ProcessInstanceService } from '../../../../services/process-instance.service';
import { ProcessDefinitionInfoSectionComponent } from './process-definition-info-section.component';

describe('Process Definition Info Section Component', () => {
  let component: ProcessDefinitionInfoSectionComponent;
  let fixture: ComponentFixture<ProcessDefinitionInfoSectionComponent>;

  const processDefinition: ProcessDefinition = {
    id: '123',
    key: 'abc',
  };
  const processDefinitionId = processDefinition.id as string;

  const versions = [
    { versionDefinitionId: 'definition-1', versionNumber: 1 },
    { versionDefinitionId: 'definition-2', versionNumber: 2 },
  ];

  const mockProcessDefinitionService: Mocked<ProcessDefinitionService> = {
    getProcessDefinitionById: vi.fn(() => of(processDefinition)),
    getProcessDefinitionVersionsByKey: vi.fn(() => of(versions)),
  } as unknown as Mocked<ProcessDefinitionService>;

  const mockProcessInstanceService: Mocked<ProcessInstanceService> = {
    getProcessInstanceCountByFilter: vi.fn(() => of(1)),
  } as unknown as Mocked<ProcessInstanceService>;

  const mockToastService = {
    error: vi.fn(),
  } as unknown as Mocked<ToastService>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProcessDefinitionInfoSectionComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
      providers: [
        { provide: ProcessDefinitionService, useValue: mockProcessDefinitionService },
        { provide: ProcessInstanceService, useValue: mockProcessInstanceService },
        { provide: ToastService, useValue: mockToastService },
      ],
    });
    fixture = TestBed.createComponent(ProcessDefinitionInfoSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => vi.useRealTimers());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the details', async () => {
    component.processDefinitionId = processDefinitionId;

    expect(mockProcessDefinitionService.getProcessDefinitionById).toHaveBeenCalledWith(processDefinitionId);

    await vi.advanceTimersByTimeAsync(1);

    expect(component.processDefinition).toEqual(processDefinition);
  });

  it('should show an error when loading details fails', async () => {
    mockProcessDefinitionService.getProcessDefinitionById.mockReturnValueOnce(
      throwError(() => {
        new Error('A new error');
      }),
    );

    component.processDefinitionId = processDefinitionId;
    await vi.runAllTimersAsync();

    expect(mockToastService.error).toHaveBeenCalledWith('Failed to load process definition');
  });

  it('should load process versions', async () => {
    component.processDefinitionId = processDefinitionId;

    await vi.advanceTimersByTimeAsync(1);

    expect(mockProcessDefinitionService.getProcessDefinitionVersionsByKey).toHaveBeenCalledWith(processDefinition.key);
  });

  it('should show an error when loading version fails', async () => {
    mockProcessDefinitionService.getProcessDefinitionVersionsByKey.mockReturnValueOnce(
      throwError(() => {
        new Error('A new error');
      }),
    );

    component.processDefinitionId = processDefinitionId;

    await vi.runAllTimersAsync();

    expect(mockToastService.error).toHaveBeenCalledWith('Failed to load process definition versions');
  });

  it('should get the count of instances for each version when version dropdown is opened', async () => {
    component.processDefinitionId = processDefinitionId;

    await vi.advanceTimersByTimeAsync(1);

    component.onVersionOpen();

    await vi.advanceTimersByTimeAsync(1);

    expect(mockProcessInstanceService.getProcessInstanceCountByFilter).toHaveBeenNthCalledWith(1, {
      processDefinitionId: versions[0].versionDefinitionId,
    });
    expect(mockProcessInstanceService.getProcessInstanceCountByFilter).toHaveBeenNthCalledWith(2, {
      processDefinitionId: versions[1].versionDefinitionId,
    });
  });

  it('should cancel loading counts when dropdown is closed', () => {
    component.cancel$ = { next: vi.fn() } as any;

    component.onVersionClose();

    expect(component.cancel$.next).toHaveBeenCalled();
  });

  it('should unsubscribe on destroy', () => {
    component.definitionSub = { unsubscribe: vi.fn() } as any;
    component.versionCountsSub = { unsubscribe: vi.fn() } as any;
    component.versionsSub = { unsubscribe: vi.fn() } as any;

    component.ngOnDestroy();

    expect(component.definitionSub?.unsubscribe).toHaveBeenCalled();
    expect(component.versionCountsSub?.unsubscribe).toHaveBeenCalled();
    expect(component.versionsSub?.unsubscribe).toHaveBeenCalled();
  });
});
