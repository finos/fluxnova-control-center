import { Component } from '@angular/core';
import { IDateAngularComp } from 'ag-grid-angular';
import { IDateParams } from 'ag-grid-community';

@Component({
  selector: 'fluxnova-ag-grid-date-input',
  templateUrl: './date-input.component.html',
  styleUrls: ['./date-input.component.scss'],
  standalone: false,
})
export class DateInputComponent implements IDateAngularComp {
  private params?: IDateParams;
  date: Date | null = null;

  agInit(params: IDateParams) {
    this.params = params;
  }

  getDate(): Date | null {
    return this.date;
  }

  setDate(date: Date) {
    this.date = date;
  }

  dateChanged(date: Date) {
    this.date = date;
    if (this.params) {
      this.params.onDateChanged();
    }
  }

  popupOpened() {
    const datepicker = document.querySelector('ngb-datepicker');
    // needed so that ag-grid doesn't close the filter popup when clicking on the calendar
    // https://www.ag-grid.com/javascript-grid-date-component/
    datepicker?.classList?.add('ag-custom-component-popup');
  }
}
