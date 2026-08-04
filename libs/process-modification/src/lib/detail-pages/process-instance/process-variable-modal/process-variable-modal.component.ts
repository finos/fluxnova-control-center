import { AfterViewInit, Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgbActiveModal, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { convertDateToFluxnovaString, DateFilterTypes } from '@fxn/common';
import { Variable } from '@fxn/types';
import { Subject, take } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { SubSink } from 'subsink';
import { VariableService } from '../../../services/variable.service';

export interface VariableOptions {
  variable?: Variable;
  confirmButtonLabel?: string;
  cancelButtonLabel?: string;
  title?: string;
  modalType?: 'Edit' | 'Add' | 'Readonly' | 'Delete';
  typeOptions?: { value: string; name: string }[];
  allVariables?: Variable[];
  processInstanceActive?: boolean;
}

export interface VariableModalResult {
  variableName: string;
  variableValue: string | null;
  variableType: string;
  valueInfo: {
    objectTypeName?: string;
    serializationDataFormat?: string;
  };
  saved: boolean;
}

@Component({
  selector: 'fluxnova-process-variable-modal',
  templateUrl: './process-variable-modal.component.html',
  styleUrls: ['./process-variable-modal.component.scss'],
  standalone: false,
})
export class ProcessVariableModalComponent implements OnInit, AfterViewInit, OnDestroy {
  modal = inject(NgbActiveModal);
  variableService = inject(VariableService);

  @ViewChild('modal') viewChild?: ElementRef<HTMLDivElement>;
  @ViewChild('variableNameValidationTooltip', { read: NgbTooltip }) variableNameValidationTooltip?: NgbTooltip;
  @ViewChild('variableValueValidationTooltip', { read: NgbTooltip }) variableValueValidationTooltip?: NgbTooltip;
  @ViewChild('variableNameInput', { read: ElementRef }) variableNameInput?: ElementRef<HTMLInputElement>;
  @ViewChild('objectTypeNameInput', { read: ElementRef }) objectTypeNameInput?: ElementRef<HTMLInputElement>;
  @ViewChild('serializationDataFormatInput', { read: ElementRef })
  serializationDataFormatInput?: ElementRef<HTMLInputElement>;
  @ViewChild('variableValueInput', { read: ElementRef }) variableValueInput?: ElementRef<
    HTMLInputElement | HTMLTextAreaElement
  >;
  private subs = new SubSink();
  public deserializedVariableValue?: string;
  public toggleTabs = ['Deserialized', 'Serialized'];
  public activeTab = 'Deserialized';
  public hasLoadedDeserialized = false;
  public deserializedErrorMessage = '';
  public dynamicErrorMessage = '';
  public domParser = new DOMParser();
  public xmlSerializer = new XMLSerializer();
  public xsltProcessor = new XSLTProcessor();

  ngAfterViewInit() {
    this.viewChild?.nativeElement.addEventListener('keypress', this.handleKeyPress);
  }

  ngOnInit() {
    this.updateWorkingCopyData();
    this.subs.add(this.variableValueSubject.pipe(debounceTime(500)).subscribe(() => this.toggleVariableValueTooltip()));
    if (
      (this.options.modalType === 'Readonly' || this.options.modalType === 'Delete') &&
      this.options.variable?.id &&
      this.options.variable?.type === 'Object'
    ) {
      this.variableService
        .getDeserializedVariableValue(this.options.variable.id)
        .pipe(take(1))
        .subscribe((variable) => {
          if (variable.errorMessage) {
            this.deserializedErrorMessage = variable.errorMessage;
          }
          this.deserializedVariableValue = JSON.stringify(variable.value);
          this.hasLoadedDeserialized = true;
        });
    }
    if (this.workingCopyData.variableType === 'Json' || this.workingCopyData.variableType === 'Xml') {
      this.handleFormat();
    }
  }

  public variableValueSubject = new Subject<string>();
  private _options: VariableOptions = {
    variable: {},
  } as VariableOptions;
  private _workingCopyData: VariableModalResult = {
    variableValue: '',
    variableName: '',
    variableType: 'String',
    valueInfo: {},
    saved: true,
  };
  get workingCopyData() {
    return this._workingCopyData;
  }

  set workingCopyData(data) {
    this._workingCopyData = { ...data };
  }

  public onVariableValueChange(input: string) {
    this.workingCopyData = {
      ...this._workingCopyData,
      variableValue: input,
    };
    this.dynamicErrorMessage = '';
    this.variableValueSubject.next(this.workingCopyData.variableValue as string);
  }

  get options(): VariableOptions {
    return this._options;
  }

  set options(value: VariableOptions) {
    this._options = value;
    this.updateWorkingCopyData();
  }

  private updateWorkingCopyData() {
    this.workingCopyData = {
      variableValue: this.options.variable?.value ?? '',
      variableType: this.options.variable?.type ?? 'String',
      variableName: this.options.variable?.name ?? '',
      valueInfo: this.options.variable?.valueInfo ? { ...this.options.variable?.valueInfo } : {},
      saved: true,
    };
  }

  get showTextArea() {
    return ['Json', 'Object', 'Xml'].some((type) => type === this.workingCopyData.variableType);
  }

  canSave() {
    switch (this.options.modalType) {
      case 'Delete':
        return true;
      case 'Add':
        return (
          this.isVariableNameUnique &&
          this.isVariableValueValid() &&
          this.isVariableValueInfoValid() &&
          this.workingCopyData.variableName
        );
      default:
        return (
          this.isVariableValueValid() &&
          this.isVariableValueInfoValid() &&
          (this.workingCopyData.variableType === 'Object'
            ? this.hasValueInfoChanged() || this.hasValueChanged()
            : this.hasValueChanged())
        );
    }
  }

  isVariableValueValid(): boolean {
    if (['Short', 'Integer', 'Long', 'Double'].includes(this.workingCopyData.variableType)) {
      return this.isVariableValueValidNumber();
    }
    if (this.workingCopyData.variableType === 'Date') {
      return !isNaN(Date.parse(this.workingCopyData.variableValue || ''));
    }
    if (this.workingCopyData.variableType === 'Json') {
      return this.isVariableValueValidJson();
    }
    if (this.workingCopyData.variableType === 'Xml') {
      return this.isVariableValueValidXml();
    }
    return (
      Boolean(this.workingCopyData.variableType) &&
      (this.workingCopyData.variableType === 'Null' || Boolean(this.workingCopyData.variableValue))
    );
  }

  isVariableValueInfoValid(): boolean {
    if (this.workingCopyData.variableType === 'Object') {
      return (
        Boolean(this.workingCopyData.valueInfo.objectTypeName) &&
        Boolean(this.workingCopyData.valueInfo.serializationDataFormat)
      );
    }
    return true;
  }

  hasValueChanged(): boolean {
    if (this.workingCopyData.variableType === 'Json') {
      return this.formatJson(this.options.variable?.value as string) !== this.workingCopyData.variableValue;
    }
    return this.workingCopyData.variableValue !== this.options.variable?.value;
  }

  hasValueInfoChanged(): boolean {
    return (
      this.workingCopyData.valueInfo.objectTypeName !== this.options.variable?.valueInfo?.objectTypeName ||
      this.workingCopyData.valueInfo.serializationDataFormat !==
        this.options.variable?.valueInfo?.serializationDataFormat
    );
  }

  typeChanged() {
    this.workingCopyData.variableValue = '';
  }

  isVariableValueValidNumber() {
    const str = this.workingCopyData.variableValue;
    let int;
    if (isNaN(str as any)) return false;
    try {
      int = BigInt(str || '');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {} // Undefined if not parseable as an int
    const float = parseFloat(str || '');
    switch (this.workingCopyData.variableType) {
      case 'Short':
        return int !== undefined && int < 32768 && int >= -32768;
      case 'Integer':
        return int !== undefined && int < 2147483648 && int >= -2147483648;
      case 'Long':
        return int !== undefined && int < BigInt('9223372036854775808') && int >= BigInt('-9223372036854775808');
      case 'Double':
        return float !== undefined && !isNaN(float);
      default:
        return false;
    }
  }

  isVariableValueValidJson() {
    try {
      JSON.parse(this.workingCopyData.variableValue as string);
      return true;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return false;
    }
  }

  isVariableValueValidXml(): boolean {
    return this.cleanAndValidateXml(this.workingCopyData.variableValue as string).isValid;
  }

  handleFormat() {
    switch (this.workingCopyData.variableType) {
      case 'Xml':
        this.workingCopyData.variableValue = this.formatXML(this.workingCopyData.variableValue as string);
        break;
      case 'Json':
        this.workingCopyData.variableValue = this.formatJson(this.workingCopyData.variableValue as string);
        break;
      default:
        break;
    }
  }

  formatJson(unformattedString: string) {
    if (unformattedString.length === 0) {
      return '';
    }
    const obj = JSON.parse(unformattedString);
    return JSON.stringify(obj, undefined, 2);
  }

  formatXML(unformattedString: string): string {
    const { resultXml, isValid } = this.cleanAndValidateXml(unformattedString);
    if (!isValid) return resultXml;

    this.xsltProcessor.importStylesheet(
      this.domParser.parseFromString(
        [
          '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
          '  <xsl:strip-space elements="*"/>',
          '  <xsl:template match="para[content-style][(text())]">',
          '    <xsl:value-of select="normalize-space(.)"/>',
          '  </xsl:template>',
          '  <xsl:template match="node()|@*">',
          '    <xsl:copy><xsl:apply-templates select="node()|@*"/></xsl:copy>',
          '  </xsl:template>',
          '  <xsl:output indent="yes"/>',
          '</xsl:stylesheet>',
        ].join('\n'),
        'application/xml',
      ),
    );

    const formattedDoc = this.xsltProcessor.transformToDocument(
      this.domParser.parseFromString(resultXml, 'application/xml'),
    );
    return this.xmlSerializer.serializeToString(formattedDoc);
  }

  cleanAndValidateXml(xml: string): { resultXml: string; isValid: boolean } {
    const doc = this.domParser.parseFromString(xml, 'text/xml');
    if (doc.getElementsByTagName('parsererror').length > 0) {
      return { resultXml: xml, isValid: false };
    }

    return { resultXml: this.xmlSerializer.serializeToString(doc), isValid: true };
  }

  getValidationMessage(): string {
    switch (this.workingCopyData.variableType) {
      case 'Short':
        return 'Value must be an integer between -32768 and 32767.';
      case 'Integer':
        return 'Value must be an integer between -2147483648 and 2147483647.';
      case 'Long':
        return "Value must be an integer within Java's LONG range.";
      case 'Double':
        return 'Value must be a number.';
      case 'Date':
        return 'Value must be a date in the format: yyyy-MM-DDTHH:mm:ss.SSSZZ';
      case 'Json':
        return 'Value must be a valid JSON object.';
      case 'Xml':
        return 'Value must be a valid XML object.';
      default:
        return 'Invalid value.';
    }
  }

  get isVariableNameUnique() {
    if (this.options.allVariables) {
      return !this.options.allVariables.some((variable) => variable.name === this.workingCopyData.variableName);
    }
    return true;
  }

  dateRangeChanged(event?: { dateFrom?: Date; dateTo?: Date | null; filterType: DateFilterTypes }) {
    if (event) {
      this.workingCopyData.variableValue = (event?.dateFrom && convertDateToFluxnovaString(event.dateFrom)) || '';
    } else {
      this.workingCopyData.variableValue = '';
    }
  }

  updateActiveTab(name: string) {
    this.activeTab = name;
  }

  handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (this.options.modalType === 'Readonly') {
        this.dismiss();
        return;
      }
      if (this.viewChild?.nativeElement.ownerDocument.activeElement?.id !== 'textarea') {
        e.preventDefault();
        if (this.canSave()) this.confirm();
        return;
      }
    }
  };

  confirm() {
    if (this.workingCopyData.variableType === 'Null') {
      this.workingCopyData.variableValue = null;
    }
    this.modal.close({
      ...this.workingCopyData,
    });
  }

  dismiss() {
    this.modal.dismiss();
  }

  onVariableNameChange() {
    if (this.isVariableNameUnique) {
      this.variableNameValidationTooltip?.close();
    } else {
      this.variableNameValidationTooltip?.open();
    }
  }

  toggleVariableValueTooltip() {
    if (!this.isVariableValueValid() && this.workingCopyData.variableValue?.length !== 0) {
      this.variableValueValidationTooltip?.open();
    } else {
      this.variableValueValidationTooltip?.close();
    }
  }

  onMouseLeave(event: MouseEvent, tooltipRef: NgbTooltip) {
    if (event.target !== this.viewChild?.nativeElement.ownerDocument.activeElement) {
      tooltipRef.close();
    }
  }

  onDownloadClick() {
    if (this.options.variable) {
      this.variableService.downloadVariableValue(this.options.variable, this.options.processInstanceActive);
    }
  }

  ngOnDestroy() {
    this.viewChild?.nativeElement.removeEventListener('keypress', this.handleKeyPress);
    this.subs.unsubscribe();
  }
}
