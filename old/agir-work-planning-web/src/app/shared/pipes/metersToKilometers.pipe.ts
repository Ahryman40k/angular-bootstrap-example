import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appMetersToKilometers'
})
export class MetersToKilometersPipe implements PipeTransform {
  public transform(value: number): number {
    if (value === null || value === undefined) {
      return 0;
    }
    const roundedValue = Math.round(value);
    return roundedValue / 1000;
  }
}
