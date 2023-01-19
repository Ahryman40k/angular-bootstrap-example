import { ICountBy } from '@villemontreal/agir-work-planning-lib/dist/src';

export interface ICountByCityProperties {
  id: string;
  rtuProjectCount: ICountBy;
  displayCount: string | number;
  ABREV: string;
}
