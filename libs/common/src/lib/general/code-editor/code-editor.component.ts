import { Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { WINDOW } from 'ngx-window-token';
import { editor, IDisposable } from 'monaco-editor';
import ITextModel = editor.ITextModel;
import IMarker = editor.IMarker;

export const DEFAULT_EDITOR_OPTIONS: any = {
  theme: 'github',
  language: 'javascript',
  readOnly: true,
  fixedOverflowWidgets: false,
  minimap: {
    enabled: true,
  },
  lineNumbersMinChars: 3,
  scrollBeyondLastLine: false,
};

export interface ScriptInfo {
  content: string;
  name: string;
  language?: string;
}

@Component({
  selector: 'fluxnova-code-editor',
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.scss'],
  standalone: false,
})
export class CodeEditorComponent implements OnInit, OnDestroy {
  private readonly window = inject<Window>(WINDOW);

  private readonly disposables: IDisposable[] = [];
  private model?: editor.ITextModel;
  private _scriptInfo?: ScriptInfo;

  @Input() editorOptionsOverrides: any = {};
  @Input() set scriptInfo(scriptInfo: ScriptInfo) {
    this._scriptInfo = scriptInfo;

    if (this.localEditor) {
      const uri = this.monaco.Uri.parse(scriptInfo.name);
      const previouslyLoadedModel: ITextModel | null = this.globalEditor.getModel(uri);
      this.updateModel(
        previouslyLoadedModel ??
          this.globalEditor.createModel(
            this._scriptInfo.content,
            this._scriptInfo?.language ?? this.editorOptions.language,
            uri,
          ),
      );

      if (!previouslyLoadedModel) this.setupListeners();
    }
  }

  @Output() editorInitialized = new EventEmitter<typeof editor>();
  @Output() codeChangeEvent = new EventEmitter<string>();
  @Output() modelMarkersChangeEvent = new EventEmitter<IMarker[]>();

  get monaco() {
    return (<any>this.window).monaco;
  }

  /**
   * @returns Object containing functions from the editor namespace
   */
  get globalEditor(): typeof editor {
    return this.monaco.editor;
  }

  localEditor?: editor.IEditor;

  editorOptions = DEFAULT_EDITOR_OPTIONS;

  ngOnInit() {
    // Apply overrides that were passed in from the html template
    this.applyOverrides();
  }

  ngOnDestroy() {
    this.globalEditor.getModels().forEach((model) => model.dispose());
    this.disposables.forEach((d) => d?.dispose());
  }

  onInitializeEditor(codeEditor: editor.IEditor) {
    this.localEditor = codeEditor;
    this.editorInitialized.emit(this.globalEditor);
  }

  /**
   * Called when switching between script files and when
   * editing the text within the editor.
   *
   * @param $event
   */
  onCodeChange($event: any) {
    if (this.editorOptions.readOnly) this.applyOverrides();

    this.codeChangeEvent.emit($event);
  }

  applyOverrides() {
    this.editorOptions = { ...DEFAULT_EDITOR_OPTIONS, ...this.editorOptionsOverrides };
  }

  updateModel(model: ITextModel) {
    this.model = model;
    this.localEditor?.setModel(model);
  }

  setupListeners() {
    if (this.model) {
      this.disposables.push(
        this.model.onDidChangeContent(() => {
          this.codeChangeEvent.emit(this.model?.getValue());
        }),
        this.globalEditor.onDidChangeMarkers(() => {
          this.modelMarkersChangeEvent.emit(this.globalEditor.getModelMarkers({}));
        }),
      );
    }
  }

  format() {
    this.localEditor?.trigger(this.model?.getValue(), 'editor.action.formatDocument', {});
  }
}
