import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProcessInstanceService } from '../../../../services/process-instance.service';
import { ProcessInstanceInfoSectionComponent } from './process-instance-info-section.component';

describe('Process Instance Info Section Component', () => {
  let component: ProcessInstanceInfoSectionComponent;
  let fixture: ComponentFixture<ProcessInstanceInfoSectionComponent>;

  const mockProcessInstanceService = {
    getProcessInstance: vi.fn(() =>
      of({
        id: '123',
        state: 'ACTIVE',
      }),
    ),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProcessInstanceInfoSectionComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
      providers: [
        { provide: ProcessInstanceService, useValue: mockProcessInstanceService },
        { provide: ActivatedRoute, useValue: { params: of({}) } },
      ],
    });
    fixture = TestBed.createComponent(ProcessInstanceInfoSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    vi.useFakeTimers();
  });

  afterEach(() => vi.useRealTimers());

  it('should end up in ready state with all values correct after receiving the id', () => {
    component.processInstanceId = '123';
    fixture.detectChanges();

    expect(component.isLoading).toEqual(false);
    expect(component.processInstance).toEqual({ id: '123', state: 'ACTIVE' });
    expect(component.stateMap['ACTIVE'].value).toEqual(component.processInstance?.state);
  });

  it('should refresh data when reloadNeeded event is received', async () => {
    component.processInstanceId = '123';
    fixture.detectChanges();

    expect(component.stateMap['ACTIVE'].value).toEqual(component.processInstance?.state);
    mockProcessInstanceService.getProcessInstance.mockReturnValueOnce(of({ id: '456', state: 'SUSPENDED' }));
    component.eventBus.reloadNeeded();
    await vi.advanceTimersByTimeAsync(201);
    expect(component.stateMap['SUSPENDED']?.value).toEqual(component.processInstance?.state);
  });
});
