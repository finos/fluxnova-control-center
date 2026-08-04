import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { NgbDate, NgbInputDatepicker } from '@ng-bootstrap/ng-bootstrap';
import moment from 'moment';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { SubSink } from 'subsink';
import { parseDate } from '../date-format';
import { RadioButtonItem } from '../radio-buttons-toggle/radio-buttons-toggle.component';
export type DateFilterTypes = 'inRange' | 'equals' | 'before' | 'after';

@Component({
  selector: 'fluxnova-date-range-select',
  templateUrl: './date-range-select.component.html',
  styleUrls: ['./date-range-select.component.scss'],
  standalone: false,
})
export class DateRangeSelectComponent implements OnDestroy, OnInit {
  inputChanged: Subject<Event> = new Subject<Event>();
  defaultFromTime = { hour: 0, minute: 0, second: 0 };
  defaultToTime = { hour: 23, minute: 59, second: 59 };
  @ViewChild('picker') picker?: NgbInputDatepicker;
  @ViewChild('rangeInput') rangeInput?: ElementRef;
  @Output() dateRangeChanged = new EventEmitter<{
    dateTo: Date | null;
    dateFrom: Date;
    filterType: DateFilterTypes;
  } | null>();

  @Output() popupOpened = new EventEmitter();
  @Output() validityChanged = new EventEmitter<boolean>();
  @Input() container = 'body';
  @Input() selectRange = true;
  @Input() popoverPlacement = 'bottom-right auto';

  @Input() set dateRange(dateRange: { dateTo?: string; dateFrom?: string }) {
    if (dateRange) {
      this.dateFrom = (dateRange.dateFrom && this.convertInputStringToDate(dateRange.dateFrom)) || null;
      this.dateTo = (dateRange.dateTo && this.convertInputStringToDate(dateRange.dateTo)) || null;
      this.updateInputText(this.dateFrom, this.dateTo);
      this.isInvalidDateRange =
        !this.dateFrom || (this.filterTypeRange && (!this.dateTo || this.dateFrom > this.dateTo));
      this.validityChanged.emit(!this.isInvalidDateRange);
    } else {
      this.rangeString = '';
      this.dateFromText = '';
      this.dateToText = '';
      this.dateFrom = null;
      this.dateTo = null;
    }
  }
  @Input() keepOpenAfterDateSelect = false;
  @Input() displayFilterTypeHeader = false;
  @Input() set filterType(filterType: DateFilterTypes) {
    this.filterTypeRange = filterType === 'inRange';
    this.radioButtons = [
      {
        name: 'Single Date',
        value: 'equals',
        checked: !this.filterTypeRange,
      },
      {
        name: 'Date Range',
        value: 'inRange',
        checked: this.filterTypeRange,
      },
    ];
    this.handleFilterTypeToggle(filterType);
  }
  @Input() dateFrom: Date | null = null;
  @Input() dateTo: Date | null = null;

  filterTypeRange = true;
  hoveredDate: NgbDate | null = null;
  dateFromText = '';
  dateToText = '';
  rangeString = '';
  isInvalidDateRange = false;
  placeholders = { inRange: 'YYYY-MM-DD HH:MM:SS \u2192 YYYY-MM-DD HH:MM:SS', equals: 'YYYY-MM-DD HH:MM:SS' };
  radioButtons?: RadioButtonItem[];
  popoverInputsChanged = new Subject<Event>();

  private subs = new SubSink();

  constructor() {
    this.subs.add(
      this.inputChanged
        .pipe(
          map((event) => {
            this.maskInput((event.target as any).value);
            return event;
          }),
          debounceTime(1200),
          distinctUntilChanged(),
        )
        .subscribe((event: Event) =>
          this.filterTypeRange ? this.onDateRangeInputChanged(event) : this.onSingleDateInputChanged(event),
        ),
      this.popoverInputsChanged
        .pipe(
          debounceTime(800),
          distinctUntilChanged((a: Event, b: Event) => {
            const previousValue = (b.target as any).id === 'dateToTextInput' ? this.dateToText : this.dateFromText;
            return previousValue === (b.target as any).value;
          }),
        )
        .subscribe((event: Event) => {
          if (!this.filterTypeRange) {
            this.dateFromText = (event.target as any).value;
            this.onSingleDateInputChanged(event);
          } else {
            this.dateFromText =
              (event.target as any).id === 'dateFromTextInput' ? (event.target as any).value : this.dateFromText;
            this.dateToText =
              (event.target as any).id === 'dateToTextInput' ? (event.target as any).value : this.dateToText;
            this.rangeString = this.getRangeInputString();
            this.updateDateRangeFromDateFromTextAndDateToText();
          }
        }),
    );
  }

  ngOnInit() {
    if (this.dateFrom && !this.filterTypeRange) {
      this.updateSingleDate(this.dateFrom);
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  toggle() {
    if (this.picker) {
      this.picker.toggle();
      if (this.picker.isOpen()) {
        this.picker.autoClose = false;
        this.popupOpened.emit();
      }
    }
  }

  maskInput(textValue: string) {
    const [fromText, toText] = textValue.split(' \u2192 ').map((text) => text.trim());
    const fromTextDate = this.convertInputStringToDate(fromText);
    if (fromTextDate && parseDate(fromText, 'yyyy-MM-DD')) {
      fromTextDate?.setHours(this.defaultFromTime.hour, this.defaultFromTime.minute, this.defaultFromTime.second);
    }
    const toTextDate = this.convertInputStringToDate(toText);
    if (toTextDate && parseDate(toText, 'yyyy-MM-DD')) {
      toTextDate?.setHours(this.defaultToTime.hour, this.defaultToTime.minute, this.defaultToTime.second);
    }
    if (fromTextDate && textValue[textValue.length - 1] === ' ') {
      this.updateInputText(fromTextDate, toTextDate);
    }
  }

  handleFilterTypeToggle(type: string) {
    this.filterTypeRange = type === 'inRange';
    this.dateTo = null;
    if (!this.filterTypeRange && this.dateFrom) {
      this.updateSingleDate(this.dateFrom);
    } else if (this.dateFrom) {
      this.updateInputText(this.dateFrom);
    }
  }

  onSingleDateInputChanged(event: Event) {
    const dateStr: string = (event.target as any).value;
    this.dateFrom = this.convertInputStringToDate(dateStr);
    this.isInvalidDateRange = !!dateStr.length && !this.dateFrom;
    if (!this.isInvalidDateRange && this.dateFrom) {
      this.dateRangeChanged.emit({ dateFrom: this.dateFrom, dateTo: null, filterType: 'equals' });
      this.closeOnSelect();
    } else if (!dateStr) {
      this.dateRangeChanged.emit(null);
      this.closeOnSelect();
    }
  }

  closeOnSelect() {
    if (!this.keepOpenAfterDateSelect) {
      this.picker?.close();
    }
  }

  onDateRangeInputChanged(event: Event) {
    const dateStr = (event.target as any).value;
    if (dateStr) {
      const dateStrArr: string[] = dateStr.split(' \u2192 ');
      this.dateFromText = dateStrArr[0] || this.dateFromText;
      this.dateToText = dateStrArr[1] || this.dateToText;
    } else {
      this.dateFromText = '';
      this.dateToText = '';
    }
    this.updateDateRangeFromDateFromTextAndDateToText();
  }

  updateDateRangeFromDateFromTextAndDateToText() {
    this.dateFrom = this.convertInputStringToDate(this.dateFromText);
    this.dateTo = this.convertInputStringToDate(this.dateToText);
    this.isInvalidDateRange = !this.dateFrom || !this.dateTo || this.dateFrom > this.dateTo;
    if (this.dateFrom && this.dateTo && !this.isInvalidDateRange) {
      this.dateRangeChanged.emit({ dateFrom: this.dateFrom, dateTo: this.dateTo, filterType: 'inRange' });
      this.closeOnSelect();
    } else if (!this.dateFromText && !this.dateToText) {
      this.isInvalidDateRange = false;
      this.dateRangeChanged.emit(null);
      this.closeOnSelect();
    }
  }

  convertInputStringToDate(dateStr: string) {
    if (dateStr?.length < 6) {
      return null;
    } else {
      let m = parseDate(dateStr);
      if (!m) {
        // the string wasn't one of the recognized formats, let native Date try to parse
        const dateObj = new Date(dateStr);
        m = moment(dateObj);
      }
      if (!m.isValid()) {
        // could not parse the date, don't attempt a search
        console.warn('Could not parse date', dateStr);
        return null;
      }
      return m.toDate();
    }
  }

  onDateSelection(date: NgbDate) {
    const formattedDate = new Date(
      date.year,
      date.month - 1,
      date.day,
      this.dateFrom?.getHours() || this.defaultFromTime.hour,
      this.dateFrom?.getMinutes() || this.defaultFromTime.minute,
      this.defaultFromTime.second,
    );
    if (this.filterTypeRange) {
      this.updateFromDateAndToDate(formattedDate);
    } else {
      this.updateSingleDate(formattedDate);
    }
  }

  updateFromDateAndToDate(date: Date) {
    if (!this.dateFrom && !this.dateTo) {
      this.dateFrom = date;
    } else if (this.dateFrom && !this.dateTo && date >= this.dateFrom) {
      date.setHours(this.defaultToTime.hour, this.defaultToTime.minute, this.defaultToTime.second);
      this.dateTo = date;
    } else if (this.dateFrom && !this.dateTo && date <= this.dateFrom) {
      this.dateTo = this.dateFrom;
      if (
        this.dateTo.getHours() === this.defaultFromTime.hour &&
        this.dateTo.getMinutes() === this.defaultFromTime.minute &&
        this.dateTo.getSeconds() === this.defaultFromTime.second
      ) {
        this.dateTo.setHours(this.defaultToTime.hour, this.defaultToTime.minute, this.defaultToTime.second);
      }
      date.setHours(this.defaultFromTime.hour, this.defaultFromTime.minute, this.defaultFromTime.second);
      this.dateFrom = date;
    } else {
      this.dateTo = null;
      this.dateFrom = date;
    }
    this.checkRangeValidityAndEmit();
  }

  onTimeChange(dateFrom: Date, dateTo: Date) {
    if (dateFrom?.toString() === 'Invalid Date' || dateTo?.toString() === 'Invalid Date') {
      return;
    }
    this.dateFrom = dateFrom;
    this.dateTo = dateTo;
    if (this.filterTypeRange) {
      if (dateFrom && dateTo && dateFrom > dateTo) {
        this.dateFrom = dateTo;
        this.dateTo = dateFrom;
      }
      this.checkRangeValidityAndEmit();
    } else {
      this.updateSingleDate(dateFrom);
    }
  }

  checkRangeValidityAndEmit() {
    this.isInvalidDateRange = !this.dateTo || !this.dateFrom || this.dateFrom > this.dateTo;
    this.updateInputText(this.dateFrom, this.dateTo);
    if (this.dateTo && this.dateFrom && !this.isInvalidDateRange) {
      this.dateRangeChanged.emit({ dateFrom: this.dateFrom, dateTo: this.dateTo, filterType: 'inRange' });
      this.closeOnSelect();
    } else {
      this.validityChanged.emit(!this.isInvalidDateRange);
    }
  }

  updateSingleDate(date: Date) {
    this.dateFrom = date;
    this.dateTo = null;
    this.isInvalidDateRange = false;
    this.dateFromText = this.getDateString(this.dateFrom) || this.dateFromText;
    this.dateRangeChanged.emit({ dateFrom: this.dateFrom, dateTo: this.dateTo, filterType: 'equals' });
    this.closeOnSelect();
  }

  updateInputText(dateFrom: Date | null = null, dateTo: Date | null = null) {
    this.dateFromText = this.getDateString(dateFrom);
    this.dateToText = this.getDateString(dateTo);
    this.rangeString = this.getRangeInputString();
  }

  getRangeInputString() {
    return this.dateFromText && this.dateFromText + ' \u2192 ' + this.dateToText;
  }

  isHovered(date: NgbDate) {
    const formattedDate = new Date(date.year, date.month - 1, date.day);
    return (
      this.hoveredDate === date ||
      (this.dateFrom && !this.dateTo && this.hoveredDate && formattedDate > this.dateFrom && date < this.hoveredDate)
    );
  }

  isInside(date: NgbDate) {
    if (this.filterTypeRange) {
      const formattedDate = new Date(date.year, date.month - 1, date.day);
      if (this.dateFrom && this.dateTo) {
        return formattedDate > this.dateFrom && formattedDate < this.dateTo;
      } else if (this.dateFrom && this.hoveredDate) {
        const formattedHoveredDate = new Date(this.hoveredDate.year, this.hoveredDate.month - 1, this.hoveredDate.day);
        const earlierDate = formattedHoveredDate > this.dateFrom ? this.dateFrom : formattedHoveredDate;
        const laterDate = formattedHoveredDate < this.dateFrom ? this.dateFrom : formattedHoveredDate;
        return formattedDate > earlierDate && formattedDate < laterDate;
      }
    }
    return;
  }

  isRange(date: NgbDate) {
    const formattedFromDate = this.getDateString(
      new Date(date.year, date.month - 1, date.day, this.dateFrom?.getHours() || 0, this.dateFrom?.getMinutes() || 0),
    );
    const formattedToDate = this.getDateString(
      new Date(date.year, date.month - 1, date.day, this.dateTo?.getHours() || 0, this.dateTo?.getMinutes() || 0),
    );
    return (
      this.dateFromText === formattedFromDate ||
      (this.filterTypeRange && this.dateToText === formattedToDate) ||
      this.isHovered(date)
    );
  }

  isOutsideDay(date: NgbDate, currentMonth: number) {
    return date.month !== currentMonth;
  }

  getDateString(date?: Date | null) {
    return (date && moment(date).format('yyyy-MM-DD HH:mm:ss')) || '';
  }
}
