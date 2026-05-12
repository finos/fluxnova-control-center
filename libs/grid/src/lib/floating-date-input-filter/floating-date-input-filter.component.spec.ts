import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { IFloatingFilterParams } from 'ag-grid-community';
import { convertDateToFluxnovaString, DateFilterTypes, GeneralModule, IconComponent } from '@fxn/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FloatingDateInputFilterComponent } from './floating-date-input-filter.component';

describe('Floating Date Input Component', () => {
  let component: FloatingDateInputFilterComponent;
  let fixture: ComponentFixture<FloatingDateInputFilterComponent>;
  const currentTimezoneOffset = getCurrentOffset();
  const mockParentModel = {
    type: 'inRange',
    dateFrom: `2022-05-04T00:00:00.000${currentTimezoneOffset}00`,
    dateTo: `2022-05-08T00:00:00.000${currentTimezoneOffset}00`,
  };

  const mockParams: IFloatingFilterParams = {
    filterParams: null as any,
    api: {
      setFilterModel: vi.fn(),
      getFilterModel: vi.fn(),
    },
    column: {
      getColId: () => 'dueDate',
      getColDef: () => ({
        filterParams: { comparators: ['inRange', 'lessThan', 'greaterThan'] },
      }),
    },
  } as any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FloatingDateInputFilterComponent, IconComponent],
      imports: [GeneralModule, NgbPopoverModule],
    });

    fixture = TestBed.createComponent(FloatingDateInputFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.agInit(mockParams);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should update dateRange and filter type on parent model change', () => {
    component.onParentModelChanged(mockParentModel);
    expect(component.filterType).toEqual(mockParentModel.type);
    expect(component.dateRange).toEqual({ dateFrom: mockParentModel.dateFrom, dateTo: mockParentModel.dateTo });
  });

  it('should update filter comparator options and filter type on comparator change', () => {
    expect(component.filterType).toEqual('inRange');
    expect(component.filterComparatorOptions[0].checked).toBeTruthy();
    expect(component.filterComparatorOptions[1].checked).toBeFalsy();
    expect(component.filterComparatorOptions[2].checked).toBeFalsy();

    component.updateCurrentFilterComparator('lessThan');
    expect(component.filterType).toEqual('lessThan');
    expect(component.filterComparatorOptions[0].checked).toBeFalsy();
    expect(component.filterComparatorOptions[1].checked).toBeTruthy();
    expect(component.filterComparatorOptions[2].checked).toBeFalsy();
  });

  it('should return null when no date has been set', () => {
    component.onParentModelChanged(null);
    expect(component.dateRange).toBeNull();
  });

  it('should notify Ag-Grid when the date changes', () => {
    const event: { dateFrom?: Date; dateTo?: Date; filterType: DateFilterTypes } = {
      dateFrom: new Date(mockParentModel.dateFrom),
      filterType: 'equals',
    };
    component.dateRangeChanged(event);
    expect(component.dateRange).toEqual({ dateFrom: convertDateToFluxnovaString(new Date(mockParentModel.dateFrom)) });
    expect(mockParams.api.setFilterModel).toHaveBeenCalledTimes(1);
  });

  it('should update date to time when date range changes', () => {
    const mockDateStartOfDay = `2022-05-08T00:00:00.000${currentTimezoneOffset}00`;
    const mockDateEndOfDay = `2022-05-08T23:59:59.999${currentTimezoneOffset}00`;

    const event: { dateFrom?: Date; dateTo?: Date; filterType: DateFilterTypes } = {
      dateFrom: new Date(mockDateStartOfDay),
      dateTo: new Date(mockDateEndOfDay),
      filterType: 'equals',
    };

    component.dateRangeChanged(event);
    expect(component.dateRange).toEqual({
      dateFrom: convertDateToFluxnovaString(new Date(mockDateStartOfDay)),
      dateTo: convertDateToFluxnovaString(new Date(mockDateEndOfDay)),
    });
    expect(mockParams.api.setFilterModel).toHaveBeenCalledTimes(1);
  });

  it('should apply an ag-grid popup css class to ngb-datepicker when the popup is opened', () => {
    const spy = vi.spyOn(document, 'querySelector');
    const mockElement = { classList: { add: vi.fn() } };
    spy.mockReturnValue(mockElement as any);
    component.popupOpened();
    expect(mockElement.classList.add).toHaveBeenCalledTimes(1);
    expect(mockElement.classList.add).toHaveBeenCalledWith('ag-custom-component-popup');
  });

  function getCurrentOffset(): string {
    const timezoneInHours = new Date().getTimezoneOffset() / 60;
    if (timezoneInHours >= 10) return `-${timezoneInHours}`;
    if (timezoneInHours > 0) return `-0${timezoneInHours}`;
    if (timezoneInHours >= -10) return `+0${Math.abs(timezoneInHours)}`;
    if (timezoneInHours <= -10) return `+${Math.abs(timezoneInHours)}`;
    return `${timezoneInHours}`;
  }
});
