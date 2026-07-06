import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { HistoryLinkRendererComponent } from './history-link-renderer.component';

describe('History Link Renderer Component', () => {
  let component: HistoryLinkRendererComponent;
  let fixture: ComponentFixture<HistoryLinkRendererComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HistoryLinkRendererComponent],
      imports: [RouterTestingModule],
    });

    fixture = TestBed.createComponent(HistoryLinkRendererComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should setup a URL for a Task history item from Task Detail Page', () => {
    const type = 'task-detail';
    const mockParams = {
      data: { level: 'Task', taskId: 't123' },
      value: type,
    };
    component.refresh(mockParams as any);
    expect(component.href).toEqual(`../${mockParams.data.taskId}`);
  });

  it('should setup a URL for a Process history item for Task Detail Page', () => {
    const type = 'task-detail';
    const mockParams = {
      data: { level: 'Process', processInstanceId: 'p123' },
      value: type,
    };
    component.refresh(mockParams as any);
    expect(component.href).toEqual(`../process/${mockParams.data.processInstanceId}`);
  });

  it('should setup a URL for a Task history item from Process Detail Page', () => {
    const type = 'process-detail';
    const mockParams = {
      data: { level: 'Task', taskId: 't123' },
      value: type,
    };
    component.refresh(mockParams as any);
    expect(component.href).toEqual(`../../${mockParams.data.taskId}`);
  });

  it('should setup a URL for a Process history item from Process Detail Page', () => {
    const type = 'process-detail';
    const mockParams = {
      data: { level: 'Process', processInstanceId: 'p123' },
      value: type,
    };
    component.refresh(mockParams as any);
    expect(component.href).toEqual(`../${mockParams.data.processInstanceId}`);
  });
});
