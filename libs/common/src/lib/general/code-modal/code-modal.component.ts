import { Component, inject, Input, OnInit, ViewChild } from '@angular/core';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { isEmpty } from 'lodash-es';
import { GeneralModule } from '../general.module';
import { CodeEditorComponent } from '../code-editor/code-editor.component';

@Component({
  selector: 'fluxnova-code-modal',
  imports: [GeneralModule],
  templateUrl: './code-modal.component.html',
  styleUrls: ['./code-modal.component.scss'],
})
export class CodeModalComponent implements OnInit {
  modal = inject(NgbActiveModal);

  private _code = '';
  get code(): string {
    return this._code;
  }
  @Input() set code(value: string) {
    this._code = value;

    if (!isEmpty(value)) this.updateEditor();
  }
  @Input() title = '';

  @ViewChild(CodeEditorComponent)
  codeEditor?: CodeEditorComponent;

  toolTipTitle?: string;
  copyTextLabel?: string;

  ngOnInit(): void {
    this.toolTipTitle = 'Copy ' + this.title;
    this.copyTextLabel = this.title;
  }

  onEditorInitialized() {
    if (!isEmpty(this.code)) this.updateEditor();
  }

  protected updateEditor() {
    if (this.codeEditor) this.codeEditor.scriptInfo = { content: this._code, name: 'stacktrace' };
  }
}
