import { Result } from '../../../shared/logic/result';
import { IDownloadFileResult } from '../../../shared/storage/iStorageService';
import { ISheet2JSONOpts, spreadsheetUtils } from '../../../utils/spreadsheets/spreadsheetsUtils';
import { INexoHeaders } from '../models/rows/nexoRow';

export class NexoImportFileParser {
  public static parse<H extends INexoHeaders>(file: IDownloadFileResult, opts?: ISheet2JSONOpts): Result<H[]> {
    const worksheetResult = spreadsheetUtils.getWorkSheetFromFile(file);
    if (worksheetResult.isFailure) {
      return worksheetResult as Result<any>; // recast for error
    }
    return spreadsheetUtils.workSheetToJSON<H>(worksheetResult.getValue(), opts);
  }
}
