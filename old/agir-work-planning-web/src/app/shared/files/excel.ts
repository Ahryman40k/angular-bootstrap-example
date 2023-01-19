import * as xlsx from 'xlsx';

import * as fileUtils from './utils';

export async function readExcelFile<T>(excelFile: File): Promise<T[]> {
  const buffer = await fileUtils.readArrayBuffer(excelFile);
  const wb = xlsx.read(buffer, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const results = xlsx.utils.sheet_to_json(ws) as T[];
  return results;
}
