import { SortingStatus } from '../../directives/sort.directive';
import { SortDirection } from '../../forms/sort/sort-utils';

export enum RtuTransmissionsTableColumnLabels {
  'startDateTime' = 'Début de la transmission',
  'endDateTime' = 'Fin de la transmission',
  'status' = 'Statut',
  'id' = 'ID projet',
  'projectName' = 'Libellé',
  'streetName' = 'Voie',
  'streetFrom' = 'De',
  'streetTo' = 'À'
}

export enum RtuTransmissionFields {
  id = 'id',
  startDateTime = 'startDateTime',
  endDateTime = 'endDateTime',
  status = 'status',
  errorDetail = 'errorDetail',
  projectName = 'projectName',
  streetName = 'streetName',
  streetFrom = 'streetFrom',
  streetTo = 'streetTo'
}

export interface IRtuTransmissionsTableColumnOptions {
  [columnName: string]: IRtuTransmissionsTableOptions;
}

export interface IRtuTransmissionsTableOptions {
  shown: boolean;
  sortable: boolean | SortingStatus;
  sorted?: boolean | SortDirection;
}
