import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'numberPipe'
})
export class NumberPipe implements PipeTransform {
  public transform(value: string | number): string {
    return Number(value)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
}
