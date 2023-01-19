import { Pipe, PipeTransform } from '@angular/core';
import { pad, padEnd, padStart } from 'lodash';
type PadPosition = 'start' | 'end';
@Pipe({ name: 'vdmPad' })
export class PadPipe implements PipeTransform {
  public transform(
    el: string | number,
    length: number = 2,
    position: PadPosition = 'start',
    chars: string = '0'
  ): string {
    switch (position) {
      case 'start':
        return padStart(el.toString(), length, chars);
      case 'end':
        return padEnd(el.toString(), length, chars);
      default:
        return pad(el.toString(), length, chars);
    }
  }
}
