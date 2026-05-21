import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import moment from 'moment';
import {
  convertDateToFluxnovaString,
  convertMsToDurationString,
  DateFormatPipe,
  diffDateStrings,
  formatMsToLargestTimeUnit,
  parseDate,
} from './date-format';

describe('Parsing Dates', () => {
  describe('Parse Date', () => {
    let consoleSpy: Mock;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => vi.resetAllMocks());
    it('should return null when no date is given', () => {
      const tests = [null, undefined, ''];
      tests.forEach((toTest) => {
        const result = parseDate(toTest);
        expect(result).toEqual(null);
      });
    });

    it('should reject a date string that does not match any pre-defined formats', () => {
      const toTest = '05-12-2020';
      const result = parseDate(toTest);
      expect(result).toEqual(null);
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(`Invalid Date`, toTest);
    });

    it('should accept a date string that matches the RFC_3339 format', () => {
      // yyyy-MM-DDTHH:mm:ssZ
      const toTest = '2020-04-01T23:59:59-00:00';
      const result = parseDate(toTest);
      expect(result).toBeTruthy();
      expect(result?.year()).toEqual(2020);
      expect(result?.month()).toEqual(3);
      expect(result?.date()).toEqual(1);
      expect(consoleSpy).toHaveBeenCalledTimes(0);
    });

    it('should accept a date string that matches the RFC_3339_NO_TIME format', () => {
      // yyyy-MM-DD
      const toTest = '2020-12-25';
      const result = parseDate(toTest);
      expect(result).toBeTruthy();
      expect(result?.year()).toEqual(2020);
      expect(result?.month()).toEqual(11);
      expect(result?.date()).toEqual(25);
      expect(consoleSpy).toHaveBeenCalledTimes(0);
    });

    it('should accept a date string that matches the RFC_3339_NANO format', () => {
      // yyyy-MM-DDTHH:mm:ss.SSSSSSZ
      const toTest = '2020-07-04T23:59:59.999999-00:00';
      const result = parseDate(toTest);
      expect(result).toBeTruthy();
      expect(result?.year()).toEqual(2020);
      expect(result?.month()).toEqual(6);
      expect(result?.date()).toEqual(4);
      expect(consoleSpy).toHaveBeenCalledTimes(0);
    });

    it('should accept a date string that matches the DATE_TIME_PICKER_FORMAT_12_HOUR format', () => {
      // yyyy-MM-DD h:mm A
      const toTest = '2020-07-04 10:25 PM';
      const result = parseDate(toTest);
      expect(result).toBeTruthy();
      expect(result?.year()).toEqual(2020);
      expect(result?.month()).toEqual(6);
      expect(result?.date()).toEqual(4);
      expect(result?.hour()).toEqual(22);
      expect(result?.minute()).toEqual(25);
      expect(consoleSpy).toHaveBeenCalledTimes(0);
    });

    it('should accept a date string that matches the given format', () => {
      const toTest = '2020-01-01T23';
      const format = 'yyyy-MM-DDTHH';
      const result = parseDate(toTest, format);
      expect(result?.year()).toEqual(2020);
      expect(result?.month()).toEqual(0);
      expect(result?.date()).toEqual(1);
      expect(consoleSpy).toHaveBeenCalledTimes(0);
    });

    it('should accept a date object', () => {
      const toTest = new Date();
      const result = parseDate(toTest);
      expect(result?.toISOString()).toEqual(toTest.toISOString());
      expect(consoleSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('Convert Date to Fluxnova-friendly String', () => {
    // Fluxnova format: yyyy-MM-DDTHH:mm:ss.SSSZZ

    it('should return an empty string when no date is given', () => {
      const tests = [null, undefined, ''];
      tests.forEach((toTest: any) => {
        const result = convertDateToFluxnovaString(toTest);
        expect(result).toEqual('');
      });
    });

    it('should convert a date string', () => {
      const toTest = '2020-12-25';
      const expected = `2020-12-25`;
      const result = convertDateToFluxnovaString(toTest).split('T');
      expect(result[0]).toEqual(expected);
      expect(result[1].length).toEqual(17);
    });

    it('should convert a date string using the given format', () => {
      const toTest = '2020-1-1';
      const format = 'yyyy-M-D';
      const expected = `2020-01-01`;
      const result = convertDateToFluxnovaString(toTest, format).split('T');
      expect(result[0]).toEqual(expected);
      expect(result[1].length).toEqual(17);
    });
  });

  describe('Handle duration date strings', () => {
    const testStartDateString = '2025-03-15 08:00:24';
    const testEndDateString = '2025-03-17 12:13:51';
    const expectedMilliseconds = 188007000;

    it('should calc diff', () => {
      const result = diffDateStrings(testStartDateString, testEndDateString);
      expect(result).toEqual(expectedMilliseconds);
    });

    it('should convert milliseconds to proper duration string', () => {
      const expectedDurationString = '52:13:27.0'; // Hours:Minutes:Seconds.Milliseconds
      const result = convertMsToDurationString(expectedMilliseconds);
      expect(result).toEqual(expectedDurationString);
    });

    it('should format hours when duration is >= 1 hour', () => {
      expect(formatMsToLargestTimeUnit(10800000)).toEqual('3 hrs');
      expect(formatMsToLargestTimeUnit(5400000)).toEqual('1 hrs');
      expect(formatMsToLargestTimeUnit(360000000)).toEqual('100 hrs');
    });

    it('should format minutes when duration is < 1 hour but >= 1 minute', () => {
      expect(formatMsToLargestTimeUnit(1800000)).toEqual('30 mins');
      expect(formatMsToLargestTimeUnit(60000)).toEqual('1 mins');
      expect(formatMsToLargestTimeUnit(3540000)).toEqual('59 mins');
    });

    it('should format seconds when duration is < 1 minute but >= 1 second', () => {
      expect(formatMsToLargestTimeUnit(30000)).toEqual('30 s');
      expect(formatMsToLargestTimeUnit(1000)).toEqual('1 s');
      expect(formatMsToLargestTimeUnit(59000)).toEqual('59 s');
    });

    it('should format milliseconds when duration is < 1 second', () => {
      expect(formatMsToLargestTimeUnit(500)).toEqual('500.00 ms');
      expect(formatMsToLargestTimeUnit(0)).toEqual('0.00 ms');
      expect(formatMsToLargestTimeUnit(999)).toEqual('999.00 ms');
      expect(formatMsToLargestTimeUnit(123.45)).toEqual('123.45 ms');
    });
  });
});

describe('Pipe: Date Format', () => {
  let pipe: DateFormatPipe;
  let spyWarn: any;

  beforeEach(() => {
    spyWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    pipe = new DateFormatPipe();
    spyWarn.mockReset();
  });

  afterEach(() => vi.resetAllMocks());

  it('should return null if null is provided', () => {
    expect(pipe.transform(null as any)).toEqual(null);
  });

  const dateStr = '2020-12-17T22:23:24.000-0000';
  const testDate = moment(dateStr);

  describe('when a string is given', () => {
    beforeEach(() => {
      spyWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });
    it('should console warn and return null when faulty date provided', () => {
      expect(pipe.transform('2020-13-33')).toEqual(null);
      expect(spyWarn).toHaveBeenCalled();
    });

    it('should console warn and return null when string cannot be interpreted as a date', () => {
      expect(pipe.transform('test')).toEqual(null);
      expect(spyWarn).toHaveBeenCalled();
    });

    it('should return correct format when default pipe used', () => {
      expect(pipe.transform(dateStr)).toEqual(testDate.format('yyyy-MM-DD HH:mm:ss'));
    });

    it('should return correct format when short date provided and default pipe used', () => {
      expect(pipe.transform('2020-09-12')).toEqual('2020-09-12 00:00:00');
    });

    it('should return correct format when long formatType is specified', () => {
      expect(pipe.transform(dateStr)).toEqual(testDate.format('yyyy-MM-DD HH:mm:ss'));
    });

    it('should return correct format when medium formatType is specified', () => {
      expect(pipe.transform(dateStr, 'medium')).toEqual(testDate.format('MM/DD/yyyy hh:mmA'));
    });

    it('should return correct format when short formatType is specified', () => {
      expect(pipe.transform(dateStr, 'short')).toEqual(testDate.format('yyyy-MM-DD'));
    });

    it('should return correct format when time formatType is specified', () => {
      expect(pipe.transform(dateStr, 'time')).toEqual(testDate.format('hh:mmA'));
    });
  });

  describe('when a date object is given', () => {
    const dateObj = testDate.toDate();

    it('should return correct format when default pipe used', () => {
      expect(pipe.transform(dateObj)).toEqual(testDate.format('yyyy-MM-DD HH:mm:ss'));
    });

    it('should return correct format when long formatType is specified', () => {
      expect(pipe.transform(dateObj, 'long')).toEqual(testDate.format('yyyy-MM-DD HH:mm:ss'));
    });

    it('should return correct format when medium formatType is specified', () => {
      expect(pipe.transform(dateObj, 'medium')).toEqual(testDate.format('MM/DD/yyyy hh:mmA'));
    });

    it('should return correct format when short formatType is specified', () => {
      expect(pipe.transform(dateObj, 'short')).toEqual(testDate.format('yyyy-MM-DD'));
    });

    it('should return correct format when time formatType is specified', () => {
      expect(pipe.transform(dateObj, 'time')).toEqual(testDate.format('hh:mmA'));
    });
  });

  describe('when a number is given', () => {
    const ms = 937300; // 15 minutes and 37.3 seconds

    it('should return convert ms to a duration string', () => {
      expect(pipe.transform(ms)).toEqual('0:15:37.3');
    });

    it('should convert 0 ms to a zero duration string', () => {
      expect(pipe.transform(0)).toEqual('0:00:00.0');
    });
  });
});
