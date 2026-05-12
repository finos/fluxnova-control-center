import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbDate, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import moment from 'moment';
import { firstValueFrom } from 'rxjs';
import { mockConsoleWarn } from '@fxn/test-support/vitest';
import { DateSelectComponent } from './date-select.component';

describe('Date Select Component', () => {
  let component: DateSelectComponent;
  let fixture: ComponentFixture<DateSelectComponent>;
  let expectedModel: NgbDate;

  const date = moment();

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DateSelectComponent],
      imports: [NgbDatepickerModule, FormsModule],
    });

    fixture = TestBed.createComponent(DateSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    vi.useFakeTimers();
    expectedModel = new NgbDate(date.year(), date.month() + 1, date.date());
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('should notify subscribers when the date changes via an ng-bootstrap event', async () => {
    const expected = new Date(date.year(), date.month(), date.date());
    const promise = firstValueFrom(component.dateChanged);
    const ngbDate = new NgbDate(date.year(), date.month() + 1, date.date());
    component.onDateChanged(ngbDate);
    const newDate = await promise;
    expect(newDate).toEqual(expected);
  });

  it('should notify subscribers when the date changes via the text input', async () => {
    const event = {
      target: {
        value: date.format('yyyy-MM-DD'),
      },
    };
    const expected = new Date(date.year(), date.month(), date.date());
    const promise = firstValueFrom(component.dateChanged);
    component.inputChanged.next(event as any);
    vi.runAllTimers();
    const newDate = await promise;
    expect(newDate).toEqual(expected);
  });

  it('should handle incorrect date formats provided via the text input', () => {
    mockConsoleWarn();
    const mockEventEmitter = {
      emit: vi.fn(),
    };
    component.dateChanged = mockEventEmitter as any;
    const spy = vi.spyOn(console, 'warn');
    const event = {
      target: {
        value: '2020-01-aa',
      },
    };
    component.inputChanged.next(event as any);
    vi.runAllTimers();
    expect(console.warn).toHaveBeenCalledTimes(2);
    expect(component.model).toEqual(null);
    expect(mockEventEmitter.emit).toHaveBeenCalledTimes(0);

    event.target.value = '2020-01-011';
    component.inputChanged.next(event as any);
    vi.runAllTimers();
    expect(console.warn).toHaveBeenCalledTimes(2);
    expect(component.model).toEqual(null);
    expect(mockEventEmitter.emit).toHaveBeenCalledTimes(0);

    spy.mockRestore();
  });

  it('should debounce for 1s on text input', () => {
    const mockEventEmitter = {
      emit: vi.fn(),
    };
    component.dateChanged = mockEventEmitter as any;
    const event = {
      target: {
        value: date.format('yyyy-MM-DD'),
      },
    };
    component.inputChanged.next(event as any);

    vi.advanceTimersByTime(200);
    expect(mockEventEmitter.emit).toHaveBeenCalledTimes(0);
    vi.advanceTimersByTime(1000);
    expect(component.model).toEqual(expectedModel);
    expect(mockEventEmitter.emit).toHaveBeenCalledTimes(1);
  });
});
