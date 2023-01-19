import { Pipe, PipeTransform } from '@angular/core';
import { Many, orderBy } from 'lodash';

@Pipe({ name: 'appOrderBy' })
export class OrderByPipe implements PipeTransform {
  public transform(elements: any[], property: string, direction: Many<boolean | 'asc' | 'desc'> = 'asc'): any[] {
    if (!(elements instanceof Array) || !property) {
      return elements;
    }
    return orderBy(elements, e => e[property], direction);
  }
}
