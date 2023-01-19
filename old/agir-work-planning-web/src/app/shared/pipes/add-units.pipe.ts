import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'addUnits'
})
export class AddUnitsPipe implements PipeTransform {
  public transform(value: string, units: string): string {
    return value?.concat(value.indexOf('m') > -1 ? '' : `${units}`);
  }
}
