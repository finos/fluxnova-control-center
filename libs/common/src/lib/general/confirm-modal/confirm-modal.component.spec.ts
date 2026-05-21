import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { ConfirmModalComponent } from './confirm-modal.component';

describe('ConfirmModalComponent', () => {
  let component: ConfirmModalComponent;
  let fixture: ComponentFixture<ConfirmModalComponent>;

  const mockModal = {
    close: vi.fn(),
    dismiss: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, FormsModule],
      declarations: [ConfirmModalComponent],
      providers: [{ provide: NgbActiveModal, useValue: mockModal }],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmModalComponent);
    component = fixture.componentInstance;
    component.options = { inputs: {}, showDynamicContent: false };
    fixture.detectChanges();
  });

  it('must validate the value entered in the input field', () => {
    component.validateInput(9, 1, 10);
    expect(component.errorMessage).toBeUndefined();
  });

  it('value entered less than min', () => {
    component.validateInput(0, 1, 10);
    expect(component.errorMessage).toEqual('Value must be between 1 and 10');
  });

  it('value entered greater than max', () => {
    component.validateInput(11, 1, 10);
    expect(component.errorMessage).toEqual('Value must be between 1 and 10');
  });

  it('should set readMoreExpanded correctly', () => {
    expect(component.readMoreState.isOpen).toEqual(false);
    component.toggleReadMore();
    expect(component.readMoreState.isOpen).toEqual(true);
  });

  it('should set up and tear down event listener for keypress', () => {
    const addEventListenerSpy = vi.spyOn(component.modalViewChild.nativeElement, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(component.modalViewChild.nativeElement, 'removeEventListener');
    component.ngAfterViewInit();
    expect(addEventListenerSpy).toHaveBeenCalledTimes(1);
    component.confirm();
    expect(removeEventListenerSpy).toHaveBeenCalledTimes(1);
    component.dismiss();
    expect(removeEventListenerSpy).toHaveBeenCalledTimes(2);
  });

  it('should call confirm if enter is pressed', () => {
    const confirmSpy = vi.spyOn(component, 'confirm');
    component.handleKeyPress({ key: 'a' } as KeyboardEvent);
    expect(confirmSpy).toHaveBeenCalledTimes(0);
    component.handleKeyPress({ key: 'Enter' } as KeyboardEvent);
    expect(confirmSpy).toHaveBeenCalledTimes(1);
  });

  it('should set controlsDynamicContent correctly on radio change', () => {
    const radioButton = {
      label: '',
      name: 'test',
      controlsDynamicContent: false,
    };
    component.modalData.selectedRadioOption = 'test';
    component.onRadioChange(radioButton);
    expect(component.options.showDynamicContent).toBeFalsy();

    radioButton.controlsDynamicContent = true;
    component.onRadioChange(radioButton);
    expect(component.options.showDynamicContent).toBeTruthy();
  });

  it('should update selectedDate on date selector change', () => {
    const date = {
      dateFrom: new Date(),
    };
    component.onDateSelectorChange(date);
    expect(component.modalData.selectedDate).toEqual(date.dateFrom);
  });

  it('should close the modal on confirm', () => {
    component.options.inputs = {
      checkboxes: [
        {
          label: '',
          name: 'option1',
          value: true,
        },
        {
          label: '',
          name: 'option2',
          value: false,
        },
        {
          label: '',
          name: 'option3',
          value: false,
        },
      ],
    };
    component.options.dynamicContent = {
      inputs: {
        checkboxes: [
          {
            label: '',
            name: 'dynamicOption1',
            value: true,
          },
        ],
      },
    };
    component.confirm();
    expect(mockModal.close).toHaveBeenCalledWith({
      ...component.modalData,
      inputs: {
        dynamicOption1: true,
        option1: true,
        option2: false,
        option3: false,
      },
    });
  });

  it('should set default radio option in ngOnInit', () => {
    expect(component.modalData.selectedRadioOption).toEqual('');
    component.options.inputs = {
      radioButtons: [
        {
          label: '',
          name: 'option1',
          defaultOption: true,
        },
      ],
    };

    component.ngOnInit();
    expect(component.modalData.selectedRadioOption).toEqual('option1');
  });

  it('should show dynamic content if default selected option controls it', () => {
    expect(component.modalData.selectedRadioOption).toEqual('');
    component.options.inputs = {
      radioButtons: [
        {
          label: '',
          name: 'option1',
          defaultOption: true,
          controlsDynamicContent: true,
        },
      ],
    };

    component.ngOnInit();
    expect(component.modalData.selectedRadioOption).toEqual('option1');
    expect(component.options.showDynamicContent).toEqual(true);
  });
});
