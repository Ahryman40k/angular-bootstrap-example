import { IPaging } from '@villemontreal/agir-work-planning-lib/dist/src';
import { IPaginatedResult, isEmpty, utils } from '@villemontreal/core-utils-general-nodejs-lib';
import * as fs from 'fs';
import { readJson } from 'fs-extra';
import { chain, cloneDeep, get, isNil, last, pickBy, trim, trimEnd } from 'lodash';
import * as marked from 'marked';
import { Types } from 'mongoose';
import { resolve as resolvePath } from 'path';

import { configs } from '../../config/configs';
import { constants, EndpointTypes } from '../../config/constants';
import { isEntity } from '../shared/domain/entity';
import { UnexpectedError } from '../shared/domainErrors/unexpectedError';
import { Result } from '../shared/logic/result';

// ==========================================
// We export the general utils too....
// ==========================================
export * from '@villemontreal/core-utils-general-nodejs-lib';

export interface IKeyAndValue<T> {
  [key: string]: T;
}

/**
 * App utilities
 */
export class AppUtils {
  private readmeHtml: string;

  /**
   * Returns the "README.md" file converted to
   * HTML.
   */
  public getReadmeHtml(): string {
    if (!this.readmeHtml || !configs.templatingEngine.enableCache) {
      this.readmeHtml = marked(fs.readFileSync(__dirname + '/../../README.md', 'UTF-8'));

      // ==========================================
      // We replace the hardcoded URLS to the actual urls.
      // ==========================================
      for (const pos in EndpointTypes) {
        if (EndpointTypes.hasOwnProperty(pos)) {
          const endpointType = EndpointTypes[pos];
          if (endpointType !== EndpointTypes[EndpointTypes.NONE]) {
            const actualUrl = trimEnd(this.createPublicUrl('/', EndpointTypes[endpointType]), '/');
            const endpointTypeRoot = this.getEndpointTypeRoot(EndpointTypes[endpointType]);
            this.readmeHtml = this.readmeHtml
              .split(`http://localhost:12345${endpointTypeRoot}/some/business/domain`)
              .join(`${actualUrl}`);
          }
        }
      }
      const finalUrl = trimEnd(this.createPublicUrl('/', EndpointTypes.NONE), '/');
      this.readmeHtml = this.readmeHtml.split('http://localhost:12345').join(`${finalUrl}`);

      // ==========================================
      // Section to remove
      // ==========================================
      this.readmeHtml = this.readmeHtml.replace(
        /Les Endpoints par défaut du gabarit<\/h2>[\s\S]*?<p>Notez que le <em>path<\/em>/,
        'Les Endpoints par défaut du gabarit</h2>\n<p>Notez que le <em>path</em>'
      );

      // ==========================================
      // Nicer footer
      // ==========================================
      this.readmeHtml = this.readmeHtml.replace(
        /<p>\|\n:-----:\|\n\|([\s\S]*?)<\/em><\/p>/,
        '<p style="text-align:center;">$1</em></p>'
      );
    }
    return this.readmeHtml;
  }

  /**
   * Create a full public path, given the relative path and the
   * type of endpoint the URL is for.
   *
   * The path will start with a "/".
   */
  public createPublicFullPath(relativePath: string, endpointType: EndpointTypes): string {
    let fullPath = this.getEndpointTypeRoot(endpointType);
    if (!utils.isBlank(configs.api.domainPath) && endpointType !== EndpointTypes.NONE) {
      fullPath = `${trimEnd(fullPath, '/')}${configs.api.domainPath}`;
      if (!utils.isBlank(configs.environment.instance) && !fullPath.endsWith(`-${configs.environment.instance}`)) {
        fullPath = `${trimEnd(fullPath, '/')}-${configs.environment.instance}`;
      }
    }

    const relativePathClean = relativePath ? trim(relativePath, '/ ') : '';
    if (!utils.isBlank(relativePathClean)) {
      fullPath = trimEnd(`${fullPath}/${relativePathClean}`);
    }

    return fullPath;
  }

  /**
   * Create an absolute public URL, given the relative path and the
   * type of endpoint the URL is for.
   */
  public createPublicUrl(relativePath: string, endpointType: EndpointTypes, port: number = configs.api.port) {
    let scheme = configs.api.scheme || 'http';
    scheme = trimEnd(scheme.toLowerCase(), ':');
    let url = `${scheme}://${configs.api.host}`;
    if (scheme === 'http') {
      if (port !== 80) {
        url = `${url}:${port}`;
      }
    } else if (scheme === 'https') {
      if (port !== 443) {
        url = `${url}:${port}`;
      }
    } else {
      throw new Error(`Unmanaged scheme : "${scheme}"`);
    }

    if (!utils.isBlank(relativePath)) {
      url += this.createPublicFullPath(relativePath, endpointType);
    }

    return url;
  }

  public clone<T>(o: T): T {
    let v: any;
    let key: any;
    const out: any = Array.isArray(o) ? [] : {};
    // tslint:disable-next-line:forin
    for (key in o) {
      v = o[key];
      if (v === null) {
        out[key] = null;
      } else if (v instanceof Types.ObjectId) {
        out[key] = v;
      } else if (v instanceof Date) {
        out[key] = v;
      } else if (typeof v === 'object') {
        out[key] = this.clone(v);
      } else {
        out[key] = v;
      }
    }
    return out;
  }

  /**
   * Gets the root path to use for a given
   * endpoint type.
   *
   * The path will start with a "/".
   */
  public getEndpointTypeRoot(endpointType: EndpointTypes) {
    // Defaults to "API"
    if (endpointType === undefined || endpointType === null || endpointType === EndpointTypes.API) {
      return constants.EnpointTypeRoots.API;
    }

    if (endpointType === EndpointTypes.DOCUMENTATION) {
      return constants.EnpointTypeRoots.DOCUMENTATION;
    }

    if (endpointType === EndpointTypes.DIAGNOSTICS) {
      return constants.EnpointTypeRoots.DIAGNOSTICS;
    }

    if (endpointType === EndpointTypes.NONE) {
      return '';
    }

    throw Error(`Invalid endpoint type : ${endpointType}`);
  }

  public generatePaging(partial?: Partial<IPaging>): IPaging {
    return {
      totalCount: partial?.totalCount || 0,
      offset: partial?.offset || constants.PaginationDefaults.OFFSET,
      limit: partial?.limit || constants.PaginationDefaults.LIMIT
    };
  }

  public paginate<T>(arrayToPaginate: T[], pagingOptions?: IPaging): IPaginatedResult<T> {
    const offset = pagingOptions?.offset || constants.PaginationDefaults.OFFSET;
    const limit = pagingOptions?.limit || constants.PaginationDefaults.LIMIT;
    let arrayResult = !isEmpty(arrayToPaginate) ? arrayToPaginate : [];
    const totalCount = pagingOptions?.totalCount || arrayResult.length;
    if (totalCount > limit || offset) {
      arrayResult = arrayResult.slice(offset, offset + limit);
    }
    return {
      paging: {
        totalCount,
        offset,
        limit
      },
      items: arrayResult
    };
  }

  public capitalizeFirstLetter(str: string) {
    return str[0].toUpperCase() + str.slice(1);
  }

  public capitalizeObjectKeys<P>(incoming: P): P {
    return this.modifyObjectKeysCase(incoming, this.capitalizeFirstLetter);
  }

  public lowerizeObjectKeys<P>(incoming: P): P {
    return this.modifyObjectKeysCase(incoming, this.lowerizeFirstLetter);
  }

  private modifyObjectKeysCase<P>(incoming: P, modifier: (input: string) => string): P {
    const result: P = {} as P;
    Object.keys(incoming).forEach(key => {
      result[modifier(key)] = incoming[key];
    });
    return result;
  }

  /**
   * Formats the number for the alpha numeric plugin.
   * Pads the number with at least 5 zeros.
   * e.g. 123 = '00123'
   */
  public padStartNumberId(num: number): string {
    return num.toString().padStart(5, '0');
  }

  public readFile(...pathSegments: string[]): Buffer {
    const filePath = resolvePath(...pathSegments);
    return fs.readFileSync(filePath);
  }

  public delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public lowerizeFirstLetter(value: string) {
    if (!value) {
      return value;
    }
    return value.charAt(0).toLowerCase() + value.slice(1);
  }

  public parseInt(value: string): number {
    return Number.parseInt(value, 10);
  }

  public daysBetweenDates(date1: Date, date2: Date): number {
    if (isNil(date1) || isNil(date2)) {
      return undefined;
    }
    const MS_PER_DAY = 24 * 3600 * 1000;
    // the hours are set to zero, because just the day must be considered for validation
    date1.setHours(0, 0, 0, 0);
    date2.setHours(0, 0, 0, 0);
    return Math.abs((date1.getTime() - date2.getTime()) / MS_PER_DAY);
  }

  public flattenObject(obj: any) {
    const flattenedObject = {};
    this.traverseAndFlatten(obj, flattenedObject);
    return flattenedObject;
  }

  public async getPackageJson(): Promise<Result<any>> {
    try {
      return Result.ok(await readJson(resolvePath(`${__dirname}/../../package.json`)));
    } catch (e) {
      return Result.fail(UnexpectedError.create(e, `An error occured while getting package.json`));
    }
  }

  public numberOfHoursBetween(date1: Date, date2: Date): number {
    return Math.abs(date1.getTime() - date2.getTime()) / 36e5;
  }

  public removeUndefinedValues(input: object): object {
    return pickBy(input, v => !isNil(v));
  }

  public concatArrayOfArrays(args: any[]) {
    const result = [];
    for (const arg of args) {
      if (Array.isArray(arg)) {
        result.push(...arg);
      } else {
        result.push(arg);
      }
    }
    return result;
  }

  // replace all mapObject keys found in input string by mapObject values
  public replaceAll(str: string, mapObj: IKeyAndValue<string>) {
    const re = new RegExp(Object.keys(mapObj).join('|'), 'gi');

    return str.replace(re, matched => {
      return mapObj[matched];
    });
  }

  public getCurrentYear() {
    return new Date().getFullYear();
  }

  // https://stackoverflow.com/questions/18878571/underscore-js-find-the-most-frequently-occurring-value-in-an-array
  public getMostOccurenceValue<T>(input: T[]) {
    return chain(input)
      .countBy()
      .toPairs()
      .maxBy(last)
      .head()
      .value() as T;
  }

  /**
   *
   * @param key Given an array, create an object with given key value gather array values
   */
  public groupArrayToObject<T>(key: string | number, inputArray: T[]): IKeyAndValue<T[]> {
    const resultObject: IKeyAndValue<T[]> = {};
    for (const row of inputArray) {
      let keyValue = get(row, key);
      // if is an instance => use getters
      if (isEntity(row)) {
        const accessors = `${key}`.split('.');
        keyValue = row;
        for (const accessor of accessors) {
          keyValue = keyValue[accessor];
        }
      }

      if (Object.keys(resultObject).includes(`${keyValue}`)) {
        resultObject[keyValue].push(row);
      } else {
        resultObject[keyValue] = [row];
      }
    }
    return resultObject;
  }

  public findDuplicates(arr: string[] | number[]) {
    const sortedArray = arr.slice().sort(); // You can define the comparing function here.
    const results = [];
    for (let i = 0; i < sortedArray.length - 1; i++) {
      if (sortedArray[i + 1] === sortedArray[i]) {
        results.push(sortedArray[i]);
      }
    }
    return results;
  }

  public unflatten(data: any): any {
    const result: any = {};
    for (const i of Object.keys(data)) {
      const keys = i.split('.');
      keys.reduce((r, e, j) => {
        return r[e] || (r[e] = isNaN(Number(keys[j + 1])) ? (keys.length - 1 === j ? data[i] : {}) : []);
      }, result);
    }
    return result;
  }

  public stringifiedJSONToJSON(jsonAsString: string): any {
    if (typeof jsonAsString === 'object') {
      return jsonAsString; // Already a JSON object
    }
    const cleaned = jsonAsString.replace(/\r?\n|\r|\t|\s+/g, '');
    try {
      return JSON.parse(cleaned);
    } catch (e) {
      return `Unparsable JSON string ${e}`;
    }
  }

  private traverseAndFlatten(currentNode: any, target: any, flattenedKey?: string) {
    for (const key in currentNode) {
      if (currentNode.hasOwnProperty(key)) {
        let newKey;
        if (flattenedKey === undefined) {
          newKey = key;
        } else {
          newKey = `${flattenedKey}.${key}`;
        }

        const value = currentNode[key];
        if (isNil(value)) {
          target[newKey] = null;
        } else if (typeof value === 'object') {
          this.traverseAndFlatten(value, target, newKey);
        } else {
          target[newKey] = value;
        }
      }
    }
  }

  /**
   * Date in open-api is a string, it needs to be converted to string to be validated
   * @param object
   * @returns
   */
  public convertDateToISOString<T>(object: T): T {
    const clonedObject = cloneDeep(object);
    for (const key of Object.keys(clonedObject)) {
      if (clonedObject[key] instanceof Date) {
        clonedObject[key] = clonedObject[key].toISOString();
      }
    }
    return clonedObject;
  }
}
export const appUtils: AppUtils = new AppUtils();
