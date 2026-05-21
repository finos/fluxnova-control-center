import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbDate, NgbDatepickerModule, NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import moment from 'moment';
import { Directive, NO_ERRORS_SCHEMA } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { mockConsoleWarn } from '@fxn/test-support/vitest';
import { RadioButtonsToggleComponent } from '../radio-buttons-toggle/radio-buttons-toggle.component';
import { DateRangeSelectComponent } from './date-range-select.component';

@Directive({
  selector: '[fluxnovaTruncateWithTooltip]',
  standalone: false,
})
export class MockFluxnovaTruncateWithTooltipDirective {}

describe('Date Range Select Component', () => {
  let component: DateRangeSelectComponent;
  let fixture: ComponentFixture<DateRangeSelectComponent>;

  const date = moment(new Date('05-06-2022 16:00'));

  beforeAll(() => {
    global.console = { log: vi.fn(), error: vi.fn(), warn: vi.fn() } as any;
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DateRangeSelectComponent, RadioButtonsToggleComponent, MockFluxnovaTruncateWithTooltipDirective],
      imports: [NgbDatepickerModule, FormsModule, NgbPopoverModule],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(DateRangeSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('should notify subscribers when the date range changes via an ng-bootstrap event', async () => {
    component.filterType = 'inRange';
    const dateFrom = new NgbDate(date.year(), date.month() + 1, date.date());
    const dateTo = new NgbDate(date.year(), date.month() + 1, date.date() + 1);

    const expected = {
      dateFrom: new Date(dateFrom.year, dateFrom.month - 1, dateFrom.day),
      dateTo: new Date(dateTo.year, dateTo.month - 1, dateTo.day, 23, 59, 59),
      filterType: 'inRange',
    };
    const promise = firstValueFrom(component.dateRangeChanged);
    component.onDateSelection(dateTo);
    component.onDateSelection(dateFrom);
    const dateRange = await promise;
    expect(dateRange).toEqual(expected);
  });

  it('should notify subscribers when the date changes via the text input', async () => {
    const dateFrom = new Date(date.year(), date.month(), date.date() + 1);
    const dateTo = new Date(date.year(), date.month(), date.date() + 2);
    component.filterType = 'inRange';
    const event = {
      target: {
        value: moment(dateFrom).format('yyyy-MM-DD') + ' \u2192 ' + moment(dateTo).format('yyyy-MM-DD'),
      },
    };
    const expected = { dateFrom, dateTo, filterType: 'inRange' };
    const promise = firstValueFrom(component.dateRangeChanged);
    component.inputChanged.next(event as any);
    vi.runAllTimers();
    const dateRange = await promise;
    expect(dateRange).toEqual(expected);
  });

  it('should handle incorrect date formats provided via the text input', () => {
    mockConsoleWarn();
    const mockEventEmitter = {
      emit: vi.fn(),
    };
    component.dateRangeChanged = mockEventEmitter as any;
    const spy = vi.spyOn(console, 'warn');
    let event = {
      target: {
        value: '2020-01-aa',
      },
    };
    expect(console.warn).toHaveBeenCalledTimes(0);
    component.inputChanged.next(event as any);
    expect(console.warn).toHaveBeenCalledTimes(3);
    vi.runAllTimers();
    expect(console.warn).toHaveBeenCalledTimes(5);
    expect(component.dateFrom).toEqual(null);
    expect(component.isInvalidDateRange).toEqual(true);
    expect(mockEventEmitter.emit).toHaveBeenCalledTimes(0);

    const dateFrom = new Date(date.year(), date.month(), date.date() + 1);
    const dateTo = new Date(date.year(), date.month(), date.date() + 2);

    event = {
      target: {
        value: moment(dateFrom).format('yyyy-MM-DD') + ' \u2192 ' + moment(dateTo).format('yyyy-MM-DD'),
      },
    };
    component.inputChanged.next(event as any);
    vi.runAllTimers();
    expect(component.dateFrom).toEqual(dateFrom);
    expect(component.dateTo).toEqual(dateTo);
    expect(component.isInvalidDateRange).toEqual(false);
    expect(mockEventEmitter.emit).toHaveBeenCalledWith({ dateFrom, dateTo, filterType: 'inRange' });
    spy.mockRestore();
  });

  it('should debounce for 1.2s on text input', () => {
    const dateFrom = new Date(date.year(), date.month(), date.date() + 1);
    const dateTo = new Date(date.year(), date.month(), date.date() + 2);

    const mockEventEmitter = {
      emit: vi.fn(),
    };
    component.dateRangeChanged = mockEventEmitter as any;
    const event = {
      target: {
        value: moment(dateFrom).format('yyyy-MM-DD HH:mm') + ' \u2192 ' + moment(dateTo).format('yyyy-MM-DD HH:mm'),
      },
    };
    component.inputChanged.next(event as any);

    vi.advanceTimersByTime(200);
    expect(mockEventEmitter.emit).toHaveBeenCalledTimes(0);
    vi.advanceTimersByTime(1200);
    expect(component.dateFrom).toEqual(dateFrom);
    expect(component.dateTo).toEqual(dateTo);

    expect(mockEventEmitter.emit).toHaveBeenCalledWith({ dateFrom, dateTo, filterType: 'inRange' });
  });

  it('should notify subscribers when the single date Input text changes', async () => {
    const dateFrom = new Date(date.year(), date.month(), date.date() + 1);
    component.filterType = 'equals';
    const event = {
      target: {
        value: moment(dateFrom).format('yyyy-MM-DD'),
      },
    };
    const expected = { dateFrom, dateTo: null, filterType: 'equals' };
    const promise = firstValueFrom(component.dateRangeChanged);
    component.inputChanged.next(event as any);
    vi.runAllTimers();
    const dateRange = await promise;
    expect(dateRange).toEqual(expected);
  });

  it('should toggle between single and range filter', () => {
    const dateFrom = new Date(date.year(), date.month(), date.date() + 1, 6, 42);
    const dateTo = new Date(date.year(), date.month(), date.date() + 2, 11, 13);

    component.dateFrom = dateFrom;
    component.dateTo = dateTo;
    component.filterType = 'inRange';
    component.handleFilterTypeToggle('equals');

    expect(component.dateFrom).toEqual(dateFrom);
    expect(component.dateTo).toEqual(null);

    expect(component.dateFromText).toEqual(moment(component.dateFrom).format('yyyy-MM-DD HH:mm:ss'));
  });

  it('should emit date range change when time is updated', () => {
    const dateFrom = new Date(date.year(), date.month(), date.date() + 1, 3, 30);
    const dateTo = new Date(date.year(), date.month(), date.date() + 2, 14, 23);
    const mockEventEmitter = {
      emit: vi.fn(),
    };
    component.filterTypeRange = true;
    component.dateRangeChanged = mockEventEmitter as any;
    component.onTimeChange(dateFrom, dateTo);
    expect(mockEventEmitter.emit).toHaveBeenCalledWith({ dateFrom, dateTo, filterType: 'inRange' });
  });

  it('should update single date on ngOnInit if dateFrom is set', () => {
    const dateFrom = new Date(date.year(), date.month(), date.date() + 1, 3, 30);
    component.dateFrom = dateFrom;
    component.filterTypeRange = false;
    const updateSingleDateSpy = vi.spyOn(component, 'updateSingleDate');

    component.ngOnInit();
    expect(updateSingleDateSpy).toHaveBeenCalledWith(dateFrom);
  });
});
