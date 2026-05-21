import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { FluxnovaVariableTypes, Variable } from '@fxn/types';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { VariableService } from '../../../services/variable.service';
import { ProcessVariableModalComponent } from './process-variable-modal.component';

describe('ProcessVariableModalComponent', () => {
  let component: ProcessVariableModalComponent;
  let fixture: ComponentFixture<ProcessVariableModalComponent>;

  Object.defineProperty(window, 'XSLTProcessor', {
    value: vi.fn(function () {
      return {
        transformToDocument: vi.fn(),
        importStylesheet: vi.fn(),
      };
    }),
  });

  Object.defineProperty(window, 'XMLSerializer', {
    value: vi.fn(function () {
      return {
        serializeToString: vi.fn(),
      };
    }),
  });

  const mockHttp = {
    get: vi.fn(),
  };

  const mockVariableService = {
    getDeserializedVariableValue: vi.fn(() =>
      of({
        value: 'test-value',
      }),
    ),
    downloadVariableValue: vi.fn(),
  };

  const mockModal = { close: vi.fn(), dismiss: vi.fn() };
  const mockVariableNameTooltip = { open: vi.fn(), close: vi.fn() };
  const mockVariableValueTooltip = { open: vi.fn(), close: vi.fn() };
  let mockDocument: Document;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProcessVariableModalComponent],
      imports: [FormsModule, NgbTooltip],
      providers: [
        { provide: NgbActiveModal, useValue: mockModal },
        { provide: HttpClient, useValue: mockHttp },
        { provide: VariableService, useValue: mockVariableService },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(ProcessVariableModalComponent);
    mockDocument = TestBed.inject(DOCUMENT);
    component = fixture.componentInstance;
    fixture.detectChanges();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('should reset value when type changes', () => {
    component.options = {
      variable: {
        id: '123',
        name: 'test',
        value: 'testing',
        type: FluxnovaVariableTypes.String,
      },
    };
    component.typeChanged();
    expect(component.workingCopyData.variableValue).toEqual('');
  });

  it('should correctly identify if you can save', () => {
    component.options = {
      modalType: 'Delete',
    };
    expect(component.canSave()).toEqual(true);
    component.options = {
      modalType: 'Add',
    };
    expect(component.canSave()).toEqual(
      component.isVariableNameUnique && component.isVariableValueValid() && component.workingCopyData.variableName,
    );
  });

  it('should initialize with empty workingCopyData when variable is undefined', () => {
    expect(component.workingCopyData).toEqual({
      variableValue: '',
      variableType: 'String',
      variableName: '',
      valueInfo: {},
      saved: true,
    });
    component.options = { variable: undefined };
    expect(component.workingCopyData).toEqual({
      variableValue: '',
      variableType: 'String',
      variableName: '',
      valueInfo: {},
      saved: true,
    });
  });

  it('should initialize with correct workingCopyData when variable is not undefined', () => {
    component.options = {
      variable: { id: '123', value: '123', type: FluxnovaVariableTypes.Integer, name: 'myInt' },
    };
    expect(component.workingCopyData).toMatchObject({
      variableValue: '123',
      variableType: 'Integer',
      variableName: 'myInt',
      saved: true,
    });
  });

  it('should get deserialized value from variable service if type is object', () => {
    component.options = {
      variable: {
        id: '123',
        name: 'test',
        type: FluxnovaVariableTypes.Object,
      },
      modalType: 'Readonly',
    };
    component.ngOnInit();
    expect(mockVariableService.getDeserializedVariableValue).toHaveBeenCalled();
    expect(JSON.parse(component.deserializedVariableValue ?? '')).toEqual('test-value');
  });

  it('should set deserializedErrorMessage when it exists', () => {
    component.options = {
      variable: {
        id: '123',
        name: 'test',
        type: FluxnovaVariableTypes.Object,
      },
      modalType: 'Readonly',
    };
    mockVariableService.getDeserializedVariableValue.mockReturnValue(
      of({ value: 'test-value', errorMessage: 'test-error-message' }),
    );

    component.ngOnInit();

    expect(component.deserializedErrorMessage).toEqual('test-error-message');
  });

  it('should format variableValue as json if type is json', () => {
    const formatJsonSpy = vi.spyOn(component, 'formatJson');
    component.options = {
      variable: {
        id: '123',
        name: 'test',
        value: JSON.stringify({ hello: 'world' }),
        type: FluxnovaVariableTypes.Json,
      },
    };
    component.ngOnInit();
    expect(formatJsonSpy).toHaveBeenCalled();
  });

  it('handle format should do nothing if type is not json or xml', () => {
    const formatXmlSpy = vi.spyOn(component, 'formatXML');
    const formatJsonSpy = vi.spyOn(component, 'formatJson');
    component.options = {
      variable: {
        id: '123',
        name: 'test',
        type: FluxnovaVariableTypes.String,
      },
    };
    component.handleFormat();
    expect(formatXmlSpy).toHaveBeenCalledTimes(0);
    expect(formatJsonSpy).toHaveBeenCalledTimes(0);
  });

  it('should correctly format the xml when formatXml is called', () => {
    component.formatXML('<xml><aTag><aNestedTag>A value here</aNestedTag></aTag></xml>');
    expect(component.xsltProcessor.importStylesheet).toHaveBeenCalledTimes(1);
    expect(component.xsltProcessor.transformToDocument).toHaveBeenCalledTimes(1);
    expect(component.xmlSerializer.serializeToString).toHaveBeenCalledTimes(2);
  });

  it('should format variableValue as xml if type is xml', () => {
    const formatXmlSpy = vi.spyOn(component, 'formatXML');
    component.options = {
      variable: {
        id: '123',
        name: 'test',
        value: '<?xml version="1.0" encoding="UTF-8"?></xml>',
        type: FluxnovaVariableTypes.Xml,
      },
    };
    component.ngOnInit();
    expect(formatXmlSpy).toHaveBeenCalled();
  });

  it('shows error for invalid xml', () => {
    component.options = {
      variable: {
        id: '123',
        name: 'test',
        value: '<?xml version="1.0" encoding="UTF-8"?></xml>hello',
        type: FluxnovaVariableTypes.Xml,
      },
    };
    expect(component.isVariableValueValid()).toEqual(false);
    expect(component.getValidationMessage()).toEqual('Value must be a valid XML object.');
  });

  it('should not show error if xml is valid', () => {
    component.options = {
      variable: {
        id: '123',
        name: 'test',
        value: '<xml version="1.0" encoding="UTF-8"/>',
        type: FluxnovaVariableTypes.Xml,
      },
    };
    expect(component.isVariableValueValid()).toEqual(true);
  });

  it('should show error if all fields not filled out', () => {
    component.workingCopyData.variableValue = '';
    expect(component.canSave()).toBeFalsy();
  });

  it('should not show an error if everything is valid', () => {
    component.workingCopyData = {
      variableName: 'test',
      variableValue: 'testing',
      variableType: 'String',
      valueInfo: {},
      saved: true,
    };
    expect(component.canSave()).toBeTruthy();
  });

  it('shows an error for an invalid short', () => {
    component.workingCopyData.variableType = 'Short';
    component.workingCopyData.variableValue = '32768';

    expect(component.isVariableValueValid()).toBe(false);
    component.workingCopyData.variableValue = '2.3';
    expect(component.isVariableValueValid()).toBe(false);
    expect(component.getValidationMessage()).toEqual('Value must be an integer between -32768 and 32767.');

    component.workingCopyData.variableValue = '32767';
    expect(component.isVariableValueValid()).toBe(true);
  });

  it('allows 0 for numbers', () => {
    component.workingCopyData.variableType = 'Short';
    component.workingCopyData.variableValue = '0';

    expect(component.isVariableValueValid()).toBe(true);

    component.workingCopyData.variableValue = '32767';
    expect(component.isVariableValueValid()).toBe(true);
  });

  it('shows an error for an invalid integer', () => {
    component.workingCopyData.variableType = 'Integer';
    component.workingCopyData.variableValue = 'bogus32768';

    expect(component.isVariableValueValid()).toBe(false);
    component.workingCopyData.variableValue = '2147483648';
    expect(component.isVariableValueValid()).toBe(false);
    expect(component.getValidationMessage()).toEqual('Value must be an integer between -2147483648 and 2147483647.');

    component.workingCopyData.variableValue = '32767';
    expect(component.isVariableValueValid()).toBe(true);
  });

  it('shows error for invalid Long', () => {
    component.options = {
      variable: {
        id: '123',
        name: '',
        value: 'hello world',
        type: FluxnovaVariableTypes.Long,
      },
    };
    expect(component.getValidationMessage()).toEqual("Value must be an integer within Java's LONG range.");
  });

  it('shows error for invalid Double', () => {
    component.options = {
      variable: {
        id: '123',
        name: '',
        value: 'hello world',
        type: FluxnovaVariableTypes.Double,
      },
    };
    expect(component.getValidationMessage()).toEqual('Value must be a number.');
  });

  it('should return default error message when variable type is  not set', () => {
    component.options = {
      variable: {
        id: '123',
        name: '',
        value: '',
        type: undefined,
      },
    };
    expect(component.getValidationMessage()).toEqual('Invalid value.');
  });

  it('shows an error for an invalid date', () => {
    component.workingCopyData.variableType = 'Date';
    component.workingCopyData.variableValue = 'bogusDate';

    expect(component.isVariableValueValid()).toBe(false);
    component.workingCopyData.variableValue = 'january';
    expect(component.isVariableValueValid()).toBe(false);
    expect(component.getValidationMessage()).toEqual('Value must be a date in the format: yyyy-MM-DDTHH:mm:ss.SSSZZ');

    component.workingCopyData.variableValue = '2023-02-01';
    expect(component.isVariableValueValid()).toBe(true);
  });

  it('should not allow saving unless value has been changed', () => {
    const variable = {
      variableName: 'test',
      variableValue: 'testing',
      variableType: FluxnovaVariableTypes.String,
    };
    component.options = {
      variable: {
        id: '123',
        name: variable.variableName,
        value: variable.variableValue,
        type: variable.variableType,
      },
    };

    expect(component.isVariableValueValid()).toBe(true);
    expect(component.hasValueChanged()).toBe(false);
    expect(component.canSave()).toBe(false);

    component.onVariableValueChange('foo');

    expect(component.isVariableValueValid()).toBe(true);
    expect(component.hasValueChanged()).toBe(true);
    expect(component.canSave()).toBe(true);
  });

  it('should allow saving object variables when typeInfo is changed', () => {
    component.options = {
      variable: {
        id: '123',
        name: 'test-variable-name',
        value: 'test-variable-value',
        type: FluxnovaVariableTypes.Object,
        valueInfo: {
          serializationDataFormat: 'test-serialization-data-format',
          objectTypeName: 'test-object-type-name',
        },
      },
    };

    expect(component.isVariableValueValid()).toBe(true);
    expect(component.hasValueInfoChanged()).toBe(false);
    expect(component.canSave()).toBe(false);

    component.workingCopyData.valueInfo.serializationDataFormat = 'test-new-serialization-data-format';

    expect(component.isVariableValueValid()).toBe(true);
    expect(component.hasValueInfoChanged()).toBe(true);
    expect(component.canSave()).toBe(true);
  });

  it('should correctly detect if json value has changed', () => {
    component.options = {
      variable: {
        id: '123',
        name: '',
        value: '{"myKey": "myVal"}',
        type: FluxnovaVariableTypes.Json,
      },
    };
    component.ngOnInit();
    expect(component.hasValueChanged()).toEqual(false);
    component.workingCopyData.variableValue = '{"myKey": "myVal", "secondKey", "secondVal"}';
    expect(component.hasValueChanged()).toEqual(true);
  });

  it('should show an error in tooltip after the debounce delay has passed, but not before', async () => {
    component.options = {
      variable: {
        id: '123',
        name: 'json',
        value: '{"title":"a title", "array": ["this", "is", "an", "array"], "number": 42}',
        type: FluxnovaVariableTypes.Json,
      },
    };

    expect(component.isVariableValueValid()).toBe(true);
    expect(component.variableValueValidationTooltip?.isOpen()).toBe(false);

    component.onVariableValueChange('incorrect json value');

    expect(component.isVariableValueValid()).toBe(false);
    expect(component.variableValueValidationTooltip?.isOpen()).toBe(false);

    await vi.advanceTimersByTimeAsync(510);

    expect(component.variableValueValidationTooltip?.isOpen()).toBe(true);
    expect(component.getValidationMessage()).toBe('Value must be a valid JSON object.');
  });

  it('should show error when attempting to create variable that already exists', async () => {
    component.options = {
      variable: {
        id: '123',
        value: 'test it',
        name: 'foo',
        type: FluxnovaVariableTypes.String,
      },
      allVariables: [{ id: '123', name: 'foo', value: 'Foo', type: 'String' as FluxnovaVariableTypes }],
    };

    expect(component.isVariableNameUnique).toBe(false);
  });

  it('should not show error when attempting to create variable with a unique name', async () => {
    component.options = {
      variable: {
        id: '123',
        type: FluxnovaVariableTypes.String,
        name: 'foo2',
        value: 'test it',
      },
      allVariables: [{ id: '123', name: 'foo', value: 'Foo', type: 'String' as FluxnovaVariableTypes }],
    };

    expect(component.isVariableNameUnique).toBe(true);
  });

  it('should update active tab name correctly', () => {
    expect(component.activeTab).toEqual('Deserialized');
    component.updateActiveTab('Serialized');
    expect(component.activeTab).toEqual('Serialized');
  });

  it('should dismiss modal correctly', () => {
    component.dismiss();
    expect(mockModal.dismiss).toHaveBeenCalled();
  });

  it('should call the confirm method on modal correctly when confirmed', () => {
    component.options = {
      variable: {
        type: FluxnovaVariableTypes.String,
        id: '1234',
        name: 'foo2',
        value: 'test it',
      },
    };
    component.confirm();
    expect(component.workingCopyData.variableValue).toEqual('test it');
    expect(mockModal.close).toHaveBeenCalledTimes(1);
    component.options = {
      variable: {
        id: '123',
        name: 'test',
        type: FluxnovaVariableTypes.Null,
      },
    };
    component.confirm();
    expect(mockModal.close).toHaveBeenCalledTimes(2);
    expect(component.workingCopyData.variableValue).toEqual(null);
  });

  it('should return from isValidNumber correctly', () => {
    component.workingCopyData.variableValue = '9223372036854775809';
    component.workingCopyData.variableType = 'Long';

    expect(component.isVariableValueValidNumber()).toEqual(false);

    component.workingCopyData.variableValue = '-9223372036854775809';
    component.workingCopyData.variableType = 'Long';

    expect(component.isVariableValueValidNumber()).toEqual(false);

    component.workingCopyData.variableValue = '123';
    component.workingCopyData.variableType = 'Long';

    expect(component.isVariableValueValidNumber()).toEqual(true);

    component.workingCopyData.variableValue = '';
    component.workingCopyData.variableType = 'Double';

    expect(component.isVariableValueValidNumber()).toEqual(false);

    component.workingCopyData.variableValue = '123';
    component.workingCopyData.variableType = 'Double';

    expect(component.isVariableValueValidNumber()).toEqual(true);

    component.workingCopyData.variableValue = '123.456';
    component.workingCopyData.variableType = 'Double';

    expect(component.isVariableValueValidNumber()).toEqual(true);

    component.workingCopyData.variableValue = '';
    component.workingCopyData.variableType = 'String';

    expect(component.isVariableValueValidNumber()).toEqual(false);
  });

  describe('When keyboard event is received', () => {
    let dismissSpy: Mock;
    let confirmSpy: Mock;
    let mockTestDiv: HTMLElement | null;
    let mockTextarea: HTMLElement | null;

    beforeEach(() => {
      vi.clearAllMocks();
      dismissSpy = vi.spyOn(component, 'dismiss');
      confirmSpy = vi.spyOn(component, 'confirm');
      document.body.innerHTML = `<div>
                          <div id="divid"></div>
                          <textarea id="textarea"></textarea>
                          </div>`;
      mockTestDiv = document.getElementById('divid');
      mockTextarea = document.getElementById('textarea');
    });

    it('should handle key press correctly when is not enter', () => {
      mockTextarea?.focus();
      component.options.modalType = 'Edit';
      component.handleKeyPress(new KeyboardEvent('keypress', { key: 'a' }));
      expect(dismissSpy).toHaveBeenCalledTimes(0);
      expect(confirmSpy).toHaveBeenCalledTimes(0);
    });

    it('should handle key press correctly when is enter and modal is not readonly', () => {
      mockTestDiv?.focus();
      component.options.modalType = 'Edit';
      component.handleKeyPress(new KeyboardEvent('keypress', { key: 'Enter' }));
      expect(dismissSpy).toHaveBeenCalledTimes(0);
      expect(confirmSpy).toHaveBeenCalledTimes(0);
      mockTextarea?.focus();
      component.handleKeyPress(new KeyboardEvent('keypress', { key: 'Enter' }));
      expect(dismissSpy).toHaveBeenCalledTimes(0);
      expect(confirmSpy).toHaveBeenCalledTimes(0);
    });

    it('should handle key press correctly when is enter and modal is readonly', () => {
      component.options.modalType = 'Readonly';
      component.handleKeyPress(new KeyboardEvent('keypress', { key: 'Enter' }));
      expect(dismissSpy).toHaveBeenCalledTimes(1);
      expect(confirmSpy).toHaveBeenCalledTimes(0);
    });

    it('should handle key press correctly when is enter and cannot save', () => {
      vi.spyOn(component, 'canSave').mockReturnValueOnce(false);
      component.options.modalType = 'Add';
      mockTestDiv?.focus();
      component.handleKeyPress(new KeyboardEvent('keypress', { key: 'Enter' }));
      expect(confirmSpy).toHaveBeenCalledTimes(0);
      expect(dismissSpy).toHaveBeenCalledTimes(0);
    });

    it('should handle key press correctly when is enter and can save', () => {
      confirmSpy = vi.spyOn(component, 'confirm');
      component.options.modalType = 'Add';
      mockTestDiv?.focus();
      vi.spyOn(component, 'canSave').mockReturnValue(true);
      component.handleKeyPress(new KeyboardEvent('keypress', { key: 'Enter' }));
      expect(dismissSpy).toHaveBeenCalledTimes(0);
      expect(confirmSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('onVariableNameChange', () => {
    beforeEach(() => {
      component.variableNameValidationTooltip = mockVariableNameTooltip as unknown as NgbTooltip;
    });

    it('closes variable name tooltip when variable name is unique', () => {
      component.options = {
        variable: {
          id: '123',
          name: 'test-unique-variable-name',
        },
        modalType: 'Add',
        allVariables: [{ id: '123', name: 'test-variable-name' }],
      };

      component.onVariableNameChange();

      expect(mockVariableNameTooltip.close).toHaveBeenCalled();
    });

    it('opens variable name tooltip when variable name is not unique', () => {
      component.options = {
        variable: {
          id: '123',
          name: 'test-variable-name',
        },
        modalType: 'Add',
        allVariables: [{ id: '123', name: 'test-variable-name' }],
      };

      component.onVariableNameChange();

      expect(mockVariableNameTooltip.open).toHaveBeenCalled();
    });
  });

  describe('toggleVariableValueTooltip', () => {
    beforeEach(() => {
      component.variableValueValidationTooltip = mockVariableValueTooltip as unknown as NgbTooltip;
    });

    it('opens variable value tooltip when conditions are met', () => {
      component.options = {
        variable: {
          id: '123',
          name: 'test',
          value: 'test-invalid-json',
          type: FluxnovaVariableTypes.Json,
        },
      };

      component.toggleVariableValueTooltip();

      expect(mockVariableValueTooltip.open).toHaveBeenCalled();
    });

    it.each([
      { description: 'variable is valid', value: '{}' },
      { description: 'variable is empty string', value: '{}' },
    ])('closes variable value tooltip when conditions are not met - $description', ({ value }) => {
      component.options = {
        variable: {
          id: '123',
          name: 'test',
          value,
          type: FluxnovaVariableTypes.Json,
        },
      };

      component.toggleVariableValueTooltip();

      expect(mockVariableValueTooltip.close).toHaveBeenCalled();
    });
  });

  describe('onMouseLeave', () => {
    it('closes the tooltip if the event target is not the current document active element', () => {
      const testElement = mockDocument.createElement('input');
      mockDocument.body.appendChild(testElement);
      const mouseEvent = new MouseEvent('mouseleave');
      Object.defineProperty(mouseEvent, 'target', { value: testElement });
      mockDocument.body.focus();

      component.onMouseLeave(mouseEvent, mockVariableNameTooltip as unknown as NgbTooltip);

      expect(mockVariableNameTooltip.close).toHaveBeenCalled();
    });

    it('does not close the tooltip if the event target is the current document active element', () => {
      const testElement = mockDocument.createElement('input');
      mockDocument.body.appendChild(testElement);
      testElement.focus();
      const mouseEvent = new MouseEvent('mouseleave');
      Object.defineProperty(mouseEvent, 'target', { value: testElement });

      component.onMouseLeave(mouseEvent, mockVariableNameTooltip as unknown as NgbTooltip);

      expect(mockVariableNameTooltip.close).not.toHaveBeenCalled();
    });
  });

  describe('formatJson', () => {
    it('should not error when given empty value', () => {
      const result = component.formatJson('');
      expect(result).toEqual('');
    });
  });

  describe('onDownloadClick', () => {
    it('uses the variable service to download the variable', () => {
      component.options.processInstanceActive = true;
      component.onDownloadClick();

      expect(mockVariableService.downloadVariableValue).toHaveBeenCalledWith(component.options.variable, true);
    });
  });

  describe('isVariableValueInfoValid', () => {
    it('should return true for non-object variable types', () => {
      component.workingCopyData.variableType = FluxnovaVariableTypes.String;
      expect(component.isVariableValueInfoValid()).toBe(true);
    });

    it.each(['serializationDataFormat', 'objectTypeName'] as const)(
      'should return false if Object variable type and missing valueInfo field %p',
      (valueInfoKey) => {
        component.workingCopyData.variableType = FluxnovaVariableTypes.Object;
        component.workingCopyData.valueInfo = {
          serializationDataFormat: 'test-serialization-data-format',
          objectTypeName: 'test-object-type-name',
        };
        component.workingCopyData.valueInfo[valueInfoKey] = '';

        expect(component.isVariableValueInfoValid()).toBe(false);
      },
    );
  });

  describe('hasValueInfoChanged', () => {
    beforeEach(() => {
      const valueInfo = {
        seralizationDataFormat: 'test-serialization-data-format',
        objectTypeName: 'test-object-type-name',
      };
      component.options.variable = {
        ...component.options.variable,
        valueInfo: {
          ...valueInfo,
        },
      } as Variable;
      component.workingCopyData.valueInfo = {
        ...valueInfo,
      };
    });
    it('returns false when neither valueInfo field has changed', () => {
      expect(component.hasValueInfoChanged()).toBe(false);
    });

    it.each(['serializationDataFormat', 'objectTypeName'] as const)(
      'should return true if valueInfo field %p has changed',
      (valueInfoKey) => {
        component.workingCopyData.valueInfo[valueInfoKey] = 'test-some-other-value';

        expect(component.hasValueInfoChanged()).toBe(true);
      },
    );
  });
});
