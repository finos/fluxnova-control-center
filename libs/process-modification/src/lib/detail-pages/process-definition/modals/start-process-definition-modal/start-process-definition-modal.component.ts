import { AfterViewInit, Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { catchError, debounceTime, Observable, Subject, throwError } from 'rxjs';
import { SubSink } from 'subsink';
import { CodeEditorComponent } from '@fxn/common';
import { StartProcessDefinitionOptions } from '@fxn/types';
import { isEmpty } from 'lodash-es';
import { editor } from 'monaco-editor';
import { ProcessDefinitionService } from '../../../../services/process-definition.service';
import IMarker = editor.IMarker;

export interface StartProcessDefinitionModalState {
  isSubmitting: boolean;
  successfulSubmit: boolean;
  successMessage: string;
  errorMessage: string;
  hideErrorMessage: boolean;
  activeTab?: string;
}

export interface StartProcessDefinitionModalResult {
  businessKey: string;
  jsonValue: string;
  submitted: boolean;
  instanceId: string;
}

export const START_PROCESS_DEFAULT_OPTIONS: StartProcessDefinitionOptions = {
  confirmButtonLabel: 'Submit',
  cancelButtonLabel: 'Cancel',
};

export const START_PROCESS_DEFAULT_STATE: StartProcessDefinitionModalState = {
  successMessage: 'The process has been started',
  errorMessage: '',
  hideErrorMessage: true,
  isSubmitting: false,
  successfulSubmit: false,
};

export enum StartProcessDefinitionTabs {
  JSONString = 'JSON String',
}

export const START_FORM_SCHEMA = {
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
          },
          required: ['type', 'value'],
        },
      },
      businessKey: {
        type: 'string',
      },
    },
  },
};

const START_FORM_EXAMPLE = `{
  "variables": {
    "aVariable" : {
      "value" : "aStringValue",
      "type": "String",
      "valueInfo" : {
        "transient" : true
      }
    },
    "anotherVariable" : {
      "value" : true,
      "type": "Boolean"
    }
  },
  "businessKey" : "myBusinessKey"
}`;

@Component({
  selector: 'fluxnova-start-process-definition-modal',
  templateUrl: './start-process-definition-modal.component.html',
  styleUrls: ['./start-process-definition-modal.component.scss'],
  standalone: false,
})
export class StartProcessDefinitionModalComponent implements OnInit, OnDestroy, AfterViewInit {
  modal = inject(NgbActiveModal);
  private processDefinitionService = inject(ProcessDefinitionService);

  tabs = StartProcessDefinitionTabs;
  public jsonValueSubject = new Subject<string>();
  public businessKeySubject = new Subject<string>();

  private subs = new SubSink();
  private currentMarkers: IMarker[] = [];

  options: StartProcessDefinitionOptions = START_PROCESS_DEFAULT_OPTIONS;
  public modalState: StartProcessDefinitionModalState = {
    ...START_PROCESS_DEFAULT_STATE,
    activeTab: this.tabs.JSONString,
  };

  modalData: StartProcessDefinitionModalResult = {
    jsonValue: this.options.jsonValue ?? '',
    businessKey: this.options.businessKey ?? '',
    instanceId: this.options.instanceId ?? '',
    submitted: true,
  };

  canSubmit = true;

  @ViewChild(CodeEditorComponent)
  codeEditor?: CodeEditorComponent;

  ngOnInit() {
    this.subs.add(
      this.jsonValueSubject.pipe(debounceTime(500)).subscribe(() => {
        this.clearError();
      }),
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  ngAfterViewInit() {
    this.subs.add(
      this.codeEditor?.editorInitialized.subscribe((monEditor) => {
        const URI = this.codeEditor?.monaco.Uri.parse('a://start-form.json');
        const model = monEditor.getModel(URI) || monEditor.createModel('', 'json', URI);

        this.codeEditor?.monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
          validate: true,
          schemas: [
            {
              fileMatch: [URI.toString()],
              ...START_FORM_SCHEMA,
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
    );
  }

  activeTabsChanged(tab: StartProcessDefinitionTabs) {
    this.modalState.activeTab = tab;
  }

  onJsonUpdate(json: string) {
    this.modalData.jsonValue = json;
    this.modalState.hideErrorMessage = true;

    this.updateCanSubmit(this.currentMarkers);
  }

  public updateCanSubmit(markers?: IMarker[]) {
    this.canSubmit = this.modalState.hideErrorMessage && !this.modalState.isSubmitting && isEmpty(markers);
  }

  public handleBusinessKeyChange(input: string) {
    this.clearError();
    this.businessKeySubject.next(input as string);
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

  confirm() {
    if (!this.options.processDefinitionId) {
      this.displayError('Process definition Id is not identifiable. Please try again.');
      return;
    }

    this.modalState.isSubmitting = true;

    try {
      return this.handleAction(
        this.processDefinitionService.submitStartFormWithDefinitionId(
          this.options.processDefinitionId,
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
          this.displayError(err.statusText);
          this.modalState.isSubmitting = false;
          this.updateCanSubmit();
          return throwError(() => err);
        }),
      )
      .subscribe((result) => {
        this.modalState.isSubmitting = false;
        this.modalState.successfulSubmit = true;
        this.modalData.instanceId = result.id;
        this.dismiss();
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

  protected readonly START_FORM_EXAMPLE = START_FORM_EXAMPLE;
}
