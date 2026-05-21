import { cloneDeep } from 'lodash-es';
import { of, throwError } from 'rxjs';
import { editor } from 'monaco-editor';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NgbActiveModal, NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { CUSTOM_ELEMENTS_SCHEMA, ElementRef, EventEmitter } from '@angular/core';
import { CodeEditorComponent } from '@fxn/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DecisionDefinitionService } from '../../../../services/decision-definition.service';
import { EVALUATE_DECISION_SCHEMA, EvaluateDecisionModalComponent } from './evaluate-decision-modal.component';
import IMarker = editor.IMarker;

describe('EvaluateDecisionModalComponent', () => {
  let component: EvaluateDecisionModalComponent;
  let fixture: ComponentFixture<EvaluateDecisionModalComponent>;

  const mockDefinitionService = {
    evaluateDecision: vi.fn().mockReturnValue(of({})),
  };

  const mockModal = {
    close: vi.fn(),
    dismiss: vi.fn(),
  };

  global.ResizeObserver = vi.fn(function () {
    return {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    };
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EvaluateDecisionModalComponent],
      imports: [FormsModule, NgbPopoverModule],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: NgbActiveModal, useValue: mockModal },
        { provide: DecisionDefinitionService, useValue: mockDefinitionService },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(EvaluateDecisionModalComponent);
    component = fixture.componentInstance;
    component.codeEditor = { subscribe: vi.fn() } as unknown as CodeEditorComponent;
    component.resultEditor = { subscribe: vi.fn() } as unknown as CodeEditorComponent;
    fixture.detectChanges();

    mockDefinitionService.evaluateDecision = vi.fn().mockReturnValue(of({}));

    const defaultPayload = {
      variables: {
        season: {
          value: 'Spring',
          type: 'String',
        },
        guestCount: {
          value: 42,
          type: 'Double',
        },
      },
    };

    component.modalData = {
      jsonValue: JSON.stringify(defaultPayload),
      submitted: true,
      result:
        '[\n' +
        '  {\n' +
        '    "desiredDish": {\n' +
        '      "type": "String",\n' +
        '      "value": "Stew",\n' +
        '      "valueInfo": {}\n' +
        '    }\n' +
        '  }\n' +
        ']',
    };
    vi.useFakeTimers();
  });

  afterEach(() => vi.useRealTimers());

  it('should submit a request', () => {
    component.options.decisionDefinitionId = '1234';
    component.modalData.jsonValue = `{
      "variables": {
        "season": { "value": "Spring", "type": "String" },
        "guestCount": { "value": 42, "type": "Double" }
      }
    }`;
    component.confirm();
    expect(mockDefinitionService.evaluateDecision).toHaveBeenCalledWith(
      component.options.decisionDefinitionId,
      JSON.parse(component.modalData.jsonValue),
    );
  });

  it('should send an empty object if the form is empty', () => {
    component.options.decisionDefinitionId = '1234';
    component.modalData.jsonValue = '';
    component.confirm();
    expect(mockDefinitionService.evaluateDecision).toHaveBeenCalledWith(component.options.decisionDefinitionId, {});
  });

  it('should report back a successful submission if no issues with starting process definition', () => {
    component.options.decisionDefinitionId = '1234';
    component.confirm();

    expect(component.modalState.successfulSubmit).toBeTruthy();
  });

  it('should disable the confirm button and display an error if server returns bad request', async () => {
    mockDefinitionService.evaluateDecision = vi.fn().mockReturnValue(throwError(() => new Error('async error')));

    component.options.decisionDefinitionId = '1234';
    component.confirm();

    await expect(vi.runAllTimersAsync()).rejects.toThrowError('async error');
    expect(component.modalState.hideErrorMessage).toBe(false);
    expect(component.modalState.errorMessage).toEqual(
      'Unable to evaluate decision. Please check your input against the model and try again.',
    );
    expect(component.canSubmit).toBe(false);
  });

  it('should close modal when dismissed via Cancel/Close button', () => {
    component.options.decisionDefinitionId = '1234';
    component.confirm();
    component.dismiss();
    expect(mockModal.close).toHaveBeenCalled();
  });

  describe('onAfterViewInit', () => {
    const mockModel = {
      setValue: vi.fn(),
    };
    const mockLocalEditor = {
      getModel: vi.fn().mockReturnValue(mockModel),
    } as unknown as typeof editor;

    const mockEditor = {
      editorInitialized: new EventEmitter<typeof editor>(),
      modelMarkersChangeEvent: new EventEmitter<IMarker[]>(),
      monaco: {
        Uri: {
          parse: vi.fn().mockReturnValue('a://decision-definition/evaluate-decision.json'),
        },
        languages: {
          json: {
            jsonDefaults: {
              setDiagnosticsOptions: vi.fn(),
            },
          },
        },
      },
      updateModel: vi.fn(),
      localEditor: {
        layout: vi.fn(),
      },
      setupListeners: vi.fn(),
    } as unknown as CodeEditorComponent;

    const mockResultEditor = cloneDeep(mockEditor) as unknown as CodeEditorComponent;
    mockResultEditor.monaco.Uri.parse = vi.fn().mockReturnValue('a://decision-definition/evaluate-result.json');

    it('should set up the input editor when editor is initialized', () => {
      component.codeEditor = mockEditor;
      component.ngAfterViewInit();
      mockEditor.editorInitialized.emit(mockLocalEditor);

      expect(mockEditor.monaco.languages.json.jsonDefaults.setDiagnosticsOptions).toHaveBeenCalledWith({
        validate: true,
        schemas: [
          {
            fileMatch: ['a://decision-definition/evaluate-decision.json'],
            ...EVALUATE_DECISION_SCHEMA,
          },
        ],
      });
      expect(mockModel.setValue).toHaveBeenCalledWith('');
      expect(mockEditor.updateModel).toHaveBeenCalledWith(mockModel);
    });

    it('should set up the result editor when editor is initialized', () => {
      component.resultEditor = mockResultEditor;
      component.ngAfterViewInit();
      mockResultEditor.editorInitialized.emit(mockLocalEditor);

      expect(mockModel.setValue).toHaveBeenCalledWith('');
      expect(mockResultEditor.updateModel).toHaveBeenCalledWith(mockModel);
    });

    it('should update canSubmit when markers change', () => {
      component.codeEditor = mockEditor;
      component.ngAfterViewInit();

      expect(component.canSubmit).toBeTruthy();

      mockEditor.modelMarkersChangeEvent.emit([{} as unknown as IMarker]);

      expect(component.canSubmit).toBeFalsy();
    });

    it('should update the modalData and canSubmit when json is updated', () => {
      component.codeEditor = mockEditor;
      component.ngAfterViewInit();
      component.updateCanSubmit = vi.fn();

      component.onJsonUpdate('asdf');
      expect(component.modalState.hideErrorMessage).toBe(true);
      expect(component.modalData.jsonValue).toBe('asdf');
      expect(component.updateCanSubmit).toHaveBeenCalled();
    });

    it('should layout editors on resize observer callback', () => {
      const containerElement = {
        clientWidth: 800,
        clientHeight: 600,
      } as unknown as Element;
      component.codeContainer = { nativeElement: containerElement } as ElementRef;
      component.codeEditor = mockEditor;
      component.resultEditor = mockResultEditor;

      const codeEditorLayoutSpy = vi.spyOn(mockEditor.localEditor as any, 'layout');
      const resultEditorLayoutSpy = vi.spyOn(mockResultEditor.localEditor as any, 'layout');

      // Override global ResizeObserver
      let resizeCallback: ResizeObserverCallback = {} as ResizeObserverCallback;
      const observeSpy = vi.fn();
      vi.spyOn(window, 'ResizeObserver').mockImplementation(function (callback: ResizeObserverCallback) {
        resizeCallback = callback;
        return {
          observe: observeSpy,
          unobserve: vi.fn(),
          disconnect: vi.fn(),
        } as unknown as ResizeObserver;
      });

      component.ngAfterViewInit();

      expect(observeSpy).toHaveBeenCalledWith(containerElement);

      // Simulate a resize event
      resizeCallback?.(
        [
          {
            target: containerElement,
            contentRect: {} as unknown as DOMRectReadOnly,
            borderBoxSize: [],
            contentBoxSize: [],
            devicePixelContentBoxSize: [],
          },
        ],
        {} as ResizeObserver,
      );

      expect(codeEditorLayoutSpy).toHaveBeenCalledWith({ width: 400, height: 600 });
      expect(resultEditorLayoutSpy).toHaveBeenCalledWith({ width: 400, height: 600 });
    });
  });
});
