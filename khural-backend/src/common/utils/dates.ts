import { BadRequestException } from '@nestjs/common';
import { isDateString, isPositive } from 'class-validator';
import moment from 'moment-timezone';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

const TIMEZONE_NAME = 'Asia/Krasnoyarsk';
dayjs.extend(utc);

class DateFormatter {
  static toTimestampWTZ(): string;
  static toTimestampWTZ(unixtime: number): string;
  static toTimestampWTZ(dateString: string): string;
  static toTimestampWTZ(date: Date): string;
  static toTimestampWTZ(value?: number | string | Date): string {
    try {
      let result: string;
      switch (typeof value) {
        case 'number':
          const unixtime = value * 1000;
          if (!isPositive(unixtime)) {
            throw new BadRequestException('unixtime value must be positive');
          }
          result = moment(unixtime).tz(TIMEZONE_NAME).format();
          break;

        case 'object':
          result = moment(value).tz(TIMEZONE_NAME).format();
          break;

        case 'string':
          if (!isDateString(value)) {
            throw new BadRequestException(
              'dateString must match to date string',
            );
          }
          result = moment(value).tz(TIMEZONE_NAME).format();
          break;

        case 'undefined':
          result = moment().tz(TIMEZONE_NAME).format();
          break;

        default:
          result = moment(value).tz(TIMEZONE_NAME).format();
          break;
      }

      return result;
    } catch (e) {
      throw new Error('cannot convert to date');
    }
  }

  static toMomentWTZ(): moment.Moment;
  static toMomentWTZ(unixtime: number): moment.Moment;
  static toMomentWTZ(dateString: string): moment.Moment;
  static toMomentWTZ(date: Date): moment.Moment;
  static toMomentWTZ(value?: number | string | Date): moment.Moment {
    try {
      let result: moment.Moment;

      if (typeof value == 'number') {
        result = moment(value * 1000).tz(TIMEZONE_NAME);
        return result;
      }

      if (typeof value === 'string') {
        result = moment(value).tz(TIMEZONE_NAME);
        return result;
      }

      if (value instanceof Date) {
        result = moment(value).tz(TIMEZONE_NAME);
        return result;
      }

      if (typeof value === 'undefined') {
        return moment().tz(TIMEZONE_NAME);
      }

      return moment().tz(TIMEZONE_NAME);
    } catch (e) {
      throw e;
    }
  }

  static toISOStringOrFail(unixtime: number): string;
  static toISOStringOrFail(dateString: string): string;
  static toISOStringOrFail(date: number | string): string {
    try {
      let dateString: string;
      switch (typeof date) {
        case 'number':
          const withMilliseconds = date * 1000;
          dateString = new Date(withMilliseconds).toISOString();
          return dateString;

        case 'string':
          dateString = new Date(date).toISOString();
          return dateString;

        default:
          dateString = new Date(date).toISOString();
          return dateString;
      }
    } catch (e) {
      throw new Error('cannot convert to date');
    }
  }

  static toUnixtime(date: Date): number;
  static toUnixtime(dateString: string): number;
  static toUnixtime(date: string | Date): number {
    if (date instanceof Date) {
      const unixtime = date.getTime() / 1000;
      return unixtime;
    }

    if (typeof date === 'string') {
      const unixtime = new Date(date).getTime() / 1000;
      return unixtime;
    }

    return 0;
  }

  static setTimeForDate(date: number, time: string): moment.Moment;
  static setTimeForDate(date: moment.Moment, time: string): moment.Moment;
  static setTimeForDate(
    date: moment.Moment | number,
    time: string,
  ): moment.Moment {
    let result: moment.Moment = moment();
    const day: moment.Moment = moment(time, ['h:m:a', 'H:m']).tz(TIMEZONE_NAME);
    if (moment.isMoment(date)) {
      date.set({
        hour: day.hour(),
        minute: day.minute(),
        second: 0,
      });

      result = date;
    }

    if (typeof date === 'number') {
      const desired_date = DateFormatter.toMomentWTZ(date);
      desired_date.set({
        hour: day.hour(),
        minute: day.minute(),
        second: 0,
      });
      result = desired_date;
    }

    return result;
  }

  static getDate(unixTime: number): string {
    const date = new Date(unixTime);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  /**
   * Преобразует часы в Unix timestamp для указанного дня.
   * @param {number} dateNumber - Unix timestamp дня
   * @param {number} hours - Количество часов (0-23)
   * @returns {number} Unix timestamp с учетом часов
   */
  static hoursToUnix(dateNumber: number, hours: number | undefined): number {
    if (hours === undefined) {
      throw new BadRequestException('Date number cannot be undefined.');
    }

    if (hours < 0 || hours > 23) {
      throw new BadRequestException('Hours must be between 0 and 23.');
    }

    const date = DateFormatter.toMomentWTZ(dateNumber);
    date.set({ hour: hours, minute: 0, second: 0 });
    return date.unix();
  }

  static formatUnixTime(unixTime: number): string {
    return dayjs.unix(unixTime).utc().format('DD.MM.YYYY HH:mm');
  }
}

export { DateFormatter };
export { TIMEZONE_NAME };
