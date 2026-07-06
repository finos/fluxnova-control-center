import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StackTraceRendererComponent } from './stack-trace-renderer.component';

describe('StackTraceRendererComponent', () => {
  let component: StackTraceRendererComponent;
  let fixture: ComponentFixture<StackTraceRendererComponent>;

  const mockModal = {
    componentInstance: {},
    result: Promise.resolve(true),
  };

  const mockModalService = {
    open: vi.fn().mockReturnValue(mockModal),
  };

  const mockHttpService = {
    get: vi.fn().mockReturnValue(of({})),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StackTraceRendererComponent],
      providers: [
        { provide: NgbModal, useValue: mockModalService },
        { provide: HttpClient, useValue: mockHttpService },
      ],
    }).compileComponents();

    TestBed.overrideProvider(NgbModal, { useValue: mockModalService });
    fixture = TestBed.createComponent(StackTraceRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should set message and jobId in agInit', () => {
    component.agInit({ value: 'test', data: { configuration: '123' } } as any);
    expect(component.message).toEqual('test');
    expect(component.jobId).toEqual('123');
  });

  it('should update message and jobId in refresh', () => {
    component.jobId = 'job123';
    component.message = 'test';
    component.refresh({ value: 'test2', data: { configuration: '1234' } } as any);
    expect(component.message).toEqual('test2');
    expect(component.jobId).toEqual('1234');
  });

  it('should open modal', () => {
    component.jobId = 'job123';
    component.openStackTraceModal();
    expect(mockModalService.open).toHaveBeenCalled();
    expect(mockHttpService.get).toHaveBeenCalledWith('api/jobs/job123/stacktrace', { responseType: 'text' });
  });
});
