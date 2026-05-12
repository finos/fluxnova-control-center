import { AfterViewInit, Component, inject, OnInit, ViewChild, ViewChildren } from '@angular/core';
import { NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { keyBy, mapValues, merge } from 'lodash-es';
import { ItemTypeAction } from '@fxn/types';
import { AnimationState } from '../../animations/animation-state';
import { MODAL_DEFAULTS } from '../modal-defaults';

export const CONFIRM_MODAL_DEFAULT_OPTIONS: NgbModalOptions = {
  ...MODAL_DEFAULTS,
  windowClass: 'confirm-modal',
  ariaLabelledBy: 'confirm',
};

export interface CheckboxInput {
  label: string;
  name?: string;
  value?: boolean;
  showInfoBubble?: boolean;
  infoTooltip?: string;
  itemTypeAction?: ItemTypeAction;
}

export interface RadioButtonInput {
  label: string;
  name?: string;
  defaultOption?: boolean;
  showInfoBubble?: boolean;
  infoTooltip?: string;
  controlsDynamicContent?: boolean;
}

export interface TextareaInput {
  label: string;
  name: string;
  value?: boolean;
}
export interface NumberInput {
  label: string;
  min: number;
  max: number;
  name?: string;
  showInfoBubble?: boolean;
  infoTooltip?: string;
}
export interface ConfirmOutput {
  [key: string]: boolean;
}

export interface ConfirmOptions {
  confirmButtonLabel?: string;
  cancelButtonLabel?: string;
  hideCancelButton?: boolean;
  message?: string;
  lineItems?: any[];
  title?: string;
  inputs?: {
    checkboxes?: CheckboxInput[];
    radioButtons?: RadioButtonInput[];
    textarea?: TextareaInput;
    numberInput?: NumberInput;
  };
  isBulkTerminate?: boolean;
  showDynamicContent?: boolean;
  dynamicContent?: ConfirmOptionsDynamicContent;
}

export interface ConfirmOptionsDynamicContent {
  inputs?: {
    checkboxes?: CheckboxInput[];
    radioButtons?: RadioButtonInput[];
    textarea?: TextareaInput;
    numberInput?: NumberInput;
    dateSelector?: boolean;
  };
  readMoreContent?: string[];
}

export const CONFIRM_DEFAULT_OPTIONS: ConfirmOptions = {
  confirmButtonLabel: 'Confirm',
  cancelButtonLabel: 'Cancel',
};

export interface ModalResult {
  confirmed: boolean;
  reason?: string;
  skipSubProcesses?: boolean;
  skipCustomListeners?: boolean;
  skipIoMappings?: boolean;
  inputs?: ConfirmOutput;
  numberInput?: number;
  selectedRadioOption?: string;
  selectedDate?: Date;
  dynamicContent?: any;
  validDate?: boolean;
}

@Component({
  selector: 'fluxnova-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.scss'],
  standalone: false,
})
export class ConfirmModalComponent implements AfterViewInit, OnInit {
  modal = inject(NgbActiveModal);

  @ViewChildren('numberInput') vc: any;
  @ViewChild('modal') modalViewChild: any;
  options: ConfirmOptions = CONFIRM_DEFAULT_OPTIONS;
  currentDate: Date = new Date();
  modalInitializing = false;

  modalData: ModalResult = {
    confirmed: true,
    reason: '',
    numberInput: 1,
    selectedRadioOption: '',
    selectedDate: undefined,
    validDate: true,
  };

  readMoreState = new AnimationState();
  dynamicContentState = new AnimationState();

  public errorMessage: string | undefined = undefined;

  ngOnInit() {
    this.modalInitializing = true;
    const defaultOption = this.options?.inputs?.radioButtons?.find((button) => button.defaultOption);
    if (defaultOption) {
      this.modalData.selectedRadioOption = defaultOption.name;
      if (defaultOption.controlsDynamicContent) {
        this.options.showDynamicContent = true;
        this.dynamicContentState.isOpen = true;
      }
    }
    queueMicrotask(() => {
      this.modalInitializing = false;
    });
  }

  ngAfterViewInit() {
    this.vc.first?.nativeElement.focus();
    this.modalViewChild?.nativeElement.addEventListener('keypress', this.handleKeyPress);
  }

  confirm() {
    this.modalViewChild?.nativeElement.removeEventListener('keypress', this.handleKeyPress);
    this.modal.close({
      ...this.modalData,
      inputs: merge(
        mapValues(keyBy(this.options.inputs?.checkboxes, 'name'), 'value'),
        mapValues(keyBy(this.options.dynamicContent?.inputs?.checkboxes, 'name'), 'value'),
      ),
    });
  }

  dismiss() {
    this.modalViewChild?.nativeElement.removeEventListener('keypress', this.handleKeyPress);
    this.modal.dismiss();
  }

  toggleReadMore() {
    this.readMoreState.toggle();
  }

  validateInput(retryCount: number, min: number, max: number) {
    this.errorMessage = retryCount < min || retryCount > max ? `Value must be between ${min} and ${max}` : undefined;
  }

  onRadioChange(radioButton: RadioButtonInput) {
    const show = !!(radioButton.controlsDynamicContent && radioButton.name === this.modalData.selectedRadioOption);
    this.options.showDynamicContent = show;
    this.dynamicContentState.isOpen = show;
  }

  onDateSelectorChange(event: any) {
    this.modalData.selectedDate = event.dateFrom;
  }

  onDateInput(event: InputEvent) {
    const dateInput = (event.target as HTMLInputElement).value;
    const date = new Date(dateInput);

    this.modalData.validDate = !isNaN(date.getTime());

    this.modalData.selectedDate = date;
  }

  handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      this.confirm();
    }
  };
}
