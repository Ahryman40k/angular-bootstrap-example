export enum RestrictionType {
  EXECUTOR = 'EXECUTOR',
  REQUESTOR = 'REQUESTOR',
  BOROUGH = 'BOROUGH'
}

export type IRestriction = {
  [key in RestrictionType]?: string[];
};
