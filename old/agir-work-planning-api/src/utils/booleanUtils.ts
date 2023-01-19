import * as _ from 'lodash';

/**
 * Iterates through the keys and parses boolean each value if the object is not empty
 * @template T the type of the object
 * @param obj the object
 * @param keys the keys of the object
 * @returns void
 */
export function parseBooleanKeys<T>(obj: T, keys: (keyof T)[]): void {
  if (_.isEmpty(obj)) {
    return;
  }
  keys.forEach(k => {
    if (obj[k]) {
      const keyValue = obj[k] as any;
      if (keyValue instanceof Array) {
        obj[k as string] = keyValue.map(v => v === 'true');
      } else {
        obj[k as string] = keyValue === 'true';
      }
    }
  });
}
