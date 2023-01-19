import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import { saveAs } from 'file-saver';
import { isNil } from 'lodash';
import { DateTime } from 'luxon';

export interface IDateRange {
  firstDate: string;
  lastDate: string;
}

export const REGEX_NO_WHITE_SPACE = /^\S+$/;

export class Utils {
  public static camelToDashCase(str: string): string {
    return str.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
  }

  public static taxonomiesToAcronymOrLabelCodeObjects(
    taxonomies: ITaxonomy[]
  ): { [acronymOrLabelCode: string]: string }[] {
    return taxonomies.map(taxonomy => ({ [taxonomy.code]: taxonomy.properties?.acronym?.fr || taxonomy.label.fr }));
  }

  public static formatToDate(value: any, format: string): string {
    const date = DateTime.fromISO(value);
    return typeof value === 'string' && date && date.isValid ? date.toFormat(format) : value;
  }

  public static createAndDownloadBlobFile(multiPartData: any): void {
    const buffer = new Uint8Array(multiPartData.data.data);
    const blob = new Blob([buffer], { type: multiPartData.metadata.contentType });
    const fileName = multiPartData.metadata.objectName;
    saveAs(blob, fileName);
  }

  public static generateDatesFromYear(year: number): IDateRange {
    const firstDate = new Date(year, 0, 1).toISOString();
    const lastDate = new Date(year, 11, 31);
    lastDate.setHours(23, 59, 59, 999);
    return {
      firstDate,
      lastDate: lastDate.toISOString()
    };
  }

  public static getYearQuarter(date: Date): number {
    return Math.floor((date.getMonth() + 3) / 3);
  }

  public static removeObjectEmptyProperties(object: {}): void {
    if (!object) {
      return;
    }
    Object.keys(object).forEach(k => isNil(object[k]) && delete object[k]);
  }
}

export function enumValues<T>(e: any): T[] {
  return Object.keys(e).map(i => e[i]);
}
