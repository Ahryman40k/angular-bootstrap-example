import { IStringOrStringArray } from '@villemontreal/agir-work-planning-lib/dist/src';

export interface IRtuProjectCriteria {
  areaId?: IStringOrStringArray;
  fields?: string[];
  partnerId?: string[];
  rtuStatus?: string;
  phase?: string;
  fromDateStart?: string;
  fromDateEnd?: string;
  toDateStart?: string;
  toDateEnd?: string;
  bbox?: string;
  limit?: number;
  id?: string;
}
