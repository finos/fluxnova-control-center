import { Component, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { NgbDate, NgbInputDatepicker } from '@ng-bootstrap/ng-bootstrap';
import moment from 'moment';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { parseDate } from '../date-format';

@Component({
  selector: 'fluxnova-date-select',
  templateUrl: './date-select.component.html',
  styleUrls: ['./date-select.component.scss'],
  standalone: false,
})
export class DateSelectComponent implements OnDestroy {
  inputChanged: Subject<Event> = new Subject<Event>();
  model?: NgbDate | null;

  @ViewChild('picker') picker?: NgbInputDatepicker;

  @Output() dateChanged = new EventEmitter<Date>();
  @Output() popupOpened = new EventEmitter();

  @Input() container = 'body';
  @Input() set date(date: Date | null) {
    this._date = date;
    if (date) {
      const mDate = moment(date);
      this.model = new NgbDate(mDate.year(), mDate.month() + 1, mDate.date());
    } else {
      this.model = null;
    }
  }

  private _date?: Date | null;
  private inputSub: Subscription;

  constructor() {
    this.date = null;
    this.inputSub = this.inputChanged
      .pipe(debounceTime(1000), distinctUntilChanged())
      .subscribe((event: Event) => this.onDateChanged(event));
  }

  ngOnDestroy() {
    this.inputSub.unsubscribe();
  }

  toggle() {
    if (this.picker) {
      this.picker.toggle();
      if (this.picker.isOpen()) {
        this.popupOpened.emit();
      }
    }
  }

  onDateChanged(date: NgbDate | Event) {
    if (date instanceof NgbDate) {
      this.date = new Date(date.year, date.month - 1, date.day);
    } else {
      const dateStr = (date.target as any).value;
      if (dateStr === '') {
        this.date = null;
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
          return;
        }
        this.date = m.toDate();
      }
    }
    this.dateChanged.emit(this._date || undefined);
  }
}
