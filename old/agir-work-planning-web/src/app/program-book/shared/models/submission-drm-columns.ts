import { SortingStatus } from 'src/app/shared/directives/sort.directive';
import { ProgramBookTableColumns } from 'src/app/shared/models/table/column-config-enums';
import { IColumn } from 'src/app/shared/models/table/column-config-interfaces';

export type TDirection = boolean | 'desc' | 'asc';

export const PNI_FIELDS =
  'drmNumber,submissionNumber,projectName,boroughId,status,projectTypeId,executorId,interventionIds';
export const NON_PNI_FIELDS = 'drmNumber,submissionNumber,projectName,boroughId,status,projectTypeId,executorId';
export const SUBMISSION_FIELDS = 'streetName,streetFrom,streetTo';
export const DEFAULT_TABLE_COLUMNS: IColumn[] = [
  {
    columnName: ProgramBookTableColumns.SUBMISSION_NUMBER,
    displayOrder: 1,
    className: `col-${ProgramBookTableColumns.SUBMISSION_NUMBER}`,
    sorting: SortingStatus.active,
    condition: true
  },
  {
    columnName: ProgramBookTableColumns.PROJECT_ID,
    displayOrder: 2,
    className: `col-${ProgramBookTableColumns.PROJECT_ID}`,
    sorting: SortingStatus.inactive,
    condition: true
  },
  {
    columnName: ProgramBookTableColumns.LABEL,
    displayOrder: 3,
    className: `col-${ProgramBookTableColumns.LABEL}`,
    sorting: SortingStatus.inactive,
    condition: true
  },
  {
    columnName: ProgramBookTableColumns.PROGRAM,
    displayOrder: 4,
    className: `col-${ProgramBookTableColumns.PROGRAM}`,
    sorting: SortingStatus.inactive,
    condition: true
  },
  {
    columnName: ProgramBookTableColumns.BOROUGH,
    displayOrder: 5,
    className: `col-${ProgramBookTableColumns.BOROUGH}`,
    sorting: SortingStatus.inactive,
    condition: true
  }
];
export const SUBMISSION_COLUMNS: IColumn[] = [
  {
    columnName: ProgramBookTableColumns.STREET_NAME,
    displayOrder: 5,
    className: `col-${ProgramBookTableColumns.STREET_NAME}`,
    sorting: SortingStatus.inactive,
    condition: true
  },
  {
    columnName: ProgramBookTableColumns.STREET_FROM,
    displayOrder: 6,
    className: `col-${ProgramBookTableColumns.STREET_FROM}`,
    sorting: SortingStatus.inactive,
    condition: true
  },
  {
    columnName: ProgramBookTableColumns.STREET_TO,
    displayOrder: 7,
    className: `col-${ProgramBookTableColumns.STREET_TO}`,
    sorting: SortingStatus.inactive,
    condition: true
  }
];

export interface IProjectOrderProps {
  id: string;
  value: string;
  submissionNumber?: string;
}
