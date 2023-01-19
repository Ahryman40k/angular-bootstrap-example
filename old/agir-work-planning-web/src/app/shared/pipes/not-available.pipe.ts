import { Pipe, PipeTransform } from '@angular/core';

const NOT_AVAILABLE: string = 'N/D';
@Pipe({
  name: 'vdmNa'
})
export class NotAvailablePipe implements PipeTransform {
  public transform(value: string, notAvailable: string = NOT_AVAILABLE): string {
    return !!value?.toString() ? value : notAvailable;
  }
}
