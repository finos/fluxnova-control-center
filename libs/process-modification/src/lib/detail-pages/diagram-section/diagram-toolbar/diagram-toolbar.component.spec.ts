import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { NgbTooltip, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject } from 'rxjs';
import { ButtonActions } from '@fxn/types/src/button-actions';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToolbarService } from '../../../common/toolbar/toolbar.service';
import { ItemDetailPageCommunicationService } from '../../item-detail-page.communication.service';
import { PimCommandStackService } from '../pim-command-stack.service';
import { DiagramToolbarComponent } from './diagram-toolbar.component';

describe('Diagram Toolbar Component', () => {
  let component: DiagramToolbarComponent;
  let fixture: ComponentFixture<DiagramToolbarComponent>;
  const mockStack = {
    execute: vi.fn(),
    clear: vi.fn(),
    willActionsTerminateProcess: vi.fn(() => false),
    isEmpty$: new BehaviorSubject<boolean>(true),
    isUndoEmpty: true,
    wasStackAppliedSuccessfully$: new BehaviorSubject<boolean>(false),
  };
  const mockToolbarService = {
    emitter: { emit: vi.fn() },
  };
  const mockTooltip = {
    close: vi.fn(),
  } as unknown as NgbTooltip;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DiagramToolbarComponent],
      imports: [NgbTooltipModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
      providers: [
        { provide: PimCommandStackService, useValue: mockStack },
        { provide: ToolbarService, useValue: mockToolbarService },
        ItemDetailPageCommunicationService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DiagramToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call clear on the stack when onCancel is called', () => {
    component.onCancel();
    expect(mockStack.clear).toHaveBeenCalledTimes(1);
  });

  it('should set isEditing to true when onEdit is called', () => {
    expect(component.isEditing).toBeFalsy();
    component.onEdit();
    expect(component.isEditing).toBeTruthy();
  });

  it('should set isEditing and hasChanges to true when isEmpty$ observable is false', () => {
    mockStack.isEmpty$.next(false);

    expect(component.isEditing).toBeTruthy();
    expect(component.hasChanges).toBeTruthy();
  });

  it('should set isEditing to true and hasChanges to false when isEmpty$ observable is false and isUndoEmpty is true', () => {
    mockStack.isEmpty$.next(false);
    mockStack.isUndoEmpty = false;
    mockStack.isEmpty$.next(true);

    expect(component.isEditing).toBeTruthy();
    expect(component.hasChanges).toBeFalsy();
  });

  it('should set isEditing to false when wasStackAppliedSuccessfully is true', () => {
    mockStack.isEmpty$.next(false);
    mockStack.isUndoEmpty = false;
    mockStack.wasStackAppliedSuccessfully$.next(true);

    expect(component.isEditing).toBeFalsy();
  });

  it('should dispatch a evaluate_decision click event when calling evaluate', () => {
    component.onEvaluateDecision();

    expect(mockToolbarService.emitter.emit).toHaveBeenCalledWith({ target: 'evaluate_decision', action: 'click' });
  });

  it('should dispatch a start_process click event when calling onStartProcess', () => {
    component.onStartProcess();

    expect(mockToolbarService.emitter.emit).toHaveBeenCalledWith({ target: 'start_process', action: 'click' });
  });

  it('should dispatch an apply_changes click event when calling onApplyChanges', () => {
    component.onApplyChanges();

    expect(mockToolbarService.emitter.emit).toHaveBeenCalledWith({ target: 'apply_changes', action: 'click' });
  });

  it('should set isStartEnabled to true when enabling the start_process button', () => {
    component.enable([ButtonActions.START_PROCESS]);

    expect(component.isStartEnabled).toBe(true);
  });

  it('should set isEditEnabled to true when enabling the move_tokens button', () => {
    component.enable([ButtonActions.MOVE_TOKEN]);

    expect(component.isEditEnabled).toBe(true);
  });

  it('should set isStartEnabled to false when disabling the start_process button', () => {
    component.disable([ButtonActions.START_PROCESS]);

    expect(component.isStartEnabled).toBe(false);
  });

  it('should set isEditEnabled to false when disabling the move_tokens button', () => {
    component.disable([ButtonActions.MOVE_TOKEN]);

    expect(component.isEditEnabled).toBe(false);
  });

  it('should dispatch a diagramTools zoom event when calling onZoomDiagram', () => {
    component.onZoomDiagram(1, mockTooltip);

    expect(mockToolbarService.emitter.emit).toHaveBeenCalledWith({ target: 'diagramTools', action: 'zoom', value: 1 });
  });

  it('should dispatch a diagramTools reset-view event when calling onRecenterDiagram', () => {
    component.onRecenterDiagram(mockTooltip);

    expect(mockToolbarService.emitter.emit).toHaveBeenCalledWith({ target: 'diagramTools', action: 'reset-view' });
  });

  it('should call event bus when showing/hiding flow', () => {
    const flowHighlightedSpy = vi.spyOn((component as any).eventBus, 'diagramFlowHighlighted');
    component.onToggleDiagramColors(mockTooltip);

    expect(flowHighlightedSpy).toHaveBeenCalledWith(false);
  });

  it('should call event bus when showing/hiding instance statistics', () => {
    const instanceStatisticsSpy = vi.spyOn((component as any).eventBus, 'instanceStatisticsShown');
    component.onToggleInstanceStatistics(mockTooltip);

    expect(instanceStatisticsSpy).toHaveBeenCalledWith(false);
  });

  it('should call event bus when activating/disabling heatmap', () => {
    expect(component.heatmapState.isOpen).toBe(false);
    component.onToggleHeatmap(mockTooltip);
    expect(component.heatmapState.isOpen).toBe(true);
  });

  it('should prevent focus on button click', () => {
    const blurSpy = vi.fn();
    const event = new MouseEvent('click');
    const target = document.createElement('button');
    target.blur = blurSpy;
    Object.defineProperty(event, 'target', { value: target, writable: false });

    component.preventFocus(event);

    expect(blurSpy).toHaveBeenCalled();
  });
});
