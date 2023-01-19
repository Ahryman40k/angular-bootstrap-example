import { HttpParams } from '@angular/common/http';

/**
 * Creates HTTP parameters based on an object.
 *
 * @param obj The key-value object.
 * @returns http params
 */
export function buildHttpParams(obj: object): HttpParams {
  let params = new HttpParams();

  for (const param of Object.keys(obj)) {
    const value = obj[param];
    if (value === undefined || value === null) {
      continue;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        continue;
      }
      params = params.set(param, value.join(','));
    } else {
      params = params.set(param, value);
    }
  }

  return params;
}
