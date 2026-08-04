import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal, NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { CUSTOM_ELEMENTS_SCHEMA, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { CodeEditorComponent } from '@fxn/common';
import { editor } from 'monaco-editor';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProcessDefinitionService } from '../../../../services/process-definition.service';
import { START_FORM_SCHEMA, StartProcessDefinitionModalComponent } from './start-process-definition-modal.component';
import IMarker = editor.IMarker;

describe('StartProcessDefinitionModalComponent', () => {
  let component: StartProcessDefinitionModalComponent;
  let fixture: ComponentFixture<StartProcessDefinitionModalComponent>;

  const mockDefinitionService = {
    submitStartFormWithDefinitionId: vi.fn().mockReturnValue(of({})),
  };

  const mockModal = {
    close: vi.fn(),
    dismiss: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StartProcessDefinitionModalComponent],
      imports: [FormsModule, NgbPopoverModule],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: NgbActiveModal, useValue: mockModal },
        { provide: ProcessDefinitionService, useValue: mockDefinitionService },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(StartProcessDefinitionModalComponent);
    component = fixture.componentInstance;
    component.codeEditor = { subscribe: vi.fn() } as unknown as CodeEditorComponent;
    fixture.detectChanges();

    mockDefinitionService.submitStartFormWithDefinitionId = vi.fn().mockReturnValue(of({}));
    const defaultPayload = {
      variables: {
        aVariable: {
          value: 'aVariable',
          type: 'String',
        },
        anotherVariable: {
          value: true,
          type: 'Boolean',
        },
      },
      businessKey: 'myBusinessKey',
    };

    component.modalData = {
      businessKey: 'myBusinessKey',
      jsonValue: JSON.stringify(defaultPayload),
      submitted: true,
      instanceId: '123',
    };
    vi.useFakeTimers();
  });

  afterEach(() => vi.useRealTimers());

  it('should submit a request', () => {
    component.options.processDefinitionId = '1234';
    component.modalData.jsonValue = '{"businessKey": "hello"}';
    component.confirm();
    expect(mockDefinitionService.submitStartFormWithDefinitionId).toHaveBeenCalledWith(
      component.options.processDefinitionId,
      JSON.parse(component.modalData.jsonValue),
    );
  });

  it('should send an empty object if the form is empty', () => {
    component.confirm();

    component.modalData.jsonValue = '';
    component.confirm();
    expect(mockDefinitionService.submitStartFormWithDefinitionId).toHaveBeenCalledWith(
      component.options.processDefinitionId,
      {},
    );
  });

  it('should report back a successful submission if no issues with starting process definition', () => {
    component.options.processDefinitionId = '1234';
    component.confirm();

    expect(component.modalState.successfulSubmit).toBeTruthy();
  });

  it('should disable the confirm button and display an error if server returns bad request', async () => {
    mockDefinitionService.submitStartFormWithDefinitionId = vi
      .fn()
      .mockReturnValue(throwError(() => new Error('async error')));

    try {
      component.confirm();
      await vi.runAllTimersAsync();
    } catch {
      // Expected because handleAction rethrows in catchError.
    }

    expect(component.modalState.hideErrorMessage).toBeFalsy();
    expect(component.canSubmit).toBe(false);
  });

  it('should close modal with data if submission was successful', () => {
    component.options.processDefinitionId = '1234';
    component.confirm();
    component.dismiss();
    expect(mockModal.close).toHaveBeenCalled();
  });

  it('should hide error message if business key is changed', () => {
    component.modalState.hideErrorMessage = false;
    component.modalState.errorMessage = 'Testing error message';

    component.handleBusinessKeyChange('newBusinessKey');
    expect(component.modalState.hideErrorMessage).toBeTruthy();
    expect(component.modalState.errorMessage).toBeFalsy();
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
          parse: vi.fn().mockReturnValue('a://start-form.json'),
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
    } as unknown as CodeEditorComponent;

    it('should setup the editor when editor is initialized', () => {
      component.codeEditor = mockEditor;
      component.ngAfterViewInit();
      mockEditor.editorInitialized.emit(mockLocalEditor);

      expect(mockEditor.monaco.languages.json.jsonDefaults.setDiagnosticsOptions).toHaveBeenCalledWith({
        validate: true,
        schemas: [
          {
            fileMatch: ['a://start-form.json'],
            ...START_FORM_SCHEMA,
          },
        ],
      });
      expect(mockModel.setValue).toHaveBeenCalledWith('');
      expect(mockEditor.updateModel).toHaveBeenCalledWith(mockModel);
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
  });
});
