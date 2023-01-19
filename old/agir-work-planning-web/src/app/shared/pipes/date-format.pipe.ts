import { Pipe, PipeTransform } from '@angular/core';

import { Utils } from '../utils/utils';

@Pipe({ name: 'appDateFormat' })
export class DateFormatPipe implements PipeTransform {
  public transform(value: string, format: string): string {
    return Utils.formatToDate(value, format);
  }
}
