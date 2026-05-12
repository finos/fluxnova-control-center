import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CodeEditorComponent } from '../code-editor/code-editor.component';
import { CodeModalComponent } from './code-modal.component';

describe('CodeModalComponent', () => {
  let component: CodeModalComponent;
  let fixture: ComponentFixture<CodeModalComponent>;

  const mockModal = { close: vi.fn() };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeModalComponent],
      providers: [{ provide: NgbActiveModal, useValue: mockModal }],
    }).compileComponents();

    fixture = TestBed.createComponent(CodeModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should set toolTipTitle and copyTextLabel in ngOnInit', () => {
    component.title = 'Message';
    component.ngOnInit();

    expect(component.toolTipTitle).toBe('Copy Message');
    expect(component.copyTextLabel).toBe('Message');
  });

  it('should set the scriptInfo property on the editor when the editor has been initialized', () => {
    const mockEditor = {
      scriptInfo: '',
      globalEditor: {
        getModels: () => [],
      },
    } as unknown as CodeEditorComponent;

    component.codeEditor = mockEditor;
    component.code = 'asdf';

    expect(mockEditor.scriptInfo).toEqual({ content: 'asdf', name: 'stacktrace' });
  });

  it('should update the editor if the code is not empty', () => {
    const mockEditor = {
      scriptInfo: '',
      globalEditor: {
        getModels: () => [],
      },
    } as unknown as CodeEditorComponent;

    component.codeEditor = mockEditor;

    component.code = 'asdf';
    component.onEditorInitialized();

    expect(mockEditor.scriptInfo).toEqual({ content: 'asdf', name: 'stacktrace' });
  });
});
