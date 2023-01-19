import 'moment/locale/en-ca';
import 'moment/locale/fr-ca';

import { isEmpty, isString } from 'lodash';
import * as moment from 'moment';

import { createLogger } from '../logger';
import { AuthorizedDateFormats, DateError, TimeUnits, When } from './moment.enum';
import { MomentError } from './momentError';

const logger = createLogger('MomentUtils');

export class MomentUtils {
  /**
   * Get date formatted in utc.
   * @param value Can be a string or a Date.
   * @returns A date in utc time.
   * @throws Invalid_Format or Invalid_Date when the date is undefined or does not respects the correct format.
   */
  public static getUtcDate(value: string | Date | number, target = 'value'): Date {
    if (value === When.NOW) {
      return this.now();
    }
    if (!value) {
      this.validateDate(value, target);
    }
    let theDate: any;
    if (typeof value === 'number') {
      theDate = moment
        .unix(value)
        .utc()
        .toDate();
    } else {
      theDate = moment(moment(value), AuthorizedDateFormats.COMPLETE, true)
        .utc()
        .toDate();
    }

    // If moment failed
    if (theDate && String(theDate).includes('Invalid')) {
      theDate = value;
    }
    this.validateDate(theDate, target);
    return theDate;
  }

  /**
   * @returns Current time in utc format.
   */
  public static now(): Date {
    return moment()
      .utc()
      .toDate();
  }

  /**
   * Compares if date1 is less then date2.
   * @param dateToCompare The date being compared.
   * @param otherDate The other date being compared.
   * @param granularity The time unit.  default in millisecs.
   * @param equal checks if equal also.
   * @returns True if date dateToCompare is less than the otherDate, false otherwise.
   * @throws No errors, just returns false if one of the dates is invalid or undefined.
   */
  public static lt(
    dateToCompare: Date | string | When,
    otherDate: Date | string | When,
    equal = false,
    granularity?: TimeUnits
  ) {
    try {
      const dtc = this.getUtcDate(dateToCompare, 'dateToCompare');
      const od = this.getUtcDate(otherDate, 'otherDate');
      return equal
        ? moment(dtc)
            .utc()
            .isSameOrBefore(od, granularity)
        : moment(dtc)
            .utc()
            .isBefore(od, granularity);
    } catch {
      return false;
    }
  }

  /**
   * Verify if dateToCompare is between firstDate and secondDate.
   * @param dateToCompare The date being compared
   * @param firstDate The start date.
   * @param secondDate The end date.
   * @param granularity the time unit. default in seconds
   * @returns True if dateToCompare is between the other dates, false otherwise.
   * @throws No errors, just returns false if one of the dates is invalid or undefined.
   */
  public static between(
    dateToCompare: Date | string | When,
    firstDate: Date | string | When,
    secondDate: Date | string | When,
    granularity: TimeUnits = TimeUnits.SECOND
  ) {
    try {
      const dtc = this.getUtcDate(dateToCompare, 'dateToCompare');
      const fd = this.getUtcDate(firstDate, 'firstDate');
      const sd = this.getUtcDate(secondDate, 'secondDate');
      return moment(dtc)
        .utc()
        .isBetween(fd, sd, granularity);
    } catch {
      return false;
    }
  }

  /**
   * Compares if date1 is less then or equal to date2.
   * @param dateToCompare The date being compared.
   * @param otherDate The other date being compared.
   * @param equal checks if equal also.
   * @param granularity The time unit.  default in millisecs.
   * @returns True if date dateToCompare is less or equal to to the otherDate, false otherwise.
   * @throws No errors, just returns false if one of the dates is invalid or undefined.
   */
  public static lte(dateToCompare: Date | string | When, otherDate: Date | string | When, granularity?: TimeUnits) {
    try {
      const dtc = this.getUtcDate(dateToCompare, 'dateToCompare');
      const od = this.getUtcDate(otherDate, 'otherDate');
      return moment(dtc)
        .utc()
        .isSameOrBefore(od, granularity);
    } catch {
      return false;
    }
  }
  /**
   * Compares if date1 is greater then date2.
   * @param dateToCompare The date being compared.
   * @param otherDate The other date being compared.
   * @param granularity The time unit.  default in millisecs.
   * @returns True if date dateToCompare is greater than the otherDate, false otherwise.
   * @throws No errors, just returns false if one of the dates is invalid or undefined.
   */
  public static gt(
    dateToCompare: Date | string | When,
    otherDate: Date | string | When,
    equal = true,
    granularity?: TimeUnits
  ) {
    try {
      const dtc = this.getUtcDate(dateToCompare, 'dateToCompare');
      const od = this.getUtcDate(otherDate, 'otherDate');
      return equal
        ? moment(dtc)
            .utc()
            .isSameOrAfter(od, granularity)
        : moment(dtc)
            .utc()
            .isAfter(od, granularity);
    } catch (error) {
      logger.debug(JSON.stringify(error), '[MomentUtils gt] error');
      return false;
    }
  }

  /**
   * Removes x units to a date.
   * @param value The date to interact with.
   * @param howMany Number of units to remove.
   * @param timeUnits Granularity of the time to remove.
   * @param when Additionnal parameter to set the date at the end or the start.
   * @param whenTimeUnits Additionnal parameter to set the granularity for start or end of.  By default, timeUnits will be used.
   * @returns Returns a new date object.
   * @throws Invalid_Format or Invalid_Date when the date is undefined of dows not respects the correct format.
   */
  public static subtract(
    value: Date | string | When,
    howMany: number,
    timeUnits: TimeUnits = TimeUnits.DAY,
    when?: When,
    whenTimeUnits?: TimeUnits
  ): Date {
    let date = this.getUtcDate(value);
    date = moment(date)
      .utc()
      .subtract(howMany as any, timeUnits)
      .toDate();
    switch (when) {
      case When.START:
        return this.startOf(date, whenTimeUnits || timeUnits);
      case When.END:
        return this.endOf(date, whenTimeUnits || timeUnits);
      default:
        return date;
    }
  }

  /**
   * Adds x units to a date.
   * @param value The date to interact with.
   * @param howMany Number of units to add.
   * @param timeUnits Granularity of the time to add.
   * @param when Additionnal parameter to set the date at the end or the start.
   * @param whenTimeUnits Additionnal parameter to set the granularity for start or end of.  By default, timeUnits will be used.
   * @returns Returns a new date object.
   * @throws Invalid_Format or Invalid_Date when the date is undefined of dows not respects the correct format.
   */
  public static add(
    value: Date | string | When,
    howMany: number,
    timeUnits: TimeUnits = TimeUnits.DAY,
    when?: When,
    whenTimeUnits?: TimeUnits
  ): Date {
    let date = this.getUtcDate(value);
    date = moment(date)
      .utc()
      .add(howMany as any, timeUnits)
      .toDate();
    switch (when) {
      case When.START:
        return this.startOf(date, whenTimeUnits || timeUnits);
      case When.END:
        return this.endOf(date, whenTimeUnits || timeUnits);
      default:
        return date;
    }
  }

  public static getMinute(value: Date | string | When) {
    return this.getTimeUnit(value, TimeUnits.MINUTE);
  }
  public static getHour(value: Date | string | When) {
    return this.getTimeUnit(value, TimeUnits.HOUR);
  }
  public static getDay(value: Date | string | When) {
    return this.getTimeUnit(value, TimeUnits.DATE);
  }
  public static getMonth(value: Date | string | When) {
    return this.getTimeUnit(value, TimeUnits.MONTH) + 1;
  }
  public static getYear(value: Date | string | When) {
    return this.getTimeUnit(value, TimeUnits.YEAR);
  }

  /**
   * Formats the value into the wanted format.  Validation is still effective but it wont throw an error.
   * @param value the date.
   * @param format the desired format.
   * @returns the formatted date or Invalid date format if the parameter passed was invalid.
   * @throws No error, only invalid date format : $value
   */
  public static format(
    value: Date | string | When,
    format: AuthorizedDateFormats = AuthorizedDateFormats.MINUTE,
    keepLocalTime = false
  ): string {
    try {
      const date = this.getUtcDate(value);
      if (format === AuthorizedDateFormats.COMPLETE) {
        return moment(date)
          .utc(keepLocalTime)
          .format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
      }
      return moment(date)
        .utc(keepLocalTime)
        .format(format);
    } catch {
      return `invalid date format : ${value}`;
    }
  }

  public static setMinute(value: Date | string | When, timeUnits: number) {
    return this.setTimeUnit(value, timeUnits, TimeUnits.MINUTE);
  }
  public static setHour(value: Date | string | When, timeUnits: number) {
    return this.setTimeUnit(value, timeUnits, TimeUnits.HOUR);
  }
  public static setDay(value: Date | string | When, timeUnits: number) {
    return this.setTimeUnit(value, timeUnits, TimeUnits.DATE);
  }
  public static setMonth(value: Date | string | When, timeUnits: number) {
    return this.setTimeUnit(value, timeUnits - 1, TimeUnits.MONTH);
  }
  public static setYear(value: Date | string | When, timeUnits: number) {
    return this.setTimeUnit(value, timeUnits, TimeUnits.YEAR);
  }

  /**
   * Set the date to the start of the selected timeUnits.
   * @param value The date to interact with.
   * @param timeUnits Granularity of when to start.
   * @returns Returns a new date object.
   * @throws Invalid_Format or Invalid_Date when the date is undefined of dows not respects the correct format.
   */
  public static startOf(value: Date | string | When, timeUnit: TimeUnits = TimeUnits.DAY) {
    const date = this.getUtcDate(value);
    return moment(date)
      .startOf(timeUnit)
      .utc()
      .toDate();
  }

  /**
   * Set the date to the end of the selected timeUnits.
   * @param value The date to interact with.
   * @param timeUnits Granularity of when to end.
   * @returns Returns a new date object.
   * @throws Invalid_Format or Invalid_Date when the date is undefined of dows not respects the correct format.
   */
  public static endOf(value: Date | string | When, timeUnit: TimeUnits = TimeUnits.DAY) {
    const date = this.getUtcDate(value);
    return moment(date)
      .endOf(timeUnit)
      .utc()
      .toDate();
  }

  /**
   * Validates a date.
   * @param value The date to validate.
   * @param target Target displayed in the error message.
   * @throws Invalid_Format or Invalid_Date when the date is undefined of dows not respects the correct format.
   */
  public static validateDate(value: string | Date | number, target = 'value') {
    let code: string;
    let message: string;
    if (!value) {
      code = DateError.INVALID_DATE;
      message = 'Date value cannot be empty or undefined';
    } else if (isString(value) && (isNaN(new Date(value).valueOf()) || !this.isDateValidAcceptedFormat(value))) {
      code = DateError.INVALID_DATE_FORMAT;
      message = `Invalid date format, current value: ${value}`;
    } else if ((value instanceof Date && isNaN(value.getTime())) || (value && String(value).includes('Invalid'))) {
      code = DateError.INVALID_DATE;
      message = `Date is not a valid instance of date: ${value}`;
    }
    if (!isEmpty(code)) {
      throw new MomentError(message, code, target);
    }
  }

  /**
   * Validates a date but returns true of false
   * @param value The date to validate.
   * @returns true if date is valid, false otherwise
   * @throws No error, use validateDate to throw an error.
   */
  public static isValid(value: string | Date) {
    try {
      this.validateDate(value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * @returns returns if a date is valid
   */
  public static isDateValidAcceptedFormat(value: string | Date): boolean {
    let isValid = false;
    if (value) {
      isValid = Object.keys(AuthorizedDateFormats).some(key => {
        return moment(value, AuthorizedDateFormats[key], true).isValid();
      });
    }
    return isValid;
  }

  /**
   * Gets the date in unix(SECONDS) since the Unix Epoch in local time
   * @param value The date to interact with.
   * @returns Returns the unix(SECONDS) since the Unix Epoch
   */
  public static dateToUnix(value: Date | string | When): number {
    const date = this.getUtcDate(value);
    return moment(date)
      .unix()
      .valueOf();
  }

  /**
   * Gets the date in unix(SECONDS) since the Unix Epoch
   * @param value The date to interact with.
   * @returns Returns the unix(SECONDS) since the Unix Epoch
   */
  public static unixToDate(value: string | number): Date {
    return this.getUtcDate(value);
  }

  public static getDateString(value: Date | string | When, lang: string): string {
    const localLocale = moment(value);

    localLocale.locale(lang); // set this instance to use French
    return localLocale.format('LL'); // 11 décembre 2018
  }

  /**
   * Gets the time from date
   * @param value The date to convert.
   * @returns Returns the date as number, null if value was undefined
   */
  public static getTimeFromDate(value: Date | string | When) {
    if (!value) {
      return null;
    }
    return this.getUtcDate(value).getTime();
  }

  private static getTimeUnit(value: Date | string | When, timeUnits: TimeUnits): number {
    const date = this.getUtcDate(value);
    return moment(date)
      .utc()
      .get(timeUnits);
  }
  private static setTimeUnit(value: Date | string | When, timeValue: number, timeUnits: TimeUnits): Date {
    const date = this.getUtcDate(value);
    return moment(date)
      .set(timeUnits, timeValue)
      .utc()
      .toDate();
  }
}
