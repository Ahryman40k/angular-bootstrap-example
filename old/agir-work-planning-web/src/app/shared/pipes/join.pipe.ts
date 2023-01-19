import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'vdmJoin' })
export class JoinPipe implements PipeTransform {
  public transform(elements: string | string[], separator: string): string {
    if (!(elements instanceof Array)) {
      return elements;
    }
    let uniqElems = Array.from(new Set(elements));
    uniqElems = uniqElems.filter(x => x);
    return uniqElems.join(separator);
  }
}
