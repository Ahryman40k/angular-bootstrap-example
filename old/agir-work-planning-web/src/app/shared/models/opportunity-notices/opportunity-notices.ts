export enum OpportunityNoticeFilterKey {
  createdAt = 'createdAt',
  modifiedAt = 'modifiedAt',
  typeId = 'typeId',
  requestorId = 'requestorId',
  status = 'status'
}

export enum OpportunityNoticeResponse {
  yes = 'Positive',
  no = 'Negative',
  analyzing = 'En analyse'
}
export interface IOpportunityNoticeFilter {
  key: string;
  label: string;
}
