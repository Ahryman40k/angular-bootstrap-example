import { isEmpty } from 'lodash';
import {
  ParsingOptions,
  read,
  Sheet2JSONOpts,
  utils as xlsxUtils,
  WorkBook,
  WorkSheet,
  write,
  WritingOptions
} from 'xlsx';
import { Result } from '../../shared/logic/result';
import { appUtils } from '../utils';

// tslint:disable:no-empty-interface
export interface IWorkSheet extends WorkSheet {}
export interface ISheet2JSONOpts extends Sheet2JSONOpts {}

class SpreadSheetUtils {
  public getWorkSheetFromFile(file: any, opts?: ParsingOptions): Result<IWorkSheet> {
    try {
      // Some dates of the format YYYY-MM-DDTHH:mm:ss.sss are read with a one hour offset
      const workbook: WorkBook = read(file.data, { ...{ cellDates: true, cellNF: false, cellText: false }, ...opts });
      const workSheet: WorkSheet = workbook.Sheets[workbook.SheetNames[0]];
      return Result.ok(workSheet);
    } catch (error) {
      return Result.fail(error);
    }
  }

  public getWorkSheetColumnHeaders(worksheet: IWorkSheet): Result<string[]> {
    try {
      return Result.ok(
        Object.values(worksheet)
          .filter(value => !isEmpty(value.v))
          .map(column => column.v)
      );
    } catch (error) {
      return Result.fail(error);
    }
  }

  public getCsvColumnHeaders(worksheet: IWorkSheet): Result<string[]> {
    try {
      const headerRegex = new RegExp("^([A-Za-z]+)1='(.*)$");
      const cells = xlsxUtils.sheet_to_formulae(worksheet);
      return Result.ok(cells.filter(item => headerRegex.test(item)).map(item => item.split("='")[1]));
    } catch (error) {
      return Result.fail(error);
    }
  }

  public getWorkSheetNbRows(worksheet: IWorkSheet): Result<number> {
    try {
      const range = xlsxUtils.decode_range(worksheet['!ref']);
      return Result.ok(range.e.r - range.s.r + 1);
    } catch (error) {
      return Result.fail(error);
    }
  }

  public workSheetToJSON<Headers>(worksheet: IWorkSheet, opts?: ISheet2JSONOpts): Result<Headers[]> {
    try {
      return Result.ok(
        xlsxUtils.sheet_to_json<Headers>(worksheet, opts).map(json => appUtils.lowerizeObjectKeys(json))
      );
    } catch (error) {
      return Result.fail(error);
    }
  }

  // Input data is a JSON object array
  public createXLSFile(data: any[]) {
    const wb = xlsxUtils.book_new();
    const ws = xlsxUtils.json_to_sheet(data);
    xlsxUtils.book_append_sheet(wb, ws);
    const wbOpts: WritingOptions = { bookType: 'xls', type: 'buffer' };
    return write(wb, wbOpts);
  }
}

export const spreadsheetUtils = new SpreadSheetUtils();
