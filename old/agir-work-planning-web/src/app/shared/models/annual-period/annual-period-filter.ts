export enum AnnualPeriodFilterKey {
  id = 'id',
  requestor = 'requestorId',
  planificationYear = 'planificationYear',
  interventionLength = 'asset.length.value'
}

export interface IAnnualPeriodFilter {
  key: AnnualPeriodFilterKey;
  label: string;
}
