import { Pipe, PipeTransform } from '@angular/core';
/**
 * used to filter list of objects using filter function
 */
@Pipe({ name: 'vdmFilter' })
export class FilterPipe implements PipeTransform {
  public transform(elements: any[], filterFn: (el, pattern) => boolean, value: string): any[] {
    return elements.filter(el => filterFn(el, value));
  }
}
