import { IStringOrStringArray } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as _ from 'lodash';

export function joinStrings<T>(items: T[], separator?: string): string {
  return items.filter(x => x).join(separator);
}

export function convertStringOrStringArray(stringOrStringArray: IStringOrStringArray): string[] {
  if (stringOrStringArray instanceof Array) {
    return stringOrStringArray;
  }
  if (typeof stringOrStringArray !== 'string') {
    return [stringOrStringArray];
  }
  return stringOrStringArray?.split(',').map(x => x.trim()) || [];
}

export function hasDuplicates<T>(array: T[], callbackfn: (value: T, index: number, array: T[]) => unknown): boolean {
  return _.size(array.filter(callbackfn)) > 1;
}

export function includes<T>(source: T[], destination: T[]): boolean {
  return source.every(el => _.includes(destination, el));
}

export function mergeArrays<T>(source: T[], destination: T[]): T[] {
  return _.uniq(_.concat(source || [], destination || []));
}
