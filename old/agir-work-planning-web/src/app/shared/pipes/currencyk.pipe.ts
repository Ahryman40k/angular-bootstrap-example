import { CurrencyPipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { isNumber } from 'lodash';

@Pipe({
  name: 'vdmCurrencyK'
})
export class CurrencyKPipe implements PipeTransform {
  public transform(value: string | number): string | null {
    const valueTransformed = isNumber(value)
      ? value
          .toString()
          .split('.')
          .join(',')
      : value;
    return valueTransformed ? `${valueTransformed} k$` : null;
  }
}
