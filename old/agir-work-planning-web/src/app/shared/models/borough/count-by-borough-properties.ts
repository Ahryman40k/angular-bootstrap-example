import { ICountBy } from '@villemontreal/agir-work-planning-lib/dist/src';

export interface ICountByBoroughProperties {
  id: string;
  projectCount: ICountBy;
  interventionCount: ICountBy;
  displayCount: string | number;
  ABREV: string;
}
