import { isEmpty } from 'lodash-es';
import { editor } from 'monaco-editor';
import { catchError, debounceTime, Observable, Subject, throwError } from 'rxjs';
import { SubSink } from 'subsink';
import { AfterViewInit, Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CodeEditorComponent } from '@fxn/common';
import { DecisionDefinitionService } from '../../../../services/decision-definition.service';
import IMarker = editor.IMarker;

export interface EvaluateDecisionModalState {
  isSubmitting: boolean;
  successfulSubmit: boolean;
  successMessage: string;
  errorMessage: string;
  hideErrorMessage: boolean;
}

export interface EvaluateDecisionModalResult {
  jsonValue: string;
  submitted: boolean;
  result?: string;
}

export interface EvaluateDecisionOptions {
  decisionDefinitionId?: string;
  confirmButtonLabel?: string;
  cancelButtonLabel?: string;
  title?: string;
  message?: string;
  jsonValue?: string;
  typeOptions?: { value: string; name: string }[];
}

export const EVALUATE_DECISION_DEFAULT_OPTIONS: EvaluateDecisionOptions = {
  confirmButtonLabel: 'Evaluate',
  cancelButtonLabel: 'Cancel',
};

export const EVALUATE_DECISION_DEFAULT_STATE: EvaluateDecisionModalState = {
  successMessage: 'Decision evaluated.',
  errorMessage: '',
  hideErrorMessage: true,
  isSubmitting: false,
  successfulSubmit: false,
};

export const EVALUATE_DECISION_SCHEMA = {
  schema: {
    type: 'object',
    properties: {
      variables: {
        type: 'object',
        minProperties: 1,
        additionalProperties: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
            },
            value: {
              type: ['string', 'number', 'integer', 'object', 'array', 'boolean', 'null'],
            },
            valueInfo: {
              type: 'object',
              properties: {
                objectTypeName: { type: 'string' },
                serializationDataFormat: { type: 'string' },
                filename: { type: 'string' },
                mimetype: { type: 'string' },
                encoding: { type: 'string' },
              },
            },
          },
          required: ['type', 'value'],
        },
      },
    },
  },
};

@Component({
  selector: 'fluxnova-evaluate-decision-modal',
  templateUrl: './evaluate-decision-modal.component.html',
  styleUrls: ['./evaluate-decision-modal.component.scss'],
  standalone: false,
})
export class EvaluateDecisionModalComponent implements OnInit, OnDestroy, AfterViewInit {
  modal = inject(NgbActiveModal);
  private decisionDefinitionService = inject(DecisionDefinitionService);

  @ViewChild('codeEditor', { read: CodeEditorComponent })
  codeEditor?: CodeEditorComponent;

  @ViewChild('resultEditor', { read: CodeEditorComponent })
  resultEditor?: CodeEditorComponent;

  @ViewChild('codeContainer')
  codeContainer?: ElementRef;

  options: EvaluateDecisionOptions = EVALUATE_DECISION_DEFAULT_OPTIONS;

  public modalState: EvaluateDecisionModalState = {
    ...EVALUATE_DECISION_DEFAULT_STATE,
  };

  modalData: EvaluateDecisionModalResult = {
    jsonValue: this.options.jsonValue ?? '',
    result: '',
    submitted: true,
  };

  canSubmit = true;

  public jsonValueSubject = new Subject<string>();
  public resultSubject = new Subject<string>();

  private subs = new SubSink();
  private currentMarkers: IMarker[] = [];
  private codeEditorUri = 'a://decision-definition/evaluate-request.json';
  private resultEditorUri = 'a://decision-definition/evaluate-result.json';
  private resizeObserver?: ResizeObserver;

  protected readonly INPUT_EXAMPLE = `{
    "variables": {
      "aVariable": {
        "type": "String",
        "value": "Foo"
      },
      "anotherVariable": {
        "type": "Double",
        "value": 42
      }
    }
  }`;

  ngOnInit() {
    this.subs.add(
      this.jsonValueSubject.pipe(debounceTime(500)).subscribe(() => {
        this.clearError();
      }),
    );
  }

  ngAfterViewInit() {
    this.subs.add(
      this.codeEditor?.editorInitialized.subscribe((monEditor) => {
        const URI = this.codeEditor?.monaco.Uri.parse(this.codeEditorUri);
        const model = monEditor.getModel(URI) || monEditor.createModel('', 'json', URI);

        this.codeEditor?.monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
          validate: true,
          schemas: [
            {
              fileMatch: [URI.toString()],
              ...EVALUATE_DECISION_SCHEMA,
            },
          ],
        });

        model.setValue('');
        this.codeEditor?.updateModel(model);
        this.codeEditor?.setupListeners();
      }),
      this.codeEditor?.modelMarkersChangeEvent.subscribe((markers) => {
        this.currentMarkers = markers;
        this.updateCanSubmit(markers);
      }),
      this.resultSubject.subscribe((value: string) => {
        const globalEditor = this.resultEditor?.globalEditor;
        const URI = this.resultEditor?.monaco.Uri.parse(this.resultEditorUri);
        const model = globalEditor?.getModel(URI) || globalEditor?.createModel('', 'json', URI);

        if (!model) {
          return;
        }

        model.setValue(JSON.stringify(value, null, '\t'));
        this.resultEditor?.updateModel(model);
      }),
      this.resultEditor?.editorInitialized.subscribe((monEditor) => {
        const URI = this.resultEditor?.monaco.Uri.parse(this.resultEditorUri);
        const model = monEditor.getModel(URI) || monEditor.createModel('', 'json', URI);

        model.setValue('');
        this.resultEditor?.updateModel(model);
      }),
    );
    this.initResizeObserver();
  }

  onJsonUpdate(json: string) {
    this.modalData.jsonValue = json;
    this.modalState.hideErrorMessage = true;

    this.updateCanSubmit(this.currentMarkers);
  }

  public updateCanSubmit(markers?: IMarker[]) {
    this.canSubmit = this.modalState.hideErrorMessage && !this.modalState.isSubmitting && isEmpty(markers);
  }

  dismiss() {
    if (this.modalState.successfulSubmit) {
      this.modal.close({
        ...this.modalData,
      });
    } else {
      this.modal.close();
    }
  }

  clearResultEditorContents() {
    this.resultEditor?.globalEditor.getModel(this.resultEditor?.monaco.Uri.parse(this.resultEditorUri))?.dispose();
  }

  confirm() {
    this.clearResultEditorContents();

    if (!this.options.decisionDefinitionId) {
      this.displayError('Decision definition Id not available. Please try again.');
      return;
    }

    this.modalState.isSubmitting = true;

    try {
      return this.handleAction(
        this.decisionDefinitionService.evaluateDecision(
          this.options.decisionDefinitionId || '',
          JSON.parse(this.modalData.jsonValue || '{}'),
        ),
      );
    } catch (error) {
      this.modalState.isSubmitting = false;
      this.displayError('Errors found in JSON. Please double check your formatting.');
      return throwError(() => error);
    }
  }

  private handleAction(obs: Observable<any>) {
    return obs
      .pipe(
        catchError((err) => {
          // We don't get meaningful error info back from the API, or else we could use something
          // like `(err.error.cause.message ?? err.statusText)` to get the details from the error we
          // caught.
          this.displayError('Unable to evaluate decision. Please check your input against the model and try again.');
          this.modalState.isSubmitting = false;
          this.updateCanSubmit();
          return throwError(() => err);
        }),
      )
      .subscribe((result) => {
        this.modalState.isSubmitting = false;
        this.modalState.successfulSubmit = true;
        this.resultSubject.next(result);
        this.options.cancelButtonLabel = 'Close';
        return result;
      });
  }

  displayError(error: string) {
    this.modalState.errorMessage = error;
    this.modalState.hideErrorMessage = false;
  }

  clearError() {
    this.modalState.errorMessage = '';
    this.modalState.hideErrorMessage = true;
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.resizeObserver?.unobserve(this.codeContainer?.nativeElement);
  }

  initResizeObserver() {
    this.resizeObserver = new ResizeObserver(() => {
      const containerElement = this.codeContainer?.nativeElement;
      this.codeEditor?.localEditor?.layout({
        width: containerElement.clientWidth / 2,
        height: containerElement.clientHeight,
      });
      this.resultEditor?.localEditor?.layout({
        width: containerElement.clientWidth / 2,
        height: containerElement.clientHeight,
      });
    });
    this.resizeObserver.observe(this.codeContainer?.nativeElement);
  }
}
