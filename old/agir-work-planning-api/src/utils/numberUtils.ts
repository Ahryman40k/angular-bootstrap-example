import * as _ from 'lodash';

import { appUtils } from './utils';

/**
 * Iterates through the keys and parses int each value if the object is not empty
 * @template T the type of the object
 * @param obj the object
 * @param keys the keys of the object
 * @returns void
 */
export function parseIntKeys<T>(obj: T, keys: (keyof T)[]): void {
  if (_.isEmpty(obj)) {
    return;
  }
  keys.forEach(k => {
    if (obj[k]) {
      const keyValue = obj[k] as any;
      if (keyValue instanceof Array) {
        obj[k as string] = keyValue.map(v => appUtils.parseInt(v));
      } else {
        obj[k as string] = appUtils.parseInt(keyValue);
      }
    }
  });
}
