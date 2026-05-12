import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RadioButtonsToggleComponent } from './radio-buttons-toggle.component';

describe('RadioButtonsToggleComponent', () => {
  let component: RadioButtonsToggleComponent;

  beforeEach(() => {
    component = new RadioButtonsToggleComponent();
  });

  it('should emit radio value on button click', () => {
    component.radioButtons = [{ name: 'radio name', value: 'radioValue' }];
    const emitSpy = vi.spyOn(component.toggleUpdateRadioButtons, 'emit');
    component.handleButtonClick(component.radioButtons[0].value, 0);
    expect(emitSpy).toHaveBeenCalledWith(component.radioButtons[0].value);
  });
});
