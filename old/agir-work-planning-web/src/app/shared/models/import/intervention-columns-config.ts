import { ExcelColumn } from './excel-column';

export interface IInterventionColumnsValue {
  program: ExcelColumn;
  projectId: ExcelColumn;
  priority: ExcelColumn;
  borough: ExcelColumn;
  street: ExcelColumn;
  from: ExcelColumn;
  to: ExcelColumn;
  roadSectionId: ExcelColumn;
  unifiedRoadSectionId: ExcelColumn;
  assetId: ExcelColumn;
  workType: ExcelColumn;
  assetType: ExcelColumn;
  interventionLength: ExcelColumn;
  estimate: ExcelColumn;
  comment: ExcelColumn;
}
