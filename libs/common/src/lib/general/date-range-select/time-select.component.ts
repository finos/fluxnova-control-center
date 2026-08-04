import { Component, EventEmitter, Injectable, Input, OnDestroy, Output } from '@angular/core';
import { NgbTimeAdapter, NgbTimeStruct } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Injectable()
export class NgbTimeDateAdapter extends NgbTimeAdapter<Date> {
  dateObject = { year: 0, month: 0, date: 0 };
  fromModel(value: Date | null): NgbTimeStruct | null {
    if (!value) {
      return null;
    }
    this.dateObject = {
      year: value.getFullYear(),
      month: value.getMonth(),
      date: value.getDate(),
    };
    return {
      hour: value.getHours(),
      minute: value.getMinutes(),
      second: value.getSeconds(),
    };
  }

  toModel(time: NgbTimeStruct | null): Date | null {
    return new Date(this.dateObject.year, this.dateObject.month, this.dateObject.date, time?.hour, time?.minute);
  }
}

@Component({
  selector: 'fluxnova-time-select',
  templateUrl: './time-select.component.html',
  providers: [{ provide: NgbTimeAdapter, useClass: NgbTimeDateAdapter }],
  standalone: false,
})
export class TimeSelectComponent implements OnDestroy {
  input$ = new BehaviorSubject({} as any);
  inputSub?: Subscription;

  @Input() label = '';
  @Input() dateTimeModel?: Date;
  @Output() updateDateTime = new EventEmitter<Date>();

  constructor() {
    this.inputSub = this.input$.pipe(debounceTime(800)).subscribe((input) => input?.target?.blur());
  }

  ngOnDestroy() {
    this.inputSub?.unsubscribe();
  }
}
