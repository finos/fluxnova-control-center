import { beforeEach, describe, expect, it, type Mocked, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { editor } from 'monaco-editor';
import { WINDOW } from 'ngx-window-token';
import { CodeEditorComponent, DEFAULT_EDITOR_OPTIONS } from './code-editor.component';
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;
import ITextModel = editor.ITextModel;

describe('CodeEditorComponent', () => {
  let component: CodeEditorComponent;
  let fixture: ComponentFixture<CodeEditorComponent>;
  const mockWindow = {
    monaco: {
      editor: {
        getModelMarkers: vi.fn(),
        onDidChangeMarkers: vi.fn(() => ({ dispose: vi.fn() })),
        createModel: vi.fn(),
        getModel: vi.fn(),
        getModels: () => [],
      },
      Uri: {
        parse: vi.fn(() => {}),
      },
    },
  } as unknown as Window;

  const mockEditor = {
    setModel: vi.fn(),
    trigger: vi.fn(),
  } as unknown as Mocked<IStandaloneCodeEditor>;

  const mockModel = {
    onDidChangeContent: vi.fn(),
    getValue: () => 'i am code',
  } as unknown as Mocked<ITextModel>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: WINDOW, useValue: mockWindow }],
      declarations: [CodeEditorComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CodeEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    vi.clearAllMocks();
  });

  it('should be able to override the DEFAULT_EDITOR_OPTIONS', () => {
    component.editorOptionsOverrides = { theme: 'vs', language: 'typescript' };
    component.ngOnInit();
    expect(component.editorOptions).toEqual({
      ...DEFAULT_EDITOR_OPTIONS,
      theme: 'vs',
      language: 'typescript',
    });
  });

  it('should initialize the editor', () => {
    let initializedEditor: any;

    component.editorInitialized.subscribe((ed) => {
      initializedEditor = ed;
    });

    component.onInitializeEditor(mockEditor);

    expect(initializedEditor).toBeDefined();
    expect(component.localEditor).toBeDefined();
  });

  it('should applyOverrides when switching code to be displayed', () => {
    component.editorOptionsOverrides = { theme: 'mySpecialTheme' };

    component.onCodeChange({});

    expect(component.editorOptions).toEqual({
      ...DEFAULT_EDITOR_OPTIONS,
      theme: 'mySpecialTheme',
    });
  });

  it('should emit codeChangeEvent onCodeChange', () => {
    const event = {};
    let emittedEvent: any;

    component.codeChangeEvent.subscribe((e) => {
      emittedEvent = e;
    });

    component.onCodeChange(event);

    expect(emittedEvent).toBe(event);
  });

  it('should update the model when updateModel is called', () => {
    component.onInitializeEditor(mockEditor);
    component.updateModel(mockModel);

    expect(mockEditor.setModel).toHaveBeenCalledTimes(1);
  });

  it('should setup listeners when setupListeners is called', () => {
    component.onInitializeEditor(mockEditor);
    component.updateModel(mockModel);
    component.setupListeners();

    expect(mockModel.onDidChangeContent).toHaveBeenCalled();
  });

  it('should format the model when format is called', () => {
    component.onInitializeEditor(mockEditor);
    component.updateModel(mockModel);
    component.format();
    expect(mockEditor.trigger).toHaveBeenCalledWith('i am code', 'editor.action.formatDocument', {});
  });

  it('should update the model if the editor has already been initialized when setting the code property', () => {
    component.onInitializeEditor(mockEditor);

    component.scriptInfo = { content: 'i am new code', name: 'code' };
    expect((<any>mockWindow).monaco.editor.createModel).toHaveBeenCalledTimes(1);
    expect(mockEditor.setModel).toHaveBeenCalledTimes(1);
  });

  it('should should not setup listeners on the model more than once', () => {
    const spy = vi.spyOn(component, 'setupListeners');

    component.onInitializeEditor(mockEditor);

    component.scriptInfo = { content: 'i am new code', name: 'code' };

    expect(spy).toHaveBeenCalled();

    spy.mockClear();

    (<any>mockWindow).monaco.editor.getModel.mockReturnValue(mockModel);

    component.scriptInfo = { content: 'i am new code', name: 'code' };

    expect(spy).not.toHaveBeenCalled();
  });

  it('should not update the model if the editor has not been initialized when setting the code property', () => {
    component.scriptInfo = { content: 'i am new code', name: 'code' };

    expect((<any>mockWindow).monaco.editor.createModel).not.toHaveBeenCalledTimes(1);
    expect(mockEditor.setModel).not.toHaveBeenCalledTimes(1);
  });
});
