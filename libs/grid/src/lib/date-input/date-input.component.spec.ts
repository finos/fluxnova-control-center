import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GeneralModule } from '@fxn/common';
import { IDateParams } from 'ag-grid-community';
import moment from 'moment';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DateInputComponent } from './date-input.component';

describe('Date Input Component', () => {
  let component: DateInputComponent;
  let fixture: ComponentFixture<DateInputComponent>;

  const date = moment();
  const mockParams: IDateParams = {
    onDateChanged: vi.fn(),
    filterParams: null as any,
    api: null as any,
    context: null as any,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DateInputComponent],
      imports: [GeneralModule],
    });

    fixture = TestBed.createComponent(DateInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.agInit(mockParams);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should accept a date object', () => {
    component.setDate(date.toDate());
    expect(component.getDate()).toEqual(date.toDate());
  });

  it('should return null when no date has been set', () => {
    expect(component.getDate()).toBeNull();
  });

  it('should notify Ag-Grid when the date changes', () => {
    const expected = new Date();
    component.dateChanged(expected);
    expect(component.getDate()).toEqual(expected);
    expect(mockParams.onDateChanged).toHaveBeenCalledTimes(1);
    expect(mockParams.onDateChanged).toHaveBeenCalledWith();
  });

  it('should apply an ag-grid popup css class to ngb-datepicker when the popup is opened', () => {
    const spy = vi.spyOn(document, 'querySelector');
    const mockElement = { classList: { add: vi.fn() } };
    spy.mockReturnValue(mockElement as any);
    component.popupOpened();
    expect(mockElement.classList.add).toHaveBeenCalledTimes(1);
    expect(mockElement.classList.add).toHaveBeenCalledWith('ag-custom-component-popup');
  });
});
