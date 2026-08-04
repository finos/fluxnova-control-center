import { Pipe, PipeTransform } from '@angular/core';
import { isDate } from 'lodash-es';
import moment, { Moment } from 'moment';

export const acceptedDateFormats = {
  RFC_3339: 'yyyy-MM-DDTHH:mm:ssZ',
  RFC_3339_NANO: 'yyyy-MM-DDTHH:mm:ss.SSSSSSZ',
  RFC_3339_NO_TIME: 'yyyy-MM-DD',
  FLUXNOVA_DATE_FORMAT: 'yyyy-MM-DDTHH:mm:ss.SSSZZ',
  DATE_TIME_PICKER_FORMAT_12_HOUR_ALT: 'yyyy-MM-DD h:mmA',
  DATE_TIME_PICKER_FORMAT_12_HOUR: 'yyyy-MM-DD h:mm A',
  DATE_TIME_PICKER_FORMAT_24_HOUR: 'yyyy-MM-DD H:mm',
  DATE_TIME_PICKER_FORMAT_24_HOUR_SECONDS: 'yyyy-MM-DD HH:mm:ss',
  DATE_TIME_12_HOUR_US: 'MM/DD/yyyy hh:mmA',
  TIME_12_HOUR: 'hh:mmA',
};

export function parseDate(date?: string | Date | null, format?: string): Moment | null {
  let m;

  if (!date) {
    return null;
  }

  // try Date object first
  if (isDate(date)) {
    m = moment(date);
  } else {
    if (format) {
      m = moment(date, format, true);
    } else {
      for (const formatValue of Object.values(acceptedDateFormats)) {
        m = moment(date, formatValue, true);
        if (m.isValid()) {
          break;
        }
      }
    }
    if (!m?.isValid()) {
      console.warn('Invalid Date', date);
      m = null;
    }
  }
  return m;
}

export function convertDateToFluxnovaString(date: string | Date, parsingFormat?: string): string {
  const m = parseDate(date, parsingFormat);
  return m ? m.format(acceptedDateFormats.FLUXNOVA_DATE_FORMAT) : '';
}

export function diffDateStrings(startDate: string, endDate: string): number {
  const startMoment = moment(startDate);
  const endMoment = moment(endDate);
  return endMoment.diff(startMoment);
}

export function convertMsToDurationString(ms: number): string {
  const duration = moment.duration(ms);

  const totalHours = Math.floor(duration.asHours());
  const minutes = duration.minutes();
  const seconds = duration.seconds();
  const deciSeconds = Math.floor(duration.milliseconds() / 100);

  return `${totalHours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${deciSeconds}`;
}

export function formatMsToLargestTimeUnit(ms: number): string {
  const duration = moment.duration(ms);

  const totalHours = Math.floor(duration.asHours());
  if (totalHours > 0) {
    return `${totalHours} hrs`;
  }
  const minutes = duration.minutes();
  if (minutes > 0) {
    return `${minutes} mins`;
  }
  const seconds = duration.seconds();
  if (seconds > 0) {
    return `${seconds} s`;
  }
  return `${ms.toFixed(2)} ms`;
}

@Pipe({
  name: 'fluxnovaDate',
  standalone: false,
})
export class DateFormatPipe implements PipeTransform {
  transform(value?: string | Date | number, formatType?: string): string | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    // Handle milliseconds
    if (typeof value === 'number') {
      return convertMsToDurationString(value);
    }

    // Handle dates
    const formattedDate = parseDate(value as string | Date);
    if (!formattedDate) {
      return null;
    }

    const formatMap: Record<string, string> = {
      long: acceptedDateFormats.DATE_TIME_PICKER_FORMAT_24_HOUR_SECONDS,
      medium: acceptedDateFormats.DATE_TIME_12_HOUR_US,
      short: acceptedDateFormats.RFC_3339_NO_TIME,
      time: acceptedDateFormats.TIME_12_HOUR,
    };

    const format = formatMap[formatType || 'long'];
    return format ? formattedDate.format(format) : null;
  }
}
